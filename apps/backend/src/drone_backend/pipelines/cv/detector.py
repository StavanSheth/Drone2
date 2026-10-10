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

_ocr_engine = None
_last_voltage = 20.9
_last_lat = 0.0
_last_lon = 0.0
_last_alt = 0.4
_last_speed = 0.0
_last_osd_lines: List[str] = []

def get_ocr_engine():
    global _ocr_engine
    if _ocr_engine is None:
        try:
            from rapidocr_onnxruntime import RapidOCR
            _ocr_engine = RapidOCR()
        except Exception:
            _ocr_engine = None
    return _ocr_engine

_cached_models: Dict[str, Any] = {}

def get_model(model_name: str = "V2"):
    global _cached_models
    if YOLO is None:
        return None
    settings = get_settings()
    
    # Normalize model name to match actual .pt filenames on disk
    model_file_map = {
        "V2": "V2",
        "v2": "V2",
        "YOLOv8m": "yolov8m",
        "yolov8m": "yolov8m",
        "version3": "version3",
        "V3": "version3",
        "v3": "version3",
    }
    file_stem = model_file_map.get(model_name, model_name)
    
    if model_name not in _cached_models or _cached_models[model_name] is None:
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
    return round(percentage, 1)

def extract_telemetry(frame: np.ndarray) -> Dict[str, Any]:
    global _last_voltage, _last_lat, _last_lon, _last_alt, _last_speed, _last_osd_lines
    data = {
        "voltage": _last_voltage,
        "percentage": calculate_battery_percentage(_last_voltage),
        "lat": _last_lat,
        "lon": _last_lon,
        "alt": _last_alt,
        "speed": _last_speed,
    }

    ocr = get_ocr_engine()
    if ocr is None:
        return data

    try:
        h, w = frame.shape[:2]
        detected_lines: List[str] = []

        # 1. Bottom-Right ROI: Battery Voltage and GPS
        right_roi = frame[int(h * 0.55):h, int(w * 0.55):w]
        res_right, _ = ocr(right_roi)

        parsed_voltage: Optional[float] = None
        parsed_lat: Optional[float] = None
        parsed_lon: Optional[float] = None

        if res_right:
            sorted_items = sorted(res_right, key=lambda x: min(pt[1] for pt in x[0]))
            for box, text, score in sorted_items:
                ascii_text = ''.join(c for c in text if ord(c) < 128).strip()
                clean = ascii_text.replace('o', '0').replace('O', '0').strip()
                if not clean:
                    continue

                # Check for voltage e.g. "20.9", "20.9 Volt", "20.9V"
                v_match = re.search(r'(\d{1,2}\.\d{1,2})', clean)
                if v_match and parsed_voltage is None:
                    v_val = float(v_match.group(1))
                    if 10.0 <= v_val <= 30.0:
                        parsed_voltage = v_val
                        continue

                # Check for GPS coordinates (e.g. 0.0000000, 17.558500, 78.395900)
                coord_str = re.sub(r'^[Il1|](0\.\d+)', r'\1', clean)
                coord_match = re.search(r'(-?\d{1,3}\.\d{4,8})', coord_str)
                if coord_match:
                    coord_val = float(coord_match.group(1))
                    if parsed_lat is None:
                        parsed_lat = coord_val
                    elif parsed_lon is None:
                        parsed_lon = coord_val

        if parsed_voltage is not None:
            _last_voltage = parsed_voltage
            data["voltage"] = parsed_voltage
            data["percentage"] = calculate_battery_percentage(parsed_voltage)
            detected_lines.append(f"[OSD] BATT: {parsed_voltage:.1f}V ({data['percentage']}%)")

        if parsed_lat is not None:
            _last_lat = parsed_lat
            data["lat"] = parsed_lat
        if parsed_lon is not None:
            _last_lon = parsed_lon
            data["lon"] = parsed_lon

        if parsed_lat is not None and parsed_lon is not None:
            detected_lines.append(f"[OSD] GPS: LAT {parsed_lat:.6f} | LON {parsed_lon:.6f}")
        elif parsed_lat is not None:
            detected_lines.append(f"[OSD] LAT: {parsed_lat:.6f}")

        # 2. Left Middle-to-Bottom ROI: Speed and Altitude
        left_roi = frame[int(h * 0.55):int(h * 0.95), 0:int(w * 0.30)]
        res_left, _ = ocr(left_roi)

        parsed_alt: Optional[float] = None
        parsed_speed: Optional[float] = None

        if res_left:
            sorted_left = sorted(res_left, key=lambda x: min(pt[1] for pt in x[0]))
            for box, text, score in sorted_left:
                ascii_text = ''.join(c for c in text if ord(c) < 128).strip()
                clean = ascii_text.replace('o', '0').replace('O', '0').strip()
                if not clean or ':' in clean:
                    continue

                spd_match = re.search(r'(\d{1,3}(?:\.\d{1,2})?)\s*(?:km/?h|kph|m/?s)?', clean, re.IGNORECASE)
                alt_match = re.search(r'(\d{1,3}(?:\.\d{1,2})?)\s*(?:m|M)?', clean)

                if 'km' in clean.lower() or 'kph' in clean.lower():
                    if spd_match:
                        parsed_speed = float(spd_match.group(1))
                    elif '-' in clean:
                        parsed_speed = 0.0

                if alt_match and parsed_alt is None:
                    val = float(alt_match.group(1))
                    if 0.0 <= val <= 1000.0:
                        parsed_alt = val

            if parsed_speed is None:
                parsed_speed = 0.0

        if parsed_alt is not None:
            _last_alt = parsed_alt
            data["alt"] = parsed_alt
            detected_lines.append(f"[OSD] ALT: {parsed_alt:.1f}m")

        if parsed_speed is not None:
            _last_speed = parsed_speed
            data["speed"] = parsed_speed
            detected_lines.append(f"[OSD] SPD: {parsed_speed:.1f} km/h")

        if detected_lines:
            _last_osd_lines = detected_lines

    except Exception:
        pass

    return data

