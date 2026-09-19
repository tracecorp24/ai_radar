import os
import sys
import pytest
from fastapi import UploadFile
from io import BytesIO

# Workspace root yolunu sys.path'e ekle (infrastructure betiklerini test etmek için)
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from app.core.rate_limiter import rate_limiter
from app.core.file_checker import FileChecker
from infrastructure.scripts.backup_db import run_backup

def test_rate_limiter():
    rate_limiter.check_rate_limit("test_client_ip")
    assert len(rate_limiter.requests_store["test_client_ip"]) > 0

def test_file_checker():
    # Geçerli txt dosyası
    valid_file = UploadFile(filename="test.txt", file=BytesIO(b"hello world"))
    FileChecker.validate_file(valid_file, b"hello world")

    # Desteklenmeyen uzantı
    invalid_ext = UploadFile(filename="malicious.exe", file=BytesIO(b"bad code"))
    with pytest.raises(Exception) as exc_info:
        FileChecker.validate_file(invalid_ext, b"bad code")
    assert "Desteklenmeyen dosya türü" in str(exc_info.value.detail)

def test_database_backup(tmp_path):
    backup_file = run_backup(backup_dir=str(tmp_path))
    assert os.path.exists(backup_file)
    assert backup_file.endswith(".sql")

def test_metrics_endpoint(client):
    response = client.get("/api/v1/metrics/")
    assert response.status_code == 200
    data = response.json()
    assert "metrics" in data
    assert "total_users" in data["metrics"]
    assert "total_ai_jobs" in data["metrics"]
