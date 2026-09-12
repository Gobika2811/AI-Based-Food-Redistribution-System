import os
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("resqfood.database")

# Default database connection string
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:admin123@localhost:5432/resqfood")
SQLITE_FALLBACK_URL = "sqlite:///./resqfood.db"

def init_engine():
    """Attempt connecting to PostgreSQL, falling back to SQLite if unreachable."""
    if DATABASE_URL.startswith("sqlite"):
        logger.info("Using SQLite database: %s", DATABASE_URL)
        return create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

    try:
        engine_pg = create_engine(
            DATABASE_URL,
            pool_pre_ping=True,
            pool_size=10,
            max_overflow=20,
            connect_args={"connect_timeout": 3}
        )
        with engine_pg.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Successfully connected to PostgreSQL database.")
        return engine_pg
    except Exception as e:
        logger.warning(
            "Could not connect to PostgreSQL (%s). Falling back to SQLite: %s",
            e,
            SQLITE_FALLBACK_URL
        )
        return create_engine(SQLITE_FALLBACK_URL, connect_args={"check_same_thread": False})

engine = init_engine()

# Create sessionmaker
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declarative base
Base = declarative_base()

# Dependency injector to get database session per request
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

