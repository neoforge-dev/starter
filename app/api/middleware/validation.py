import logging
import time
from typing import Callable, Optional

from app.config import settings
from app.utils.metrics import get_metrics
from fastapi import Request, Response
from fastapi.middleware.base import BaseHTTPMiddleware
from fastapi.responses import JSONResponse
from fastapi.types import ASGIApp

logger = logging.getLogger(__name__)


class RequestValidationMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp):
        """Initialize middleware."""
        super().__init__(app)
        # Initialize metrics at middleware startup
        self.metrics = get_metrics()
        # Define public endpoints that don't require validation
        self.public_endpoints = {
            "/health",
            "/health/detailed",
            f"{settings.api_v1_str}/auth/token",
            f"{settings.api_v1_str}/auth/register",
            f"{settings.api_v1_str}/auth/verify",
            f"{settings.api_v1_str}/auth/reset-password",
        }
        self.required_headers = []

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()
        method = request.method
        endpoint = request.url.path

        try:
            # Skip validation for public endpoints but still track metrics
            if endpoint in self.public_endpoints:
                response = await call_next(request)
                duration = time.time() - start_time

                # Record metrics
                self.metrics["http_request_duration_seconds"].labels(
                    method=method,
                    endpoint=endpoint,
                ).observe(duration)

                self.metrics["http_requests"].labels(
                    method=method,
                    endpoint=endpoint,
                    status=str(response.status_code),
                ).inc()

                return response

            # Skip validation for endpoints that require authentication
            # Let FastAPI's authentication handle these cases
            if endpoint.startswith(settings.api_v1_str) and (
                not request.headers.get("Authorization")
                or request.headers.get("Authorization", "").startswith(  # No auth token
                    "Bearer "
                )  # Has auth token
            ):
                response = await call_next(request)
                duration = time.time() - start_time

                # Record metrics
                self.metrics["http_request_duration_seconds"].labels(
                    method=method,
                    endpoint=endpoint,
                ).observe(duration)

                self.metrics["http_requests"].labels(
                    method=method,
                    endpoint=endpoint,
                    status=str(response.status_code),
                ).inc()

                return response

            # Validate request headers for other endpoints
            validation_error = await self._validate_headers(request)
            if validation_error:
                return validation_error

            # Process the request if no validation errors
            response = await call_next(request)
            duration = time.time() - start_time

            # Record metrics
            self.metrics["http_request_duration_seconds"].labels(
                method=method,
                endpoint=endpoint,
            ).observe(duration)

            self.metrics["http_requests"].labels(
                method=method,
                endpoint=endpoint,
                status=str(response.status_code),
            ).inc()

            # Log request details
            logger.info(
                "request_processed",
                method=method,
                url=str(request.url),
                status_code=response.status_code,
                duration_ms=round(duration * 1000, 2),
            )

            return response

        except Exception as e:
            # Handle exceptions and return a 500 Internal Server Error
            return Response(status_code=500, content="Internal Server Error")

    async def _validate_headers(self, request: Request) -> Optional[Response]:
        """Validate request headers."""
        # Check required headers
        for header in self.required_headers:
            if header not in request.headers:
                return JSONResponse(
                    content={"message": f"{header} header is required"},
                    status_code=422,
                )

        # Validate Content-Type for POST, PUT, PATCH requests
        if request.method in {"POST", "PUT", "PATCH"}:
            content_type = request.headers.get("Content-Type", "")
            if not content_type or "application/json" not in content_type.lower():
                return JSONResponse(
                    content={"message": "Content-Type must be application/json"},
                    status_code=415,
                )

            # Check Content-Length header
            if "Content-Length" not in request.headers:
                return JSONResponse(
                    content={"message": "Content-Length header is required"},
                    status_code=422,
                )

        return None

    async def _validate_header(self, request: Request):
        # Implementation of _validate_header method
        pass
