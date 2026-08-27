from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    answer: str
    sources: List[str]
    session_id: str

class ChatMessage(BaseModel):
    role: str
    content: str
    timestamp: str

class SessionSummary(BaseModel):
    id: str
    title: str
    created_at: Optional[str] = None

class SessionDetail(BaseModel):
    id: str
    created_at: str
    messages: List[ChatMessage]
