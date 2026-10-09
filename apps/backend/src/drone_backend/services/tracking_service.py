import base64
import threading
import time
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple

import cv2
import numpy as np

from drone_backend.config.settings import get_settings
from drone_backend.pipelines.cv.detector import calculate_battery_percentage, extract_osd_text, extract_telemetry
from drone_backend.pipelines.cv.preprocessing import decode_image_bytes
from drone_backend.pipelines.cv.tracker import VisualTracker


class TrackRecord:
    """Historical representation of an individual tracked target."""

    def __init__(self, track_id: int, initial_det: Dict[str, Any], mission_id: str, stream_id: str):
        self.track_id = track_id
        self.mission_id = mission_id
        self.stream_id = stream_id
        self.class_name = initial_det.get("class_name", "person")
        self.first_seen = initial_det.get("timestamp", datetime.now().isoformat())
        self.last_seen = self.first_seen
        self.first_frame = initial_det.get("frame_index", 1)
        self.last_frame = self.first_frame
        self.observations_count = 1
        self.last_box = initial_det.get("box", [0, 0, 0, 0])
        self.last_conf = initial_det.get("conf", 0.0)
        self.status = "active"

    def update(self, det: Dict[str, Any]):
        self.last_seen = det.get("timestamp", datetime.now().isoformat())
        self.last_frame = det.get("frame_index", self.last_frame + 1)
        self.observations_count += 1
        self.last_box = det.get("box", self.last_box)
        self.last_conf = det.get("conf", self.last_conf)
        self.status = "active"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "track_id": self.track_id,
            "mission_id": self.mission_id,
            "stream_id": self.stream_id,
            "class_name": self.class_name,
            "first_seen": self.first_seen,
            "last_seen": self.last_seen,
            "first_frame": self.first_frame,
            "last_frame": self.last_frame,
            "observations_count": self.observations_count,
            "last_box": self.last_box,
            "last_conf": self.last_conf,
            "status": self.status,
        }


class TrackingSession:
    """Session container managing tracker instance, lifecycle, and track history."""

    def __init__(self, mission_id: str, stream_id: str, model_name: str = "V2"):
        self.mission_id = mission_id
        self.stream_id = stream_id
        self.model_name = model_name
        self.tracker = VisualTracker(
            model_name=model_name,
            mission_id=mission_id,
            stream_id=stream_id,
        )
        self.created_at = datetime.now()
        self.last_accessed_at = time.time()
        self.tracks_history: Dict[int, TrackRecord] = {}
        self.lock = threading.RLock()

    def touch(self):
        self.last_accessed_at = time.time()

    def record_tracks(self, tracked_detections: List[Dict[str, Any]]):
        with self.lock:
            for det in tracked_detections:
                tid = det.get("track_id")
                if tid is None:
                    continue
                if tid in self.tracks_history:
                    self.tracks_history[tid].update(det)
                else:
                    self.tracks_history[tid] = TrackRecord(
                        track_id=tid,
                        initial_det=det,
                        mission_id=self.mission_id,
                        stream_id=self.stream_id,
                    )

    def close(self):
        with self.lock:
            if self.tracker:
                self.tracker.close()


