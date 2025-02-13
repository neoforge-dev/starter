import jwt
import logging
from fastapi import Request
from typing import Optional

logger = logging.getLogger(__name__)

class RateLimitMiddleware:
    # ... (other methods and initializations)

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
        # ... (code before)
        client_id = await self._get_client_id(request)
        # ... (rest of dispatch logic) 