"""SQL query monitoring module."""
import time
from contextlib import asynccontextmanager
from typing import Any, AsyncGenerator, Dict, Optional

import structlog
from sqlalchemy import event
from sqlalchemy.engine import Engine
from sqlalchemy.ext.asyncio import AsyncSession, AsyncEngine
from sqlalchemy import text

from app.db.session import engine
from app.core.metrics import get_metrics

logger = structlog.get_logger()

# Initialize metrics
metrics = get_metrics()

def extract_table_name(query: str) -> str:
    """Extract main table name from SQL query."""
    # Simple heuristic - can be improved based on actual query patterns
    query = query.lower()
    if "from" not in query:
        return "unknown"
    
    # Get the part after FROM
    from_part = query.split("from")[1].strip()
    # Get the first word (table name)
    table = from_part.split()[0].strip('"')
    # Remove any schema prefix
    if "." in table:
        table = table.split(".")[-1]
    return table

def get_query_type(query: str) -> str:
    """Determine query type from SQL statement."""
    query = query.lower().strip()
    if query.startswith("select"):
        return "select"
    elif query.startswith("insert"):
        return "insert"
    elif query.startswith("update"):
        return "update"
    elif query.startswith("delete"):
        return "delete"
    else:
        return "other"

def record_query_metrics(query: str, duration: float) -> None:
    """Record query metrics."""
    query_type = get_query_type(query)
    table = extract_table_name(query)
    
    # Update metrics
    metrics["db_query_count"].labels(query_type=query_type, table=table).inc()
    metrics["db_query_duration"].labels(query_type=query_type, table=table).observe(duration)
    
    # Log slow queries (>100ms)
    if duration > 0.1:
        metrics["db_slow_queries"].labels(query_type=query_type, table=table).inc()
        logger.warning(
            "slow_query_detected",
            query_type=query_type,
            table=table,
            duration=duration,
            query=query,
        )

def before_cursor_execute(
    conn, cursor, statement, parameters, context, executemany
):
    """Event listener for query execution start."""
    context._query_start_time = time.time()
    
def after_cursor_execute(
    conn, cursor, statement, parameters, context, executemany
):
    """Event listener for query execution end."""
    total_time = time.time() - context._query_start_time
    record_query_metrics(statement, total_time)

# Register event listeners for both sync and async engines
if isinstance(engine, AsyncEngine):
    # Register events on the sync engine for async connections
    event.listen(engine.sync_engine, "before_cursor_execute", before_cursor_execute)
    event.listen(engine.sync_engine, "after_cursor_execute", after_cursor_execute)
else:
    # If using sync engine only
    event.listen(engine, "before_cursor_execute", before_cursor_execute)
    event.listen(engine, "after_cursor_execute", after_cursor_execute)

@asynccontextmanager
async def monitor_query() -> AsyncGenerator[Dict[str, Any], None]:
    """
    Context manager for monitoring individual queries.
    
    Example:
        async with monitor_query() as stats:
            result = await db.execute(query)
            # stats contains query execution information
    
    Returns:
        Dictionary with query statistics:
        - duration: Total time spent in context (float, in seconds)
        - is_slow: Whether any query was slow (>100ms)
        - query_count: Number of queries executed
        - slow_queries: Number of slow queries
        - errors: Number of query errors
    """
    start_time = time.time()
    stats: Dict[str, Any] = {
        "start_time": start_time,
        "query_count": 0,
        "duration": 0.0,
        "slow_queries": 0,
        "errors": 0,
    }
    
    try:
        yield stats
    except Exception as e:
        stats["errors"] += 1
        raise
    finally:
        duration = time.time() - start_time
        stats.update({
            "duration": duration,  # Keep as float
            "is_slow": duration > 0.1,
        })

class QueryMonitor:
    """Query monitoring wrapper for database sessions."""

    def __init__(self, session: AsyncSession):
        """Initialize with database session."""
        self.session = session
        self.current_query = None
        self._query_stats: Dict[str, Any] = {
            "total_queries": 0,
            "slow_queries": 0,
            "errors": 0,
            "total_duration": 0.0,  # Initialize as float
        }

    async def begin(self):
        """Begin a transaction."""
        return await self.session.begin()

    async def commit(self):
        """Commit the current transaction."""
        return await self.session.commit()

    async def rollback(self):
        """Rollback the current transaction."""
        return await self.session.rollback()

    async def close(self):
        """Close the session."""
        return await self.session.close()

    async def execute(
        self,
        statement: Any,
        params: Optional[Dict[str, Any]] = None,
    ) -> Any:
        """
        Execute query with monitoring.
        
        Args:
            statement: SQL statement to execute
            params: Optional query parameters
            
        Returns:
            Query result
            
        Raises:
            Exception: Any database-related exception that occurs during execution
        """
        start_time = time.time()
        query_str = str(statement)
        query_type = get_query_type(query_str)
        
        try:
            # Set current query
            self.current_query = query_str
            
            # Convert string queries to text() objects
            if isinstance(statement, str):
                statement = text(statement)
            
            result = await self.session.execute(statement, params)
            duration = time.time() - start_time
            
            # Update instance stats
            self._query_stats["total_queries"] += 1
            self._query_stats["total_duration"] += duration
            
            # Record metrics
            record_query_metrics(query_str, duration)
            
            return result
            
        except Exception as e:
            self._query_stats["errors"] += 1
            metrics["db_query_errors"].labels(
                error_type=type(e).__name__,
                query_type=query_type,
            ).inc()
            logger.error(
                "query_error",
                query_type=query_type,
                error=str(e),
                error_type=type(e).__name__,
                query=query_str,
            )
            # Ensure the session is rolled back on error
            await self.session.rollback()
            raise
        finally:
            # Clear current query
            self.current_query = None

    @property
    def stats(self) -> Dict[str, Any]:
        """Get query statistics with duration as float."""
        return {
            **self._query_stats,
            "total_duration": self._query_stats["total_duration"],  # Keep as float
        } 