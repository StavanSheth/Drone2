from pathlib import Path
from typing import Optional, Dict

_models: Dict[str, Any] = {}

def load_yolo_model(model_path: Path):
    try:
        from ultralytics import YOLO
        if model_path.exists():
            return YOLO(str(model_path))
    except Exception as e:
        print(f"[YOLO] Could not load {model_path}: {e}")
    return None
