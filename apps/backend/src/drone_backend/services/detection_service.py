import base64
from typing import Dict, Any, List, Optional
from drone_backend.pipelines.cv.detector import detect_humans, extract_osd_text
from drone_backend.pipelines.cv.preprocessing import decode_image_bytes
from drone_backend.services.tracking_service import get_tracking_service

_osd_text_logs: List[str] = []

class DetectionService:
    def __init__(self):
        pass

    def analyze_frame(
        self,
        image_base64: str,
        mission_id: str = "default",
        model_name: str = "V2",
        track: bool = False,
        stream_id: Optional[str] = None,
        frame_index: Optional[int] = None,
    ) -> Dict[str, Any]:
        global _osd_text_logs
        from datetime import datetime

        # If tracking is requested and model is not AgriCNN, delegate to TrackingService
        if track and model_name != "AgriCNN":
            tracking_svc = get_tracking_service()
            tracking_res = tracking_svc.process_base64_frame(
                image_base64=image_base64,
                mission_id=mission_id,
                stream_id=stream_id or "default",
                model_name=model_name,
                frame_index=frame_index,
            )
            # Update OSD logs if present
            if tracking_res.get("osd_text"):
                ts = datetime.now().strftime("%H:%M:%S")
                for line in tracking_res["osd_text"]:
                    _osd_text_logs.append(f"[{ts}] {line}")
                while len(_osd_text_logs) > 200:
                    _osd_text_logs.pop(0)
            return tracking_res
        
        if image_base64 == "simulated_frame":
            from drone_backend.pipelines.cv.detector import _last_voltage, _last_lat, _last_lon, _last_osd_lines, calculate_battery_percentage
            pct = calculate_battery_percentage(_last_voltage)
            osd = list(_last_osd_lines) if _last_osd_lines else [f"[OSD] BATT: {_last_voltage:.1f}V ({pct}%)", f"[OSD] GPS: LAT {_last_lat:.6f} | LON {_last_lon:.6f}"]
            return {
                "status": "success",
                "total_detected": 0,
                "human_count": 0,
                "detections": [],
                "saved_images": [],
                "telemetry": {
                    "voltage": _last_voltage,
                    "percentage": pct,
                    "lat": _last_lat,
                    "lon": _last_lon
                },
                "osd_text": osd,
                "timestamp": datetime.now().isoformat()
            }

        header, encoded = image_base64.split(",", 1) if "," in image_base64 else (None, image_base64)
        try:
            image_bytes = base64.b64decode(encoded)
        except Exception:
            image_bytes = b""

        detection_result = detect_humans(image_bytes, mission_id=mission_id, model_name=model_name)
        
        # Extract OSD text from the frame
        frame = decode_image_bytes(image_bytes)
        osd_lines = extract_osd_text(frame) if frame is not None else []
        
        if osd_lines:
            ts = datetime.now().strftime("%H:%M:%S")
            for line in osd_lines:
                _osd_text_logs.append(f"[{ts}] {line}")
            while len(_osd_text_logs) > 200:
                _osd_text_logs.pop(0)

        # Flatten response: detections array at top level
        response = {
            "status": "success",
            "total_detected": detection_result.get("total_detected", 0),
            "human_count": detection_result.get("total_detected", 0),
            "detections": detection_result.get("detections", []),
            "saved_images": detection_result.get("saved_images", []),
            "telemetry": {
                "voltage": detection_result.get("voltage"),
                "percentage": detection_result.get("percentage"),
                "lat": detection_result.get("lat"),
                "lon": detection_result.get("lon")
            },
            "osd_text": osd_lines,
            "timestamp": datetime.now().isoformat()
        }

        # Add optional AgriCNN fields if present
        for field in ["crop_type", "disease_type", "confidence", "pesticide", "spray_amount", "is_diseased", "leaf_count"]:
            if field in detection_result:
                response[field] = detection_result[field]

        return response

    def get_osd_logs(self) -> List[str]:
        global _osd_text_logs
        return _osd_text_logs
