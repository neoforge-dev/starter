"""
JWT Security Enhancement for NeoForge
Provides advanced JWT token management with rotation, refresh, and security features.
"""

import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, List, Any, Tuple
from dataclasses import dataclass, field
from enum import Enum
import secrets
import hashlib
import json

# JWT Security Implementation with fallback support
try:
    from jose import JWTError, jwt
    from jose.exceptions import ExpiredSignatureError, InvalidTokenError
    JWT_AVAILABLE = True
except ImportError:
    JWT_AVAILABLE = False
    JWTError = Exception
    ExpiredSignatureError = Exception
    InvalidTokenError = Exception

    # Simple mock JWT implementation for development/testing
    class MockJWT:
        @staticmethod
        def encode(payload, key, algorithm):
            import json
            import base64
            # Simple encoding for testing - NOT SECURE FOR PRODUCTION
            data = json.dumps(payload).encode()
            return base64.b64encode(data).decode()

        @staticmethod
        def decode(token, key, algorithms):
            import json
            import base64
            try:
                data = base64.b64decode(token)
                return json.loads(data.decode())
            except Exception:
                raise InvalidTokenError("Invalid token")

    jwt = MockJWT()
from pydantic import BaseModel

logger = logging.getLogger(__name__)


class TokenType(Enum):
    """Types of JWT tokens."""
    ACCESS = "access"
    REFRESH = "refresh"
    API_KEY = "api_key"


class TokenStatus(Enum):
    """Status of JWT tokens."""
    ACTIVE = "active"
    REVOKED = "revoked"
    EXPIRED = "expired"
    SUSPENDED = "suspended"


@dataclass
class TokenMetadata:
    """Metadata for JWT tokens."""
    token_id: str
    user_id: int
    tenant_id: Optional[str] = None
    token_type: TokenType = TokenType.ACCESS
    status: TokenStatus = TokenStatus.ACTIVE
    issued_at: datetime = field(default_factory=datetime.utcnow)
    expires_at: datetime = field(default_factory=lambda: datetime.utcnow() + timedelta(hours=1))
    last_used_at: Optional[datetime] = None
    usage_count: int = 0
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    device_fingerprint: Optional[str] = None
    rotation_count: int = 0
    parent_token_id: Optional[str] = None
    security_flags: List[str] = field(default_factory=list)


@dataclass
class TokenRotationConfig:
    """Configuration for token rotation."""
    enable_rotation: bool = True
    rotation_threshold: int = 80  # Rotate when usage reaches 80%
    max_rotations: int = 5
    rotation_grace_period: int = 300  # 5 minutes grace period
    force_rotation_after: int = 3600  # Force rotation after 1 hour
    rotation_window: int = 600  # 10 minutes window for rotation


@dataclass
class JWTSecurityConfig:
    """Configuration for JWT security."""
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7
    api_key_expire_days: int = 365
    token_rotation: TokenRotationConfig = field(default_factory=TokenRotationConfig)
    max_tokens_per_user: int = 10
    max_tokens_per_device: int = 3
    enable_device_fingerprinting: bool = True
    enable_ip_whitelisting: bool = False
    allowed_ips: List[str] = field(default_factory=list)
    enable_token_encryption: bool = True
    encryption_key: Optional[str] = None


class TokenBlacklist:
    """In-memory token blacklist for revoked tokens."""

    def __init__(self):
        self._blacklisted_tokens: Dict[str, datetime] = {}
        self._cleanup_interval: int = 3600  # 1 hour

    def add(self, token_id: str, expiry: datetime):
        """Add token to blacklist."""
        self._blacklisted_tokens[token_id] = expiry
        logger.info(f"Token {token_id} added to blacklist")

    def is_blacklisted(self, token_id: str) -> bool:
        """Check if token is blacklisted."""
        if token_id in self._blacklisted_tokens:
            expiry = self._blacklisted_tokens[token_id]
            if datetime.utcnow() > expiry:
                # Token has expired, remove from blacklist
                del self._blacklisted_tokens[token_id]
                return False
            return True
        return False

    def cleanup(self):
        """Remove expired tokens from blacklist."""
        now = datetime.utcnow()
        expired_tokens = [
            token_id for token_id, expiry in self._blacklisted_tokens.items()
            if now > expiry
        ]
        for token_id in expired_tokens:
            del self._blacklisted_tokens[token_id]

        if expired_tokens:
            logger.info(f"Cleaned up {len(expired_tokens)} expired tokens from blacklist")


