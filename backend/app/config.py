from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "ARkA E-commerce"

    # ❌ SEM valor default
    DATABASE_URL: str

    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    MEDIA_DIR: str = "media"
    PORT: int = 10000

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()