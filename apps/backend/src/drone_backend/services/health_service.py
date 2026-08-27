from drone_backend.config.settings import get_settings
from drone_backend.infrastructure.serial.manager import get_serial_manager
from drone_backend.infrastructure.llm.ollama import check_ollama_alive
from drone_backend.schemas.common import HealthResponse

class HealthService:
    def __init__(self):
        self.settings = get_settings()
        self.serial_mgr = get_serial_manager()

    def get_health(self) -> HealthResponse:
        return HealthResponse(
            status="healthy",
            version=self.settings.VERSION,
            active_port=self.serial_mgr.active_port,
            port_connected=self.serial_mgr.connected,
            rag_ready=check_ollama_alive(self.settings.OLLAMA_BASE_URL)
        )
