from pydantic import BaseModel
from typing import Optional

class Drone(BaseModel):
    id: str = "drone-01"
    name: str = "Trinetra Tactical Drone"
    connected: bool = False
    active_port: Optional[str] = None
