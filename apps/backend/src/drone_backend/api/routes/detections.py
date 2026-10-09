import shutil
from pathlib import Path
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from drone_backend.api.dependencies import (
    get_app_settings,
    get_detection_svc,
    get_mission_svc,
    get_tracking_svc,
)
from drone_backend.config.settings import Settings
from drone_backend.schemas.detection import (
    DetectionRequest,
    DetectionResponse,
    ImageDetectionItem,
    MissionDetectionCount,
    TrackHistoryItem,
    TrackHistoryResponse,
    TrackingFrameRequest,
    TrackingSessionCreateRequest,
    TrackingSessionResponse,
)
from drone_backend.services.detection_service import DetectionService
from drone_backend.services.mission_service import MissionService
from drone_backend.services.tracking_service import TrackingService

router = APIRouter(tags=["Detections & Tracking"])


# --- Existing Primary Endpoint (Preserved & Enhanced) ---

@router.post("/analyze-feed", response_model=DetectionResponse)
async def analyze_feed(
    request: DetectionRequest,
    svc: DetectionService = Depends(get_detection_svc),
):
    """Analyze single frame or sequential stream.

    Preserves 100% legacy backward compatibility. If `track=True` or `stream_id` is supplied,
    runs through persistent ByteTrack tracking.
    """
    try:
        res = svc.analyze_frame(
            image_base64=request.image_base64,
            mission_id=request.mission_id or "default",
            model_name=request.model_name or "V2",
            track=bool(request.track),
            stream_id=request.stream_id or "default",
            frame_index=request.frame_index,
        )
        if "error" in res:
            raise HTTPException(status_code=400, detail=res["error"])
        return DetectionResponse(**res)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Analysis failed: {str(e)}")


@router.get("/list-detections/{mission_id}", response_model=List[ImageDetectionItem])
async def list_detections(mission_id: str, m_svc: MissionService = Depends(get_mission_svc)):
    return m_svc.list_mission_images(mission_id)


@router.get("/list-missions-with-detections", response_model=List[MissionDetectionCount])
async def list_missions_with_detections(m_svc: MissionService = Depends(get_mission_svc)):
    return m_svc.list_missions_with_detections()


# --- Dedicated ByteTrack Tracking Endpoints ---

