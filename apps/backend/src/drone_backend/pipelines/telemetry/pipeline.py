from drone_backend.infrastructure.serial.manager import get_serial_manager

class TelemetryPipeline:
    def __init__(self):
        self.mgr = get_serial_manager()
        
    def get_snapshot(self):
        return self.mgr.gps_data

_telem_pipe = None

def get_telemetry_pipeline() -> TelemetryPipeline:
    global _telem_pipe
    if _telem_pipe is None:
        _telem_pipe = TelemetryPipeline()
    return _telem_pipe
