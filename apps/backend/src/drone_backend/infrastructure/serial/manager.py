import serial
import threading
from datetime import datetime
from typing import List, Dict, Any, Optional
from drone_backend.config.settings import get_settings

class SerialManager:
    def __init__(self):
        self.settings = get_settings()
        self.gps_data = {
            "lat": 0.0,
            "lng": 0.0,
            "hdop": 99.99,
            "moves_left": 10,
            "last_update": datetime.now().isoformat()
        }
        self.raw_serial_logs: List[str] = []
        self.active_port: str = self.settings.DEFAULT_SERIAL_PORT
        self.baud_rate: int = self.settings.DEFAULT_BAUD_RATE
        self.connected: bool = False
        
        self._stop_event = threading.Event()
        self._thread: Optional[threading.Thread] = None
        self._lock = threading.Lock()

    def start(self, port: Optional[str] = None):
        with self._lock:
            target_port = port or self.active_port
            self.stop()
            self._stop_event = threading.Event()
            self.active_port = target_port
            self._thread = threading.Thread(
                target=self._reader_loop,
                args=(target_port, self._stop_event),
                daemon=True
            )
            self._thread.start()

    def stop(self):
        self._stop_event.set()
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=2)
        self.connected = False

    def _reader_loop(self, port: str, stop_event: threading.Event):
        try:
            ser = serial.Serial(port, self.baud_rate, timeout=1)
            self.connected = True
            print(f"[SERIAL] Connected to {port} @ {self.baud_rate} baud")
            while not stop_event.is_set():
                if ser.in_waiting:
                    line = ser.readline().decode('utf-8', errors='ignore').strip()
                    if not line:
                        continue
                    timestamp = datetime.now().strftime("%H:%M:%S")
                    self.raw_serial_logs.append(f"[{timestamp}] {line}")
                    if len(self.raw_serial_logs) > 100:
                        self.raw_serial_logs.pop(0)

                    try:
                        if "Latitude :" in line:
                            self.gps_data["lat"] = float(line.split("Latitude :")[1].strip())
                        elif "Longitude:" in line:
                            self.gps_data["lng"] = float(line.split("Longitude:")[1].strip())
                        elif "Moves Left:" in line:
                            self.gps_data["moves_left"] = int(line.split("Moves Left:")[1].strip())
                        elif "HDOP:" in line:
                            self.gps_data["hdop"] = float(line.split("HDOP:")[1].strip())
                        elif "Lat:" in line:
                            self.gps_data["lat"] = float(line.split("Lat:")[1].split()[0])
                        elif "Lng:" in line:
                            self.gps_data["lng"] = float(line.split("Lng:")[1].split()[0])
                        self.gps_data["last_update"] = datetime.now().isoformat()
                    except (ValueError, IndexError):
                        continue
            ser.close()
            print(f"[SERIAL] Disconnected from {port}")
        except Exception as e:
            print(f"[SERIAL] Error on {port}: {e}")
        finally:
            self.connected = False

_serial_mgr = None

def get_serial_manager() -> SerialManager:
    global _serial_mgr
    if _serial_mgr is None:
        _serial_mgr = SerialManager()
    return _serial_mgr
