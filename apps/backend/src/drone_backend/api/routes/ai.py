from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from typing import List
import uuid
import shutil
from datetime import datetime
from drone_backend.schemas.ai import ChatRequest, ChatResponse, SessionSummary, SessionDetail
from drone_backend.pipelines.rag.pipeline import get_rag_pipeline, RAGPipeline
from drone_backend.infrastructure.storage.local import LocalStorageManager
from drone_backend.config.settings import get_settings, Settings
from drone_backend.api.dependencies import get_storage_mgr, get_app_settings

router = APIRouter(tags=["AI & RAG"])

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(
    request: ChatRequest,
    storage: LocalStorageManager = Depends(get_storage_mgr)
):
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    
    session_id = request.session_id or str(uuid.uuid4())
    history_db = storage.load_chat_history()
    
    if session_id not in history_db:
        history_db[session_id] = {
            "id": session_id,
            "created_at": datetime.now().isoformat(),
            "messages": []
        }
    
    session = history_db[session_id]
    rag = get_rag_pipeline()
    
    try:
        result = rag.query(request.message, history=session["messages"])
        session["messages"].append({
            "role": "user",
            "content": request.message,
            "timestamp": datetime.now().isoformat()
        })
        session["messages"].append({
            "role": "assistant",
            "content": result["answer"],
            "timestamp": datetime.now().isoformat()
        })
        storage.save_chat_history(history_db)
        
        return ChatResponse(
            answer=result["answer"],
            sources=result["sources"],
            session_id=session_id
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/chat/sessions", response_model=List[SessionSummary])
async def get_sessions(storage: LocalStorageManager = Depends(get_storage_mgr)):
    db = storage.load_chat_history()
    sessions = []
    for sid, session_data in db.items():
        title = "New Chat"
        if session_data.get("messages"):
            first_user_msg = next((msg["content"] for msg in session_data["messages"] if msg["role"] == "user"), "New Chat")
            title = first_user_msg[:30] + "..." if len(first_user_msg) > 30 else first_user_msg
            
        sessions.append(SessionSummary(
            id=sid,
            title=title,
            created_at=session_data.get("created_at")
        ))
    return sorted(sessions, key=lambda x: x.created_at or "", reverse=True)

@router.get("/chat/sessions/{session_id}")
async def get_session(session_id: str, storage: LocalStorageManager = Depends(get_storage_mgr)):
    db = storage.load_chat_history()
    if session_id not in db:
        raise HTTPException(status_code=404, detail="Session not found")
    return db[session_id]

@router.post("/upload-document")
async def upload_document(
    file: UploadFile = File(...),
    settings: Settings = Depends(get_app_settings)
):
    if not file.filename.lower().endswith(('.pdf', '.txt', '.csv')):
        raise HTTPException(status_code=400, detail="Only PDF, TXT, CSV allowed")
    
    file_path = settings.DOCUMENTS_DIR / file.filename
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    
    if settings.CHROMA_DIR.exists():
        shutil.rmtree(settings.CHROMA_DIR)
        settings.CHROMA_DIR.mkdir(parents=True, exist_ok=True)

    rag = get_rag_pipeline()
    rag.reload()
    
    return {"message": f"Uploaded {file.filename} and updated knowledge base"}