def extract_osd_text(frame: np.ndarray) -> List[str]:
    global _last_osd_lines
    if not _last_osd_lines:
        extract_telemetry(frame)
    return list(_last_osd_lines)

def get_human_class_ids(model: Any, class_names: Optional[List[str]] = None) -> List[int]:
    if model is None or not hasattr(model, "names"):
        return []
    settings = get_settings()
    target_names = [n.lower() for n in (class_names or settings.HUMAN_CLASS_NAMES)]
    matched_ids = []
    for cls_id, name in model.names.items():
        if name.lower() in target_names:
            matched_ids.append(int(cls_id))
    return matched_ids

def detect_humans_in_frame(
    frame: np.ndarray,
    mission_id: str = "default",
    model_name: str = "V2",
    conf: float = 0.35,
    save_crops: bool = True
) -> Dict[str, Any]:
    settings = get_settings()
    current_model = get_model(model_name) or get_model("V2")
    if current_model is None:
        return {"total_detected": 0, "detections": [], "saved_images": []}

    results = current_model(frame, conf=conf, verbose=False)
    human_detections = []
    saved_images = []
    mission_dir = settings.MISSIONS_DIR / mission_id if save_crops else None
    if mission_dir:
        mission_dir.mkdir(parents=True, exist_ok=True)

    human_class_names = [n.lower() for n in settings.HUMAN_CLASS_NAMES]

    for r in results:
        boxes = r.boxes
        if boxes is None or len(boxes) == 0:
            continue
        for box in boxes:
            cls = int(box.cls[0])
            name = current_model.names.get(cls, "unknown")
            if name.lower() in human_class_names:
                coords = box.xyxy[0].tolist()
                b_conf = float(box.conf[0])
                human_detections.append({
                    "cls": cls,
                    "name": name,
                    "conf": b_conf,
                    "box": coords
                })
                if save_crops and mission_dir:
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
        "raw_results": results
    }

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
    det_res = detect_humans_in_frame(
        frame=frame,
        mission_id=mission_id,
        model_name=model_name,
        conf=settings.DETECTION_CONF_THRESHOLD,
        save_crops=True
    )

    return {
        "total_detected": det_res["total_detected"],
        "detections": det_res["detections"],
        "saved_images": det_res["saved_images"],
        "voltage": telemetry_data["voltage"],
        "percentage": calculate_battery_percentage(telemetry_data["voltage"])
    }

