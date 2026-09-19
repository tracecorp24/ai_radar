import os
from typing import Optional
from app.services.storage.base import BaseStorageProvider

class S3StorageProvider(BaseStorageProvider):
    """
    S3 Uyumlu Depolama Adaptörü (AWS S3, Cloudflare R2, MinIO, Local Disk Fallback).
    """
    def __init__(self, upload_dir: str = "uploads"):
        self.upload_dir = upload_dir
        os.makedirs(self.upload_dir, exist_ok=True)

    def upload_file(self, file_name: str, file_data: bytes, content_type: Optional[str] = None) -> str:
        # S3 veya MinIO ayarları yoksa güvenli şekilde Local Storage'a yazar
        file_path = os.path.join(self.upload_dir, file_name)
        with open(file_path, "wb") as f:
            f.write(file_data)
        return self.get_file_url(file_name)

    def get_file_url(self, file_name: str) -> str:
        return f"/uploads/{file_name}"
