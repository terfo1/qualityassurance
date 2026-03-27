from fastapi import APIRouter, Depends

from app.presentation.api.dependencies import ServiceBundle, get_public_services


router = APIRouter()


@router.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "novacart"}


@router.get("/metrics")
def metrics(services: ServiceBundle = Depends(get_public_services)) -> dict:
    return services.metrics.metrics()
