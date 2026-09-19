import time
from collections import defaultdict
from typing import Dict, List, Tuple
from fastapi import HTTPException, Request, status

class RateLimiter:
    """
    In-memory kayan pencere (sliding window) Hız Sınırlayıcısı (Rate Limiter).
    IP veya Kullanıcı bazında dakika başına istek limitini denetler.
    """
    def __init__(self, requests_per_minute: int = 60):
        self.requests_per_minute = requests_per_minute
        self.requests_store: Dict[str, List[float]] = defaultdict(list)

    def check_rate_limit(self, client_identifier: str):
        now = time.time()
        window_start = now - 60.0 # Son 60 saniye
        
        # Süresi dolmuş istekleri temizle
        timestamps = [ts for ts in self.requests_store[client_identifier] if ts > window_start]
        self.requests_store[client_identifier] = timestamps

        if len(timestamps) >= self.requests_per_minute:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Hız sınırı aşıldı. Dakikada maksimum {self.requests_per_minute} istek atabilirsiniz.",
                headers={"Retry-After": "60"}
            )

        self.requests_store[client_identifier].append(now)

rate_limiter = RateLimiter(requests_per_minute=60)
