from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "ARkA E-commerce"
    DATABASE_URL: str   # será lida do .env
    JWT_SECRET: str = "change-me-please"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    MEDIA_DIR: str = "media"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"