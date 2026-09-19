import httpx
from typing import Optional, Any
from app.core.config import settings
from app.services.ai.base import BaseLLMProvider
from app.services.ai.mock_adapter import MockLLMProvider

class OpenAIProvider(BaseLLMProvider):
    """
    Doğrudan OpenAI API Adaptörü.
    """
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.OPENAI_API_KEY
        self.base_url = "https://api.openai.com/v1/chat/completions"

    def _get_headers(self) -> dict:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

    def generate(self, prompt: str, model: Optional[str] = None, **kwargs: Any) -> str:
        if not self.api_key or self.api_key.startswith("your_"):
            return MockLLMProvider().generate(prompt, model=model)
            
        target_model = model or "gpt-4o-mini"
        payload = {
            "model": target_model,
            "messages": [{"role": "user", "content": prompt}]
        }
        
        try:
            with httpx.Client(timeout=30.0) as client:
                response = client.post(self.base_url, headers=self._get_headers(), json=payload)
                response.raise_for_status()
                data = response.json()
                return data["choices"][0]["message"]["content"]
        except Exception as e:
            return f"[OpenAI Hata]: AI Yanıtı alınamadı -> {str(e)}"

    async def agenerate(self, prompt: str, model: Optional[str] = None, **kwargs: Any) -> str:
        if not self.api_key or self.api_key.startswith("your_"):
            return await MockLLMProvider().agenerate(prompt, model=model)
            
        target_model = model or "gpt-4o-mini"
        payload = {
            "model": target_model,
            "messages": [{"role": "user", "content": prompt}]
        }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(self.base_url, headers=self._get_headers(), json=payload)
                response.raise_for_status()
                data = response.json()
                return data["choices"][0]["message"]["content"]
        except Exception as e:
            return f"[OpenAI Hata]: AI Yanıtı alınamadı -> {str(e)}"
