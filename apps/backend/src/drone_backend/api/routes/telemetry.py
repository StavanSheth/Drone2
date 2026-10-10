from fastapi import APIRouter, Depends
from drone_backend.schemas.telemetry import TelemetryRequest, BatteryStatusResponse, GPSResponse, SerialLogsResponse, OSDLogsResponse
from drone_backend.services.telemetry_service import TelemetryService
from drone_backend.services.detection_service import DetectionService
from drone_backend.api.dependencies import get_telemetry_svc, get_detection_svc

router = APIRouter(tags=["Telemetry"])

@router.get("/gps", response_model=GPSResponse)
async def get_gps(svc: TelemetryService = Depends(get_telemetry_svc)):
    return svc.get_gps()

@router.get("/serial-logs", response_model=SerialLogsResponse)
async def get_serial_logs(svc: TelemetryService = Depends(get_telemetry_svc)):
    return {"logs": svc.get_serial_logs()}

@router.get("/feed-osd-logs", response_model=OSDLogsResponse)
async def get_osd_logs(det_svc: DetectionService = Depends(get_detection_svc)):
    from drone_backend.pipelines.cv.detector import (
        _last_voltage, _last_lat, _last_lon, _last_alt, _last_speed, calculate_battery_percentage
    )
    return {
        "logs": det_svc.get_osd_logs(),
        "voltage": _last_voltage,
        "percentage": calculate_battery_percentage(_last_voltage),
        "lat": _last_lat,
        "lon": _last_lon,
        "alt": _last_alt,
        "speed": _last_speed,
    }

@router.post("/telemetry/battery", response_model=BatteryStatusResponse)
async def get_battery_status(req: TelemetryRequest, svc: TelemetryService = Depends(get_telemetry_svc)):
    return svc.calculate_battery(req.voltage)
