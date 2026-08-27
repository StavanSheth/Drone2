from fastapi import APIRouter, HTTPException, Depends
from typing import List
from drone_backend.schemas.detection import DetectionRequest, DetectionResponse, ImageDetectionItem, MissionDetectionCount
from drone_backend.services.detection_service import DetectionService
from drone_backend.services.mission_service import MissionService
from drone_backend.api.dependencies import get_detection_svc, get_mission_svc

router = APIRouter(tags=["Detections"])

@router.post("/analyze-feed", response_model=DetectionResponse)
async def analyze_feed(request: DetectionRequest, svc: DetectionService = Depends(get_detection_svc)):
    try:
        res = svc.analyze_frame(
            image_base64=request.image_base64,
            mission_id=request.mission_id or "default",
            model_name=request.model_name or "V2"
        )
        return DetectionResponse(**res)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Analysis failed: {str(e)}")

@router.get("/list-detections/{mission_id}", response_model=List[ImageDetectionItem])
async def list_detections(mission_id: str, m_svc: MissionService = Depends(get_mission_svc)):
    return m_svc.list_mission_images(mission_id)

@router.get("/list-missions-with-detections", response_model=List[MissionDetectionCount])
async def list_missions_with_detections(m_svc: MissionService = Depends(get_mission_svc)):
    return m_svc.list_missions_with_detections()
