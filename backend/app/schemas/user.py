# app/schemas/user.py

from pydantic import BaseModel, EmailStr
from typing import Optional


# ------------------------------------------------------------
# User Base Schema
# ------------------------------------------------------------
class UserBase(BaseModel):
    username: str
    email: EmailStr


# ------------------------------------------------------------
# Create User
# ------------------------------------------------------------
class UserCreate(UserBase):
    password: str


# ------------------------------------------------------------
# Update User
# ------------------------------------------------------------
class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None


# ------------------------------------------------------------
# Response Schema
# ------------------------------------------------------------
class UserResponse(UserBase):
    id: int

    model_config = {
        "from_attributes": True   # replaces orm_mode=True in Pydantic v2
    }
