import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.exc import OperationalError
from app.config import settings

logger = logging.getLogger(__name__)

# Base declarative class
Base = declarative_base()

def get_engine():
    db_url = settings.DATABASE_URL
    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)
    try:
        # Check if Postgres or SQLite
        if db_url.startswith("sqlite"):
            engine = create_engine(db_url, connect_args={"check_same_thread": False})
        else:
            engine = create_engine(db_url, pool_pre_ping=True)
            # Test connection
            with engine.connect() as conn:
                pass
        logger.info(f"Database connected using: {db_url.split('@')[-1] if '@' in db_url else db_url}")
        return engine
    except Exception as e:
        logger.warning(f"Could not connect to configured database ({db_url}): {e}")
        fallback_url = "sqlite:///./ev_charging.db"
        logger.info(f"Falling back to local SQLite engine: {fallback_url}")
        return create_engine(fallback_url, connect_args={"check_same_thread": False})

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
