from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class DetectionItem(BaseModel):
    track_id: Optional[int] = None
    cls: int = 0
    name: str = "person"
    conf: float = 0.0
    box: List[float] = []
    bbox: Optional[Dict[str, float]] = None


class DetectionRequest(BaseModel):
    image_base64: str
    voltage: Optional[float] = None
    mission_id: Optional[str] = "default"
    model_name: Optional[str] = "V2"
    track: Optional[bool] = False
    stream_id: Optional[str] = "default"
    frame_index: Optional[int] = None


class DetectionResponse(BaseModel):
    status: str = "success"
    mission_id: Optional[str] = None
    stream_id: Optional[str] = None
    frame_index: Optional[int] = None
    total_detected: int = 0
    human_count: int = 0
    active_track_count: Optional[int] = None
    unique_tracks_seen: Optional[int] = None
    total_observations: Optional[int] = None
    detections: List[DetectionItem] = []
    saved_images: List[str] = []
    telemetry: Dict[str, Any] = {}
    osd_text: List[str] = []
    timestamp: str = ""

    # AgriCNN optional fields
    crop_type: Optional[str] = None
    disease_type: Optional[str] = None
    confidence: Optional[float] = None
    pesticide: Optional[str] = None
    spray_amount: Optional[float] = None
    is_diseased: Optional[bool] = None
    leaf_count: Optional[int] = None
    saved_image: Optional[str] = None


class ImageDetectionItem(BaseModel):
    filename: str
    url: str


class MissionDetectionCount(BaseModel):
    id: str
    count: int


# --- Dedicated Tracking Schemas ---

class TrackingSessionCreateRequest(BaseModel):
    mission_id: str = "default"
    stream_id: str = "default"
    model_name: str = "V2"


class TrackingSessionResponse(BaseModel):
    status: str = "success"
    mission_id: str
    stream_id: str
    model_name: str
    frame_index: int = 0
    active_track_count: int = 0
    unique_tracks_seen: int = 0
    total_observations: int = 0
    is_closed: bool = False


class TrackingFrameRequest(BaseModel):
    image_base64: str
    mission_id: str = "default"
    stream_id: str = "default"
    model_name: str = "V2"
    frame_index: Optional[int] = None


class TrackHistoryItem(BaseModel):
    track_id: int
    mission_id: str
    stream_id: str
    class_name: str
    first_seen: str
    last_seen: str
    first_frame: int
    last_frame: int
    observations_count: int
    last_box: List[float]
    last_conf: float
    status: str


class TrackHistoryResponse(BaseModel):
    mission_id: str
    stream_id: str
    total_tracks: int
    tracks: List[TrackHistoryItem]
