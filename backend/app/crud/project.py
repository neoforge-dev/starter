"""CRUD for Project."""
from typing import Optional

from app.crud.base import CRUDBase
from app.models.project import Project
from app.schemas.project import ProjectCreate, ProjectUpdate
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


class CRUDProject(CRUDBase[Project, ProjectCreate, ProjectUpdate]):
    async def get_by_name(self, db: AsyncSession, name: str) -> Optional[Project]:
        result = await db.execute(select(Project).where(Project.name == name))
        return result.scalar_one_or_none()


project = CRUDProject(Project)
