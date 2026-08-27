from fastapi import APIRouter, Depends
from drone_backend.schemas.common import HealthResponse
from drone_backend.services.health_service import HealthService
from drone_backend.api.dependencies import get_health_svc

router = APIRouter(tags=["Health"])

@router.get("/health", response_model=HealthResponse)
async def health_check(svc: HealthService = Depends(get_health_svc)):
    return svc.get_health()
