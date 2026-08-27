from pydantic import BaseModel
from typing import Optional, List

class HealthResponse(BaseModel):
    status: str = "healthy"
    version: str
    active_port: Optional[str] = None
    port_connected: bool = False
    rag_ready: bool = False

class PortInfo(BaseModel):
    port: str
    description: str
    hwid: str
    active: bool

class SetPortRequest(BaseModel):
    port: str
