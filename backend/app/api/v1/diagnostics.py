import os
import sys
import shutil
import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.db.session import get_db
from app.core.config import settings

router = APIRouter(prefix="/diagnostics", tags=["System Diagnostics"])

START_TIME = datetime.datetime.now(datetime.timezone.utc)

@router.get("/", summary="Kapsamlı Sistem Teşhis ve Log Protokolü")
def get_diagnostics(db: Session = Depends(get_db)):
    """
    Sistemin anlık durumunu, DB boyutunu, çalışan süreçleri, LLM API durumlarını 
    ve sistem metriklerini AI ve yöneticinin tek bir çıktıdan okuması için üretir.
    """
    now = datetime.datetime.now(datetime.timezone.utc)
    uptime_seconds = (now - START_TIME).total_seconds()
    
    # 1. Veritabanı Kontrolü ve Boyut Hesaplama
    db_status = "healthy"
    db_size_bytes = 0
    db_size_mb = 0.0
    table_counts = {}
    
    try:
        # PostgreSQL Veritabanı Boyutu
        size_result = db.execute(text("SELECT pg_database_size(current_database());")).scalar()
        if size_result:
            db_size_bytes = int(size_result)
            db_size_mb = round(db_size_bytes / (1024 * 1024), 2)
            
        # Tablo bazlı kayıt sayıları
        tables = ["users", "jobs", "testers"]
        for tbl in tables:
            try:
                cnt = db.execute(text(f"SELECT COUNT(*) FROM {tbl};")).scalar()
                table_counts[tbl] = cnt
            except Exception:
                table_counts[tbl] = -1
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
        
    # 2. LLM API Anahtarları ve Durumları
    llm_statuses = {
        "openai_configured": bool(os.getenv("OPENAI_API_KEY") or getattr(settings, "OPENAI_API_KEY", None)),
        "anthropic_configured": bool(os.getenv("ANTHROPIC_API_KEY") or getattr(settings, "ANTHROPIC_API_KEY", None)),
        "gemini_configured": bool(os.getenv("GEMINI_API_KEY") or getattr(settings, "GEMINI_API_KEY", None)),
        "deepseek_configured": bool(os.getenv("DEEPSEEK_API_KEY") or getattr(settings, "DEEPSEEK_API_KEY", None)),
    }
    
    # 3. Sistem Kaynakları (CPU, RAM, Disk) - Standart kütüphaneler ile safe fallback
    try:
        import psutil
        cpu_percent = psutil.cpu_percent(interval=None)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        system_metrics = {
            "cpu_percent": cpu_percent,
            "ram_used_mb": round(memory.used / (1024 * 1024), 2),
            "ram_total_mb": round(memory.total / (1024 * 1024), 2),
            "ram_percent": memory.percent,
            "disk_free_gb": round(disk.free / (1024 * 1024 * 1024), 2),
            "disk_percent": disk.percent
        }
    except ImportError:
        total_d, used_d, free_d = shutil.disk_usage(os.getcwd())
        system_metrics = {
            "cpu_count": os.cpu_count(),
            "disk_free_gb": round(free_d / (1024 * 1024 * 1024), 2),
            "disk_total_gb": round(total_d / (1024 * 1024 * 1024), 2),
            "disk_percent": round((used_d / total_d) * 100, 1),
            "python_version": sys.version.split(" ")[0]
        }
    
    # 4. Son Log Dosyasından Hata/Uyarı Taraması
    recent_logs = []
    log_file = os.path.join(os.getcwd(), "app.log")
    if os.path.exists(log_file):
        try:
            with open(log_file, "r", encoding="utf-8", errors="ignore") as f:
                lines = f.readlines()
                recent_logs = [line.strip() for line in lines[-20:] if "ERROR" in line or "WARNING" in line or "CRITICAL" in line]
        except Exception:
            recent_logs = ["Log dosyası okunamadı."]
            
    return {
        "timestamp": now.isoformat(),
        "uptime_human": f"{int(uptime_seconds // 3600)}h {int((uptime_seconds % 3600) // 60)}m {int(uptime_seconds % 60)}s",
        "environment": settings.ENVIRONMENT,
        "app_version": settings.VERSION,
        "database": {
            "status": db_status,
            "size_bytes": db_size_bytes,
            "size_mb": db_size_mb,
            "table_counts": table_counts
        },
        "llm_api_status": llm_statuses,
        "system_resources": system_metrics,
        "recent_alerts_logs": recent_logs
    }
