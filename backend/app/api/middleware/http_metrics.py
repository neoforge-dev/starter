"""HTTP metrics collection middleware for comprehensive request monitoring."""
import re
import time
from typing import Callable, Dict, List, Pattern

import structlog
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from app.core.metrics import get_metrics

logger = structlog.get_logger()


class HTTPMetricsMiddleware(BaseHTTPMiddleware):
    """ASGI middleware for collecting comprehensive HTTP request metrics.

    This middleware captures:
    - http_requests_total: Counter with method, endpoint, status labels
    - http_request_duration_seconds: Histogram with method, endpoint labels
    - http_5xx_responses_total: Counter for 5xx errors (already exists)

    Features:
    - Path normalization: Converts /users/123 to /users/{user_id}
    - Proper histogram buckets for latency profiling
    - Integration with existing metrics system
    """

    def __init__(self, app: ASGIApp):
        """Initialize HTTP metrics middleware."""
        super().__init__(app)
        self.metrics = get_metrics()

        # Path normalization patterns
        # These patterns convert dynamic path segments to template variables
        self.path_patterns: List[tuple[Pattern, str]] = [
            # Integer IDs - must be before more general patterns
            (re.compile(r"/users/(\d+)(?:/|$)"), r"/users/{user_id}"),
            (re.compile(r"/items/(\d+)(?:/|$)"), r"/items/{item_id}"),
            (re.compile(r"/admin/(\d+)(?:/|$)"), r"/admin/{admin_id}"),
            (re.compile(r"/events/(\d+)(?:/|$)"), r"/events/{event_id}"),
            (
                re.compile(r"/organizations/(\d+)(?:/|$)"),
                r"/organizations/{organization_id}",
            ),
            (re.compile(r"/projects/(\d+)(?:/|$)"), r"/projects/{project_id}"),
            (re.compile(r"/sessions/(\d+)(?:/|$)"), r"/sessions/{session_id}"),
            (re.compile(r"/tickets/(\d+)(?:/|$)"), r"/tickets/{ticket_id}"),
            # User-specific endpoints
            (re.compile(r"/user/(\d+)(?:/|$)"), r"/user/{user_id}"),
            (re.compile(r"/session/(\d+)(?:/|$)"), r"/session/{session_id}"),
            (re.compile(r"/profile/(\d+)(?:/|$)"), r"/profile/{user_id}"),
            (re.compile(r"/interactions/(\d+)(?:/|$)"), r"/interactions/{user_id}"),
            (re.compile(r"/insights/(\d+)(?:/|$)"), r"/insights/{user_id}"),
            (re.compile(r"/preferences/(\d+)(?:/|$)"), r"/preferences/{user_id}"),
            (re.compile(r"/similar-users/(\d+)(?:/|$)"), r"/similar-users/{user_id}"),
            # Role and RBAC endpoints
            (re.compile(r"/roles/(\d+)(?:/|$)"), r"/roles/{role_id}"),
            (re.compile(r"/rules/([a-zA-Z0-9\-_]+)(?:/|$)"), r"/rules/{rule_id}"),
            # Content and suggestions
            (re.compile(r"/content/(\d+)(?:/|$)"), r"/content/{content_id}"),
            (
                re.compile(r"/(\d+)(?:/|$)"),
                r"/{id}",
            ),  # Generic ID pattern - must be last
            # String-based IDs and UUIDs
            (
                re.compile(
                    r"/([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12})(?:/|$)"
                ),
                r"/{uuid}",
            ),
            (re.compile(r"/([a-zA-Z0-9\-_]{20,})(?:/|$)"), r"/{string_id}"),
        ]

        # Paths to exclude from metrics collection
        self.excluded_paths = {
            "/metrics",
            "/health",
            "/ready",
            "/docs",
            "/redoc",
            "/openapi.json",
        }

    def _normalize_path(self, path: str) -> str:
        """Normalize path by converting dynamic segments to template variables.

        Examples:
        - /api/v1/users/123 -> /api/v1/users/{user_id}
        - /api/v1/items/456/comments -> /api/v1/items/{item_id}/comments
        - /api/v1/organizations/789/members -> /api/v1/organizations/{organization_id}/members
        """
        if path in self.excluded_paths:
            return path

        normalized_path = path

        # Apply normalization patterns in order
        for pattern, replacement in self.path_patterns:
            normalized_path = pattern.sub(replacement, normalized_path)

        # Clean up any double slashes
        normalized_path = re.sub(r"/+", "/", normalized_path)

        # Remove trailing slash unless it's the root path
        if len(normalized_path) > 1 and normalized_path.endswith("/"):
            normalized_path = normalized_path[:-1]

        return normalized_path

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request and collect metrics."""
        # Skip metrics collection for excluded paths
        if request.url.path in self.excluded_paths:
            return await call_next(request)

        # Record start time
        start_time = time.perf_counter()

        # Normalize the path for consistent labeling
        normalized_path = self._normalize_path(request.url.path)

        # Process the request
        try:
            response = await call_next(request)
            status_code = response.status_code
        except Exception as e:
            # Handle exceptions and record as 5xx error
            logger.exception(
                "http_request_exception",
                method=request.method,
                path=request.url.path,
                normalized_path=normalized_path,
                error=str(e),
            )
            status_code = 500
            # Re-raise the exception after recording metrics
            self._record_metrics(
                request.method, normalized_path, status_code, start_time
            )
            raise

        # Record metrics
        self._record_metrics(request.method, normalized_path, status_code, start_time)

        return response

    def _record_metrics(
        self, method: str, normalized_path: str, status_code: int, start_time: float
    ) -> None:
        """Record HTTP metrics for the request."""
        try:
            # Calculate request duration
            duration = time.perf_counter() - start_time

            # Record total requests counter
            self.metrics["http_requests"].labels(
                method=method, endpoint=normalized_path, status=str(status_code)
            ).inc()

            # Record request duration histogram
            self.metrics["http_request_duration_seconds"].labels(
                method=method, endpoint=normalized_path
            ).observe(duration)

            # Record 5xx errors (per-route counter for fast error-rate computation)
            if status_code >= 500:
                self.metrics["http_5xx_responses"].labels(
                    method=method, endpoint=normalized_path
                ).inc()

            # Log structured request metrics for debugging
            logger.debug(
                "http_request_metrics_recorded",
                method=method,
                endpoint=normalized_path,
                status_code=status_code,
                duration_seconds=round(duration, 4),
                is_5xx=status_code >= 500,
            )

        except Exception as e:
            # Log error but don't fail the request
            logger.error(
                "metrics_recording_failed",
                method=method,
                endpoint=normalized_path,
                status_code=status_code,
                error=str(e),
            )


def setup_http_metrics_middleware(app) -> None:
    """Set up HTTP metrics middleware on the FastAPI app.

    This should be called early in the middleware setup to ensure
    all requests are captured.
    """
    app.add_middleware(HTTPMetricsMiddleware)

    logger.info(
        "http_metrics_middleware_configured",
        metrics_available=[
            "http_requests_total",
            "http_request_duration_seconds",
            "http_5xx_responses_total",
        ],
        path_normalization_enabled=True,
        histogram_buckets="0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0",
    )
