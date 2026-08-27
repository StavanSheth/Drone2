# Trinetra Drone Backend

High-performance FastAPI service providing:
- Real-time ESP-NOW GPS telemetry processing.
- Computer Vision inference pipelines (YOLOv8 + OSD OCR extraction).
- Offline RAG Knowledge Retrieval Copilot (Ollama + ChromaDB).

## Running
```bash
uv run uvicorn drone_backend.main:app --reload --host 0.0.0.0 --port 8000
```
