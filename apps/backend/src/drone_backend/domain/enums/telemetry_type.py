from enum import Enum

class TelemetryType(str, Enum):
    GPS = "gps"
    BATTERY = "battery"
    IMU = "imu"
    OSD = "osd"
