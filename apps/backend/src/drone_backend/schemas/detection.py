from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class DetectionRequest(BaseModel):
    image_base64: str
    voltage: Optional[float] = None
    mission_id: Optional[str] = "default"
    model_name: Optional[str] = "V2"

class DetectionItem(BaseModel):
    cls: int = 0
    name: str = "person"
    conf: float = 0.0
    box: List[float] = []

class DetectionResponse(BaseModel):
    status: str = "success"
    total_detected: int = 0
    human_count: int = 0
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
