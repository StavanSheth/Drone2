from datetime import datetime

def get_iso_now() -> str:
    return datetime.now().isoformat()

def get_timestamp_str() -> str:
    return datetime.now().strftime("%H:%M:%S")
