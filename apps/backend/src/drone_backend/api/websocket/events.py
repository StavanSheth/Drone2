from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class TrackingFrameEvent(BaseModel):
    type: str = "tracking.frame"
    mission_id: str
    stream_id: str
    frame_index: Optional[int] = None
    timestamp: Optional[str] = None
    human_count: int = 0
    active_track_count: int = 0
    unique_tracks_seen: int = 0
    detections: List[Dict[str, Any]] = []
    telemetry: Optional[Dict[str, Any]] = None
