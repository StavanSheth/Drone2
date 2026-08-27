from drone_backend.infrastructure.serial.manager import get_serial_manager

def get_live_gps():
    return get_serial_manager().gps_data
