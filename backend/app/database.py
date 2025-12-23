from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base
from .config import settings

engine = create_engine(settings.DATABASE_URL, future=True)

@event.listens_for(engine, "connect")
def _set_client_encoding(dbapi_connection, connection_record):
    # Força UTF-8 no Postgres para não gravar acentos errado (FragrÃ¢ncia)
    try:
        cursor = dbapi_connection.cursor()
        cursor.execute("SET client_encoding TO 'UTF8'")
        cursor.close()
    except Exception:
        # Se não for Postgres/driver não suportar, ignora
        pass

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()