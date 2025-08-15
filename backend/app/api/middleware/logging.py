"""Logging middleware for request correlation and context."""
import time
import uuid
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.logging import set_request_context, logger


class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware to add request correlation IDs and logging context."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request with logging context."""
        start_time = time.time()
        
        # Generate or extract correlation ID
        correlation_id = request.headers.get("X-Correlation-ID") or str(uuid.uuid4())
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        
        # Extract user context if available
        user_id = None
        session_id = None
        
        # Try to get user info from JWT token or session
        if hasattr(request.state, "user") and request.state.user:
            user_id = str(request.state.user.id)
        
        # Extract session ID from headers or cookies
        session_id = request.headers.get("X-Session-ID")
        if not session_id and request.cookies:
            session_id = request.cookies.get("session_id")
        
        # Set request context for logging
        set_request_context(
            request_id=request_id,
            user_id=user_id,
            session_id=session_id,
            correlation_id=correlation_id
        )
        
        # Log request start
        logger.info(
            "Request started",
            method=request.method,
            url=str(request.url),
            path=request.url.path,
            query_params=dict(request.query_params),
            headers={k: v for k, v in request.headers.items() 
                    if k.lower() not in ['authorization', 'cookie', 'x-api-key']},
            client_ip=self._get_client_ip(request),
            user_agent=request.headers.get("User-Agent"),
            request_size=request.headers.get("Content-Length", 0)
        )
        
        # Process request
        try:
            response = await call_next(request)
            
            # Calculate response time
            process_time = time.time() - start_time
            
            # Log successful response
            logger.info(
                "Request completed",
                status_code=response.status_code,
                response_time=round(process_time * 1000, 2),  # ms
                response_size=response.headers.get("Content-Length", 0)
            )
            
            # Add correlation headers to response
            response.headers["X-Correlation-ID"] = correlation_id
            response.headers["X-Request-ID"] = request_id
            response.headers["X-Response-Time"] = str(round(process_time * 1000, 2))
            
            return response
            
        except Exception as exc:
            # Calculate error response time
            process_time = time.time() - start_time
            
            # Log error
            logger.error(
                "Request failed",
                error=str(exc),
                error_type=type(exc).__name__,
                response_time=round(process_time * 1000, 2),
                exc_info=True
            )
            
            raise
    
    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP address from request."""
        # Check for forwarded headers
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        # Fallback to client address
        if hasattr(request, "client") and request.client:
            return request.client.host
        
        return "unknown"


class DatabaseLoggingMiddleware:
    """Middleware for database query logging."""
    
    def __init__(self):
        self.slow_query_threshold = 1.0  # seconds
    
    async def log_query(self, query: str, params: dict, execution_time: float):
        """Log database query with performance metrics."""
        log_data = {
            "query": query[:500] + "..." if len(query) > 500 else query,
            "execution_time": round(execution_time * 1000, 2),  # ms
            "param_count": len(params) if params else 0
        }
        
        if execution_time > self.slow_query_threshold:
            logger.warning(
                "Slow database query detected",
                **log_data,
                log_category="performance"
            )
        else:
            logger.debug(
                "Database query executed",
                **log_data
            )


class SecurityLoggingMixin:
    """Mixin for security-related logging."""
    
    @staticmethod
    def log_authentication_attempt(
        username: str,
        success: bool,
        ip_address: str,
        user_agent: str,
        failure_reason: str = None
    ):
        """Log authentication attempts for security monitoring."""
        event_data = {
            "username": username,
            "ip_address": ip_address,
            "user_agent": user_agent,
            "log_category": "security"
        }
        
        if success:
            logger.info(
                "Authentication successful",
                **event_data,
                security_severity="low"
            )
        else:
            logger.warning(
                "Authentication failed",
                failure_reason=failure_reason,
                **event_data,
                security_severity="medium"
            )
    
    @staticmethod
    def log_authorization_failure(
        user_id: str,
        resource: str,
        action: str,
        ip_address: str
    ):
        """Log authorization failures."""
        logger.warning(
            "Authorization denied",
            user_id=user_id,
            resource=resource,
            action=action,
            ip_address=ip_address,
            log_category="security",
            security_severity="medium"
        )
    
    @staticmethod
    def log_suspicious_activity(
        description: str,
        ip_address: str,
        user_id: str = None,
        additional_data: dict = None
    ):
        """Log suspicious activities."""
        event_data = {
            "description": description,
            "ip_address": ip_address,
            "log_category": "security",
            "security_severity": "high"
        }
        
        if user_id:
            event_data["user_id"] = user_id
        
        if additional_data:
            event_data.update(additional_data)
        
        logger.critical(
            "Suspicious activity detected",
            **event_data
        )


class BusinessLoggingMixin:
    """Mixin for business event logging."""
    
    @staticmethod
    def log_user_action(
        action: str,
        user_id: str,
        resource_type: str = None,
        resource_id: str = None,
        metadata: dict = None
    ):
        """Log business-critical user actions."""
        event_data = {
            "action": action,
            "user_id": user_id,
            "log_category": "business"
        }
        
        if resource_type:
            event_data["resource_type"] = resource_type
        
        if resource_id:
            event_data["resource_id"] = resource_id
        
        if metadata:
            event_data.update(metadata)
        
        logger.info(
            "User action performed",
            **event_data
        )
    
    @staticmethod
    def log_system_event(
        event_type: str,
        description: str,
        severity: str = "info",
        metadata: dict = None
    ):
        """Log system events."""
        event_data = {
            "event_type": event_type,
            "description": description,
            "log_category": "system"
        }
        
        if metadata:
            event_data.update(metadata)
        
        log_method = getattr(logger, severity.lower(), logger.info)
        log_method(
            "System event occurred",
            **event_data
        )