@router.post("/tracking/sessions", response_model=TrackingSessionResponse)
async def create_or_get_tracking_session(
    req: TrackingSessionCreateRequest,
    tracking_svc: TrackingService = Depends(get_tracking_svc),
):
    """Initialize or acquire an isolated ByteTrack session for a mission and stream."""
    try:
        session = tracking_svc.get_or_create_session(
            mission_id=req.mission_id,
            stream_id=req.stream_id,
            model_name=req.model_name,
        )
        status = session.tracker.get_status()
        return TrackingSessionResponse(
            status="success",
            mission_id=req.mission_id,
            stream_id=req.stream_id,
            model_name=req.model_name,
            frame_index=status.get("frame_index", 0),
            active_track_count=status.get("active_track_count", 0),
            unique_tracks_seen=status.get("unique_tracks_seen", 0),
            total_observations=status.get("total_observations", 0),
            is_closed=status.get("is_closed", False),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create tracking session: {str(e)}")


@router.post("/tracking/frame", response_model=DetectionResponse)
async def track_frame(
    req: TrackingFrameRequest,
    tracking_svc: TrackingService = Depends(get_tracking_svc),
):
    """Ingest the next chronological frame for persistent ByteTrack tracking."""
    try:
        res = tracking_svc.process_base64_frame(
            image_base64=req.image_base64,
            mission_id=req.mission_id,
            stream_id=req.stream_id,
            model_name=req.model_name,
            frame_index=req.frame_index,
        )
        if "error" in res:
            raise HTTPException(status_code=400, detail=res["error"])
        return DetectionResponse(**res)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Tracking frame processing failed: {str(e)}")


@router.get("/tracking/sessions/{mission_id}/{stream_id}")
async def get_tracking_session_status(
    mission_id: str,
    stream_id: str,
    tracking_svc: TrackingService = Depends(get_tracking_svc),
):
    """Retrieve diagnostic health and current track status for a session."""
    status = tracking_svc.get_session_status(mission_id=mission_id, stream_id=stream_id)
    if status is None:
        raise HTTPException(status_code=404, detail="Tracking session not found")
    return {"status": "success", "session": status}


@router.get("/tracking/sessions/{mission_id}/{stream_id}/tracks", response_model=TrackHistoryResponse)
async def get_tracking_session_tracks(
    mission_id: str,
    stream_id: str,
    tracking_svc: TrackingService = Depends(get_tracking_svc),
):
    """Retrieve full persistent track history and statistics for a session."""
    tracks = tracking_svc.get_track_history(mission_id=mission_id, stream_id=stream_id)
    items = [TrackHistoryItem(**t) for t in tracks]
    return TrackHistoryResponse(
        mission_id=mission_id,
        stream_id=stream_id,
        total_tracks=len(items),
        tracks=items,
    )


@router.post("/tracking/sessions/{mission_id}/{stream_id}/reset")
async def reset_tracking_session(
    mission_id: str,
    stream_id: str,
    tracking_svc: TrackingService = Depends(get_tracking_svc),
):
    """Reset the Kalman filter and tracklet registry for a stream/mission."""
    success = tracking_svc.reset_session(mission_id=mission_id, stream_id=stream_id)
    if not success:
        raise HTTPException(status_code=404, detail="Tracking session not found")
    return {"status": "success", "message": f"Session '{stream_id}' for mission '{mission_id}' reset successfully."}


@router.delete("/tracking/sessions/{mission_id}/{stream_id}")
async def close_tracking_session(
    mission_id: str,
    stream_id: str,
    tracking_svc: TrackingService = Depends(get_tracking_svc),
):
    """Explicitly terminate and free resources for a tracking session."""
    success = tracking_svc.close_session(mission_id=mission_id, stream_id=stream_id)
    if not success:
        raise HTTPException(status_code=404, detail="Tracking session not found")
    return {"status": "success", "message": f"Session '{stream_id}' closed."}


@router.post("/tracking/upload-video")
async def upload_and_track_video(
    file: UploadFile = File(...),
    mission_id: str = Form("default"),
    stream_id: str = Form("video_upload"),
    model_name: str = Form("V2"),
    max_frames: Optional[int] = Form(None),
    save_annotated: bool = Form(True),
    tracking_svc: TrackingService = Depends(get_tracking_svc),
    settings: Settings = Depends(get_app_settings),
):
    """Upload a drone video file (.mp4, .avi, etc.) and run sequential ByteTrack tracking."""
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in settings.ALLOWED_VIDEO_FORMATS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported video format '{suffix}'. Allowed: {settings.ALLOWED_VIDEO_FORMATS}",
        )

    # Save to temp mission storage
    temp_dir = settings.MISSIONS_DIR / mission_id / "uploads"
    temp_dir.mkdir(parents=True, exist_ok=True)
    temp_file = temp_dir / file.filename

    try:
        with open(temp_file, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Enforce file size limit
        file_size = temp_file.stat().st_size
        if file_size > settings.MAX_VIDEO_UPLOAD_SIZE_BYTES:
            temp_file.unlink(missing_ok=True)
            raise HTTPException(
                status_code=400,
                detail=f"Video file exceeds maximum limit of {settings.MAX_VIDEO_UPLOAD_SIZE_BYTES / (1024*1024):.0f}MB",
            )

        # Process through ByteTrack pipeline
        result = tracking_svc.process_video_file(
            video_path=temp_file,
            mission_id=mission_id,
            stream_id=stream_id,
            model_name=model_name,
            max_frames=max_frames,
            save_annotated=save_annotated,
        )
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Video tracking failed: {str(e)}")
    finally:
        file.file.close()
