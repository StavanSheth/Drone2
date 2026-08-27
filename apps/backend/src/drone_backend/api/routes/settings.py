from fastapi import APIRouter, HTTPException, Depends
from typing import List
import serial.tools.list_ports
from drone_backend.schemas.common import PortInfo, SetPortRequest
from drone_backend.infrastructure.serial.manager import get_serial_manager, SerialManager

router = APIRouter(tags=["Settings"])

@router.get("/list-ports", response_model=List[PortInfo])
async def list_ports():
    mgr = get_serial_manager()
    ports = serial.tools.list_ports.comports()
    return [
        PortInfo(
            port=p.device,
            description=p.description,
            hwid=p.hwid,
            active=(p.device == mgr.active_port)
        )
        for p in sorted(ports, key=lambda x: x.device)
    ]

@router.post("/set-port")
async def set_port(request: SetPortRequest):
    if not request.port:
        raise HTTPException(status_code=400, detail="Port name is required")
    mgr = get_serial_manager()
    mgr.start(request.port)
    return {
        "status": "connecting",
        "port": request.port,
        "message": f"Serial reader switching to {request.port}"
    }

@router.get("/port-status")
async def port_status():
    mgr = get_serial_manager()
    return {
        "active_port": mgr.active_port,
        "connected": mgr.connected
    }
