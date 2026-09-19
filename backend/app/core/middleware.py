import time
import uuid
import logging
from starlette.types import ASGIApp, Scope, Receive, Send

logger = logging.getLogger("app.middleware")

class RequestIDMiddleware:
    """
    Saf (Pure) ASGI Middleware.
    Her HTTP isteğine benzersiz 'X-Request-ID' ekler ve yanıt süresini (latency) ölçer.
    Thread değiştirmediği için SQLite testlerinde ve asenkron yüklerde maksimum performans sağlar.
    """
    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        request_id = str(uuid.uuid4())
        start_time = time.time()

        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                process_time = (time.time() - start_time) * 1000
                headers = list(message.get("headers", []))
                headers.append((b"x-request-id", request_id.encode("utf-8")))
                headers.append((b"x-process-time-ms", f"{process_time:.2f}".encode("utf-8")))
                message["headers"] = headers
            await send(message)

        await self.app(scope, receive, send_wrapper)
