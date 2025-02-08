"""Request validation middleware."""
import time
from typing import Callable, Dict, Optional, Any
from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
import structlog
from pydantic import ValidationError, BaseModel
from app.api.endpoints.metrics import HTTP_REQUEST_DURATION, HTTP_REQUESTS_TOTAL

logger = structlog.get_logger()

class RequestValidationMiddleware(BaseHTTPMiddleware):
    """Middleware for validating requests."""
    
    def __init__(self, app: ASGIApp):
        """Initialize middleware."""
        super().__init__(app)
    
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
            HTTP_REQUEST_DURATION.labels(
                method=method,
                endpoint=endpoint,
            ).observe(duration)
            
            HTTP_REQUESTS_TOTAL.labels(
                method=method,
                endpoint=endpoint,
                status=response.status_code,
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
            HTTP_REQUEST_DURATION.labels(
                method=method,
                endpoint=endpoint,
            ).observe(duration)
            
            HTTP_REQUESTS_TOTAL.labels(
                method=method,
                endpoint=endpoint,
                status=422,
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
            HTTP_REQUEST_DURATION.labels(
                method=method,
                endpoint=endpoint,
            ).observe(duration)
            
            HTTP_REQUESTS_TOTAL.labels(
                method=method,
                endpoint=endpoint,
                status=500,
            ).inc()

            logger.exception(
                "request_processing_error",
                method=method,
                url=str(request.url),
                error=str(e),
                duration_ms=round(duration * 1000, 2),
            )
            return JSONResponse(
                status_code=500,
                content={
                    "detail": "Internal Server Error",
                    "message": "An error occurred while processing your request",
                },
            )
    
    async def _validate_headers(self, request: Request) -> None:
        """Validate request headers."""
        # Required headers for all requests
        required_headers = {
            "accept": "Accept header is required",
            "user-agent": "User-Agent header is required",
        }
        
        # Additional headers for POST/PUT/PATCH requests
        if request.method in {"POST", "PUT", "PATCH"}:
            required_headers["content-type"] = "Content-Type header is required"
            required_headers["content-length"] = "Content-Length header is required"
        
        # Check required headers
        missing_headers = []
        for header, message in required_headers.items():
            if header not in request.headers:
                missing_headers.append(message)
        
        if missing_headers:
            raise ValidationError(
                [{"loc": ["header"], "msg": msg} for msg in missing_headers],
                BaseModel,
            )

def setup_validation_middleware(app: FastAPI) -> None:
    """Set up request validation middleware."""
    app.add_middleware(RequestValidationMiddleware)
    
    logger.info("request_validation_middleware_configured") 