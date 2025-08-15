"""Cache manager for personalization system with Redis integration."""
import json
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from app.core.redis import get_redis
from app.schemas.personalization import PersonalizationConfig

logger = logging.getLogger(__name__)


class PersonalizationCacheManager:
    """
    Manages caching for personalization system to optimize performance.
    Uses Redis for distributed caching with intelligent cache invalidation.
    """

    def __init__(self):
        """Initialize cache manager with Redis connection."""
        self.redis = None
        self.default_ttl = 300  # 5 minutes default TTL
        self.key_prefix = "personalization"

    async def _get_redis(self):
        """Get Redis connection lazily."""
        if not self.redis:
            self.redis = await get_redis()
        return self.redis

    def _make_key(self, *parts: str) -> str:
        """Create a cache key with consistent formatting."""
        return f"{self.key_prefix}:" + ":".join(str(part) for part in parts)

    async def get_user_config(
        self,
        user_id: int,
        context: str
    ) -> Optional[PersonalizationConfig]:
        """
        Get cached personalization configuration for user.
        
        Args:
            user_id: User ID
            context: Personalization context
            
        Returns:
            PersonalizationConfig if cached, None otherwise
        """
        try:
            redis = await self._get_redis()
            if not redis:
                return None

            cache_key = self._make_key("config", str(user_id), context)
            cached_data = await redis.get(cache_key)
            
            if cached_data:
                config_dict = json.loads(cached_data)
                
                # Check if cache is still valid
                cache_expires_at = datetime.fromisoformat(config_dict["cache_expires_at"])
                if datetime.utcnow() < cache_expires_at:
                    logger.debug(f"Cache hit for user {user_id}, context {context}")
                    return PersonalizationConfig(**config_dict)
                else:
                    # Cache expired, remove it
                    await redis.delete(cache_key)
                    logger.debug(f"Cache expired for user {user_id}, context {context}")
            
            return None
            
        except Exception as e:
            logger.warning(f"Error retrieving cached config for user {user_id}: {e}")
            return None

    async def cache_user_config(
        self,
        user_id: int,
        context: str,
        config: PersonalizationConfig,
        ttl_seconds: int = None
    ) -> bool:
        """
        Cache personalization configuration for user.
        
        Args:
            user_id: User ID
            context: Personalization context
            config: Configuration to cache
            ttl_seconds: Cache TTL in seconds
            
        Returns:
            True if cached successfully, False otherwise
        """
        try:
            redis = await self._get_redis()
            if not redis:
                return False

            ttl = ttl_seconds or self.default_ttl
            cache_key = self._make_key("config", str(user_id), context)
            
            # Serialize configuration
            config_dict = config.model_dump()
            # Ensure datetime objects are serializable
            for key, value in config_dict.items():
                if isinstance(value, datetime):
                    config_dict[key] = value.isoformat()
            
            cached_data = json.dumps(config_dict)
            
            # Cache with TTL
            await redis.setex(cache_key, ttl, cached_data)
            
            # Track cache statistics
            await self._track_cache_write(user_id, context)
            
            logger.debug(f"Cached config for user {user_id}, context {context}, TTL {ttl}s")
            return True
            
        except Exception as e:
            logger.warning(f"Error caching config for user {user_id}: {e}")
            return False

    async def invalidate_user_cache(
        self,
        user_id: int,
        contexts: Optional[List[str]] = None
    ) -> bool:
        """
        Invalidate cached configurations for a user.
        
        Args:
            user_id: User ID
            contexts: Specific contexts to invalidate, or None for all
            
        Returns:
            True if invalidated successfully
        """
        try:
            redis = await self._get_redis()
            if not redis:
                return False

            if contexts:
                # Invalidate specific contexts
                keys_to_delete = []
                for context in contexts:
                    keys_to_delete.append(self._make_key("config", str(user_id), context))
            else:
                # Invalidate all contexts for user
                pattern = self._make_key("config", str(user_id), "*")
                keys_to_delete = await redis.keys(pattern)
            
            if keys_to_delete:
                await redis.delete(*keys_to_delete)
                logger.info(f"Invalidated {len(keys_to_delete)} cache entries for user {user_id}")
            
            # Track cache invalidation
            await self._track_cache_invalidation(user_id, len(keys_to_delete))
            
            return True
            
        except Exception as e:
            logger.warning(f"Error invalidating cache for user {user_id}: {e}")
            return False

    async def get_rule_cache(
        self,
        rule_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Get cached rule data.
        
        Args:
            rule_id: Rule identifier
            
        Returns:
            Cached rule data or None
        """
        try:
            redis = await self._get_redis()
            if not redis:
                return None

            cache_key = self._make_key("rule", rule_id)
            cached_data = await redis.get(cache_key)
            
            if cached_data:
                return json.loads(cached_data)
            
            return None
            
        except Exception as e:
            logger.warning(f"Error retrieving cached rule {rule_id}: {e}")
            return None

    async def cache_rule_data(
        self,
        rule_id: str,
        rule_data: Dict[str, Any],
        ttl_seconds: int = 3600  # 1 hour default for rules
    ) -> bool:
        """
        Cache rule data.
        
        Args:
            rule_id: Rule identifier
            rule_data: Rule data to cache
            ttl_seconds: Cache TTL in seconds
            
        Returns:
            True if cached successfully
        """
        try:
            redis = await self._get_redis()
            if not redis:
                return False

            cache_key = self._make_key("rule", rule_id)
            cached_data = json.dumps(rule_data)
            
            await redis.setex(cache_key, ttl_seconds, cached_data)
            
            logger.debug(f"Cached rule data for {rule_id}, TTL {ttl_seconds}s")
            return True
            
        except Exception as e:
            logger.warning(f"Error caching rule {rule_id}: {e}")
            return False

    async def invalidate_rule_cache(
        self,
        rule_id: str
    ) -> bool:
        """
        Invalidate cached rule data.
        
        Args:
            rule_id: Rule identifier
            
        Returns:
            True if invalidated successfully
        """
        try:
            redis = await self._get_redis()
            if not redis:
                return False

            cache_key = self._make_key("rule", rule_id)
            await redis.delete(cache_key)
            
            logger.debug(f"Invalidated rule cache for {rule_id}")
            return True
            
        except Exception as e:
            logger.warning(f"Error invalidating rule cache {rule_id}: {e}")
            return False

    async def get_segment_cache(
        self,
        segment: str
    ) -> Optional[Dict[str, Any]]:
        """
        Get cached segment analysis data.
        
        Args:
            segment: User segment
            
        Returns:
            Cached segment data or None
        """
        try:
            redis = await self._get_redis()
            if not redis:
                return None

            cache_key = self._make_key("segment", segment)
            cached_data = await redis.get(cache_key)
            
            if cached_data:
                return json.loads(cached_data)
            
            return None
            
        except Exception as e:
            logger.warning(f"Error retrieving cached segment {segment}: {e}")
            return None

    async def cache_segment_data(
        self,
        segment: str,
        segment_data: Dict[str, Any],
        ttl_seconds: int = 1800  # 30 minutes default for segments
    ) -> bool:
        """
        Cache segment analysis data.
        
        Args:
            segment: User segment
            segment_data: Segment data to cache
            ttl_seconds: Cache TTL in seconds
            
        Returns:
            True if cached successfully
        """
        try:
            redis = await self._get_redis()
            if not redis:
                return False

            cache_key = self._make_key("segment", segment)
            cached_data = json.dumps(segment_data)
            
            await redis.setex(cache_key, ttl_seconds, cached_data)
            
            logger.debug(f"Cached segment data for {segment}, TTL {ttl_seconds}s")
            return True
            
        except Exception as e:
            logger.warning(f"Error caching segment {segment}: {e}")
            return False

    async def get_user_profile_cache(
        self,
        user_id: int
    ) -> Optional[Dict[str, Any]]:
        """
        Get cached user profile data.
        
        Args:
            user_id: User ID
            
        Returns:
            Cached profile data or None
        """
        try:
            redis = await self._get_redis()
            if not redis:
                return None

            cache_key = self._make_key("profile", str(user_id))
            cached_data = await redis.get(cache_key)
            
            if cached_data:
                return json.loads(cached_data)
            
            return None
            
        except Exception as e:
            logger.warning(f"Error retrieving cached profile for user {user_id}: {e}")
            return None

    async def cache_user_profile(
        self,
        user_id: int,
        profile_data: Dict[str, Any],
        ttl_seconds: int = 600  # 10 minutes default for profiles
    ) -> bool:
        """
        Cache user profile data.
        
        Args:
            user_id: User ID
            profile_data: Profile data to cache
            ttl_seconds: Cache TTL in seconds
            
        Returns:
            True if cached successfully
        """
        try:
            redis = await self._get_redis()
            if not redis:
                return False

            cache_key = self._make_key("profile", str(user_id))
            
            # Serialize profile data
            serializable_data = {}
            for key, value in profile_data.items():
                if isinstance(value, datetime):
                    serializable_data[key] = value.isoformat()
                else:
                    serializable_data[key] = value
            
            cached_data = json.dumps(serializable_data)
            
            await redis.setex(cache_key, ttl_seconds, cached_data)
            
            logger.debug(f"Cached profile for user {user_id}, TTL {ttl_seconds}s")
            return True
            
        except Exception as e:
            logger.warning(f"Error caching profile for user {user_id}: {e}")
            return False

    async def get_analytics_cache(
        self,
        cache_key: str
    ) -> Optional[Dict[str, Any]]:
        """
        Get cached analytics data.
        
        Args:
            cache_key: Analytics cache key
            
        Returns:
            Cached analytics data or None
        """
        try:
            redis = await self._get_redis()
            if not redis:
                return None

            full_key = self._make_key("analytics", cache_key)
            cached_data = await redis.get(full_key)
            
            if cached_data:
                return json.loads(cached_data)
            
            return None
            
        except Exception as e:
            logger.warning(f"Error retrieving cached analytics {cache_key}: {e}")
            return None

    async def cache_analytics_data(
        self,
        cache_key: str,
        analytics_data: Dict[str, Any],
        ttl_seconds: int = 900  # 15 minutes default for analytics
    ) -> bool:
        """
        Cache analytics data.
        
        Args:
            cache_key: Analytics cache key
            analytics_data: Analytics data to cache
            ttl_seconds: Cache TTL in seconds
            
        Returns:
            True if cached successfully
        """
        try:
            redis = await self._get_redis()
            if not redis:
                return False

            full_key = self._make_key("analytics", cache_key)
            
            # Serialize analytics data
            serializable_data = {}
            for key, value in analytics_data.items():
                if isinstance(value, datetime):
                    serializable_data[key] = value.isoformat()
                else:
                    serializable_data[key] = value
            
            cached_data = json.dumps(serializable_data)
            
            await redis.setex(full_key, ttl_seconds, cached_data)
            
            logger.debug(f"Cached analytics data for {cache_key}, TTL {ttl_seconds}s")
            return True
            
        except Exception as e:
            logger.warning(f"Error caching analytics {cache_key}: {e}")
            return False

    async def flush_all_cache(self) -> bool:
        """
        Flush all personalization cache data.
        
        Returns:
            True if flushed successfully
        """
        try:
            redis = await self._get_redis()
            if not redis:
                return False

            pattern = self._make_key("*")
            keys_to_delete = await redis.keys(pattern)
            
            if keys_to_delete:
                await redis.delete(*keys_to_delete)
                logger.info(f"Flushed {len(keys_to_delete)} personalization cache entries")
            
            return True
            
        except Exception as e:
            logger.error(f"Error flushing personalization cache: {e}")
            return False

    async def get_cache_stats(self) -> Dict[str, Any]:
        """
        Get cache performance statistics.
        
        Returns:
            Dict containing cache statistics
        """
        try:
            redis = await self._get_redis()
            if not redis:
                return {"error": "Redis not available"}

            # Get cache hit/miss statistics
            hit_key = self._make_key("stats", "hits")
            miss_key = self._make_key("stats", "misses")
            write_key = self._make_key("stats", "writes")
            invalidate_key = self._make_key("stats", "invalidations")
            
            hits = await redis.get(hit_key) or "0"
            misses = await redis.get(miss_key) or "0"
            writes = await redis.get(write_key) or "0"
            invalidations = await redis.get(invalidate_key) or "0"
            
            total_requests = int(hits) + int(misses)
            hit_rate = (int(hits) / total_requests * 100) if total_requests > 0 else 0
            
            # Get cache size
            pattern = self._make_key("*")
            all_keys = await redis.keys(pattern)
            cache_size = len([key for key in all_keys if not key.endswith(":stats:hits") 
                             and not key.endswith(":stats:misses") 
                             and not key.endswith(":stats:writes")
                             and not key.endswith(":stats:invalidations")])
            
            return {
                "cache_hits": int(hits),
                "cache_misses": int(misses),
                "cache_writes": int(writes),
                "cache_invalidations": int(invalidations),
                "hit_rate_percent": round(hit_rate, 2),
                "total_cached_items": cache_size,
                "total_requests": total_requests
            }
            
        except Exception as e:
            logger.error(f"Error getting cache stats: {e}")
            return {"error": str(e)}

    async def _track_cache_hit(self, user_id: int, context: str) -> None:
        """Track cache hit for statistics."""
        try:
            redis = await self._get_redis()
            if redis:
                hit_key = self._make_key("stats", "hits")
                await redis.incr(hit_key)
        except Exception:
            pass  # Don't let stats tracking break functionality

    async def _track_cache_miss(self, user_id: int, context: str) -> None:
        """Track cache miss for statistics."""
        try:
            redis = await self._get_redis()
            if redis:
                miss_key = self._make_key("stats", "misses")
                await redis.incr(miss_key)
        except Exception:
            pass

    async def _track_cache_write(self, user_id: int, context: str) -> None:
        """Track cache write for statistics."""
        try:
            redis = await self._get_redis()
            if redis:
                write_key = self._make_key("stats", "writes")
                await redis.incr(write_key)
        except Exception:
            pass

    async def _track_cache_invalidation(self, user_id: int, count: int) -> None:
        """Track cache invalidation for statistics."""
        try:
            redis = await self._get_redis()
            if redis:
                invalidate_key = self._make_key("stats", "invalidations")
                await redis.incrby(invalidate_key, count)
        except Exception:
            pass