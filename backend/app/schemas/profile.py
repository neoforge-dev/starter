"""Profile schemas for RealWorld API."""
from pydantic import BaseModel


# Profile response schema
class ProfileResponse(BaseModel):
    """Profile response schema."""

    username: str
    bio: str = ""
    image: str = ""
    following: bool = False

    class Config:
        """Schema configuration."""

        from_attributes = True


# Single profile response
class SingleProfileResponse(BaseModel):
    """Response for single profile."""

    profile: ProfileResponse