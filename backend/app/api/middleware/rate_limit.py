import jwt
import logging
from fastapi import Request, FastAPI
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

class RateLimitMiddleware:
    def __init__(self, config):
        self.config = config
        self.rate_limit = 100  # requests per minute
        self.window = 60  # seconds

    async def _get_client_id(self, request: Request) -> Optional[str]:
        # Extract the token from header. Expect header "Authorization: Bearer <token>"
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return None

        # Extract the token part if the header contains 'Bearer '
        token = auth_header.replace("Bearer ", "").strip()

        try:
            payload = jwt.decode(
                token,
                str(self.config.jwt_secret),  # ensure the secret key is a string
                algorithms=["HS256"]
            )
            return payload.get("sub")
        except Exception as exc:
            # Log the error with details
            logger.error("JWT decoding error in rate limit", exc_info=exc)
            return None

    async def dispatch(self, request: Request, call_next):
        client_id = await self._get_client_id(request)
        if not client_id:
            # If no client ID, proceed without rate limiting
            return await call_next(request)
            
        # TODO: Implement rate limiting logic here
        return await call_next(request)

def setup_rate_limit_middleware(app: FastAPI) -> None:
    """Set up rate limiting middleware for the FastAPI application."""
    middleware = RateLimitMiddleware(settings)
    app.middleware("http")(middleware.dispatch) 