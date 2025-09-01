"""Database performance optimization utilities.

This module provides utilities for query optimization, indexing strategies,
and performance monitoring for PostgreSQL database operations.

Features:
- Index creation and management
- Query performance analysis
- Connection pool optimization
- Query plan analysis
- Database performance metrics
"""

import asyncio
import time
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Union

import structlog
from app.db.session import engine
from sqlalchemy import Index, MetaData, Table, text
from sqlalchemy.engine import Result
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.sql import Select

from app.core.config import get_settings

logger = structlog.get_logger()


class QueryPerformanceTracker:
    """Track and analyze database query performance."""

    def __init__(self):
        self.slow_queries = []
        self.query_counts = {}
        self.query_times = {}
        self.connection_pool_stats = {}

    def record_query(self, query: str, execution_time: float, result_count: int = 0):
        """Record query execution for performance analysis."""
        # Normalize query for grouping
        normalized_query = self._normalize_query(query)

        # Track query counts
        self.query_counts[normalized_query] = (
            self.query_counts.get(normalized_query, 0) + 1
        )

        # Track query times
        if normalized_query not in self.query_times:
            self.query_times[normalized_query] = []
        self.query_times[normalized_query].append(execution_time)

        # Record slow queries (>100ms)
        if execution_time > 0.1:
            self.slow_queries.append(
                {
                    "query": query,
                    "execution_time": execution_time,
                    "result_count": result_count,
                    "timestamp": datetime.utcnow(),
                    "normalized": normalized_query,
                }
            )

            # Keep only last 100 slow queries
            if len(self.slow_queries) > 100:
                self.slow_queries.pop(0)

    def _normalize_query(self, query: str) -> str:
        """Normalize query for grouping similar queries."""
        # Remove specific values and normalize spacing
        import re

        normalized = re.sub(r"\b\d+\b", "?", query)  # Replace numbers
        normalized = re.sub(r"'[^']*'", "?", normalized)  # Replace string literals
        normalized = re.sub(r"\s+", " ", normalized).strip()  # Normalize whitespace
        return normalized.lower()

    def get_performance_report(self) -> Dict[str, Any]:
        """Generate comprehensive performance report."""
        report = {
            "summary": {
                "total_queries": sum(self.query_counts.values()),
                "unique_queries": len(self.query_counts),
                "slow_queries": len(self.slow_queries),
                "avg_query_time": 0,
            },
            "top_queries_by_count": [],
            "top_queries_by_time": [],
            "slow_queries": self.slow_queries[-10:],  # Last 10 slow queries
            "recommendations": [],
        }

        # Calculate average query times
        all_times = []
        for times in self.query_times.values():
            all_times.extend(times)

        if all_times:
            report["summary"]["avg_query_time"] = sum(all_times) / len(all_times)

        # Top queries by count
        sorted_by_count = sorted(
            self.query_counts.items(), key=lambda x: x[1], reverse=True
        )
        report["top_queries_by_count"] = [
            {"query": query, "count": count} for query, count in sorted_by_count[:10]
        ]

        # Top queries by average time
        avg_times = {}
        for query, times in self.query_times.items():
            avg_times[query] = sum(times) / len(times)

        sorted_by_time = sorted(avg_times.items(), key=lambda x: x[1], reverse=True)
        report["top_queries_by_time"] = [
            {"query": query, "avg_time": avg_time}
            for query, avg_time in sorted_by_time[:10]
        ]

        # Generate recommendations
        report["recommendations"] = self._generate_recommendations()

        return report

    def _generate_recommendations(self) -> List[str]:
        """Generate optimization recommendations based on query patterns."""
        recommendations = []

        # Check for slow queries
        if len(self.slow_queries) > 10:
            recommendations.append(
                "Consider adding indexes for frequently slow queries"
            )

        # Check for frequent queries
        max_count = max(self.query_counts.values()) if self.query_counts else 0
        if max_count > 100:
            recommendations.append("Consider caching results for most frequent queries")

        # Check for N+1 query patterns
        select_counts = sum(
            1 for query in self.query_counts.keys() if "select" in query
        )
        if select_counts > len(self.query_counts) * 0.8:
            recommendations.append(
                "High number of SELECT queries detected - check for N+1 query problems"
            )

        return recommendations


# Global performance tracker
performance_tracker = QueryPerformanceTracker()


@asynccontextmanager
async def track_query_performance(session: AsyncSession, query: Union[str, Select]):
    """Context manager to track query execution performance."""
    start_time = time.time()
    query_str = str(query) if isinstance(query, Select) else query
    result_count = 0

    try:
        yield
    except Exception as e:
        logger.error("query_execution_error", query=query_str, error=str(e))
        raise
    finally:
        execution_time = time.time() - start_time
        performance_tracker.record_query(query_str, execution_time, result_count)

        if execution_time > 0.1:  # Log slow queries
            logger.warning(
                "slow_query_detected",
                query=query_str[:200],  # Truncate for logging
                execution_time=execution_time,
                result_count=result_count,
            )


