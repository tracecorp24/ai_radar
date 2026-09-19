import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from app.db.base_class import Base

class Tester(Base):
    """
    Davetli Tester Beyaz Liste Tablosu (testers) - Plandaki 13. Madde
    """
    __tablename__ = "testers"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    enabled = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
