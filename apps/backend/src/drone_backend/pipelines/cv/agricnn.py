from typing import Dict, Any, Optional
import os
import cv2
import numpy as np
from datetime import datetime
from drone_backend.config.settings import get_settings
from drone_backend.pipelines.cv.detector import extract_telemetry, calculate_battery_percentage

# Setup paths based on Disaster_Drone settings
settings = get_settings()
MODELS_DIR = settings.MODEL_PROD_DIR

# ──────────────────────────────────────────────────────────────────────────────
# Stage 1 — YOLOv8 Leaf Detector  (leaf_detection_YoloV8.pt)
# ──────────────────────────────────────────────────────────────────────────────
try:
    from ultralytics import YOLO
    YOLO_MODEL_PATH = os.path.join(MODELS_DIR, "leaf_detection_YoloV8.pt")
    leaf_detector = YOLO(YOLO_MODEL_PATH)
    print(f"[AgriCNN] YOLOv8 leaf detector loaded: {YOLO_MODEL_PATH}")
except Exception as e:
    leaf_detector = None
    print(f"[AgriCNN] WARNING: YOLOv8 leaf detector not available: {e}")

# ──────────────────────────────────────────────────────────────────────────────
# Stage 2 — CNN Plant Disease Classifier  (CNN_plant_diseases_detection.h5)
# ──────────────────────────────────────────────────────────────────────────────
try:
    import tensorflow as tf
    CNN_MODEL_PATH = os.path.join(MODELS_DIR, "CNN_plant_diseases_detection.h5")
    disease_classifier = tf.keras.models.load_model(CNN_MODEL_PATH, compile=False)
    print(f"[AgriCNN] CNN disease classifier loaded: {CNN_MODEL_PATH}")
except Exception as e:
    disease_classifier = None
    print(f"[AgriCNN] WARNING: CNN disease classifier not available: {e}")

PLANT_CLASSES = [
    "Apple___Apple_scab", "Apple___Black_rot", "Apple___Cedar_apple_rust", "Apple___healthy",
    "Blueberry___healthy", "Cherry_(including_sour)___Powdery_mildew", "Cherry_(including_sour)___healthy",
    "Corn_(maize)___Cercospora_leaf_spot_Gray_leaf_spot", "Corn_(maize)___Common_rust_",
    "Corn_(maize)___Northern_Leaf_Blight", "Corn_(maize)___healthy", "Grape___Black_rot",
    "Grape___Esca_(Black_Measles)", "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)", "Grape___healthy",
    "Orange___Haunglongbing_(Citrus_greening)", "Peach___Bacterial_spot", "Peach___healthy",
    "Pepper,_bell___Bacterial_spot", "Pepper,_bell___healthy", "Potato___Early_blight",
    "Potato___Late_blight", "Potato___healthy", "Raspberry___healthy", "Soybean___healthy",
    "Squash___Powdery_mildew", "Strawberry___Leaf_scorch", "Strawberry___healthy",
    "Tomato___Bacterial_spot", "Tomato___Early_blight", "Tomato___Late_blight",
    "Tomato___Leaf_Mold", "Tomato___Septoria_leaf_spot", "Tomato___Spider_mites_Two-spotted_spider_mite",
    "Tomato___Target_Spot", "Tomato___Tomato_Yellow_Leaf_Curl_Virus", "Tomato___Tomato_mosaic_virus",
    "Tomato___healthy",
]

def _parse_class(label: str):
    parts = label.split("___", 1)
    crop = parts[0].replace("_", " ").replace(",", "").strip()
    disease = parts[1].replace("_", " ").strip() if len(parts) > 1 else "Unknown"
    crop = crop.replace("(including sour)", "").strip()
    return crop, disease

PESTICIDE_MAP = {
    "healthy": ("None", 0.0),
    "bacterial_spot": ("Copper-based bactericide", 0.3),
    "early_blight": ("Chlorothalonil fungicide", 0.5),
    "late_blight": ("Chlorothalonil fungicide", 0.5),
    "powdery_mildew": ("Sulfur-based fungicide", 0.4),
    "black_rot": ("Mancozeb fungicide", 0.5),
    "leaf_blight": ("Mancozeb fungicide", 0.5),
    "esca": ("Systemic fungicide", 0.5),
    "mosaic_virus": ("Systemic insecticide", 0.5),
    "yellow_leaf_curl": ("Imidacloprid insecticide", 0.5),
    "haunglongbing": ("Imidacloprid insecticide", 0.5),
    "cercospora": ("Propiconazole fungicide", 0.4),
    "gray_leaf_spot": ("Propiconazole fungicide", 0.4),
    "common_rust": ("Triazole fungicide", 0.4),
    "spider_mites": ("Abamectin miticide", 0.3),
    "leaf_scorch": ("Copper oxychloride", 0.4),
    "leaf_mold": ("Chlorothalonil fungicide", 0.4),
    "septoria_leaf_spot": ("Mancozeb fungicide", 0.4),
    "target_spot": ("Azoxystrobin fungicide", 0.4),
    "apple_scab": ("Captan fungicide", 0.4),
    "cedar_apple_rust": ("Myclobutanil fungicide", 0.4),
}

