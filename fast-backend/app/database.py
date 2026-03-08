import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

# We expect a Postgres connection string like postgresql://user:pass@host:port/db
# If Supabase provides postgres://, SQLAlchemy prefers postgresql://
DATABASE_URL = os.getenv("SUPABASE_DB_URL", "")
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

try:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
except Exception as e:
    engine = None
    SessionLocal = None
    print(f"Warning: Could not configure database engine. Check SUPABASE_DB_URL. Error: {e}")

Base = declarative_base()

def get_db():
    if SessionLocal is None:
        yield None
        return
        
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
