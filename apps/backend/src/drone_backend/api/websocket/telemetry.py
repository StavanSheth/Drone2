from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
from drone_backend.infrastructure.serial.manager import get_serial_manager

router = APIRouter()

@router.websocket("/ws/telemetry")
async def websocket_telemetry_endpoint(websocket: WebSocket):
    await websocket.accept()
    mgr = get_serial_manager()
    try:
        while True:
            await websocket.send_json({
                "gps": mgr.gps_data,
                "connected": mgr.connected,
                "active_port": mgr.active_port
            })
            await asyncio.sleep(0.5)
    except WebSocketDisconnect:
        pass
