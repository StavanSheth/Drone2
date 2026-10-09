import base64
import cv2
import numpy as np
import pytest
from fastapi.testclient import TestClient

from drone_backend.main import app

client = TestClient(app)


def make_dummy_base64():
    img = np.zeros((200, 200, 3), dtype=np.uint8)
    _, buf = cv2.imencode(".jpg", img)
    return base64.b64encode(buf.tobytes()).decode("utf-8")


def test_api_analyze_feed_legacy():
    # Legacy single-frame call without tracking
    payload = {
        "image_base64": make_dummy_base64(),
        "mission_id": "test_legacy",
        "model_name": "V2",
        "track": False,
    }
    resp = client.post("/analyze-feed", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert "total_detected" in data
    assert "detections" in data
    assert "telemetry" in data


def test_api_analyze_feed_with_tracking():
    # Call /analyze-feed with tracking enabled
    payload = {
        "image_base64": make_dummy_base64(),
        "mission_id": "test_track_mission",
        "model_name": "V2",
        "track": True,
        "stream_id": "test_stream_1",
        "frame_index": 1,
    }
    resp = client.post("/analyze-feed", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert data["stream_id"] == "test_stream_1"
    assert "active_track_count" in data
    assert "unique_tracks_seen" in data


def test_api_tracking_session_lifecycle():
    # Create session
    resp = client.post(
        "/tracking/sessions",
        json={"mission_id": "api_test_m", "stream_id": "api_test_s", "model_name": "V2"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert data["mission_id"] == "api_test_m"
    assert data["stream_id"] == "api_test_s"

    # Ingest frame
    frame_resp = client.post(
        "/tracking/frame",
        json={
            "image_base64": make_dummy_base64(),
            "mission_id": "api_test_m",
            "stream_id": "api_test_s",
            "model_name": "V2",
            "frame_index": 1,
        },
    )
    assert frame_resp.status_code == 200
    frame_data = frame_resp.json()
    assert frame_data["frame_index"] == 1

    # Get status
    status_resp = client.get("/tracking/sessions/api_test_m/api_test_s")
    assert status_resp.status_code == 200
    assert status_resp.json()["session"]["frame_index"] == 1

    # Get tracks
    tracks_resp = client.get("/tracking/sessions/api_test_m/api_test_s/tracks")
    assert tracks_resp.status_code == 200
    assert "tracks" in tracks_resp.json()

    # Reset
    reset_resp = client.post("/tracking/sessions/api_test_m/api_test_s/reset")
    assert reset_resp.status_code == 200

    # Delete
    del_resp = client.delete("/tracking/sessions/api_test_m/api_test_s")
    assert del_resp.status_code == 200

    # Verify 404 after deletion
    not_found_resp = client.get("/tracking/sessions/api_test_m/api_test_s")
    assert not_found_resp.status_code == 404
