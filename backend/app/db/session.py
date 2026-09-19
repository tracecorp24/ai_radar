from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings

# SQLite veya PostgreSQL için engine oluştur
# SQLite kullanılırsa connect_args={"check_same_thread": False} gerekir
engine_kwargs = {}
if settings.sync_database_url.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}

engine = create_engine(
    settings.sync_database_url,
    pool_pre_ping=True,  # Kopan bağlantıları otomatik algılar ve yeniler
    **engine_kwargs
)

# Her istek için bağımsız veritabanı oturumu üretecek fabrika
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db() -> Generator[Session, None, None]:
    """
    FastAPI Dependency Injection fonksiyonu.
    Her HTTP isteğinde yeni bir veritabanı oturumu açar.
    İstek tamamlandığında (hata olsa dahi) oturumu güvenle kapatır.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
