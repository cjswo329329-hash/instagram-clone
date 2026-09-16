from pydantic_settings import BaseSettings
from typing import List
import os

# backend 폴더의 절대경로 (어느 디렉토리에서 실행해도 동일한 DB 사용)
_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

class Settings(BaseSettings):
    PROJECT_NAME: str = "Instagram Clone API"
    SECRET_KEY: str = "supersecret_jwt_key_change_me_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 14

    DATABASE_URL: str = f"sqlite:///{_BACKEND_DIR}/instagram.db"
    BACKEND_DIR: str = _BACKEND_DIR
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    UPLOAD_DIR: str = os.path.join(_BACKEND_DIR, "uploads")

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