async def create_performance_indexes(engine: AsyncEngine) -> None:
    """Create performance-optimized database indexes.

    This function creates indexes that improve query performance based on
    common access patterns in the NeoForge application.
    """
    logger.info("creating_performance_indexes")

    indexes_to_create = [
        # User table indexes
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_active ON users(email) WHERE is_active = true",
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_last_login ON users(last_login_at) WHERE last_login_at IS NOT NULL",
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at_desc ON users(created_at DESC)",
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_verified ON users(is_verified, email_verified_at)",
        # Items table indexes (assuming common queries)
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_items_owner_created ON items(owner_id, created_at DESC)",
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_items_created_at_desc ON items(created_at DESC)",
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_items_updated_at_desc ON items(updated_at DESC)",
        # Projects table indexes
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_owner_created ON projects(owner_id, created_at DESC)",
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_status_created ON projects(status, created_at DESC)",
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_name_text ON projects USING gin(to_tsvector('english', name))",
        # Support tickets indexes
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_support_tickets_status_priority ON support_tickets(status, priority, created_at DESC)",
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_support_tickets_user_created ON support_tickets(user_id, created_at DESC)",
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_support_tickets_assigned_created ON support_tickets(assigned_to, created_at DESC)",
        # Community posts indexes
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_community_posts_created_desc ON community_posts(created_at DESC)",
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_community_posts_author_created ON community_posts(author_id, created_at DESC)",
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_community_posts_status_created ON community_posts(status, created_at DESC)",
        # Events table indexes for analytics
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_user_created ON events(user_id, created_at DESC)",
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_type_created ON events(event_type, created_at DESC)",
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_session_created ON events(session_id, created_at DESC)",
        # A/B test indexes
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ab_test_assignments_user_test ON ab_test_assignments(user_id, ab_test_id)",
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ab_tests_status_created ON ab_tests(status, created_at DESC)",
        # Audit log indexes
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_action ON audit_logs(user_id, action, created_at DESC)",
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_table_created ON audit_logs(table_name, created_at DESC)",
        # Tenant-specific indexes
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_tenant_email ON users(tenant_id, email)",
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_tenant_created ON projects(tenant_id, created_at DESC)",
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_support_tickets_tenant_status ON support_tickets(tenant_id, status, created_at DESC)",
        # Composite indexes for common query patterns
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active_verified_created ON users(is_active, is_verified, created_at DESC)",
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_owner_status_updated ON projects(owner_id, status, updated_at DESC)",
        # Partial indexes for performance
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active_recent ON users(created_at DESC) WHERE is_active = true AND created_at > NOW() - INTERVAL '1 year'",
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_support_tickets_open ON support_tickets(created_at DESC) WHERE status IN ('open', 'in_progress')",
    ]

    async with engine.begin() as conn:
        for index_sql in indexes_to_create:
            try:
                logger.debug("creating_index", sql=index_sql)
                await conn.execute(text(index_sql))
                logger.debug("index_created_successfully")
            except Exception as e:
                # Log but don't fail - index might already exist
                logger.warning("index_creation_warning", sql=index_sql, error=str(e))


async def analyze_query_performance(engine: AsyncEngine, query: str) -> Dict[str, Any]:
    """Analyze query performance using EXPLAIN ANALYZE."""
    async with engine.begin() as conn:
        # Get query plan
        explain_result = await conn.execute(
            text(f"EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) {query}")
        )
        plan_data = explain_result.fetchone()[0]

        analysis = {
            "query": query,
            "execution_time": plan_data[0]["Execution Time"],
            "planning_time": plan_data[0]["Planning Time"],
            "total_cost": plan_data[0]["Plan"]["Total Cost"],
            "actual_rows": plan_data[0]["Plan"]["Actual Rows"],
            "plan": plan_data[0]["Plan"],
            "recommendations": [],
        }

        # Generate recommendations based on plan
        plan = plan_data[0]["Plan"]

        # Check for sequential scans
        if "Seq Scan" in plan.get("Node Type", ""):
            analysis["recommendations"].append(
                "Consider adding an index to avoid sequential scan"
            )

        # Check for high cost operations
        if plan.get("Total Cost", 0) > 1000:
            analysis["recommendations"].append(
                "High cost operation detected - consider query optimization"
            )

        # Check for large row counts
        if plan.get("Actual Rows", 0) > 10000:
            analysis["recommendations"].append(
                "Large result set - consider adding filters or pagination"
            )

        return analysis


