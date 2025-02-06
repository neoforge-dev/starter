"""Database base model."""
from app.db.base_class import Base
from app.models.user import User  # noqa: F401
from app.models.item import Item  # noqa: F401

# SQLAlchemy needs to know about all models for metadata
metadata = Base.metadata 