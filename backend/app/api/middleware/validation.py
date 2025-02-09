"""Request validation middleware."""
import time
from typing import Callable, Dict, Optional, Any
from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
import structlog
from pydantic import ValidationError, BaseModel
from app.core.metrics import get_metrics

logger = structlog.get_logger()

class RequestValidationMiddleware(BaseHTTPMiddleware):
    """Middleware for validating requests."""
    
    def __init__(self, app: ASGIApp):
        """Initialize middleware."""
        super().__init__(app)
        # Initialize metrics at middleware startup
        self.metrics = get_metrics()
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Validate and process the request."""
        start_time = time.time()
        method = request.method
        endpoint = request.url.path

        try:
            # Validate request headers
            await self._validate_headers(request)
            
            # Validate content type for POST/PUT/PATCH requests
            if request.method in {"POST", "PUT", "PATCH"}:
                content_type = request.headers.get("content-type", "")
                if not content_type.startswith("application/json"):
                    return JSONResponse(
                        status_code=415,
                        content={
                            "detail": "Unsupported Media Type",
                            "message": "Content-Type must be application/json",
                        },
                    )
            
            # Process request and track duration
            response = await call_next(request)
            duration = time.time() - start_time
            
            # Record metrics
            self.metrics["http_request_duration_seconds"].labels(
                method=method,
                endpoint=endpoint,
            ).observe(duration)
            
            self.metrics["http_requests_total"].labels(
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
            
        except ValidationError as e:
            duration = time.time() - start_time
            self.metrics["http_request_duration_seconds"].labels(
                method=method,
                endpoint=endpoint,
            ).observe(duration)
            
            self.metrics["http_requests_total"].labels(
                method=method,
                endpoint=endpoint,
                status="422",
            ).inc()

            logger.warning(
                "validation_error",
                method=method,
                url=str(request.url),
                errors=str(e.errors()),
                duration_ms=round(duration * 1000, 2),
            )
            return JSONResponse(
                status_code=422,
                content={
                    "detail": "Validation Error",
                    "errors": e.errors(),
                },
            )
            
        except Exception as e:
            duration = time.time() - start_time
            self.metrics["http_request_duration_seconds"].labels(
                method=method,
                endpoint=endpoint,
            ).observe(duration)
            
            self.metrics["http_requests_total"].labels(
                method=method,
                endpoint=endpoint,
                status="500",
            ).inc()

            logger.error(
                "request_error",
                method=method,
                url=str(request.url),
                error=str(e),
                duration_ms=round(duration * 1000, 2),
            )
            return JSONResponse(
                status_code=500,
                content={
                    "detail": "Internal Server Error",
                    "message": str(e),
                },
            )
    
    async def _validate_headers(self, request: Request) -> None:
        """Validate request headers."""
        # Add header validation logic here if needed
        pass

def setup_validation_middleware(app: FastAPI) -> None:
    """Set up validation middleware."""
    app.add_middleware(RequestValidationMiddleware)
    
    logger.info("request_validation_middleware_configured") 