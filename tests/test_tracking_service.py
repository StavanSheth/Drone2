import base64
import cv2
import numpy as np
import pytest

from drone_backend.services.tracking_service import TrackingService


def make_dummy_image_bytes():
    img = np.zeros((200, 200, 3), dtype=np.uint8)
    _, buf = cv2.imencode(".jpg", img)
    return buf.tobytes()


def make_dummy_base64():
    return base64.b64encode(make_dummy_image_bytes()).decode("utf-8")


def test_tracking_service_session_isolation():
    svc = TrackingService()
    # Stream A and Stream B in same or different missions
    sess_a = svc.get_or_create_session(mission_id="m1", stream_id="cam_a")
    sess_b = svc.get_or_create_session(mission_id="m1", stream_id="cam_b")
    sess_c = svc.get_or_create_session(mission_id="m2", stream_id="cam_a")

    assert sess_a is not sess_b
    assert sess_a is not sess_c
    assert sess_a.tracker.stream_id == "cam_a"
    assert sess_b.tracker.stream_id == "cam_b"
    assert sess_c.tracker.mission_id == "m2"


def test_tracking_service_process_base64_frame():
    svc = TrackingService()
    b64_img = make_dummy_base64()

    res = svc.process_base64_frame(
        image_base64=b64_img,
        mission_id="test_mission",
        stream_id="test_cam",
        model_name="V2",
        frame_index=1,
    )

    assert res["status"] == "success"
    assert res["mission_id"] == "test_mission"
    assert res["stream_id"] == "test_cam"
    assert res["frame_index"] == 1
    assert "human_count" in res
    assert "active_track_count" in res
    assert "unique_tracks_seen" in res
    assert "telemetry" in res


def test_tracking_service_simulated_frame():
    svc = TrackingService()
    res = svc.process_base64_frame(
        image_base64="simulated_frame",
        mission_id="test_mission",
        stream_id="test_cam",
    )
    assert res["status"] == "success"
    assert res["human_count"] == 0
    assert res["active_track_count"] == 0


def test_tracking_service_reset_and_close():
    svc = TrackingService()
    b64_img = make_dummy_base64()

    svc.process_base64_frame(image_base64=b64_img, mission_id="m_rst", stream_id="s_rst")
    status = svc.get_session_status("m_rst", "s_rst")
    assert status is not None
    assert status["frame_index"] == 1

    # Reset session
    assert svc.reset_session("m_rst", "s_rst")
    status_after = svc.get_session_status("m_rst", "s_rst")
    assert status_after["frame_index"] == 0

    # Close session
    assert svc.close_session("m_rst", "s_rst")
    assert svc.get_session_status("m_rst", "s_rst") is None
