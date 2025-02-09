"""User schemas."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


# Shared properties
class UserBase(BaseModel):
    """Base User schema."""
    
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = True
    is_superuser: bool = False


# Properties to receive via API on creation
class UserCreate(UserBase):
    """User creation schema."""
    
    email: EmailStr
    password: str
    full_name: str


# Properties to receive via API on update
class UserUpdate(UserBase):
    """User update schema."""
    
    password: Optional[str] = None


# Properties shared by models stored in DB
class UserInDBBase(UserBase):
    """Base User DB schema."""
    
    id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        """Schema configuration."""
        
        from_attributes = True


# Additional properties to return via API
class UserResponse(UserInDBBase):
    """User response schema."""
    pass


# Additional properties stored in DB
class UserInDB(UserInDBBase):
    """User DB schema."""
    
    hashed_password: str 