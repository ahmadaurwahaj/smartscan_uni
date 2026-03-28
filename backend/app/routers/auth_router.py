# app/routers/auth_router.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.schemas.user import UserCreate, UserResponse
from app.schemas.auth import Token, AuthResponse
from app.services.auth_service import create_user, login_user, get_current_user
from app.database import get_db


router = APIRouter(prefix="/auth", tags=["Authentication"])


# ------------------------------------------------------------
# Register User
# ------------------------------------------------------------
@router.post("/register", response_model=UserResponse)
def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    return create_user(db, user_data)


# ------------------------------------------------------------
# Login User
# ------------------------------------------------------------
@router.post("/login", response_model=AuthResponse)
def login(email: str, password: str, db: Session = Depends(get_db)):
    result = login_user(db, email, password)
    return result


# ------------------------------------------------------------
# Get Logged-in User
# ------------------------------------------------------------
@router.get("/me", response_model=UserResponse)
def get_logged_user(current_user=Depends(get_current_user)):
    return current_user
