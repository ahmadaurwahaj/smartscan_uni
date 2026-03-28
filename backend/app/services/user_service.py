# app/services/user_service.py

from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.user import User
from app.schemas.user import UserUpdate, UserResponse


# -------------------------------------------
# Get All Users
# -------------------------------------------
def get_all_users(db: Session):
    users = db.query(User).all()
    return [UserResponse.from_orm(user) for user in users]


# -------------------------------------------
# Get User by ID
# -------------------------------------------
def get_user_by_id(user_id: int, db: Session):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return UserResponse.from_orm(user)


# -------------------------------------------
# Update User
# -------------------------------------------
def update_user(user_id: int, user_data: UserUpdate, db: Session):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if user_data.name:
        user.name = user_data.name
    if user_data.email:
        user.email = user_data.email

    db.commit()
    db.refresh(user)

    return UserResponse.from_orm(user)


# -------------------------------------------
# Delete User
# -------------------------------------------
def delete_user(user_id: int, db: Session):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    db.delete(user)
    db.commit()

    return {"message": "User deleted successfully"}
