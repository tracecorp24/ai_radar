from typing import Optional
from app.services.ai.base import BaseLLMProvider
from app.services.ai.mock_adapter import MockLLMProvider
from app.services.ai.openrouter_adapter import OpenRouterProvider
from app.services.ai.openai_adapter import OpenAIProvider

class LLMFactory:
    """
    Vendor-Bağımsız LLM Fabrika Sınıfı.
    Sağlayıcı adına göre (openrouter, openai, mock) uygun adaptör nesnesi üretir.
    """
    @staticmethod
    def get_provider(provider_name: Optional[str] = "openrouter") -> BaseLLMProvider:
        name = (provider_name or "openrouter").lower().strip()
        
        if name == "openai":
            return OpenAIProvider()
        elif name == "openrouter":
            return OpenRouterProvider()
        elif name == "mock":
            return MockLLMProvider()
        else:
            # Bilinmeyen sağlayıcı isteğinde varsayılan OpenRouter veya Mock döner
            return OpenRouterProvider()
