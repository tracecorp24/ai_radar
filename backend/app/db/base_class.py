from typing import Any
from sqlalchemy.orm import DeclarativeBase, declared_attr

class Base(DeclarativeBase):
    """
    Tüm SQLAlchemy veritabanı modelleri için temel (Base) sınıf.
    Sınıf adını otomatik olarak küçük harfe çevirip tablo adı (__tablename__) yapar.
    Örnek: User -> users, Job -> jobs
    """
    id: Any
    __name__: str

    # Tablo adını otomatik üret (Örn: User -> users)
    @declared_attr
    def __tablename__(cls) -> str:
        return cls.__name__.lower() + "s"
