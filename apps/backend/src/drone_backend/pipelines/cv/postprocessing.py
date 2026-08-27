import cv2
import numpy as np
from typing import List, Dict, Any

def draw_tactical_overlays(frame: np.ndarray, boxes: List[Dict[str, Any]]) -> np.ndarray:
    annotated = frame.copy()
    for b in boxes:
        coords = b.get("box", [0, 0, 0, 0])
        x1, y1, x2, y2 = map(int, coords)
        conf = b.get("conf", 0.0)
        label = f"{b.get('name', 'Object')} {conf:.2f}"
        cv2.rectangle(annotated, (x1, y1), (x2, y2), (0, 0, 255), 2)
        cv2.putText(annotated, label, (x1, max(y1 - 5, 15)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
    return annotated
