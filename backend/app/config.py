from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "ARCA E-commerce"

    # 🔥 Obrigatório vir do ambiente (Render / .env)
    DATABASE_URL: str

    # 🔐 Segurança
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # 📁 Media
    MEDIA_DIR: str = "media"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()