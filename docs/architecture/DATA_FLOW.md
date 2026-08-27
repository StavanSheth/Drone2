# Data Flow
```mermaid
flowchart TD
    Drone[ESP-NOW Drone GPS] -->|Serial/USB| Backend[FastAPI Serial Thread]
    Camera[Live Feed] -->|Base64 API| CV[YOLOv8 & OCR Pipeline]
    Backend -->|JSON REST / WS| UI[Next.js Dashboard]
    UI -->|Chat Query| RAG[LangChain + Ollama Copilot]
```
