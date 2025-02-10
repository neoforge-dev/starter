"""Example endpoints demonstrating monitoring and caching features."""
from datetime import timedelta
from typing import List

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import MonitoredDB
from app.core.cache import cached
from app.db.query_monitor import monitor_query
from app.models.user import User
from app.schemas.user import UserResponse

router = APIRouter(prefix="/examples", tags=["examples"])

@router.get("/cached-users", response_model=List[UserResponse])
@cached(expire=timedelta(minutes=5))
async def get_cached_users(db: MonitoredDB) -> List[UserResponse]:
    """
    Get all users with caching.
    
    This endpoint demonstrates:
    1. Redis caching with expiration
    2. Query monitoring
    3. Connection pooling
    """
    # Example of monitored query execution
    async with monitor_query() as stats:
        result = await db.execute(
            select(User).where(User.is_active == True)
        )
        users = result.scalars().all()
    
    return [
        UserResponse.model_validate(user)
        for user in users
    ]

@router.get("/query-types")
async def test_query_types(db: MonitoredDB) -> dict:
    """
    Test different query types with monitoring.
    
    This endpoint demonstrates:
    1. Different query type monitoring
    2. Query timing
    3. Slow query detection
    """
    results = {}
    
    # Test SELECT
    async with monitor_query() as stats:
        await db.execute(text("SELECT pg_sleep(0.05)"))  # Intentionally slow query
        results["select"] = stats
    
    # Test complex join
    async with monitor_query() as stats:
        await db.execute(text("""
            SELECT u.*, i.title 
            FROM users u 
            LEFT JOIN items i ON i.owner_id = u.id 
            WHERE u.is_active = true
        """))
        results["join"] = stats
    
    # Test transaction
    async with monitor_query() as stats:
        # Start a new transaction
        async with db.begin():
            # Multiple statements in transaction
            await db.execute(text("SELECT 1"))
            await db.execute(text("SELECT 2"))
            await db.execute(text("SELECT 3"))
        results["transaction"] = stats
    
    return {
        "query_timings": results,
        "monitoring_active": True,
    }

@router.get("/connection-pool")
async def test_connection_pool(db: MonitoredDB) -> dict:
    """
    Test database connection pool.
    
    This endpoint demonstrates:
    1. Connection pool monitoring
    2. Pool statistics
    3. Connection management
    """
    # Execute multiple queries to show pool usage
    results = []
    for i in range(5):
        async with monitor_query() as stats:
            await db.execute(text("SELECT 1"))
            results.append(stats)
    
    return {
        "query_timings": results,
        "pool_stats": db.stats,
    }

@router.get("/error-handling")
async def test_error_handling(db: MonitoredDB) -> dict:
    """
    Test error handling and monitoring.
    
    This endpoint demonstrates:
    1. Error monitoring
    2. Query error tracking
    3. Error metrics
    """
    try:
        # Execute invalid query
        await db.execute("SELECT * FROM nonexistent_table")
    except Exception as e:
        # Error will be logged and tracked in metrics
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Query error demonstration",
        )
    
    return {"status": "This should not be reached"} 