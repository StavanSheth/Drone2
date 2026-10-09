from pydantic import BaseModel
from typing import Optional, List

class TelemetryRequest(BaseModel):
    voltage: float

class BatteryStatusResponse(BaseModel):
    voltage: float
    percentage: float
    status: str

class GPSResponse(BaseModel):
    lat: float
    lng: float
    hdop: float
    moves_left: int
    last_update: str

class SerialLogsResponse(BaseModel):
    logs: List[str]

class OSDLogsResponse(BaseModel):
    logs: List[str]
    voltage: Optional[float] = None
    percentage: Optional[float] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
