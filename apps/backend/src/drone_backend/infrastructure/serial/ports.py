import serial.tools.list_ports
from typing import List, Dict, Any

def list_available_ports() -> List[Dict[str, Any]]:
    ports = serial.tools.list_ports.comports()
    return [
        {
            "port": p.device,
            "description": p.description,
            "hwid": p.hwid
        }
        for p in sorted(ports, key=lambda x: x.device)
    ]
