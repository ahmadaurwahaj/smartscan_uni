# app/schemas/auth.py

from pydantic import BaseModel, EmailStr
from typing import Optional
from app.schemas.user import UserResponse


# ---------------------------------------
# Token Schema
# ---------------------------------------
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ---------------------------------------
# Token Data (decoded JWT)
# ---------------------------------------
class TokenData(BaseModel):
    username: Optional[str] = None


# ---------------------------------------
# Auth Response
# ---------------------------------------
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    user: UserResponse
    token: Token