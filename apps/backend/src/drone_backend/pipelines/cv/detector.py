import os
import re
import cv2
import numpy as np
from datetime import datetime
from typing import Dict, Any, List, Optional
from drone_backend.config.settings import get_settings

try:
    from ultralytics import YOLO
except ImportError:
    YOLO = None

try:
    import pytesseract
except ImportError:
    pytesseract = None

_cached_models: Dict[str, Any] = {}
_last_voltage = 25.2

def get_model(model_name: str = "V2"):
    global _cached_models
    if YOLO is None:
        return None
    settings = get_settings()
    
    # Normalize model name to match actual .pt filenames on disk
    model_file_map = {
        "V2": "V2",
        "YOLOv8m": "yolov8m",
        "yolov8m": "yolov8m",
        "version3": "version3",
    }
    file_stem = model_file_map.get(model_name, model_name)
    
    if model_name not in _cached_models:
        # Check production then development
        prod_path = settings.MODEL_PROD_DIR / f"{file_stem}.pt"
        dev_path = settings.MODEL_DEV_DIR / f"{file_stem}.pt"
        target_path = prod_path if prod_path.exists() else dev_path
        if target_path.exists():
            _cached_models[model_name] = YOLO(str(target_path))
        else:
            _cached_models[model_name] = None
    return _cached_models.get(model_name)

def calculate_battery_percentage(voltage: Optional[float]) -> float:
    if voltage is None:
        return 0.0
    if voltage >= 25.2:
        return 100.0
    if voltage <= 18.0:
        return 0.0
    percentage = (voltage - 18.0) / 7.2 * 100.0
    return round(percentage, 2)

def extract_telemetry(frame: np.ndarray) -> Dict[str, Any]:
    global _last_voltage
    data = {"voltage": _last_voltage, "lat": None, "lon": None}
    if pytesseract is None:
        if _last_voltage > 18.2:
            _last_voltage -= 0.005
        data["voltage"] = round(_last_voltage, 2)
        return data

    try:
        h, w = frame.shape[:2]
        v_roi = frame[0:int(h*0.15), 0:int(w*0.30)]
        gps_roi = frame[int(h*0.75):h, 0:w]

        def get_text(img, config):
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            gray = cv2.resize(gray, None, fx=3, fy=3, interpolation=cv2.INTER_CUBIC)
            thresh = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
            return pytesseract.image_to_string(thresh, config=config)

        v_config = r'--oem 3 --psm 7 -c tessedit_char_whitelist=0123456789.V'
        v_text = get_text(v_roi, v_config)
        v_match = re.search(r'(\d{1,2}\.\d{1,2})', v_text)
        if v_match:
            v_val = float(v_match.group(1))
            if 10.0 <= v_val <= 26.0:
                _last_voltage = v_val
                data["voltage"] = v_val

        gps_config = r'--oem 3 --psm 11'
        gps_text = get_text(gps_roi, gps_config)
        lat_match = re.search(r'Lat\s*[:]?\s*(-?\d{1,3}\.\d+)', gps_text, re.I)
        lon_match = re.search(r'L[on|ng]\s*[:]?\s*(-?\d{1,3}\.\d+)', gps_text, re.I)
        if lat_match:
            data["lat"] = float(lat_match.group(1))
        if lon_match:
            data["lon"] = float(lon_match.group(1))
    except Exception:
        pass
    return data

def extract_osd_text(frame: np.ndarray) -> List[str]:
    if pytesseract is None:
        return []
    try:
        h, w = frame.shape[:2]
        osd_bottom = frame[int(h * 0.70):h, 0:w]
        gray = cv2.cvtColor(osd_bottom, cv2.COLOR_BGR2GRAY)
        gray = cv2.resize(gray, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
        thresh = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
        raw_text = pytesseract.image_to_string(thresh, config=r'--oem 3 --psm 6')
        lines = [line.strip() for line in raw_text.splitlines() if line.strip() and len(line.strip()) > 2]
        return lines
    except Exception:
        return []

def detect_humans(image_bytes: bytes, mission_id: str = "default", model_name: str = "V2") -> Dict[str, Any]:
    settings = get_settings()
    
    if model_name == "AgriCNN":
        from .agricnn import detect_crops
        return detect_crops(image_bytes, mission_id=mission_id)

    nparr = np.frombuffer(image_bytes, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if frame is None:
        return {"error": "Invalid image"}

    telemetry_data = extract_telemetry(frame)
    current_model = get_model(model_name) or get_model("V2")
    
    if current_model is None:
        return {
            "total_detected": 0,
            "detections": [],
            "saved_images": [],
            "voltage": telemetry_data["voltage"],
            "percentage": calculate_battery_percentage(telemetry_data["voltage"])
        }

    results = current_model(frame, conf=0.4)
    human_detections = []
    saved_images = []
    
    mission_dir = settings.MISSIONS_DIR / mission_id
    mission_dir.mkdir(parents=True, exist_ok=True)
    
    for r in results:
        boxes = r.boxes
        for box in boxes:
            cls = int(box.cls[0])
            name = current_model.names[cls]
            if name.lower() in ["person", "human", "target"]:
                coords = box.xyxy[0].tolist()
                conf = float(box.conf[0])
                human_detections.append({
                    "cls": cls,
                    "name": name,
                    "conf": conf,
                    "box": coords
                })
                # Crop and save detected person
                x1, y1, x2, y2 = map(int, coords)
                crop = frame[max(0, y1):min(frame.shape[0], y2), max(0, x1):min(frame.shape[1], x2)]
                if crop.size > 0:
                    filename = f"detect_{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}.jpg"
                    filepath = mission_dir / filename
                    cv2.imwrite(str(filepath), crop)
                    saved_images.append(filename)

    return {
        "total_detected": len(human_detections),
        "detections": human_detections,
        "saved_images": saved_images,
        "voltage": telemetry_data["voltage"],
        "percentage": calculate_battery_percentage(telemetry_data["voltage"])
    }
