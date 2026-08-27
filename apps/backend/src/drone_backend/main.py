import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware

from .config.settings import get_settings
from .config.logging import setup_logging
from .infrastructure.serial.manager import get_serial_manager
from .pipelines.rag.pipeline import get_rag_pipeline
from .api.routes import health, telemetry, settings as settings_routes, detections, ai
from .api.websocket import telemetry as telemetry_ws
from .middleware.request_id import RequestIDMiddleware

@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    settings = get_settings()
    # Start serial background thread
    mgr = get_serial_manager()
    mgr.start(settings.DEFAULT_SERIAL_PORT)
    
    # Initialize RAG pipeline asynchronously/non-blocking
    try:
        rag = get_rag_pipeline()
        rag.initialize()
    except Exception as e:
        print(f"[STARTUP] RAG warm-up deferred: {e}")
        
    yield
    # Shutdown
    mgr.stop()

settings = get_settings()
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan
)

@app.get("/")
async def root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "docs_url": "/docs"
    }

# Middlewares
app.add_middleware(RequestIDMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount missions for direct file serving (images, reports)
os.makedirs(settings.MISSIONS_DIR, exist_ok=True)
app.mount("/missions", StaticFiles(directory=str(settings.MISSIONS_DIR)), name="missions")

# Include Routers (direct and prefixed for compatibility)
app.include_router(health.router)
app.include_router(telemetry.router)
app.include_router(settings_routes.router)
app.include_router(detections.router)
app.include_router(ai.router)
app.include_router(telemetry_ws.router)

# --- Report Save/List Endpoints ---
from pydantic import BaseModel
from typing import List
from datetime import datetime

class SaveReportRequest(BaseModel):
    mission_folder: str
    filename: str
    encrypted_content: str

class SavedReportItem(BaseModel):
    mission_folder: str
    filename: str
    url: str
    size_bytes: int
    created: str

@app.post("/save-report")
async def save_report(req: SaveReportRequest):
    report_path = settings.MISSIONS_DIR / req.mission_folder
    report_path.mkdir(parents=True, exist_ok=True)
    file_path = report_path / req.filename
    file_path.write_text(req.encrypted_content, encoding="utf-8")
    return {"status": "saved", "path": str(file_path), "filename": req.filename}

@app.get("/list-reports", response_model=List[SavedReportItem])
async def list_reports():
    reports = []
    if settings.MISSIONS_DIR.exists():
        for mission_folder in settings.MISSIONS_DIR.iterdir():
            if mission_folder.is_dir():
                for f in mission_folder.iterdir():
                    if f.is_file() and f.suffix == ".aes":
                        stat = f.stat()
                        reports.append(SavedReportItem(
                            mission_folder=mission_folder.name,
                            filename=f.name,
                            url=f"/missions/{mission_folder.name}/{f.name}",
                            size_bytes=stat.st_size,
                            created=datetime.fromtimestamp(stat.st_mtime).isoformat()
                        ))
    # Sort by created time descending
    reports.sort(key=lambda x: x.created, reverse=True)
    return reports

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("drone_backend.main:app", host=settings.HOST, port=settings.PORT, reload=True)

