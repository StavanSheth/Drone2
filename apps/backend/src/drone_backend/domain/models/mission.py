from pydantic import BaseModel
from typing import Optional
from ..enums.mission_status import MissionStatus

class Mission(BaseModel):
    id: str
    name: str
    status: MissionStatus = MissionStatus.ACTIVE
    image_count: int = 0
