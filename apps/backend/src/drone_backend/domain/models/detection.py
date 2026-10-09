from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class DetectionBox(BaseModel):
    cls: int
    name: str
    conf: float
    box: List[float]
    track_id: Optional[int] = None

class DetectionResult(BaseModel):
    total_detected: int = 0
    detections: List[DetectionBox] = []
    saved_images: List[str] = []
    voltage: Optional[float] = None
    percentage: Optional[float] = None
