from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "ARkA E-commerce"
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/arca_db"
    JWT_SECRET: str = "change-me-please"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    MEDIA_DIR: str = "media"

    # ⚡ Não define PORT aqui, vamos pegar no main.py para garantir runtime

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()