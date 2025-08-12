"""Enhanced request validation middleware with security validation."""
import time
import json
import re
import hashlib
from typing import Callable, Dict, Optional, Any, List, Set
from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
import structlog
from pydantic import ValidationError, BaseModel, create_model
from app.core.metrics import get_metrics
from prometheus_client import Counter
from app.core.config import Settings, get_settings, Environment

logger = structlog.get_logger()

class ValidationErrorModel(create_model('ValidationErrorModel', 
    type=(str, 'missing'),
    loc=(List[str], ...),
    msg=(str, ...),
    input=(Any, None)
)):
    pass

class SecurityValidator:
    """Security validation utilities."""
    
    # Common injection patterns to detect
    SQL_INJECTION_PATTERNS = [
        r"('|(\\')|(;)|(--)|(\s(or|and)\s+.*(=|like))",
        r"(union\s+select|drop\s+table|insert\s+into|delete\s+from)",
        r"(exec\s*\(|sp_executesql|xp_cmdshell)"
    ]
    
    XSS_PATTERNS = [
        r"<script[^>]*>.*?</script>",
        r"javascript:",
        r"on\w+\s*=",
        r"<iframe[^>]*>.*?</iframe>"
    ]

    # Suspicious paths that might indicate attacks (avoid blocking legit /api/v1/admin)
    SUSPICIOUS_PATHS = [
        "/.env", "/config", "/wp-admin", "/phpMyAdmin",
        "/.git", "/backup", "/db", "/database", "/api/internal"
    ]
    
    # Maximum sizes for different content types
    MAX_JSON_SIZE = 10 * 1024 * 1024  # 10MB
    MAX_FORM_SIZE = 5 * 1024 * 1024   # 5MB
    
    @staticmethod
    def validate_input_security(data: Any) -> List[str]:
        """Validate input data for security threats."""
        threats = []
        
        if isinstance(data, str):
            # Check for SQL injection patterns
            for pattern in SecurityValidator.SQL_INJECTION_PATTERNS:
                if re.search(pattern, data, re.IGNORECASE):
                    threats.append("Potential SQL injection detected")
                    break
            
            # Check for XSS patterns
            for pattern in SecurityValidator.XSS_PATTERNS:
                if re.search(pattern, data, re.IGNORECASE):
                    threats.append("Potential XSS attack detected")
                    break
                    
        elif isinstance(data, dict):
            for key, value in data.items():
                threats.extend(SecurityValidator.validate_input_security(key))
                threats.extend(SecurityValidator.validate_input_security(value))
                
        elif isinstance(data, list):
            for item in data:
                threats.extend(SecurityValidator.validate_input_security(item))
        
        return threats
    
    @staticmethod
    def is_suspicious_path(path: str) -> bool:
        """Check if the request path looks suspicious."""
        path_lower = path.lower()
        return any(suspicious in path_lower for suspicious in SecurityValidator.SUSPICIOUS_PATHS)
    
    @staticmethod
    def validate_user_agent(user_agent: str) -> bool:
        """Validate User-Agent header."""
        if not user_agent or len(user_agent) < 10:
            return False
        
        # Block known malicious user agents
        malicious_patterns = [
            "sqlmap", "nikto", "nmap", "masscan", "zmap",
            "gobuster", "dirb", "dirbuster", "wfuzz"
        ]
        
        ua_lower = user_agent.lower()
        return not any(pattern in ua_lower for pattern in malicious_patterns)

