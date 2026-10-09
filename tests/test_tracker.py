import numpy as np
import pytest
import torch
from unittest.mock import MagicMock
from ultralytics.engine.results import Boxes, Results

from drone_backend.pipelines.cv.tracker import VisualTracker


class DummyModel:
    def __init__(self, names=None, boxes_per_call=None):
        self.names = names or {0: "person", 1: "vehicle"}
        self.boxes_per_call = boxes_per_call or []
        self.call_count = 0

    def __call__(self, frame, **kwargs):
        res = MagicMock(spec=Results)
        h, w = frame.shape[:2]
        if self.call_count < len(self.boxes_per_call):
            raw = self.boxes_per_call[self.call_count]
        else:
            raw = torch.zeros((0, 6), dtype=torch.float32)
        self.call_count += 1

        if len(raw) > 0:
            res.boxes = Boxes(raw, orig_shape=(h, w))
        else:
            res.boxes = Boxes(torch.zeros((0, 6), dtype=torch.float32), orig_shape=(h, w))
        return [res]


def test_tracker_initialization():
    tracker = VisualTracker(stream_id="test_stream", mission_id="test_mission")
    assert tracker.stream_id == "test_stream"
    assert tracker.mission_id == "test_mission"
    assert tracker.frame_index == 0
    assert len(tracker.unique_track_ids) == 0
    assert not tracker.is_closed


def test_tracker_invalid_frame():
    tracker = VisualTracker(stream_id="test_stream")
    with pytest.raises(ValueError):
        tracker.update(None)  # None frame

    with pytest.raises(ValueError):
        tracker.update(np.zeros((0,), dtype=np.uint8))  # 1D empty

    with pytest.raises(ValueError):
        tracker.update(np.zeros((10, 10), dtype=np.uint8))  # 2D grayscale (requires 3-channel)


def test_tracker_empty_frame_no_detections():
    model = DummyModel()
    tracker = VisualTracker(model=model)
    frame = np.zeros((480, 640, 3), dtype=np.uint8)
    res = tracker.update(frame)

    assert res["frame_index"] == 1
    assert res["human_count"] == 0
    assert res["active_track_count"] == 0
    assert res["unique_tracks_seen"] == 0
    assert len(res["detections"]) == 0


def test_tracker_consecutive_persistent_tracking():
    # Frame 1: One person at [100, 100, 200, 200]
    # Frame 2: Same person shifted slightly to [104, 102, 204, 202]
    # Frame 3: Same person at [108, 104, 208, 204]
    f1_boxes = torch.tensor([[100.0, 100.0, 200.0, 200.0, 0.90, 0.0]], dtype=torch.float32)
    f2_boxes = torch.tensor([[104.0, 102.0, 204.0, 202.0, 0.91, 0.0]], dtype=torch.float32)
    f3_boxes = torch.tensor([[108.0, 104.0, 208.0, 204.0, 0.89, 0.0]], dtype=torch.float32)

    model = DummyModel(boxes_per_call=[f1_boxes, f2_boxes, f3_boxes])
    tracker = VisualTracker(model=model)
    frame = np.zeros((480, 640, 3), dtype=np.uint8)

    # In ByteTrack:
    # Frame 1 initiates tracklet
    r1 = tracker.update(frame)
    # Frame 2 confirms tracklet
    r2 = tracker.update(frame)
    assert r2["active_track_count"] >= 1
    tid2 = r2["tracked_detections"][0]["track_id"]
    assert isinstance(tid2, int)

    # Frame 3 preserves the exact same ID
    r3 = tracker.update(frame)
    assert r3["active_track_count"] >= 1
    tid3 = r3["tracked_detections"][0]["track_id"]
    assert tid3 == tid2  # ID persistence across consecutive frames!
    assert tracker.unique_tracks_seen == 1


def test_tracker_multi_person_distinction():
    # Two distinct targets moving in parallel
    p1_f1 = [100.0, 100.0, 180.0, 200.0, 0.92, 0.0]
    p2_f1 = [400.0, 200.0, 480.0, 350.0, 0.88, 0.0]

    p1_f2 = [105.0, 102.0, 185.0, 202.0, 0.91, 0.0]
    p2_f2 = [405.0, 202.0, 485.0, 352.0, 0.87, 0.0]

    f1 = torch.tensor([p1_f1, p2_f1], dtype=torch.float32)
    f2 = torch.tensor([p1_f2, p2_f2], dtype=torch.float32)

    model = DummyModel(boxes_per_call=[f1, f2])
    tracker = VisualTracker(model=model)
    frame = np.zeros((480, 640, 3), dtype=np.uint8)

    tracker.update(frame)
    r2 = tracker.update(frame)

    assert r2["active_track_count"] == 2
    track_ids = {d["track_id"] for d in r2["tracked_detections"]}
    assert len(track_ids) == 2  # Two distinct IDs assigned!


def test_tracker_reset_and_close():
    f1_boxes = torch.tensor([[100.0, 100.0, 200.0, 200.0, 0.90, 0.0]], dtype=torch.float32)
    f2_boxes = torch.tensor([[104.0, 102.0, 204.0, 202.0, 0.91, 0.0]], dtype=torch.float32)
    model = DummyModel(boxes_per_call=[f1_boxes, f2_boxes])
    tracker = VisualTracker(model=model)
    frame = np.zeros((480, 640, 3), dtype=np.uint8)

    tracker.update(frame)
    tracker.update(frame)
    assert tracker.unique_tracks_seen >= 1

    # Reset
    tracker.reset()
    status = tracker.get_status()
    assert status["frame_index"] == 0
    assert status["active_track_count"] == 0
    assert status["unique_tracks_seen"] == 0

    # Close
    tracker.close()
    assert tracker.is_closed
    with pytest.raises(RuntimeError):
        tracker.update(frame)
