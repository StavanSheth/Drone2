from pydantic import BaseModel
from typing import Optional

class Location(BaseModel):
    lat: float = 0.0
    lng: float = 0.0
    alt: Optional[float] = 0.0
    hdop: Optional[float] = 99.99
