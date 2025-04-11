import contextvars
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

# Define a context variable for the current test session
current_test_session: contextvars.ContextVar[Optional[AsyncSession]] = contextvars.ContextVar(
    "current_test_session", default=None
) 