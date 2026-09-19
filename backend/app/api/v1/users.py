from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.user import UserCreate, UserResponse
from app.repositories.user_repository import UserRepository

from app.core.security import get_password_hash
from app.models.tester import Tester

router = APIRouter(prefix="/users", tags=["Users"])

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED, summary="Yeni Kullanıcı Kaydı")
def create_user(user_in: UserCreate, db: Session = Depends(get_db)):
    """
    Yeni bir kullanıcı kaydeder (Herkese Açık - Public Registration).
    """
    repo = UserRepository(db)
    existing_user = repo.get_by_email(user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu e-posta adresi ile zaten kayıtlı bir kullanıcı var."
        )
    hashed_pass = get_password_hash(user_in.password)
    user = repo.create(user_in, hashed_password=hashed_pass)
    return user

@router.get("/", response_model=List[UserResponse], summary="Kullanıcıları Listele")
def list_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Sistemdeki kullanıcıları listeler.
    """
    repo = UserRepository(db)
    return repo.get_multi(skip=skip, limit=limit)

@router.get("/{user_id}", response_model=UserResponse, summary="ID ile Kullanıcı Detayı")
def get_user(user_id: int, db: Session = Depends(get_db)):
    """
    Belirli bir kullanıcı detayını döndürür.
    """
    repo = UserRepository(db)
    user = repo.get_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kullanıcı bulunamadı."
        )
    return user
