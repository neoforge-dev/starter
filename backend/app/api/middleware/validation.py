"""Request validation middleware."""
from typing import Callable, Dict, Optional, Any
from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
import structlog
from pydantic import ValidationError, BaseModel

logger = structlog.get_logger()

class RequestValidationMiddleware(BaseHTTPMiddleware):
    """Middleware for validating requests."""
    
    def __init__(self, app: ASGIApp):
        """Initialize middleware."""
        super().__init__(app)
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Validate and process the request."""
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
            
            # Process request
            response = await call_next(request)
            return response
            
        except ValidationError as e:
            logger.warning(
                "request_validation_error",
                method=request.method,
                url=str(request.url),
                errors=e.errors(),
            )
            return JSONResponse(
                status_code=422,
                content={
                    "detail": "Validation Error",
                    "errors": e.errors(),
                },
            )
            
        except Exception as e:
            logger.exception(
                "request_processing_error",
                method=request.method,
                url=str(request.url),
                error=str(e),
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