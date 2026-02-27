from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# =========================================================
# SQLite LOCAL (desenvolvimento)
# =========================================================
DATABASE_URL = "sqlite:///./dev.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


# =========================================================
# DEPENDÊNCIA PARA OS ROUTERS
# =========================================================
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# =========================================================
# ⚠️ IMPORTAR MODELS E CRIAR TABELAS
# =========================================================
from .models import User  # ✅ CORRETO (models.py)

Base.metadata.create_all(bind=engine)