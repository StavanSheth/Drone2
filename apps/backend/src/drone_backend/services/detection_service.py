import base64
from typing import Dict, Any, List
from drone_backend.pipelines.cv.detector import detect_humans, extract_osd_text
from drone_backend.pipelines.cv.preprocessing import decode_image_bytes

_osd_text_logs: List[str] = []

class DetectionService:
    def __init__(self):
        pass

    def analyze_frame(self, image_base64: str, mission_id: str = "default", model_name: str = "V2") -> Dict[str, Any]:
        global _osd_text_logs
        from datetime import datetime
        
        if image_base64 == "simulated_frame":
            # Return empty detections when no real camera feed
            return {
                "status": "success",
                "total_detected": 0,
                "human_count": 0,
                "detections": [],
                "saved_images": [],
                "telemetry": {
                    "voltage": None,
                    "percentage": None,
                    "lat": None,
                    "lon": None
                },
                "osd_text": [],
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
