import os
from typing import Generator

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, declarative_base, sessionmaker

from backend.app.core.config import settings

# Determine Database URL
# If DATABASE_URL starts with postgresql://, normalize to postgresql+psycopg://
db_url = os.environ.get("DATABASE_URL", settings.DATABASE_URL)
if db_url.startswith("postgresql://") and not db_url.startswith("postgresql+psycopg://"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg://", 1)

connect_args = {}
if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    db_url,
    connect_args=connect_args,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that provides a scoped database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Initialize PostGIS extension (if PostgreSQL) and create database tables."""
    with engine.begin() as conn:
        # Check if connected to PostgreSQL, then enable PostGIS extension if available
        if engine.dialect.name == "postgresql":
            try:
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
            except Exception as e:
                print(f"Notice: Could not enable postgis extension: {e}")
        Base.metadata.create_all(bind=conn)
