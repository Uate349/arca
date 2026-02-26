from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "ARCA E-commerce"
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/arca_db"
    JWT_SECRET: str = "change-me-please"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    MEDIA_DIR: str = "media"

    class Config:
        env_file = ".env"

settings = Settings()
