"""Redis caching service for real-time recommendation delivery."""
import json
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Union

from app.core.cache import get_cache
from app.schemas.recommendation import (
    Recommendation, RecommendationResponse, TrendingRecommendationsResponse,
    SimilarUsersResponse, RecommendationAnalytics
)

logger = logging.getLogger(__name__)


class RecommendationCacheService:
    """Advanced caching service for recommendation system with smart invalidation."""
    
    def __init__(self):
        self.cache = get_cache()
        self.default_ttl = 300  # 5 minutes default
        
    # Cache key generators
    def _user_recommendations_key(
        self, 
        user_id: int, 
        types: Optional[List[str]] = None, 
        limit: int = 10
    ) -> str:
        """Generate cache key for user recommendations."""
        types_str = ":".join(sorted(types or []))
        return f"recommendations:user:{user_id}:types:{types_str}:limit:{limit}"
    
    def _trending_recommendations_key(
        self, 
        types: Optional[List[str]] = None,
        time_window: int = 24,
        limit: int = 20
    ) -> str:
        """Generate cache key for trending recommendations."""
        types_str = ":".join(sorted(types or []))
        return f"recommendations:trending:types:{types_str}:window:{time_window}:limit:{limit}"
    
    def _similar_users_key(
        self, 
        user_id: int, 
        min_similarity: float = 0.1,
        limit: int = 10
    ) -> str:
        """Generate cache key for similar users."""
        return f"similar_users:user:{user_id}:min_sim:{min_similarity}:limit:{limit}"
    
    def _analytics_key(
        self,
        user_id: Optional[int] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        types: Optional[List[str]] = None,
    ) -> str:
        """Generate cache key for analytics."""
        parts = ["analytics"]
        if user_id:
            parts.append(f"user:{user_id}")
        if start_date:
            parts.append(f"start:{start_date.date()}")
        if end_date:
            parts.append(f"end:{end_date.date()}")
        if types:
            parts.append(f"types:{':'.join(sorted(types))}")
        return ":".join(parts)
    
    def _user_preferences_key(self, user_id: int) -> str:
        """Generate cache key for user preferences."""
        return f"user_preferences:user:{user_id}"
    
    def _recommendation_key(self, recommendation_id: str) -> str:
        """Generate cache key for individual recommendation."""
        return f"recommendation:{recommendation_id}"
    
    # Caching methods
    async def cache_user_recommendations(
        self,
        user_id: int,
        recommendations: RecommendationResponse,
        types: Optional[List[str]] = None,
        limit: int = 10,
        ttl: Optional[int] = None,
    ) -> None:
        """Cache user recommendations with smart TTL."""
        key = self._user_recommendations_key(user_id, types, limit)
        ttl = ttl or self._calculate_dynamic_ttl(recommendations.recommendations)
        
        try:
            data = recommendations.model_dump()
            data["cached_at"] = datetime.utcnow().isoformat()
            await self.cache.set(key, json.dumps(data), expire=ttl)
            
            # Also cache individual recommendations for faster access
            for rec in recommendations.recommendations:
                await self.cache_recommendation(rec, ttl=ttl)
                
            logger.debug(f"Cached user recommendations for user {user_id} with TTL {ttl}s")
            
        except Exception as e:
            logger.error(f"Failed to cache user recommendations: {e}")
    
    async def get_cached_user_recommendations(
        self,
        user_id: int,
        types: Optional[List[str]] = None,
        limit: int = 10,
    ) -> Optional[RecommendationResponse]:
        """Get cached user recommendations."""
        key = self._user_recommendations_key(user_id, types, limit)
        
        try:
            cached_data = await self.cache.get(key)
            if not cached_data:
                return None
                
            if isinstance(cached_data, str):
                data = json.loads(cached_data)
            else:
                data = cached_data
                
            # Add cache hit information
            data["metadata"]["cache_hit"] = True
            data["metadata"]["cached_at"] = data.get("cached_at")
            
            return RecommendationResponse(**data)
            
        except Exception as e:
            logger.error(f"Failed to get cached user recommendations: {e}")
            return None
    
    async def cache_trending_recommendations(
        self,
        trending: TrendingRecommendationsResponse,
        types: Optional[List[str]] = None,
        time_window: int = 24,
        limit: int = 20,
        ttl: int = 900,  # 15 minutes for trending
    ) -> None:
        """Cache trending recommendations."""
        key = self._trending_recommendations_key(types, time_window, limit)
        
        try:
            data = trending.model_dump()
            data["cached_at"] = datetime.utcnow().isoformat()
            await self.cache.set(key, json.dumps(data), expire=ttl)
            
            logger.debug(f"Cached trending recommendations with TTL {ttl}s")
            
        except Exception as e:
            logger.error(f"Failed to cache trending recommendations: {e}")
    
    async def get_cached_trending_recommendations(
        self,
        types: Optional[List[str]] = None,
        time_window: int = 24,
        limit: int = 20,
    ) -> Optional[TrendingRecommendationsResponse]:
        """Get cached trending recommendations."""
        key = self._trending_recommendations_key(types, time_window, limit)
        
        try:
            cached_data = await self.cache.get(key)
            if not cached_data:
                return None
                
            if isinstance(cached_data, str):
                data = json.loads(cached_data)
            else:
                data = cached_data
                
            return TrendingRecommendationsResponse(**data)
            
        except Exception as e:
            logger.error(f"Failed to get cached trending recommendations: {e}")
            return None
    
    async def cache_similar_users(
        self,
        user_id: int,
        similar_users: SimilarUsersResponse,
        min_similarity: float = 0.1,
        limit: int = 10,
        ttl: int = 3600,  # 1 hour for similar users
    ) -> None:
        """Cache similar users response."""
        key = self._similar_users_key(user_id, min_similarity, limit)
        
        try:
            data = similar_users.model_dump()
            data["cached_at"] = datetime.utcnow().isoformat()
            await self.cache.set(key, json.dumps(data), expire=ttl)
            
            logger.debug(f"Cached similar users for user {user_id} with TTL {ttl}s")
            
        except Exception as e:
            logger.error(f"Failed to cache similar users: {e}")
    
    async def get_cached_similar_users(
        self,
        user_id: int,
        min_similarity: float = 0.1,
        limit: int = 10,
    ) -> Optional[SimilarUsersResponse]:
        """Get cached similar users."""
        key = self._similar_users_key(user_id, min_similarity, limit)
        
        try:
            cached_data = await self.cache.get(key)
            if not cached_data:
                return None
                
            if isinstance(cached_data, str):
                data = json.loads(cached_data)
            else:
                data = cached_data
                
            return SimilarUsersResponse(**data)
            
        except Exception as e:
            logger.error(f"Failed to get cached similar users: {e}")
            return None
    
    async def cache_analytics(
        self,
        analytics: RecommendationAnalytics,
        user_id: Optional[int] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        types: Optional[List[str]] = None,
        ttl: int = 1800,  # 30 minutes for analytics
    ) -> None:
        """Cache recommendation analytics."""
        key = self._analytics_key(user_id, start_date, end_date, types)
        
        try:
            data = analytics.model_dump()
            data["cached_at"] = datetime.utcnow().isoformat()
            await self.cache.set(key, json.dumps(data), expire=ttl)
            
            logger.debug(f"Cached analytics with TTL {ttl}s")
            
        except Exception as e:
            logger.error(f"Failed to cache analytics: {e}")
    
    async def get_cached_analytics(
        self,
        user_id: Optional[int] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        types: Optional[List[str]] = None,
    ) -> Optional[RecommendationAnalytics]:
        """Get cached analytics."""
        key = self._analytics_key(user_id, start_date, end_date, types)
        
        try:
            cached_data = await self.cache.get(key)
            if not cached_data:
                return None
                
            if isinstance(cached_data, str):
                data = json.loads(cached_data)
            else:
                data = cached_data
                
            return RecommendationAnalytics(**data)
            
        except Exception as e:
            logger.error(f"Failed to get cached analytics: {e}")
            return None
    
    async def cache_recommendation(
        self,
        recommendation: Recommendation,
        ttl: int = 600,  # 10 minutes for individual recommendations
    ) -> None:
        """Cache individual recommendation."""
        key = self._recommendation_key(recommendation.recommendation_id)
        
        try:
            data = recommendation.model_dump()
            data["cached_at"] = datetime.utcnow().isoformat()
            await self.cache.set(key, json.dumps(data), expire=ttl)
            
        except Exception as e:
            logger.error(f"Failed to cache recommendation {recommendation.recommendation_id}: {e}")
    
    async def get_cached_recommendation(
        self,
        recommendation_id: str,
    ) -> Optional[Recommendation]:
        """Get cached individual recommendation."""
        key = self._recommendation_key(recommendation_id)
        
        try:
            cached_data = await self.cache.get(key)
            if not cached_data:
                return None
                
            if isinstance(cached_data, str):
                data = json.loads(cached_data)
            else:
                data = cached_data
                
            return Recommendation(**data)
            
        except Exception as e:
            logger.error(f"Failed to get cached recommendation: {e}")
            return None
    
    # Cache invalidation methods
    async def invalidate_user_recommendations(self, user_id: int) -> None:
        """Invalidate all cached recommendations for a user."""
        try:
            # Find and delete all user recommendation cache keys
            pattern = f"recommendations:user:{user_id}:*"
            await self._invalidate_pattern(pattern)
            
            # Also invalidate user preferences cache
            prefs_key = self._user_preferences_key(user_id)
            await self.cache.delete(prefs_key)
            
            logger.debug(f"Invalidated recommendation cache for user {user_id}")
            
        except Exception as e:
            logger.error(f"Failed to invalidate user recommendations cache: {e}")
    
    async def invalidate_trending_recommendations(self) -> None:
        """Invalidate all trending recommendations cache."""
        try:
            pattern = "recommendations:trending:*"
            await self._invalidate_pattern(pattern)
            
            logger.debug("Invalidated trending recommendations cache")
            
        except Exception as e:
            logger.error(f"Failed to invalidate trending recommendations cache: {e}")
    
    async def invalidate_similar_users(self, user_id: int) -> None:
        """Invalidate similar users cache for a user."""
        try:
            pattern = f"similar_users:user:{user_id}:*"
            await self._invalidate_pattern(pattern)
            
            # Also invalidate for users who have this user as similar
            pattern2 = f"similar_users:*:user:{user_id}:*"
            await self._invalidate_pattern(pattern2)
            
            logger.debug(f"Invalidated similar users cache for user {user_id}")
            
        except Exception as e:
            logger.error(f"Failed to invalidate similar users cache: {e}")
    
    async def invalidate_analytics(self) -> None:
        """Invalidate all analytics cache."""
        try:
            pattern = "analytics:*"
            await self._invalidate_pattern(pattern)
            
            logger.debug("Invalidated analytics cache")
            
        except Exception as e:
            logger.error(f"Failed to invalidate analytics cache: {e}")
    
    async def invalidate_recommendation(self, recommendation_id: str) -> None:
        """Invalidate individual recommendation cache."""
        try:
            key = self._recommendation_key(recommendation_id)
            await self.cache.delete(key)
            
        except Exception as e:
            logger.error(f"Failed to invalidate recommendation cache: {e}")
    
    async def _invalidate_pattern(self, pattern: str) -> None:
        """Invalidate cache keys matching a pattern."""
        try:
            # Note: This implementation depends on the Redis cache backend
            # having scan functionality. Adjust based on your cache implementation.
            
            # For Redis-based cache
            if hasattr(self.cache, 'redis'):
                import aioredis
                redis = self.cache.redis
                
                cursor = 0
                while True:
                    cursor, keys = await redis.scan(cursor, match=pattern)
                    if keys:
                        await redis.delete(*keys)
                    if cursor == 0:
                        break
            else:
                # Fallback: attempt to use cache keys if available
                logger.warning(f"Cannot invalidate pattern {pattern} - cache doesn't support pattern matching")
                
        except Exception as e:
            logger.error(f"Failed to invalidate pattern {pattern}: {e}")
    
    # Cache warming methods
    async def warm_user_cache(
        self,
        user_id: int,
        recommendation_generator_func,
        types: Optional[List[str]] = None,
        limit: int = 10,
    ) -> None:
        """Warm the cache for a user's recommendations."""
        try:
            # Generate fresh recommendations
            recommendations = await recommendation_generator_func(
                user_id=user_id,
                types=types,
                limit=limit,
            )
            
            # Cache them
            await self.cache_user_recommendations(
                user_id=user_id,
                recommendations=recommendations,
                types=types,
                limit=limit,
            )
            
            logger.debug(f"Warmed recommendation cache for user {user_id}")
            
        except Exception as e:
            logger.error(f"Failed to warm user cache: {e}")
    
    async def warm_trending_cache(
        self,
        trending_generator_func,
        types: Optional[List[str]] = None,
        time_window: int = 24,
        limit: int = 20,
    ) -> None:
        """Warm the cache for trending recommendations."""
        try:
            trending = await trending_generator_func(
                types=types,
                time_window=time_window,
                limit=limit,
            )
            
            await self.cache_trending_recommendations(
                trending=trending,
                types=types,
                time_window=time_window,
                limit=limit,
            )
            
            logger.debug("Warmed trending recommendations cache")
            
        except Exception as e:
            logger.error(f"Failed to warm trending cache: {e}")
    
    # Utility methods
    def _calculate_dynamic_ttl(self, recommendations: List[Recommendation]) -> int:
        """Calculate dynamic TTL based on recommendation characteristics."""
        base_ttl = self.default_ttl
        
        if not recommendations:
            return base_ttl
        
        # Shorter TTL for high-priority recommendations
        avg_priority = sum(rec.priority_score for rec in recommendations) / len(recommendations)
        if avg_priority > 0.8:
            return int(base_ttl * 0.5)  # 2.5 minutes
        elif avg_priority > 0.6:
            return int(base_ttl * 0.75)  # 3.75 minutes
        
        # Longer TTL for low-confidence recommendations
        avg_confidence = sum(rec.confidence_score for rec in recommendations) / len(recommendations)
        if avg_confidence < 0.5:
            return int(base_ttl * 2)  # 10 minutes
        
        return base_ttl
    
    async def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics for monitoring."""
        try:
            # This depends on cache implementation
            if hasattr(self.cache, 'redis'):
                redis = self.cache.redis
                info = await redis.info()
                
                return {
                    "memory_used": info.get("used_memory_human"),
                    "keyspace_hits": info.get("keyspace_hits", 0),
                    "keyspace_misses": info.get("keyspace_misses", 0),
                    "connected_clients": info.get("connected_clients", 0),
                }
            else:
                return {"status": "Cache stats not available"}
                
        except Exception as e:
            logger.error(f"Failed to get cache stats: {e}")
            return {"error": str(e)}
    
    async def clear_all_recommendation_cache(self) -> None:
        """Clear all recommendation-related cache (use with caution)."""
        try:
            patterns = [
                "recommendations:*",
                "similar_users:*", 
                "analytics:*",
                "user_preferences:*",
                "recommendation:*",
            ]
            
            for pattern in patterns:
                await self._invalidate_pattern(pattern)
                
            logger.info("Cleared all recommendation cache")
            
        except Exception as e:
            logger.error(f"Failed to clear all recommendation cache: {e}")


# Global cache service instance
_cache_service = None


def get_recommendation_cache() -> RecommendationCacheService:
    """Get the global recommendation cache service instance."""
    global _cache_service
    if _cache_service is None:
        _cache_service = RecommendationCacheService()
    return _cache_service