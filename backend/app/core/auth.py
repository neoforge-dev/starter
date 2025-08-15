"""Authentication utilities."""
import secrets
import hashlib
from datetime import datetime, timedelta, UTC
from typing import Optional, Tuple

from passlib.context import CryptContext
from redis.asyncio import Redis
import structlog

from app.core.redis import get_redis
from app.core.config import Settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
logger = structlog.get_logger()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify password against hash.
    
    Args:
        plain_password: Plain text password
        hashed_password: Hashed password
        
    Returns:
        True if password matches hash
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Hash password.
    
    Args:
        password: Plain text password
        
    Returns:
        Hashed password
    """
    return pwd_context.hash(password)


def generate_refresh_token() -> str:
    """
    Generate a cryptographically secure refresh token.
    
    Returns:
        Secure random token string
    """
    return secrets.token_urlsafe(32)


def hash_refresh_token(token: str) -> str:
    """
    Hash refresh token for secure storage.
    
    Args:
        token: Plain refresh token
        
    Returns:
        SHA256 hash of the token
    """
    return hashlib.sha256(token.encode()).hexdigest()


async def store_refresh_token(
    redis: Redis,
    user_id: int,
    token_hash: str,
    session_id: str,
    settings: Settings,
    expires_in_days: int = 30
) -> None:
    """
    Store refresh token hash in Redis with expiration.
    
    Args:
        redis: Redis connection
        user_id: User ID
        token_hash: Hashed refresh token
        session_id: Session identifier
        settings: Application settings
        expires_in_days: Token expiration in days
    """
    key = f"refresh_token:{token_hash}"
    data = {
        "user_id": user_id,
        "session_id": session_id,
        "created_at": datetime.now(UTC).isoformat(),
        "rotations": 0
    }
    
    # Store with expiration
    expire_seconds = expires_in_days * 24 * 60 * 60
    await redis.hset(key, mapping=data)
    await redis.expire(key, expire_seconds)
    
    # Also store reverse lookup for user sessions
    user_key = f"user_refresh_tokens:{user_id}"
    await redis.sadd(user_key, token_hash)
    await redis.expire(user_key, expire_seconds)
    
    logger.info(
        "refresh_token_stored",
        user_id=user_id,
        session_id=session_id,
        expires_in_days=expires_in_days
    )


async def validate_refresh_token(
    redis: Redis,
    token: str
) -> Optional[dict]:
    """
    Validate refresh token and return token data if valid.
    
    Args:
        redis: Redis connection
        token: Plain refresh token
        
    Returns:
        Token data if valid, None if invalid/expired
    """
    token_hash = hash_refresh_token(token)
    key = f"refresh_token:{token_hash}"
    
    # Get token data
    data = await redis.hgetall(key)
    if not data:
        logger.warning("refresh_token_validation_failed", reason="token_not_found")
        return None
    
    logger.info(
        "refresh_token_validated",
        user_id=data.get("user_id"),
        session_id=data.get("session_id"),
        rotations=data.get("rotations", 0)
    )
    
    return {
        "user_id": int(data["user_id"]),
        "session_id": data["session_id"],
        "created_at": data["created_at"],
        "rotations": int(data.get("rotations", 0))
    }


async def rotate_refresh_token(
    redis: Redis,
    old_token: str,
    user_id: int,
    session_id: str,
    settings: Settings,
    max_rotations: int = 100  # Prevent infinite rotation
) -> Tuple[str, bool]:
    """
    Rotate refresh token - invalidate old and create new.
    
    Args:
        redis: Redis connection
        old_token: Current refresh token
        user_id: User ID
        session_id: Session identifier
        settings: Application settings
        max_rotations: Maximum allowed rotations per session
        
    Returns:
        Tuple of (new_token, success)
    """
    # First validate the old token
    old_data = await validate_refresh_token(redis, old_token)
    if not old_data:
        return "", False
    
    # Check if user_id matches (security check)
    if old_data["user_id"] != user_id:
        logger.warning(
            "refresh_token_rotation_failed",
            reason="user_id_mismatch",
            expected_user=user_id,
            actual_user=old_data["user_id"]
        )
        return "", False
    
    # Check rotation limit
    current_rotations = old_data.get("rotations", 0)
    if current_rotations >= max_rotations:
        logger.warning(
            "refresh_token_rotation_failed",
            reason="max_rotations_exceeded",
            user_id=user_id,
            rotations=current_rotations
        )
        return "", False
    
    # Generate new token
    new_token = generate_refresh_token()
    new_hash = hash_refresh_token(new_token)
    
    # Invalidate old token
    old_hash = hash_refresh_token(old_token)
    old_key = f"refresh_token:{old_hash}"
    await redis.delete(old_key)
    
    # Remove from user's token set
    user_key = f"user_refresh_tokens:{user_id}"
    await redis.srem(user_key, old_hash)
    
    # Store new token with incremented rotation count
    await store_refresh_token(
        redis=redis,
        user_id=user_id,
        token_hash=new_hash,
        session_id=session_id,
        settings=settings
    )
    
    # Update rotation count
    new_key = f"refresh_token:{new_hash}"
    await redis.hset(new_key, "rotations", current_rotations + 1)
    
    logger.info(
        "refresh_token_rotated",
        user_id=user_id,
        session_id=session_id,
        old_rotations=current_rotations,
        new_rotations=current_rotations + 1
    )
    
    return new_token, True


async def revoke_refresh_token(
    redis: Redis,
    token: str,
    user_id: Optional[int] = None
) -> bool:
    """
    Revoke a specific refresh token.
    
    Args:
        redis: Redis connection
        token: Refresh token to revoke
        user_id: Optional user ID for additional security check
        
    Returns:
        True if token was revoked, False if not found
    """
    token_hash = hash_refresh_token(token)
    key = f"refresh_token:{token_hash}"
    
    # Get token data for logging and validation
    if user_id:
        data = await redis.hgetall(key)
        if data and int(data.get("user_id", 0)) != user_id:
            logger.warning(
                "refresh_token_revoke_failed",
                reason="user_id_mismatch",
                token_user_id=data.get("user_id"),
                expected_user_id=user_id
            )
            return False
    
    # Delete the token
    deleted = await redis.delete(key)
    
    # Remove from user's token set if we have user_id
    if user_id:
        user_key = f"user_refresh_tokens:{user_id}"
        await redis.srem(user_key, token_hash)
    
    if deleted:
        logger.info(
            "refresh_token_revoked",
            user_id=user_id,
            token_hash=token_hash[:8] + "..."
        )
    
    return bool(deleted)


async def revoke_all_user_tokens(
    redis: Redis,
    user_id: int
) -> int:
    """
    Revoke all refresh tokens for a user.
    
    Args:
        redis: Redis connection
        user_id: User ID
        
    Returns:
        Number of tokens revoked
    """
    user_key = f"user_refresh_tokens:{user_id}"
    
    # Get all token hashes for the user
    token_hashes = await redis.smembers(user_key)
    
    if not token_hashes:
        return 0
    
    # Delete all tokens
    revoked_count = 0
    for token_hash in token_hashes:
        key = f"refresh_token:{token_hash}"
        if await redis.delete(key):
            revoked_count += 1
    
    # Clear the user's token set
    await redis.delete(user_key)
    
    logger.info(
        "all_user_tokens_revoked",
        user_id=user_id,
        revoked_count=revoked_count
    )
    
    return revoked_count 