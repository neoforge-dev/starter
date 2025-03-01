from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from tests.factories import UserFactory, ItemFactory
from app.core.config import settings

async def test_read_items(client: AsyncClient, db: AsyncSession, regular_user_headers: dict, regular_user) -> None:
    """Test reading item list."""
    # Clean up existing items
    await db.execute(text("TRUNCATE TABLE items CASCADE"))
    await db.commit()

    # Create test items
    items = [
        await ItemFactory.create(session=db, owner=regular_user),
        await ItemFactory.create(session=db, owner=regular_user),
        await ItemFactory.create(session=db, owner=regular_user),
    ]

    response = await client.get(f"{settings.api_v1_str}/items/", headers=regular_user_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == len(items) 