import os
from pathlib import Path
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "Trinetra Drone Backend & Tactical Intelligence API"
    VERSION: str = "0.1.0"
    API_V1_PREFIX: str = "/api/v1"
    
    # Base paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent
    BACKEND_ROOT: Path = BASE_DIR.parent.parent
    PROJECT_ROOT: Path = BACKEND_ROOT.parent.parent
    
    # Models
    MODEL_PROD_DIR: Path = PROJECT_ROOT / "ml" / "models" / "production"
    MODEL_DEV_DIR: Path = PROJECT_ROOT / "ml" / "models" / "development"
    DEFAULT_MODEL_PATH: Path = MODEL_PROD_DIR / "V2.pt"
    
    # Storage
    DATA_DIR: Path = PROJECT_ROOT / "data"
    STORAGE_DIR: Path = DATA_DIR / "storage"
    DOCUMENTS_DIR: Path = STORAGE_DIR / "documents"
    CHROMA_DIR: Path = STORAGE_DIR / "chroma_db"
    MISSIONS_DIR: Path = DATA_DIR / "missions"
    CHAT_HISTORY_FILE: Path = STORAGE_DIR / "chat_history.json"
    
    # Hardware & Serial
    DEFAULT_SERIAL_PORT: str = os.getenv("SERIAL_PORT", "COM3")
    DEFAULT_BAUD_RATE: int = 115200
    
    # LLM & RAG
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3.2:1b")
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    
    # Host & Port
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Tracking & ByteTrack
    TRACKING_ENABLED: bool = True
    TRACKER_TYPE: str = "bytetrack"
    TRACKER_CONFIG_PATH: Path = PROJECT_ROOT / "ml" / "configs" / "bytetrack.yaml"
    TRACKING_MODEL_NAME: str = "V2"
    HUMAN_CLASS_NAMES: list[str] = ["person", "human", "pedestrian", "pedestrians", "people", "target"]
    DETECTION_CONF_THRESHOLD: float = 0.25
    DETECTION_IMGSZ: int = 640
    MAX_ACTIVE_TRACKING_SESSIONS: int = 20
    TRACKING_SESSION_IDLE_TIMEOUT_SECONDS: int = 300
    MAX_PENDING_FRAMES_PER_STREAM: int = 30
    MAX_VIDEO_UPLOAD_SIZE_BYTES: int = 100 * 1024 * 1024  # 100 MB
    ALLOWED_VIDEO_FORMATS: list[str] = [".mp4", ".avi", ".mov", ".mkv"]
    ENABLE_ANNOTATED_VIDEO_OUTPUT: bool = True
    MAX_TRACK_HISTORY_PER_SESSION: int = 500

_settings = None

def get_settings() -> Settings:
    global _settings
    if _settings is None:
        _settings = Settings()
        _settings.DOCUMENTS_DIR.mkdir(parents=True, exist_ok=True)
        _settings.CHROMA_DIR.mkdir(parents=True, exist_ok=True)
        _settings.MISSIONS_DIR.mkdir(parents=True, exist_ok=True)
    return _settings
