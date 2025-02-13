from fastapi import APIRouter
from aioredis import Redis
import psutil

router = APIRouter()

@router.get("/health")
async def health_check():
    return {
        "database": await check_db_connection(),
        "redis": await check_redis(),
        "storage": check_disk_space(),
        "memory": psutil.virtual_memory().percent
    }

async def check_db_connection():
    try:
        async with db.acquire() as conn:
            return (await conn.fetchrow("SELECT 1"))[0] == 1
    except Exception:
        return False 