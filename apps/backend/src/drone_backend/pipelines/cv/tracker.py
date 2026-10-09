import threading
from datetime import datetime
from pathlib import Path
from types import SimpleNamespace
from typing import Any, Dict, List, Optional, Set, Union

import cv2
import numpy as np
import torch
import yaml
from ultralytics.engine.results import Boxes

from drone_backend.config.settings import get_settings
from drone_backend.pipelines.cv.detector import get_human_class_ids, get_model

try:
    from ultralytics.trackers.byte_tracker import BYTETracker
except ImportError:
    BYTETracker = None


class VisualTracker:
    """Production-grade ByteTrack multi-object human tracker with persistent IDs.

    Maintains isolated Kalman filters and tracklet associations per video stream/session.
    """

    def __init__(
        self,
        model_name: str = "V2",
        tracker_config: Optional[Union[str, Path, dict]] = None,
        human_classes: Optional[List[str]] = None,
        conf_threshold: Optional[float] = None,
        imgsz: int = 640,
        model: Optional[Any] = None,
        stream_id: str = "default",
        mission_id: str = "default",
        frame_rate: int = 30,
    ):
        self.settings = get_settings()
        self.model_name = model_name
        self.stream_id = stream_id
        self.mission_id = mission_id
        self.frame_rate = frame_rate
        self.imgsz = imgsz
        self.conf_threshold = conf_threshold or self.settings.DETECTION_CONF_THRESHOLD
        self.human_classes = human_classes or self.settings.HUMAN_CLASS_NAMES

        # Model instance (dependency injection or cached)
        self.model = model if model is not None else get_model(self.model_name)

        # Load ByteTrack arguments
        self.tracker_args = self._load_tracker_config(tracker_config)

        # Dedicated tracker instance per stream
        if BYTETracker is not None:
            setattr(self.tracker_args, "frame_rate", self.frame_rate)
            try:
                self.byte_tracker = BYTETracker(args=self.tracker_args)
            except TypeError:
                self.byte_tracker = BYTETracker(args=self.tracker_args, frame_rate=self.frame_rate)
        else:
            self.byte_tracker = None

        # Tracking state
        self._lock = threading.RLock()
        self.frame_index: int = 0
        self.last_timestamp: Optional[str] = None
        self.unique_track_ids: Set[int] = set()
        self.active_tracks: Dict[int, Dict[str, Any]] = {}
        self.total_observations: int = 0
        self.is_closed: bool = False

    @property
    def unique_tracks_seen(self) -> int:
        with self._lock:
            return len(self.unique_track_ids)

    def _load_tracker_config(self, config: Optional[Union[str, Path, dict]]) -> SimpleNamespace:
        defaults = {
            "tracker_type": "bytetrack",
            "track_high_thresh": 0.25,
            "track_low_thresh": 0.1,
            "new_track_thresh": 0.25,
            "track_buffer": 30,
            "match_thresh": 0.8,
            "fuse_score": True,
        }

        cfg_dict = dict(defaults)
        if isinstance(config, dict):
            cfg_dict.update(config)
        else:
            config_path = Path(config) if config else self.settings.TRACKER_CONFIG_PATH
            if config_path and config_path.exists():
                try:
                    with open(config_path, "r", encoding="utf-8") as f:
                        loaded = yaml.safe_load(f)
                        if isinstance(loaded, dict):
                            cfg_dict.update(loaded)
                except Exception:
                    pass

        return SimpleNamespace(**cfg_dict)

    def update(
        self,
        frame: np.ndarray,
        frame_timestamp: Optional[datetime] = None,
        frame_index: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Process a single sequential frame through detector and ByteTrack.

        Args:
            frame: Decoded BGR numpy array
            frame_timestamp: Optional frame capture timestamp
            frame_index: Optional caller-specified frame index
        """
        if self.is_closed:
            raise RuntimeError(f"VisualTracker session '{self.stream_id}' is closed.")

        if frame is None or not isinstance(frame, np.ndarray) or frame.size == 0 or frame.ndim != 3:
            raise ValueError("Invalid frame: must be a non-empty 3-channel numpy array.")

        h, w = frame.shape[:2]
        ts_iso = (frame_timestamp or datetime.now()).isoformat()

        with self._lock:
            if frame_index is not None:
                self.frame_index = frame_index
            else:
                self.frame_index += 1

            current_idx = self.frame_index
            self.last_timestamp = ts_iso

            # Resolve model
            model = self.model or get_model(self.model_name)
            if model is None or self.byte_tracker is None:
                return {
                    "frame_index": current_idx,
                    "timestamp": ts_iso,
                    "human_count": 0,
                    "active_track_count": 0,
                    "unique_tracks_seen": len(self.unique_track_ids),
                    "total_observations": self.total_observations,
                    "detections": [],
                    "untracked_detections": [],
                }

            # Run detection
            matched_class_ids = get_human_class_ids(model, self.human_classes)
            predict_kwargs: Dict[str, Any] = {
                "conf": self.conf_threshold,
                "imgsz": self.imgsz,
                "verbose": False,
            }
            if matched_class_ids:
                predict_kwargs["classes"] = matched_class_ids

            results = model(frame, **predict_kwargs)

            # Extract detections for humans
            raw_boxes = []
            for r in results:
                if r.boxes is None or len(r.boxes) == 0:
                    continue
                for b in r.boxes:
                    cls_id = int(b.cls[0])
                    name = model.names.get(cls_id, "person")
                    if name.lower() in [h_name.lower() for h_name in self.human_classes]:
                        coords = b.xyxy[0].tolist()
                        conf = float(b.conf[0])
                        raw_boxes.append([coords[0], coords[1], coords[2], coords[3], conf, cls_id])

            # Prepare boxes for ByteTrack
            if len(raw_boxes) > 0:
                boxes_tensor = torch.tensor(raw_boxes, dtype=torch.float32)
                det_boxes = Boxes(boxes_tensor, orig_shape=(h, w))
                det_numpy = det_boxes.cpu().numpy()
            else:
                det_boxes = Boxes(torch.zeros((0, 6), dtype=torch.float32), orig_shape=(h, w))
                det_numpy = det_boxes.cpu().numpy()

            # Update ByteTrack state
            track_results = self.byte_tracker.update(det_numpy, frame)

            tracked_detections: List[Dict[str, Any]] = []
            currently_tracked_ids: Set[int] = set()

            if track_results is not None and len(track_results) > 0:
                for row in track_results:
                    x1, y1, x2, y2 = float(row[0]), float(row[1]), float(row[2]), float(row[3])
                    tid = int(row[4])
                    conf = float(row[5])
                    cls_id = int(row[6]) if len(row) > 6 else (matched_class_ids[0] if matched_class_ids else 0)
                    class_name = model.names.get(cls_id, "person") if hasattr(model, "names") else "person"

                    # Clamp coordinates to original image space
                    x1_clamped = max(0.0, min(x1, float(w)))
                    y1_clamped = max(0.0, min(y1, float(h)))
                    x2_clamped = max(0.0, min(x2, float(w)))
                    y2_clamped = max(0.0, min(y2, float(h)))

                    det_item = {
                        "track_id": tid,
                        "cls": cls_id,
                        "class_name": class_name,
                        "name": class_name,
                        "conf": round(conf, 4),
                        "box": [
                            round(x1_clamped, 2),
                            round(y1_clamped, 2),
                            round(x2_clamped, 2),
                            round(y2_clamped, 2),
                        ],
                        "bbox": {
                            "x1": round(x1_clamped, 2),
                            "y1": round(y1_clamped, 2),
                            "x2": round(x2_clamped, 2),
                            "y2": round(y2_clamped, 2),
                        },
                        "frame_index": current_idx,
                        "timestamp": ts_iso,
                    }
                    tracked_detections.append(det_item)
                    currently_tracked_ids.add(tid)
                    self.unique_track_ids.add(tid)
                    self.active_tracks[tid] = det_item

            self.total_observations += len(tracked_detections)

            # Untracked candidate detections (raw detections not associated yet)
            untracked_detections: List[Dict[str, Any]] = []
            # Calculate any raw boxes that did not match active tracks
            for rb in raw_boxes:
                rx1, ry1, rx2, ry2, rconf, rcls = rb
                # Check overlap with any tracked detection
                has_match = False
                for td in tracked_detections:
                    tx1, ty1, tx2, ty2 = td["box"]
                    # Calculate simple IoU
                    ix1 = max(rx1, tx1)
                    iy1 = max(ry1, ty1)
                    ix2 = min(rx2, tx2)
                    iy2 = min(ry2, ty2)
                    if ix2 > ix1 and iy2 > iy1:
                        inter = (ix2 - ix1) * (iy2 - iy1)
                        area1 = (rx2 - rx1) * (ry2 - ry1)
                        area2 = (tx2 - tx1) * (ty2 - ty1)
                        union = area1 + area2 - inter
                        if union > 0 and (inter / union) > 0.4:
                            has_match = True
                            break
                if not has_match:
                    untracked_detections.append({
                        "track_id": None,
                        "cls": int(rcls),
                        "class_name": model.names.get(int(rcls), "person"),
                        "name": model.names.get(int(rcls), "person"),
                        "conf": round(float(rconf), 4),
                        "box": [round(rx1, 2), round(ry1, 2), round(rx2, 2), round(ry2, 2)],
                        "bbox": {
                            "x1": round(rx1, 2),
                            "y1": round(ry1, 2),
                            "x2": round(rx2, 2),
                            "y2": round(ry2, 2),
                        },
                        "frame_index": current_idx,
                        "timestamp": ts_iso,
                    })

            # For backward compatibility in API responses, all detections are provided in "detections"
            # with track_id filled when tracked.
            all_detections = tracked_detections + untracked_detections

            return {
                "frame_index": current_idx,
                "timestamp": ts_iso,
                "human_count": len(all_detections),
                "active_track_count": len(tracked_detections),
                "unique_tracks_seen": len(self.unique_track_ids),
                "total_observations": self.total_observations,
                "detections": all_detections,
                "tracked_detections": tracked_detections,
                "untracked_detections": untracked_detections,
            }

    def reset(self) -> None:
        """Explicitly reset tracking state for a new stream or replay."""
        with self._lock:
            if self.byte_tracker is not None:
                self.byte_tracker.reset()
            self.frame_index = 0
            self.last_timestamp = None
            self.unique_track_ids.clear()
            self.active_tracks.clear()
            self.total_observations = 0

    def close(self) -> None:
        """Close tracker session and release resources."""
        with self._lock:
            self.reset()
            self.is_closed = True

    def get_status(self) -> Dict[str, Any]:
        """Return diagnostic health and status metrics for this tracker instance."""
        with self._lock:
            return {
                "mission_id": self.mission_id,
                "stream_id": self.stream_id,
                "model_name": self.model_name,
                "frame_index": self.frame_index,
                "active_track_count": len(self.active_tracks),
                "unique_tracks_seen": len(self.unique_track_ids),
                "total_observations": self.total_observations,
                "last_timestamp": self.last_timestamp,
                "is_closed": self.is_closed,
            }