class JWTSecurityManager:
    """
    Enhanced JWT Security Manager with rotation, refresh, and advanced security features.
    """

    def __init__(self, config: JWTSecurityConfig):
        self.config = config
        self.token_blacklist = TokenBlacklist()
        self.active_tokens: Dict[str, TokenMetadata] = {}
        self.user_tokens: Dict[int, List[str]] = {}
        self.device_tokens: Dict[str, List[str]] = {}

        # Initialize encryption key if not provided
        if config.enable_token_encryption and not config.encryption_key:
            self.config.encryption_key = secrets.token_urlsafe(32)

        logger.info("Initialized JWT Security Manager")

    def create_access_token(
        self,
        data: Dict[str, Any],
        user_id: int,
        tenant_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        device_fingerprint: Optional[str] = None
    ) -> Tuple[str, TokenMetadata]:
        """Create a new access token with enhanced security."""
        token_id = secrets.token_urlsafe(32)
        issued_at = datetime.utcnow()
        expires_at = issued_at + timedelta(minutes=self.config.access_token_expire_minutes)

        # Create token metadata
        metadata = TokenMetadata(
            token_id=token_id,
            user_id=user_id,
            tenant_id=tenant_id,
            token_type=TokenType.ACCESS,
            status=TokenStatus.ACTIVE,
            issued_at=issued_at,
            expires_at=expires_at,
            ip_address=ip_address,
            user_agent=user_agent,
            device_fingerprint=device_fingerprint
        )

        # Prepare JWT payload
        payload = {
            "sub": str(user_id),
            "token_id": token_id,
            "tenant_id": tenant_id,
            "type": TokenType.ACCESS.value,
            "iat": issued_at.timestamp(),
            "exp": expires_at.timestamp(),
            "jti": token_id
        }

        # Add additional data
        payload.update(data)

        # Add security flags
        security_flags = []
        if device_fingerprint:
            security_flags.append("device_tracked")
        if ip_address and self._is_suspicious_ip(ip_address):
            security_flags.append("suspicious_ip")
        if user_agent and self._is_suspicious_user_agent(user_agent):
            security_flags.append("suspicious_ua")

        metadata.security_flags = security_flags

        # Create JWT token
        token = jwt.encode(
            payload,
            self.config.secret_key,
            algorithm=self.config.algorithm
        )

        # Store token metadata
        self._store_token_metadata(metadata)

        logger.info(f"Created access token {token_id} for user {user_id}")
        return token, metadata

    def create_refresh_token(
        self,
        user_id: int,
        tenant_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        device_fingerprint: Optional[str] = None,
        parent_token_id: Optional[str] = None
    ) -> Tuple[str, TokenMetadata]:
        """Create a new refresh token."""
        token_id = secrets.token_urlsafe(32)
        issued_at = datetime.utcnow()
        expires_at = issued_at + timedelta(days=self.config.refresh_token_expire_days)

        # Create token metadata
        metadata = TokenMetadata(
            token_id=token_id,
            user_id=user_id,
            tenant_id=tenant_id,
            token_type=TokenType.REFRESH,
            status=TokenStatus.ACTIVE,
            issued_at=issued_at,
            expires_at=expires_at,
            ip_address=ip_address,
            user_agent=user_agent,
            device_fingerprint=device_fingerprint,
            parent_token_id=parent_token_id
        )

        # Prepare JWT payload
        payload = {
            "sub": str(user_id),
            "token_id": token_id,
            "tenant_id": tenant_id,
            "type": TokenType.REFRESH.value,
            "iat": issued_at.timestamp(),
            "exp": expires_at.timestamp(),
            "jti": token_id
        }

        # Create JWT token
        token = jwt.encode(
            payload,
            self.config.secret_key,
            algorithm=self.config.algorithm
        )

        # Store token metadata
        self._store_token_metadata(metadata)

        logger.info(f"Created refresh token {token_id} for user {user_id}")
        return token, metadata

    def rotate_access_token(
        self,
        current_token: str,
        user_id: int,
        tenant_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        device_fingerprint: Optional[str] = None
    ) -> Tuple[str, TokenMetadata]:
        """Rotate an access token."""
        try:
            # Decode current token to get metadata
            payload = jwt.decode(
                current_token,
                self.config.secret_key,
                algorithms=[self.config.algorithm]
            )

            current_token_id = payload.get("token_id")
            current_metadata = None
            if current_token_id and current_token_id in self.active_tokens:
                current_metadata = self.active_tokens[current_token_id]
                current_metadata.status = TokenStatus.REVOKED
                self.token_blacklist.add(current_token_id, current_metadata.expires_at)

            # Create new token
            new_token, new_metadata = self.create_access_token(
                data={"sub": str(user_id)},
                user_id=user_id,
                tenant_id=tenant_id,
                ip_address=ip_address,
                user_agent=user_agent,
                device_fingerprint=device_fingerprint
            )

            # Link tokens
            new_metadata.parent_token_id = current_token_id
            if current_metadata:
                new_metadata.rotation_count = current_metadata.rotation_count + 1
            else:
                new_metadata.rotation_count = 1

            logger.info(f"Rotated access token from {current_token_id} to {new_metadata.token_id}")
            return new_token, new_metadata

        except JWTError as e:
            logger.error(f"Failed to rotate access token: {e}")
            raise

    def refresh_access_token(
        self,
        refresh_token: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        device_fingerprint: Optional[str] = None
    ) -> Tuple[str, TokenMetadata]:
        """Refresh an access token using a refresh token."""
        try:
            # Validate refresh token
            payload = jwt.decode(
                refresh_token,
                self.config.secret_key,
                algorithms=[self.config.algorithm]
            )

            if payload.get("type") != TokenType.REFRESH.value:
                raise InvalidTokenError("Invalid token type for refresh")

            user_id_str = payload.get("sub")
            if not user_id_str:
                raise InvalidTokenError("Token missing user ID")
            user_id = int(user_id_str)
            tenant_id = payload.get("tenant_id")
            token_id = payload.get("token_id")

            # Check if refresh token is valid
            if token_id not in self.active_tokens:
                raise InvalidTokenError("Refresh token not found")

            metadata = self.active_tokens[token_id]
            if metadata.status != TokenStatus.ACTIVE:
                raise InvalidTokenError("Refresh token is not active")

            # Check device fingerprint if enabled
            if (self.config.enable_device_fingerprinting and
                device_fingerprint and
                metadata.device_fingerprint != device_fingerprint):
                raise InvalidTokenError("Device fingerprint mismatch")

            # Create new access token
            access_token, access_metadata = self.create_access_token(
                data={"sub": str(user_id)},
                user_id=user_id,
                tenant_id=tenant_id,
                ip_address=ip_address,
                user_agent=user_agent,
                device_fingerprint=device_fingerprint
            )

            # Link tokens
            access_metadata.parent_token_id = token_id

            logger.info(f"Refreshed access token for user {user_id} using refresh token {token_id}")
            return access_token, access_metadata

        except ExpiredSignatureError:
            raise InvalidTokenError("Refresh token has expired")
        except JWTError as e:
            logger.error(f"Failed to refresh access token: {e}")
            raise InvalidTokenError("Invalid refresh token")

    def validate_token(
        self,
        token: str,
        token_type: TokenType = TokenType.ACCESS,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        device_fingerprint: Optional[str] = None
    ) -> TokenMetadata:
        """Validate a JWT token with enhanced security checks."""
        try:
            # Decode token
            payload = jwt.decode(
                token,
                self.config.secret_key,
                algorithms=[self.config.algorithm]
            )

            token_id = payload.get("token_id")
            if not token_id:
                raise InvalidTokenError("Token missing ID")

            # Check if token is blacklisted
            if self.token_blacklist.is_blacklisted(token_id):
                raise InvalidTokenError("Token has been revoked")

            # Get token metadata
            if token_id not in self.active_tokens:
                raise InvalidTokenError("Token not found")

            metadata = self.active_tokens[token_id]

            # Validate token type
            if metadata.token_type != token_type:
                raise InvalidTokenError(f"Invalid token type: expected {token_type.value}, got {metadata.token_type.value}")

            # Validate token status
            if metadata.status != TokenStatus.ACTIVE:
                raise InvalidTokenError(f"Token is {metadata.status.value}")

            # Check IP whitelist if enabled
            if (self.config.enable_ip_whitelisting and
                ip_address and
                ip_address not in self.config.allowed_ips):
                raise InvalidTokenError("IP address not whitelisted")

            # Check device fingerprint if enabled
            if (self.config.enable_device_fingerprinting and
                device_fingerprint and
                metadata.device_fingerprint != device_fingerprint):
                raise InvalidTokenError("Device fingerprint mismatch")

            # Update usage statistics
            metadata.last_used_at = datetime.utcnow()
            metadata.usage_count += 1

            # Check if token needs rotation
            if self._should_rotate_token(metadata):
                logger.info(f"Token {token_id} should be rotated")

            logger.debug(f"Validated token {token_id} for user {metadata.user_id}")
            return metadata

        except ExpiredSignatureError:
            raise InvalidTokenError("Token has expired")
        except JWTError as e:
            logger.error(f"Token validation failed: {e}")
            raise InvalidTokenError("Invalid token")

    def revoke_token(self, token_id: str, cascade: bool = False):
        """Revoke a token and optionally its children."""
        if token_id not in self.active_tokens:
            logger.warning(f"Attempted to revoke non-existent token {token_id}")
            return

        metadata = self.active_tokens[token_id]
        metadata.status = TokenStatus.REVOKED

        # Add to blacklist
        self.token_blacklist.add(token_id, metadata.expires_at)

        # Remove from active tokens
        del self.active_tokens[token_id]

        # Remove from user tokens
        if metadata.user_id in self.user_tokens:
            if token_id in self.user_tokens[metadata.user_id]:
                self.user_tokens[metadata.user_id].remove(token_id)

        # Remove from device tokens
        if metadata.device_fingerprint and metadata.device_fingerprint in self.device_tokens:
            if token_id in self.device_tokens[metadata.device_fingerprint]:
                self.device_tokens[metadata.device_fingerprint].remove(token_id)

        # Cascade revocation if requested
        if cascade:
            # Find and revoke child tokens
            child_tokens = [tid for tid, meta in self.active_tokens.items()
                          if meta.parent_token_id == token_id]
            for child_token_id in child_tokens:
                self.revoke_token(child_token_id, cascade=False)

        logger.info(f"Revoked token {token_id} (cascade: {cascade})")

    def revoke_user_tokens(self, user_id: int, token_type: Optional[TokenType] = None):
        """Revoke all tokens for a user."""
        if user_id not in self.user_tokens:
            return

        token_ids = self.user_tokens[user_id].copy()
        for token_id in token_ids:
            if token_id in self.active_tokens:
                metadata = self.active_tokens[token_id]
                if token_type is None or metadata.token_type == token_type:
                    self.revoke_token(token_id)

        logger.info(f"Revoked all tokens for user {user_id} (type: {token_type.value if token_type else 'all'})")

    def get_user_tokens(self, user_id: int, token_type: Optional[TokenType] = None) -> List[TokenMetadata]:
        """Get all active tokens for a user."""
        if user_id not in self.user_tokens:
            return []

        tokens = []
        for token_id in self.user_tokens[user_id]:
            if token_id in self.active_tokens:
                metadata = self.active_tokens[token_id]
                if token_type is None or metadata.token_type == token_type:
                    tokens.append(metadata)

        return tokens

    def cleanup_expired_tokens(self):
        """Clean up expired tokens."""
        now = datetime.utcnow()
        expired_tokens = []

        for token_id, metadata in self.active_tokens.items():
            if now > metadata.expires_at:
                expired_tokens.append(token_id)

        for token_id in expired_tokens:
            metadata = self.active_tokens[token_id]
            metadata.status = TokenStatus.EXPIRED
            self.revoke_token(token_id)

        if expired_tokens:
            logger.info(f"Cleaned up {len(expired_tokens)} expired tokens")

        # Cleanup blacklist
        self.token_blacklist.cleanup()

    def _store_token_metadata(self, metadata: TokenMetadata):
        """Store token metadata and manage token limits."""
        # Store token
        self.active_tokens[metadata.token_id] = metadata

        # Add to user tokens
        if metadata.user_id not in self.user_tokens:
            self.user_tokens[metadata.user_id] = []
        self.user_tokens[metadata.user_id].append(metadata.token_id)

        # Add to device tokens
        if metadata.device_fingerprint:
            if metadata.device_fingerprint not in self.device_tokens:
                self.device_tokens[metadata.device_fingerprint] = []
            self.device_tokens[metadata.device_fingerprint].append(metadata.token_id)

        # Enforce token limits
        self._enforce_token_limits(metadata.user_id, metadata.device_fingerprint)

    def _enforce_token_limits(self, user_id: int, device_fingerprint: Optional[str]):
        """Enforce token limits per user and device."""
        # Enforce per-user limit
        if user_id in self.user_tokens and len(self.user_tokens[user_id]) > self.config.max_tokens_per_user:
            # Remove oldest tokens
            tokens_to_remove = len(self.user_tokens[user_id]) - self.config.max_tokens_per_user
            for token_id in self.user_tokens[user_id][:tokens_to_remove]:
                self.revoke_token(token_id)
            logger.info(f"Enforced user token limit for user {user_id}")

        # Enforce per-device limit
        if (device_fingerprint and
            device_fingerprint in self.device_tokens and
            len(self.device_tokens[device_fingerprint]) > self.config.max_tokens_per_device):
            # Remove oldest tokens
            tokens_to_remove = len(self.device_tokens[device_fingerprint]) - self.config.max_tokens_per_device
            for token_id in self.device_tokens[device_fingerprint][:tokens_to_remove]:
                self.revoke_token(token_id)
            logger.info(f"Enforced device token limit for device {device_fingerprint}")

    def _should_rotate_token(self, metadata: TokenMetadata) -> bool:
        """Check if a token should be rotated."""
        if not self.config.token_rotation.enable_rotation:
            return False

        now = datetime.utcnow()
        age = (now - metadata.issued_at).total_seconds()
        usage_ratio = metadata.usage_count / max(1, self.config.access_token_expire_minutes * 60)  # Expected max usage

        # Check rotation conditions
        should_rotate = (
            age > self.config.token_rotation.force_rotation_after or
            usage_ratio > (self.config.token_rotation.rotation_threshold / 100) or
            metadata.rotation_count >= self.config.token_rotation.max_rotations
        )

        return should_rotate

    def _is_suspicious_ip(self, ip_address: str) -> bool:
        """Check if IP address is suspicious."""
        # This would integrate with threat intelligence services
        # For now, just check for common suspicious patterns
        suspicious_patterns = [
            "0.0.0.0",
            "127.0.0.1",
            "10.0.0.0/8",
            "172.16.0.0/12",
            "192.168.0.0/16"
        ]
        return any(pattern in ip_address for pattern in suspicious_patterns)

    def _is_suspicious_user_agent(self, user_agent: str) -> bool:
        """Check if user agent is suspicious."""
        # This would check for known bot patterns, empty UAs, etc.
        suspicious_patterns = [
            "bot",
            "spider",
            "crawler",
            "python-requests",
            "curl"
        ]
        return any(pattern.lower() in user_agent.lower() for pattern in suspicious_patterns)

    def get_security_metrics(self) -> Dict[str, Any]:
        """Get security metrics for monitoring."""
        total_tokens = len(self.active_tokens)
        active_tokens = sum(1 for t in self.active_tokens.values() if t.status == TokenStatus.ACTIVE)
        revoked_tokens = sum(1 for t in self.active_tokens.values() if t.status == TokenStatus.REVOKED)
        blacklisted_count = len(self.token_blacklist._blacklisted_tokens)

        # Calculate token age distribution
        now = datetime.utcnow()
        token_ages = [(now - t.issued_at).total_seconds() / 3600 for t in self.active_tokens.values()]  # hours

        return {
            "total_tokens": total_tokens,
            "active_tokens": active_tokens,
            "revoked_tokens": revoked_tokens,
            "blacklisted_tokens": blacklisted_count,
            "tokens_per_user": {uid: len(tokens) for uid, tokens in self.user_tokens.items()},
            "average_token_age_hours": sum(token_ages) / max(len(token_ages), 1),
            "max_token_age_hours": max(token_ages) if token_ages else 0,
            "min_token_age_hours": min(token_ages) if token_ages else 0,
            "security_flags_count": sum(len(t.security_flags) for t in self.active_tokens.values())
        }


# Global JWT security manager instance
jwt_security_manager: Optional[JWTSecurityManager] = None


def init_jwt_security(config: JWTSecurityConfig) -> JWTSecurityManager:
    """Initialize the global JWT security manager."""
    global jwt_security_manager
    jwt_security_manager = JWTSecurityManager(config)
    return jwt_security_manager


def get_jwt_security_manager() -> JWTSecurityManager:
    """Get the global JWT security manager."""
    if jwt_security_manager is None:
        raise RuntimeError("JWT Security Manager not initialized")
    return jwt_security_manager