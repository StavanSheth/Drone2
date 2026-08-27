from pydantic import BaseModel
from typing import Optional, List

class CreateMissionRequest(BaseModel):
    name: str
    description: Optional[str] = None

class MissionResponse(BaseModel):
    id: str
    name: str
    status: str
    created_at: str
