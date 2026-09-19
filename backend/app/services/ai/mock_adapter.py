from typing import Optional, Any
from app.services.ai.base import BaseLLMProvider

class MockLLMProvider(BaseLLMProvider):
    """
    Test ve Çevrimdışı Geliştirme İçin Mock (Sanal) AI Sağlayıcısı.
    Gerçek bir API key gerektirmez.
    """
    def generate(self, prompt: str, model: Optional[str] = None, **kwargs: Any) -> str:
        model_name = model or "mock-model-v1"
        return f"[MOCK AI - {model_name} Yanıtı]: '{prompt}' isteğiniz başarıyla işlendi."

    async def agenerate(self, prompt: str, model: Optional[str] = None, **kwargs: Any) -> str:
        model_name = model or "mock-model-v1"
        return f"[MOCK AI - {model_name} Asenkron Yanıtı]: '{prompt}' isteğiniz başarıyla işlendi."