class TrackingService:
    """Singleton service managing concurrent multi-stream ByteTrack tracking sessions."""

    def __init__(self):
        self.settings = get_settings()
        self._sessions: Dict[Tuple[str, str], TrackingSession] = {}
        self._lock = threading.RLock()

    def _cleanup_idle_sessions(self):
        """Evict sessions that have exceeded the configured idle timeout."""
        now = time.time()
        timeout = self.settings.TRACKING_SESSION_IDLE_TIMEOUT_SECONDS
        with self._lock:
            expired_keys = [
                key for key, sess in self._sessions.items()
                if (now - sess.last_accessed_at) > timeout
            ]
            for key in expired_keys:
                sess = self._sessions.pop(key, None)
                if sess:
                    sess.close()

    def get_or_create_session(
        self,
        mission_id: str = "default",
        stream_id: str = "default",
        model_name: str = "V2",
    ) -> TrackingSession:
        self._cleanup_idle_sessions()
        session_key = (mission_id, stream_id)

        with self._lock:
            if session_key in self._sessions:
                sess = self._sessions[session_key]
                if model_name and sess.model_name != model_name:
                    sess.close()
                    sess = TrackingSession(mission_id=mission_id, stream_id=stream_id, model_name=model_name)
                    self._sessions[session_key] = sess
                sess.touch()
                return sess

            # Bounded active sessions
            if len(self._sessions) >= self.settings.MAX_ACTIVE_TRACKING_SESSIONS:
                # Evict the oldest accessed session
                oldest_key = min(self._sessions.keys(), key=lambda k: self._sessions[k].last_accessed_at)
                old_sess = self._sessions.pop(oldest_key)
                old_sess.close()

            new_sess = TrackingSession(mission_id=mission_id, stream_id=stream_id, model_name=model_name)
            self._sessions[session_key] = new_sess
            return new_sess

    def process_frame(
        self,
        image_bytes: bytes,
        mission_id: str = "default",
        stream_id: str = "default",
        model_name: str = "V2",
        frame_index: Optional[int] = None,
        timestamp: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        """Decode frame, run ByteTrack pipeline, update track history, and return enriched tracking result."""
        frame = decode_image_bytes(image_bytes)
        if frame is None:
            return {"error": "Invalid image: cannot decode bytes"}

        session = self.get_or_create_session(mission_id=mission_id, stream_id=stream_id, model_name=model_name)
        session.touch()

        # Telemetry & OSD extraction
        telemetry_data = extract_telemetry(frame)
        osd_lines = extract_osd_text(frame)

        # Run VisualTracker update
        tracking_result = session.tracker.update(
            frame=frame,
            frame_timestamp=timestamp,
            frame_index=frame_index,
        )

        # Record confirmed tracks into session history
        session.record_tracks(tracking_result["tracked_detections"])

        # Construct final unified response
        response = {
            "status": "success",
            "mission_id": mission_id,
            "stream_id": stream_id,
            "frame_index": tracking_result["frame_index"],
            "timestamp": tracking_result["timestamp"],
            "human_count": tracking_result["human_count"],
            "active_track_count": tracking_result["active_track_count"],
            "unique_tracks_seen": tracking_result["unique_tracks_seen"],
            "total_observations": tracking_result["total_observations"],
            "detections": tracking_result["detections"],
            "tracked_detections": tracking_result["tracked_detections"],
            "untracked_detections": tracking_result["untracked_detections"],
            "telemetry": {
                "voltage": telemetry_data.get("voltage"),
                "percentage": calculate_battery_percentage(telemetry_data.get("voltage")),
                "lat": telemetry_data.get("lat"),
                "lon": telemetry_data.get("lon"),
            },
            "osd_text": osd_lines,
        }
        return response

    def process_base64_frame(
        self,
        image_base64: str,
        mission_id: str = "default",
        stream_id: str = "default",
        model_name: str = "V2",
        frame_index: Optional[int] = None,
        timestamp: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        if image_base64 == "simulated_frame":
            return {
                "status": "success",
                "mission_id": mission_id,
                "stream_id": stream_id,
                "frame_index": frame_index or 1,
                "timestamp": (timestamp or datetime.now()).isoformat(),
                "human_count": 0,
                "active_track_count": 0,
                "unique_tracks_seen": 0,
                "total_observations": 0,
                "detections": [],
                "tracked_detections": [],
                "untracked_detections": [],
                "telemetry": {"voltage": None, "percentage": None, "lat": None, "lon": None},
                "osd_text": [],
            }

        header, encoded = image_base64.split(",", 1) if "," in image_base64 else (None, image_base64)
        try:
            image_bytes = base64.b64decode(encoded)
        except Exception:
            return {"error": "Invalid base64 encoding"}

        return self.process_frame(
            image_bytes=image_bytes,
            mission_id=mission_id,
            stream_id=stream_id,
            model_name=model_name,
            frame_index=frame_index,
            timestamp=timestamp,
        )

    def reset_session(self, mission_id: str, stream_id: str) -> bool:
        session_key = (mission_id, stream_id)
        with self._lock:
            if session_key in self._sessions:
                sess = self._sessions[session_key]
                sess.tracker.reset()
                sess.tracks_history.clear()
                sess.touch()
                return True
        return False

    def close_session(self, mission_id: str, stream_id: str) -> bool:
        session_key = (mission_id, stream_id)
        with self._lock:
            if session_key in self._sessions:
                sess = self._sessions.pop(session_key)
                sess.close()
                return True
        return False

    def close_mission_sessions(self, mission_id: str) -> int:
        with self._lock:
            to_remove = [k for k in self._sessions.keys() if k[0] == mission_id]
            for k in to_remove:
                sess = self._sessions.pop(k)
                sess.close()
            return len(to_remove)

    def get_session_status(self, mission_id: str, stream_id: str) -> Optional[Dict[str, Any]]:
        session_key = (mission_id, stream_id)
        with self._lock:
            if session_key in self._sessions:
                sess = self._sessions[session_key]
                status = sess.tracker.get_status()
                status["active_tracks_count"] = len(sess.tracker.active_tracks)
                status["unique_tracks_seen"] = len(sess.tracker.unique_track_ids)
                status["tracks_history_count"] = len(sess.tracks_history)
                return status
        return None

    def get_track_history(self, mission_id: str, stream_id: str) -> List[Dict[str, Any]]:
        session_key = (mission_id, stream_id)
        with self._lock:
            if session_key in self._sessions:
                sess = self._sessions[session_key]
                return [track.to_dict() for track in sess.tracks_history.values()]
        return []

    def process_video_file(
        self,
        video_path: Path,
        mission_id: str = "default",
        stream_id: str = "video_upload",
        model_name: str = "V2",
        max_frames: Optional[int] = None,
        save_annotated: bool = False,
    ) -> Dict[str, Any]:
        """Process an uploaded video file frame-by-frame with ByteTrack."""
        if not video_path.exists():
            return {"error": f"Video file not found: {video_path}"}

        cap = cv2.VideoCapture(str(video_path))
        if not cap.isOpened():
            return {"error": "Failed to open video file"}

        total_file_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

        session = self.get_or_create_session(mission_id=mission_id, stream_id=stream_id, model_name=model_name)
        session.tracker.reset()
        session.tracks_history.clear()

        out_writer = None
        annotated_path = None
        if save_annotated and width > 0 and height > 0:
            mission_dir = self.settings.MISSIONS_DIR / mission_id
            mission_dir.mkdir(parents=True, exist_ok=True)
            annotated_path = mission_dir / f"tracked_{video_path.stem}.mp4"
            fourcc = cv2.VideoWriter_fourcc(*"mp4v")
            out_writer = cv2.VideoWriter(str(annotated_path), fourcc, fps, (width, height))

        frame_idx = 0
        processed_frames = 0
        start_time = time.time()

        try:
            while True:
                ret, frame = cap.read()
                if not ret or frame is None:
                    break

                frame_idx += 1
                if max_frames and frame_idx > max_frames:
                    break

                res = session.tracker.update(frame=frame, frame_index=frame_idx)
                session.record_tracks(res["tracked_detections"])
                processed_frames += 1

                if out_writer is not None:
                    # Draw bounding boxes and track IDs
                    for det in res["tracked_detections"]:
                        x1, y1, x2, y2 = map(int, det["box"])
                        tid = det["track_id"]
                        conf = det["conf"]
                        cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                        cv2.putText(
                            frame,
                            f"ID {tid} ({int(conf * 100)}%)",
                            (x1, max(20, y1 - 10)),
                            cv2.FONT_HERSHEY_SIMPLEX,
                            0.6,
                            (0, 255, 0),
                            2,
                        )
                    out_writer.write(frame)
        finally:
            cap.release()
            if out_writer is not None:
                out_writer.release()

        elapsed = time.time() - start_time
        avg_fps = round(processed_frames / elapsed, 2) if elapsed > 0 else 0.0

        return {
            "status": "completed",
            "mission_id": mission_id,
            "stream_id": stream_id,
            "total_file_frames": total_file_frames,
            "processed_frames": processed_frames,
            "elapsed_seconds": round(elapsed, 2),
            "effective_fps": avg_fps,
            "unique_tracks_seen": len(session.tracker.unique_track_ids),
            "total_observations": session.tracker.total_observations,
            "annotated_video_path": str(annotated_path) if annotated_path else None,
            "tracks": [t.to_dict() for t in session.tracks_history.values()],
        }


# Global singleton instance
_tracking_service: Optional[TrackingService] = None


def get_tracking_service() -> TrackingService:
    global _tracking_service
    if _tracking_service is None:
        _tracking_service = TrackingService()
    return _tracking_service
