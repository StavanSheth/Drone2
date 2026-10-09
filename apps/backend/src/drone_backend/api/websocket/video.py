import json
import logging
from typing import Any, Dict
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from drone_backend.services.tracking_service import get_tracking_service

logger = logging.getLogger("drone_backend.websocket.video")
router = APIRouter()


@router.websocket("/ws/tracking/{mission_id}/{stream_id}")
async def websocket_tracking_stream(
    websocket: WebSocket,
    mission_id: str,
    stream_id: str,
):
    """Real-time bi-directional WebSocket stream for ByteTrack video frame tracking."""
    await websocket.accept()
    tracking_svc = get_tracking_service()
    session = tracking_svc.get_or_create_session(mission_id=mission_id, stream_id=stream_id)

    try:
        while True:
            data = await websocket.receive_text()
            try:
                payload: Dict[str, Any] = json.loads(data)
            except Exception:
                await websocket.send_json({"type": "error", "message": "Invalid JSON frame payload"})
                continue

            image_base64 = payload.get("image_base64")
            if not image_base64:
                await websocket.send_json({"type": "error", "message": "Missing image_base64 in frame"})
                continue

            model_name = payload.get("model_name", "V2")
            frame_index = payload.get("frame_index")

            res = tracking_svc.process_base64_frame(
                image_base64=image_base64,
                mission_id=mission_id,
                stream_id=stream_id,
                model_name=model_name,
                frame_index=frame_index,
            )

            # Send real-time tracking event
            event = {
                "type": "tracking.frame",
                "mission_id": mission_id,
                "stream_id": stream_id,
                "frame_index": res.get("frame_index"),
                "timestamp": res.get("timestamp"),
                "human_count": res.get("human_count", 0),
                "active_track_count": res.get("active_track_count", 0),
                "unique_tracks_seen": res.get("unique_tracks_seen", 0),
                "detections": res.get("detections", []),
                "telemetry": res.get("telemetry", {}),
            }
            await websocket.send_json(event)
    except WebSocketDisconnect:
        logger.info(f"WebSocket client disconnected for stream '{stream_id}' in mission '{mission_id}'")
    except Exception as e:
        logger.error(f"WebSocket tracking error: {e}")
