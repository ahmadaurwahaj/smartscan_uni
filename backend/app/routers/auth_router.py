# app/routers/auth_router.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.schemas.user import UserCreate, UserResponse
from app.schemas.auth import Token, AuthResponse
from app.services.auth_service import create_user, login_user, get_current_user
from app.database import get_db
from app.utils.logger import get_logger

logger = get_logger("auth_router")

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ------------------------------------------------------------
# Register User
# ------------------------------------------------------------
@router.post("/register", response_model=UserResponse)
def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    logger.info(f"Register request for email='{user_data.email}'")
    try:
        result = create_user(db, user_data)
        logger.info(f"User registered successfully: id={result.id}, email='{result.email}'")
        return result
    except HTTPException as e:
        logger.warning(f"Registration failed for '{user_data.email}': {e.detail}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error during registration for '{user_data.email}': {e}")
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")


# ------------------------------------------------------------
# Login User
# ------------------------------------------------------------
@router.post("/login", response_model=AuthResponse)
def login(email: str, password: str, db: Session = Depends(get_db)):
    logger.info(f"Login attempt for email='{email}'")
    try:
        result = login_user(db, email, password)
        logger.info(f"Login successful for email='{email}'")
        return result
    except HTTPException as e:
        logger.warning(f"Login failed for '{email}': {e.detail}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error during login for '{email}': {e}")
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")


# ------------------------------------------------------------
# Get Logged-in User
# ------------------------------------------------------------
@router.get("/me", response_model=UserResponse)
def get_logged_user(current_user=Depends(get_current_user)):
    logger.info(f"Profile fetch for user id={current_user.id}")
    return current_user
