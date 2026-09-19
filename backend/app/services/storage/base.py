from abc import ABC, abstractmethod
from typing import Optional, BinaryIO

class BaseStorageProvider(ABC):
    """
    Vendor-Bağımsız Dosya Depolama (Object Storage) Arayüzü.
    AWS S3, Cloudflare R2, MinIO ve Local Storage bu arayüzü uygular.
    """
    @abstractmethod
    def upload_file(self, file_name: str, file_data: bytes, content_type: Optional[str] = None) -> str:
        """
        Dosyayı yükler ve kamuya açık/erişilebilir URL adresini döndürür.
        """
        pass

    @abstractmethod
    def get_file_url(self, file_name: str) -> str:
        """
        Dosyanın erişim URL'sini verir.
        """
        pass