def _get_pesticide(disease_name: str):
    dl = disease_name.lower().replace(" ", "_")
    for keyword, (pesticide, litres) in PESTICIDE_MAP.items():
        if keyword in dl:
            return pesticide, litres
    return "General broad-spectrum pesticide", 0.4

def detect_crops(image_bytes: bytes, mission_id: str = "default") -> Dict[str, Any]:
    nparr = np.frombuffer(image_bytes, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if frame is None:
        return {
            "error": "Invalid image",
            "total_detected": 0,
            "human_count": 0,
            "detections": [],
            "saved_images": [],
            "voltage": None,
            "percentage": 0.0,
        }

    telemetry_data = extract_telemetry(frame)
    voltage = telemetry_data.get("voltage")
    percentage = calculate_battery_percentage(voltage)
    gps_lat = telemetry_data.get("lat")
    gps_lon = telemetry_data.get("lon")

    leaf_detections = []
    best_crop_region = None

    if leaf_detector is not None:
        try:
            results = leaf_detector.predict(source=frame, conf=0.40, imgsz=640, verbose=False)
            if results and len(results) > 0:
                boxes = results[0].boxes
                if boxes is not None and len(boxes) > 0:
                    best_conf = 0.0
                    for box in boxes:
                        x1, y1, x2, y2 = [int(v) for v in box.xyxy[0].tolist()]
                        conf = float(box.conf[0])
                        leaf_detections.append({
                            "cls": 0, # Custom class index for leaf
                            "name": "leaf",
                            "conf": round(conf, 2),
                            "box": [float(x1), float(y1), float(x2), float(y2)]
                        })
                        if conf > best_conf:
                            best_conf = conf
                            pad = 10
                            lx1 = max(0, x1 - pad)
                            ly1 = max(0, y1 - pad)
                            lx2 = min(frame.shape[1], x2 + pad)
                            ly2 = min(frame.shape[0], y2 + pad)
                            best_crop_region = frame[ly1:ly2, lx1:lx2]
        except Exception as e:
            print(f"[AgriCNN] YOLOv8 inference error: {e}")

    if best_crop_region is None:
        best_crop_region = frame

    crop_type = "Unknown"
    disease_type = "Unknown"
    confidence = 0.0

    if disease_classifier is not None:
        try:
            img_resized = cv2.resize(best_crop_region, (150, 150))
            img_rgb = cv2.cvtColor(img_resized, cv2.COLOR_BGR2RGB)
            img_array = np.expand_dims(img_rgb.astype(np.float32) / 255.0, axis=0)
            predictions = disease_classifier.predict(img_array, verbose=0)
            class_idx = int(np.argmax(predictions[0]))
            confidence = round(float(predictions[0][class_idx]) * 100, 1)
            if class_idx < len(PLANT_CLASSES):
                crop_type, disease_type = _parse_class(PLANT_CLASSES[class_idx])
            else:
                crop_type, disease_type = "Plant", "Unknown"
        except Exception as e:
            print(f"[AgriCNN] CNN classification error: {e}")

    pesticide, spray_amount = _get_pesticide(disease_type)
    saved_images = []
    is_diseased = "healthy" not in disease_type.lower() and disease_type != "Unknown"

    if is_diseased and len(leaf_detections) > 0:
        mission_dir = settings.MISSIONS_DIR / mission_id
        mission_dir.mkdir(parents=True, exist_ok=True)
        filename = f"disease_detected_{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}.jpg"
        filepath = mission_dir / filename

        save_frame = frame.copy()
        for d in leaf_detections:
            box = d["box"]
            cv2.rectangle(save_frame, (int(box[0]), int(box[1])), (int(box[2]), int(box[3])), (0, 200, 80), 2)
            cv2.putText(save_frame, f"{crop_type} | {disease_type} | {confidence}%", (int(box[0]), max(0, int(box[1]) - 8)), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 200, 80), 1)
        cv2.imwrite(str(filepath), save_frame)
        saved_images.append(filename)

    return {
        "total_detected": len(leaf_detections),
        "detections": leaf_detections,
        "saved_images": saved_images,
        "voltage": voltage,
        "percentage": percentage,
        "lat": gps_lat,
        "lon": gps_lon,
        # AgriCNN extra fields
        "crop_type": crop_type,
        "disease_type": disease_type,
        "confidence": confidence,
        "pesticide": pesticide,
        "spray_amount": spray_amount,
        "is_diseased": is_diseased,
        "leaf_count": len(leaf_detections),
    }
