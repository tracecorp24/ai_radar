from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.health import router as health_router
from app.api.v1.users import router as users_router
from app.api.v1.auth import router as auth_router
from app.api.v1.ai import router as ai_router
from app.api.v1.metrics import router as metrics_router
from app.api.v1.testers import router as testers_router
from app.core.middleware import RequestIDMiddleware

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Vendor-Bağımsız AI Ürünü Asenkron REST API Servisi",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Request ID & Latency Tracking Middleware
app.add_middleware(RequestIDMiddleware)

# CORS Middleware (Cross-Origin Resource Sharing)
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Rotaları Ekle
app.include_router(health_router)
app.include_router(health_router, prefix=settings.API_V1_STR)
app.include_router(users_router, prefix=settings.API_V1_STR)
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(ai_router, prefix=settings.API_V1_STR)
app.include_router(metrics_router, prefix=settings.API_V1_STR)
app.include_router(testers_router, prefix=settings.API_V1_STR)

@app.get("/", summary="Kök Endpoint", tags=["System"])
def root():
    return {
        "message": f"{settings.PROJECT_NAME} API'sine Hoş Geldiniz.",
        "docs": "/docs",
        "health": "/health"
    }
