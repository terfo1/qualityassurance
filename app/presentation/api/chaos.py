import asyncio
import random

from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.config import settings


class QAFaultInjectionMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        if not settings.qa_fault_injection_enabled or not request.url.path.startswith("/api/"):
            return await call_next(request)

        target = request.headers.get("X-QA-Fault-Target")
        if target and target not in request.url.path:
            return await call_next(request)

        probability = self._read_probability(request)
        if probability <= 0 or random.random() > probability:
            return await call_next(request)

        delay_ms = self._read_int_header(request, "X-QA-Delay-Ms", minimum=0, maximum=settings.qa_fault_injection_max_delay_ms)
        if delay_ms:
            await asyncio.sleep(delay_ms / 1000)

        status_code = self._read_int_header(request, "X-QA-Status-Code", minimum=400, maximum=599)
        if status_code:
            return JSONResponse(
                status_code=status_code,
                content={
                    "detail": "Injected QA fault",
                    "path": request.url.path,
                    "status_code": status_code,
                    "delay_ms": delay_ms,
                },
            )

        return await call_next(request)

    def _read_int_header(self, request: Request, name: str, minimum: int, maximum: int) -> int:
        raw = request.headers.get(name)
        if raw is None:
            return 0
        try:
            value = int(raw)
        except ValueError:
            return 0
        return max(minimum, min(value, maximum))

    def _read_probability(self, request: Request) -> float:
        raw = request.headers.get("X-QA-Fault-Probability", "1")
        try:
            value = float(raw)
        except ValueError:
            return 0
        return max(0.0, min(value, 1.0))
