"""Test admin router registration."""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings

pytestmark = pytest.mark.asyncio


async def test_admin_router_registered(client: AsyncClient, db: AsyncSession, test_settings: Settings) -> None:
    """Test that the admin router is properly registered."""
    # Try to access the admin endpoint without authentication
    # This should return 401 Unauthorized, not 404 Not Found
    response = await client.get(f"{test_settings.api_v1_str}/admin/")
    
    # If the router is registered, we should get a 401 Unauthorized
    # If the router is not registered, we would get a 404 Not Found
    assert response.status_code == 401, f"Expected 401 Unauthorized, got {response.status_code} {response.text}" 