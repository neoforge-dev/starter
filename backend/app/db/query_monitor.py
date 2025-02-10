"""SQL query monitoring module."""
import time
from contextlib import asynccontextmanager
from typing import Any, AsyncGenerator, Dict, Optional

from prometheus_client import Counter, Histogram
import structlog
from sqlalchemy import event
from sqlalchemy.engine import Engine
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import engine

logger = structlog.get_logger()

# Metrics
QUERY_COUNT = Counter(
    "sql_queries_total",
    "Total number of SQL queries",
    labelnames=["query_type", "table"],
)

QUERY_DURATION = Histogram(
    "sql_query_duration_seconds",
    "Duration of SQL queries",
    labelnames=["query_type", "table"],
    buckets=(0.001, 0.005, 0.01, 0.025, 0.05, 0.075, 0.1, 0.25, 0.5, 0.75, 1.0, 2.5, 5.0),
)

QUERY_ERRORS = Counter(
    "sql_query_errors_total",
    "Total number of SQL query errors",
    labelnames=["error_type", "query_type"],
)

SLOW_QUERIES = Counter(
    "sql_slow_queries_total",
    "Total number of slow SQL queries (>100ms)",
    labelnames=["query_type", "table"],
)

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

@event.listens_for(Engine, "before_cursor_execute")
def before_cursor_execute(
    conn, cursor, statement, parameters, context, executemany
):
    """Event listener for query execution start."""
    context._query_start_time = time.time()
    
@event.listens_for(Engine, "after_cursor_execute")
def after_cursor_execute(
    conn, cursor, statement, parameters, context, executemany
):
    """Event listener for query execution end."""
    total_time = time.time() - context._query_start_time
    
    query_type = get_query_type(statement)
    table = extract_table_name(statement)
    
    # Update metrics
    QUERY_COUNT.labels(query_type=query_type, table=table).inc()
    QUERY_DURATION.labels(query_type=query_type, table=table).observe(total_time)
    
    # Log slow queries (>100ms)
    if total_time > 0.1:
        SLOW_QUERIES.labels(query_type=query_type, table=table).inc()
        logger.warning(
            "slow_query_detected",
            query_type=query_type,
            table=table,
            duration=total_time,
            query=statement,
        )

@asynccontextmanager
async def monitor_query() -> AsyncGenerator[Dict[str, Any], None]:
    """
    Context manager for monitoring individual queries.
    
    Example:
        async with monitor_query() as stats:
            result = await db.execute(query)
            # stats contains query execution information
    """
    start_time = time.time()
    stats: Dict[str, Any] = {
        "start_time": start_time,
        "query_count": 0,
        "duration": 0,
        "slow_queries": 0,
        "errors": 0,
    }
    
    try:
        yield stats
    finally:
        duration = time.time() - start_time
        stats.update({
            "duration": duration,
            "is_slow": duration > 0.1,
        })
        
        if duration > 0.1:
            logger.warning(
                "slow_query_in_context",
                duration=duration,
                **stats,
            )

class QueryMonitor:
    """Query monitoring wrapper for database sessions."""

    def __init__(self, session: AsyncSession):
        """Initialize with database session."""
        self.session = session
        self._query_stats: Dict[str, Any] = {}

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
        """
        start_time = time.time()
        query_type = (
            get_query_type(str(statement))
            if isinstance(statement, str)
            else "other"
        )
        
        try:
            result = await self.session.execute(statement, params)
            duration = time.time() - start_time
            
            # Update metrics
            QUERY_COUNT.labels(
                query_type=query_type,
                table=extract_table_name(str(statement)),
            ).inc()
            QUERY_DURATION.labels(
                query_type=query_type,
                table=extract_table_name(str(statement)),
            ).observe(duration)
            
            # Track slow queries
            if duration > 0.1:
                SLOW_QUERIES.labels(
                    query_type=query_type,
                    table=extract_table_name(str(statement)),
                ).inc()
                logger.warning(
                    "slow_query_detected",
                    query_type=query_type,
                    duration=duration,
                    query=str(statement),
                )
            
            return result
            
        except Exception as e:
            QUERY_ERRORS.labels(
                error_type=type(e).__name__,
                query_type=query_type,
            ).inc()
            logger.error(
                "query_error",
                query_type=query_type,
                error=str(e),
                error_type=type(e).__name__,
                query=str(statement),
            )
            raise

    @property
    def stats(self) -> Dict[str, Any]:
        """Get query statistics."""
        return self._query_stats

    @asynccontextmanager
    async def begin(self):
        """Begin a transaction."""
        async with self.session.begin() as transaction:
            yield transaction

    async def commit(self):
        """Commit the current transaction."""
        await self.session.commit()

    async def rollback(self):
        """Rollback the current transaction."""
        await self.session.rollback() 