# app/routers/user_router.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.schemas.user import UserUpdate, UserResponse
from app.services.user_service import (
    get_all_users,
    get_user_by_id,
    update_user,
    delete_user
)
from app.services.auth_service import get_current_user
from app.database import get_db

router = APIRouter(prefix="/users", tags=["Users"])


# ------------------------------------------------------------
# Get All Users (Admin-like feature)
# ------------------------------------------------------------
@router.get("/", response_model=list[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return get_all_users(db)


# ------------------------------------------------------------
# Get User by ID
# ------------------------------------------------------------
@router.get("/{user_id}", response_model=UserResponse)
def fetch_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return get_user_by_id(user_id, db)


# ------------------------------------------------------------
# Update User
# ------------------------------------------------------------
@router.put("/{user_id}", response_model=UserResponse)
def edit_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return update_user(user_id, user_data, db)


# ------------------------------------------------------------
# Delete User
# ------------------------------------------------------------
@router.delete("/{user_id}")
def remove_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return delete_user(user_id, db)
