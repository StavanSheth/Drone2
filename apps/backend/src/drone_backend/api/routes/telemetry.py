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
    return {"logs": det_svc.get_osd_logs()}

@router.post("/telemetry/battery", response_model=BatteryStatusResponse)
async def get_battery_status(req: TelemetryRequest, svc: TelemetryService = Depends(get_telemetry_svc)):
    return svc.calculate_battery(req.voltage)
