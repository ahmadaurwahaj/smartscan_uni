# app/services/auth_service.py

from sqlalchemy.orm import Session
from fastapi import HTTPException, status, Depends
from passlib.context import CryptContext

from app.models.user import User
from app.schemas.user import UserCreate, UserResponse
from app.utils.jwt_utils import create_access_token, get_token_payload
from app.database import get_db

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# -------------------------------------------
# Password Hashing
# -------------------------------------------
def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


# -------------------------------------------
# Register User
# -------------------------------------------
def create_user(db: Session, user_data: UserCreate) -> UserResponse:
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists."
        )

    new_user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=hash_password(user_data.password),
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return UserResponse.model_validate(new_user)


# -------------------------------------------
# Authenticate User (Login)
# -------------------------------------------
def authenticate_user(db: Session, email: str, password: str):
    user = db.query(User).filter(User.email == email).first()

    if not user:
        return None

    if not verify_password(password, user.password_hash):
        return None

    return user


# -------------------------------------------
# Login – Generate JWT Token
# -------------------------------------------
def login_user(db: Session, email: str, password: str):
    user = authenticate_user(db, email, password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    access_token = create_access_token({"sub": user.email})

    return {
        "user": UserResponse.model_validate(user),
        "token": {
            "access_token": access_token,
            "token_type": "bearer"
        }
    }


# -------------------------------------------
# Get Current User (FastAPI dependency)
# -------------------------------------------
def get_current_user(
    payload: dict = Depends(get_token_payload),
    db: Session = Depends(get_db)
) -> User:
    email = payload.get("sub")
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )
    return user
