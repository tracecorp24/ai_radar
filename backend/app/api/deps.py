from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.security import decode_access_token
from app.models.user import User
from app.repositories.user_repository import UserRepository

# Swagger UI ve OAuth2 için token endpoint adresi
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    """
    HTTP Authorization başlığındaki JWT Token'ı doğrular.
    Geçerliyse veritabanından aktif kullanıcıyı döndürür.
    Geçersiz veya süresi dolmuşsa HTTP 401 Unauthorized döndürür.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Geçersiz veya süresi dolmuş yetkilendirme kimliği (Token).",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    sub = decode_access_token(token)
    if sub is None:
        raise credentials_exception
    
    repo = UserRepository(db)
    # sub değeri e-posta veya user_id olabilir
    if sub.isdigit():
        user = repo.get_by_id(int(sub))
    else:
        user = repo.get_by_email(sub)
        
    if user is None:
        raise credentials_exception
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Devre dışı bırakılmış kullanıcı hesabı."
        )
        
    return user
