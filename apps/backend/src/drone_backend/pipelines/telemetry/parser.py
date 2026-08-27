import re
from typing import Dict, Any

def parse_serial_line(line: str) -> Dict[str, Any]:
    data = {}
    if "Latitude :" in line:
        data["lat"] = float(line.split("Latitude :")[1].strip())
    elif "Longitude:" in line:
        data["lng"] = float(line.split("Longitude:")[1].strip())
    elif "Moves Left:" in line:
        data["moves_left"] = int(line.split("Moves Left:")[1].strip())
    elif "HDOP:" in line:
        data["hdop"] = float(line.split("HDOP:")[1].strip())
    return data
