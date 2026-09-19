from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.config import settings
from app.core.security import verify_password, create_access_token, get_password_hash
from app.schemas.token import Token
from app.schemas.user import UserResponse
from app.repositories.user_repository import UserRepository
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token, summary="Kullanıcı Girişi (OAuth2 Token)")
def login(
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
):
    """
    Kullanıcı e-posta adresi ve parolası ile oturum açar.
    Başarılı girişte JWT Access Token döndürür.
    """
    repo = UserRepository(db)
    user = repo.get_by_email(form_data.username)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Hatalı e-posta adresi veya parola.",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # Parola doğrulama (hash veya simülasyon hash kontrolü)
    is_valid = False
    if user.hashed_password.startswith("hashed_"):
        is_valid = (user.hashed_password == f"hashed_{form_data.password}")
    else:
        is_valid = verify_password(form_data.password, user.hashed_password)
        
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Hatalı e-posta adresi veya parola.",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.email, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse, summary="Aktif Kullanıcı Profili")
def get_me(current_user: UserResponse = Depends(get_current_user)):
    """
    JWT Token ile kimliği doğrulanmış aktif kullanıcının profil bilgilerini döndürür.
    """
    return current_user
