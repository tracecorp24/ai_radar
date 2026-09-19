from abc import ABC, abstractmethod
from typing import Optional, Dict, Any

class BaseLLMProvider(ABC):
    """
    Vendor-Bağımsız LLM (Büyük Dil Modeli) Sağlayıcı Taban Sınıfı.
    OpenAI, OpenRouter, Anthropic, Gemini veya Mock sağlayıcıları bu sınıftan türemek zorundadır.
    """
    
    @abstractmethod
    def generate(self, prompt: str, model: Optional[str] = None, **kwargs: Any) -> str:
        """
        Gelen prompt için metin üretir ve yanıtı dize (string) olarak döndürür.
        """
        pass

    @abstractmethod
    async def agenerate(self, prompt: str, model: Optional[str] = None, **kwargs: Any) -> str:
        """
        Gelen prompt için asenkron (async/await) metin üretir.
        """
        pass
