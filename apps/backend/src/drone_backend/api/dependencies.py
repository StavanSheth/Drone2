from drone_backend.config.settings import get_settings, Settings
from drone_backend.infrastructure.serial.manager import get_serial_manager, SerialManager
from drone_backend.pipelines.rag.pipeline import get_rag_pipeline, RAGPipeline
from drone_backend.services.telemetry_service import TelemetryService
from drone_backend.services.mission_service import MissionService
from drone_backend.services.detection_service import DetectionService
from drone_backend.services.tracking_service import TrackingService, get_tracking_service
from drone_backend.services.health_service import HealthService
from drone_backend.infrastructure.storage.local import LocalStorageManager

def get_app_settings() -> Settings:
    return get_settings()

def get_telemetry_svc() -> TelemetryService:
    return TelemetryService()

def get_mission_svc() -> MissionService:
    return MissionService()

def get_detection_svc() -> DetectionService:
    return DetectionService()

def get_tracking_svc() -> TrackingService:
    return get_tracking_service()

def get_health_svc() -> HealthService:
    return HealthService()

def get_storage_mgr() -> LocalStorageManager:
    return LocalStorageManager()
