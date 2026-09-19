import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict

# Ortak Kullanıcı Alanları
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    is_active: Optional[bool] = True

# Kullanıcı Oluşturma İsteği (Giriş verisi)
class UserCreate(UserBase):
    password: str

# Kullanıcı Güncelleme İsteği
class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None

# Kullanıcı Yanıtı (Çıkış verisi - Parola gizlenir!)
class UserResponse(UserBase):
    id: int
    is_superuser: bool
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)
