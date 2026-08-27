from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TelemetrySnapshot(BaseModel):
    lat: float = 0.0
    lng: float = 0.0
    hdop: float = 99.99
    moves_left: int = 10
    voltage: Optional[float] = None
    battery_percentage: Optional[float] = None
    last_update: str = datetime.now().isoformat()
