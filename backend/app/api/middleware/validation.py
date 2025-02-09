"""Request validation middleware."""
import time
import json
from typing import Callable, Dict, Optional, Any, List
from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
import structlog
from pydantic import ValidationError, BaseModel, create_model
from app.core.metrics import get_metrics
from app.core.config import settings

logger = structlog.get_logger()

class ValidationErrorModel(create_model('ValidationErrorModel', 
    type=(str, 'missing'),
    loc=(List[str], ...),
    msg=(str, ...),
    input=(Any, None)
)):
    pass

class RequestValidationMiddleware(BaseHTTPMiddleware):
    """Middleware for validating requests."""
    
    def __init__(self, app: ASGIApp):
        """Initialize middleware."""
        super().__init__(app)
        # Initialize metrics at middleware startup
        self.metrics = get_metrics()
        # Define public endpoints that don't require validation
        self.public_endpoints = {
            "/health",
            f"{settings.api_v1_str}/auth/token",
            f"{settings.api_v1_str}/auth/register",
            f"{settings.api_v1_str}/auth/verify",
            f"{settings.api_v1_str}/auth/reset-password",
        }
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Validate and process the request."""
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
                
                self.metrics["http_requests_total"].labels(
                    method=method,
                    endpoint=endpoint,
                    status=str(response.status_code),
                ).inc()

                return response

            # Skip validation for endpoints that require authentication
            # Let FastAPI's authentication handle these cases
            if endpoint.startswith(settings.api_v1_str) and (
                not request.headers.get("Authorization") or  # No auth token
                request.headers.get("Authorization", "").startswith("Bearer ")  # Has auth token
            ):
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

                return response

            # Validate request headers for other endpoints
            errors = await self._validate_headers(request)
            if errors:
                error_models = [error.model_dump() for error in errors]
                return JSONResponse(
                    status_code=422,
                    content={
                        'detail': error_models,
                        'errors': error_models
                    }
                )
            
            # Validate content type for POST/PUT/PATCH requests
            if request.method in {"POST", "PUT", "PATCH"}:
                content_type = request.headers.get("content-type", "")
                # Allow form data for token endpoint
                if request.url.path.endswith("/token"):
                    if not content_type.startswith("application/x-www-form-urlencoded"):
                        return JSONResponse(
                            status_code=415,
                            content={
                                "detail": "Unsupported Media Type",
                                "message": "Content-Type must be application/x-www-form-urlencoded",
                            },
                        )
                else:
                    if not content_type.startswith("application/json"):
                        return JSONResponse(
                            status_code=415,
                            content={
                                "detail": "Unsupported Media Type",
                                "message": "Content-Type must be application/json",
                            },
                        )
                
                # Validate Content-Length for write methods
                if not request.headers.get("content-length", "").strip():
                    return JSONResponse(
                        status_code=422,
                        content={
                            'detail': [{
                                'type': 'missing',
                                'loc': ['body'],
                                'msg': 'Content-Length header is required',
                                'input': None
                            }]
                        }
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
            
        except Exception as e:
            duration = (time.time() - start_time) * 1000
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
                json.dumps({
                    "method": method,
                    "url": str(request.url),
                    "error": str(e),
                    "duration_ms": round(duration, 2),
                    "event": "request_error",
                    "level": "error",
                    "logger": logger.name,
                    "timestamp": time.time(),
                    "environment": settings.environment,
                    "app_version": settings.version,
                })
            )
            return JSONResponse(
                status_code=500,
                content={
                    "detail": "Internal Server Error",
                    "message": "An error occurred while processing your request",
                },
            )
    
    async def _validate_headers(self, request: Request) -> List[ValidationErrorModel]:
        """Validate request headers."""
        errors = []
        required_headers = {
            'accept': 'application/json',
            'user-agent': None  # Just check presence
        }
        
        # Convert headers to lowercase for case-insensitive comparison
        headers = {k.lower(): v for k, v in request.headers.items()}
        
        for header, expected_value in required_headers.items():
            if header not in headers:
                errors.append(ValidationErrorModel(
                    type='validation_error',
                    loc=['header', header],
                    msg=f'Header "{header}" is required',
                    input=None
                ))
            elif expected_value and headers[header].lower() != expected_value.lower():
                errors.append(ValidationErrorModel(
                    type='validation_error',
                    loc=['header', header],
                    msg=f'Header "{header}" must be "{expected_value}"',
                    input=headers[header]
                ))
        return errors


def setup_validation_middleware(app: FastAPI) -> None:
    """Set up validation middleware."""
    app.add_middleware(RequestValidationMiddleware)
    
    logger.info("request_validation_middleware_configured") 