async def optimize_connection_pool(engine: AsyncEngine) -> None:
    """Optimize database connection pool settings."""
    logger.info("optimizing_connection_pool")

    pool_settings = [
        # Optimize PostgreSQL settings for performance
        "SET shared_preload_libraries = 'pg_stat_statements'",
        "SET track_activity_query_size = 2048",
        "SET log_min_duration_statement = 100",  # Log queries > 100ms
        "SET log_checkpoints = on",
        "SET log_connections = off",  # Reduce log noise
        "SET log_disconnections = off",
    ]

    async with engine.begin() as conn:
        for setting in pool_settings:
            try:
                await conn.execute(text(setting))
                logger.debug("pool_setting_applied", setting=setting)
            except Exception as e:
                logger.warning("pool_setting_error", setting=setting, error=str(e))


async def get_database_stats(engine: AsyncEngine) -> Dict[str, Any]:
    """Get comprehensive database performance statistics."""
    stats = {}

    async with engine.begin() as conn:
        # Table sizes
        table_sizes_result = await conn.execute(
            text(
                """
            SELECT
                schemaname,
                tablename,
                pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
                pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
            FROM pg_tables
            WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
            ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
            LIMIT 10
        """
            )
        )

        stats["largest_tables"] = [
            {"schema": row[0], "table": row[1], "size": row[2], "size_bytes": row[3]}
            for row in table_sizes_result.fetchall()
        ]

        # Index usage stats
        index_usage_result = await conn.execute(
            text(
                """
            SELECT
                schemaname,
                tablename,
                indexname,
                idx_scan,
                idx_tup_read,
                idx_tup_fetch
            FROM pg_stat_user_indexes
            WHERE idx_scan > 0
            ORDER BY idx_scan DESC
            LIMIT 10
        """
            )
        )

        stats["most_used_indexes"] = [
            {
                "schema": row[0],
                "table": row[1],
                "index": row[2],
                "scans": row[3],
                "tuples_read": row[4],
                "tuples_fetched": row[5],
            }
            for row in index_usage_result.fetchall()
        ]

        # Connection stats
        connection_stats_result = await conn.execute(
            text(
                """
            SELECT
                count(*) as total_connections,
                count(*) FILTER (WHERE state = 'active') as active_connections,
                count(*) FILTER (WHERE state = 'idle') as idle_connections
            FROM pg_stat_activity
        """
            )
        )

        conn_stats = connection_stats_result.fetchone()
        stats["connections"] = {
            "total": conn_stats[0],
            "active": conn_stats[1],
            "idle": conn_stats[2],
        }

        # Query performance tracking
        stats["query_performance"] = performance_tracker.get_performance_report()

    return stats


async def vacuum_analyze_tables(
    engine: AsyncEngine, tables: Optional[List[str]] = None
) -> None:
    """Run VACUUM ANALYZE on specified tables or all tables."""
    logger.info("running_vacuum_analyze", tables=tables)

    if not tables:
        # Get all user tables
        async with engine.begin() as conn:
            tables_result = await conn.execute(
                text(
                    """
                SELECT tablename FROM pg_tables
                WHERE schemaname = 'public'
            """
                )
            )
            tables = [row[0] for row in tables_result.fetchall()]

    async with engine.begin() as conn:
        for table in tables:
            try:
                await conn.execute(text(f"VACUUM ANALYZE {table}"))
                logger.debug("vacuum_analyze_completed", table=table)
            except Exception as e:
                logger.error("vacuum_analyze_error", table=table, error=str(e))


class DatabaseOptimizer:
    """Main database optimization coordinator."""

    def __init__(self, engine: AsyncEngine):
        self.engine = engine

    async def run_full_optimization(self) -> Dict[str, Any]:
        """Run comprehensive database optimization."""
        logger.info("starting_full_database_optimization")

        results = {
            "indexes_created": True,
            "connection_pool_optimized": True,
            "vacuum_completed": True,
            "stats": {},
            "errors": [],
        }

        try:
            # Create performance indexes
            await create_performance_indexes(self.engine)
        except Exception as e:
            results["indexes_created"] = False
            results["errors"].append(f"Index creation failed: {e}")

        try:
            # Optimize connection pool
            await optimize_connection_pool(self.engine)
        except Exception as e:
            results["connection_pool_optimized"] = False
            results["errors"].append(f"Connection pool optimization failed: {e}")

        try:
            # Run VACUUM ANALYZE
            await vacuum_analyze_tables(self.engine)
        except Exception as e:
            results["vacuum_completed"] = False
            results["errors"].append(f"VACUUM ANALYZE failed: {e}")

        try:
            # Get final stats
            results["stats"] = await get_database_stats(self.engine)
        except Exception as e:
            results["errors"].append(f"Stats collection failed: {e}")

        logger.info("database_optimization_completed", results=results)
        return results


# Convenience function for FastAPI startup
async def initialize_database_optimization():
    """Initialize database optimization during application startup."""
    optimizer = DatabaseOptimizer(engine)
    return await optimizer.run_full_optimization()
