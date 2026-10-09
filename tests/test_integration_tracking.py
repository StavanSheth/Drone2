from pathlib import Path
import cv2
import numpy as np
import pytest
import torch
from unittest.mock import MagicMock
from ultralytics.engine.results import Boxes, Results

from drone_backend.pipelines.cv.tracker import VisualTracker
from drone_backend.services.tracking_service import TrackingService


def test_video_tracking_pipeline(tmp_path: Path):
    # Create a small 10-frame synthetic test video
    video_file = tmp_path / "test_drone_feed.mp4"
    width, height = 320, 240
    fps = 10
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    out = cv2.VideoWriter(str(video_file), fourcc, fps, (width, height))

    for i in range(10):
        frame = np.zeros((height, width, 3), dtype=np.uint8)
        # Draw a simulated human shape moving horizontally across the frame
        center_x = 50 + i * 15
        center_y = 100
        # Head
        cv2.circle(frame, (center_x, center_y), 10, (255, 255, 255), -1)
        # Torso
        cv2.rectangle(frame, (center_x - 8, center_y + 10), (center_x + 8, center_y + 40), (255, 255, 255), -1)
        out.write(frame)
    out.release()

    svc = TrackingService()
    res = svc.process_video_file(
        video_path=video_file,
        mission_id="integ_mission",
        stream_id="integ_video",
        model_name="V2",
        save_annotated=False,
    )

    assert res["status"] == "completed"
    assert res["processed_frames"] == 10
    assert res["effective_fps"] >= 0.0
