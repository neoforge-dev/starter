"""Support ticket schemas."""
from typing import Optional
from pydantic import BaseModel, EmailStr


class SupportTicketBase(BaseModel):
    email: EmailStr
    subject: str
    message: str


class SupportTicketCreate(SupportTicketBase):
    pass


class SupportTicketUpdate(BaseModel):
    subject: Optional[str] = None
    message: Optional[str] = None
    status: Optional[str] = None


class SupportTicketRead(SupportTicketBase):
    id: int
    status: str

    class Config:
        from_attributes = True
