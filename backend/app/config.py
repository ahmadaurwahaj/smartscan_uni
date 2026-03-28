# app/config.py

from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    # App settings
    APP_NAME: str = Field(default="Smart Document Processing & Analysis System")
    APP_VERSION: str = Field(default="1.0.0")

    # Security / JWT
    SECRET_KEY: str = Field(default="CHANGE_THIS_SECRET_KEY")
    ALGORITHM: str = Field(default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=60 * 24)  # 24 hours

    # Database (MySQL)
    DB_HOST: str = Field(default="localhost")
    DB_PORT: str = Field(default="3306")
    DB_USER: str = Field(default="root")
    DB_PASSWORD: str = Field(default="password")
    DB_NAME: str = Field(default="smart_docs")

    # File storage
    UPLOAD_DIR: str = Field(default="app/static/uploads")

    # Celery / Redis
    CELERY_BROKER_URL: str = Field(default="redis://localhost:6379/0")
    CELERY_RESULT_BACKEND: str = Field(default="redis://localhost:6379/1")

    # Pydantic v2 config
    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore"    # IMPORTANT → Fixes your current error
    }


settings = Settings()
