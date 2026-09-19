from typing import List
from fastapi import HTTPException, UploadFile, status

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 # 10 MB
ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".json", ".txt", ".csv"}

class FileChecker:
    """
    Güvenli Dosya Yükleme Kontrolcüsü.
    Dosya boyutunu ve uzantısını denetler.
    """
    @staticmethod
    def validate_file(file: UploadFile, file_bytes: bytes):
        # 1. Dosya boyutu kontrolü
        if len(file_bytes) > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Dosya boyutu çok büyük. Maksimum izin verilen boyut: 10 MB."
            )

        # 2. Dosya uzantısı kontrolü
        filename = file.filename or ""
        ext = filename.lower()[filename.rfind("."):] if "." in filename else ""
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Desteklenmeyen dosya türü '{ext}'. İzin verilen türler: {', '.join(ALLOWED_EXTENSIONS)}"
            )
