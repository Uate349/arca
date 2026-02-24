from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "ARkA E-commerce"
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/arca_db"
    JWT_SECRET: str = "change-me-please"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    MEDIA_DIR: str = "media"
    PORT: int = 10000  # default port, can be overridden by env

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

# Instantiate settings once for the whole app
settings = Settings()