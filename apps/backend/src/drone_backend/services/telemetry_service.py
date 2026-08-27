from drone_backend.infrastructure.serial.manager import get_serial_manager
from drone_backend.pipelines.cv.detector import calculate_battery_percentage
from drone_backend.schemas.telemetry import BatteryStatusResponse

class TelemetryService:
    def __init__(self):
        self.serial_mgr = get_serial_manager()

    def get_gps(self):
        return self.serial_mgr.gps_data

    def get_serial_logs(self):
        return self.serial_mgr.raw_serial_logs

    def calculate_battery(self, voltage: float) -> BatteryStatusResponse:
        pct = calculate_battery_percentage(voltage)
        return BatteryStatusResponse(
            voltage=voltage,
            percentage=pct,
            status="Critical" if pct < 20 else "Healthy"
        )
