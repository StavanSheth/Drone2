from starlette.middleware.base import BaseHTTPMiddleware
import time
import logging

logger = logging.getLogger("api.access")

class AccessLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        start = time.time()
        response = await call_next(request)
        duration = round((time.time() - start) * 1000, 2)
        logger.info(f"{request.method} {request.url.path} -> {response.status_code} ({duration}ms)")
        return response