class RequestValidationMiddleware(BaseHTTPMiddleware):
    """Enhanced middleware for validating requests with security features."""
    
    def __init__(self, app: ASGIApp, settings: Settings):
        """Initialize middleware."""
        super().__init__(app)
        self.settings = settings
        self.is_production = settings.environment == Environment.PRODUCTION
        # Initialize metrics at middleware startup
        self.metrics = get_metrics()
        # Threat metrics
        self.threat_blocks = Counter(
            "security_threat_blocks_total",
            "Total blocked requests for security reasons",
            ["reason"],
        )
        
        # Define required headers based on environment
        if self.is_production:
            self.required_headers = {
                "Accept",
                "User-Agent",
                "Accept-Encoding"
            }
        else:
            self.required_headers = {
                "User-Agent"
            }
            
        # Define public endpoints that don't require full validation
        self.public_endpoints = {
            "/health",
            "/health/detailed",
            "/metrics",
            "/docs",
            "/redoc",
            "/openapi.json",
            f"{self.settings.api_v1_str}/auth/token",
            f"{self.settings.api_v1_str}/auth/register",
            f"{self.settings.api_v1_str}/auth/verify",
            f"{self.settings.api_v1_str}/auth/reset-password",
        }
        
        # Security validator
        self.security_validator = SecurityValidator()
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Enhanced request validation and processing with security checks."""
        start_time = time.time()
        method = request.method
        endpoint = request.url.path
        client_ip = self._get_client_ip(request)

        try:
            # Security check: Block suspicious paths
            # Do not treat API admin endpoints as suspicious
            if self.security_validator.is_suspicious_path(endpoint) and not endpoint.startswith(f"{self.settings.api_v1_str}/admin"):
                logger.warning(
                    "suspicious_path_blocked",
                    path=endpoint,
                    client_ip=client_ip,
                    method=method
                )
                self.threat_blocks.labels(reason="suspicious_path").inc()
                return JSONResponse(
                    status_code=403,
                    content={"detail": "Access forbidden"}
                )
            
            # Security check: Validate User-Agent
            user_agent = request.headers.get("User-Agent", "")
            if not self.security_validator.validate_user_agent(user_agent):
                logger.warning(
                    "malicious_user_agent_blocked",
                    user_agent=user_agent,
                    client_ip=client_ip,
                    path=endpoint
                )
                self.threat_blocks.labels(reason="malicious_ua").inc()
                return JSONResponse(
                    status_code=400,
                    content={"detail": "Invalid User-Agent"}
                )

            # Basic validation for public endpoints
            if endpoint in self.public_endpoints:
                # Still perform basic security checks
                if self.is_production:
                    # Check for basic required headers even on public endpoints
                    if not user_agent:
                        return JSONResponse(
                            status_code=400,
                            content={"detail": "User-Agent header is required"}
                        )
                
                response = await call_next(request)
                duration = time.time() - start_time
                
                # Record metrics
                self._record_metrics(method, endpoint, response.status_code, duration)
                return response

            # Enhanced validation for API endpoints
            if endpoint.startswith(self.settings.api_v1_str):
                # Validate request headers
                validation_error = await self._validate_headers(request)
                if validation_error:
                    return validation_error

                # Validate and check request body for security threats
                if method in ["POST", "PUT", "PATCH"]:
                    try:
                        # Check content size
                        content_length = request.headers.get("Content-Length")
                        if content_length and int(content_length) > SecurityValidator.MAX_JSON_SIZE:
                            return JSONResponse(
                                status_code=413,
                                content={"detail": "Request entity too large"}
                            )
                        
                        body = await request.json()
                        
                        # Security validation of request body
                        if self.is_production:
                            security_threats = self.security_validator.validate_input_security(body)
                            if security_threats:
                                logger.warning(
                                    "security_threat_detected",
                                    threats=security_threats,
                                    client_ip=client_ip,
                                    path=endpoint,
                                    method=method
                                )
                                return JSONResponse(
                                    status_code=400,
                                    content={"detail": "Invalid request data"}
                                )
                        
                    except json.JSONDecodeError:
                        return JSONResponse(
                            status_code=422,
                            content={"detail": "Invalid JSON in request body"}
                        )
                    except ValueError:
                        return JSONResponse(
                            status_code=413,
                            content={"detail": "Request entity too large"}
                        )

            # Process request and track duration
            response = await call_next(request)
            duration = time.time() - start_time
            
            # Record metrics and log
            self._record_metrics(method, endpoint, response.status_code, duration)
            
            # Log request details (more detailed in production)
            log_data = {
                "method": method,
                "url": str(request.url),
                "status_code": response.status_code,
                "duration_ms": round(duration * 1000, 2),
                "client_ip": client_ip
            }
            
            if self.is_production:
                log_data["request_id"] = getattr(request.state, "request_id", "unknown")
            
            logger.info("request_processed", **log_data)

            return response
            
        except Exception as e:
            duration = (time.time() - start_time) * 1000
            self.metrics["http_request_duration_seconds"].labels(
                method=method,
                endpoint=endpoint,
            ).observe(duration)
            
            self.metrics["http_requests"].labels(
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
                    "environment": self.settings.environment,
                    "app_version": self.settings.version,
                })
            )
            return JSONResponse(
                status_code=500,
                content={
                    "detail": "Internal Server Error",
                    "message": "An error occurred while processing your request",
                },
            )
    
    async def _validate_headers(self, request: Request) -> Optional[Response]:
        """Validate request headers."""
        # Check required headers
        for header in self.required_headers:
            if header not in request.headers:
                return JSONResponse(
                    # Return 400 Bad Request for missing required headers
                    content={"detail": f"{header} header is required"}, 
                    status_code=400, 
                )

        # Validate Content-Type for POST, PUT, PATCH requests
        if request.method in {"POST", "PUT", "PATCH"}:
            content_type = request.headers.get("Content-Type", "")
            if not content_type or "application/json" not in content_type.lower():
                return JSONResponse(
                    # Keep 415 for unsupported media type
                    content={"detail": "Content-Type must be application/json"}, 
                    status_code=415,
                )

            # Check Content-Length header
            content_length = request.headers.get("Content-Length")
            if content_length is None:
                return JSONResponse(
                    # Return 411 Length Required for missing Content-Length
                    content={"detail": "Content-Length header required"}, 
                    status_code=411, 
                )
            try:
                length = int(content_length)
                # Optionally check if length > 0 if needed
                # if length <= 0:
                #    return JSONResponse(...)
            except ValueError:
                return JSONResponse(
                    content={"detail": "Invalid Content-Length header"},
                    status_code=400, # Bad Request for invalid value
                )

        return None
    
    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP from request."""
        # Check for forwarded headers (behind proxy)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        # Fallback to direct connection IP
        return request.client.host if request.client else "unknown"
    
    def _record_metrics(self, method: str, endpoint: str, status_code: int, duration: float) -> None:
        """Record request metrics."""
        self.metrics["http_request_duration_seconds"].labels(
            method=method,
            endpoint=endpoint,
        ).observe(duration)
        
        self.metrics["http_requests"].labels(
            method=method,
            endpoint=endpoint,
            status=str(status_code),
        ).inc()


def setup_validation_middleware(app: FastAPI) -> None:
    """Set up validation middleware."""
    # NOTE: This setup function might become obsolete if main.py uses the consolidated setup_middleware.
    # It should NOT fetch settings here; the caller (setup_middleware) should do that.
    # For now, leave it as is, but ensure it's not the primary setup path.
    current_settings = get_settings() # Fetch settings temporarily for standalone use potential
    app.add_middleware(RequestValidationMiddleware, settings=current_settings)
    
    logger.info("request_validation_middleware_configured") 