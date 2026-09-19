from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.tester import Tester
from app.schemas.tester import TesterCreate, TesterResponse

router = APIRouter(prefix="/testers", tags=["Tester Whitelist"])

@router.post("/", response_model=TesterResponse, status_code=status.HTTP_201_CREATED, summary="Tester Beyaz Listesine Ekle")
def add_tester(tester_in: TesterCreate, db: Session = Depends(get_db)):
    """
    Kayıt olmasına izin verilen tester e-posta adresini beyaz listeye ekler (Plandaki 13. Madde).
    """
    existing = db.query(Tester).filter(Tester.email == tester_in.email).first()
    if existing:
        return existing
        
    tester = Tester(email=tester_in.email, enabled=tester_in.enabled if tester_in.enabled is not None else True)
    db.add(tester)
    db.commit()
    db.refresh(tester)
    return tester

@router.get("/", response_model=List[TesterResponse], summary="Tester Listesini Getir")
def list_testers(db: Session = Depends(get_db)):
    return db.query(Tester).all()
