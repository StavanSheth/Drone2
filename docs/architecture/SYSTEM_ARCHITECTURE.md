# System Architecture

The Trinetra Drone platform is structured into three primary tiers:
1. **Hardware & Edge**: ESP-NOW GPS telemetry receiver, Video transmission link.
2. **Backend Services (`apps/backend`)**: FastAPI, YOLOv8 Object Detection, LangChain RAG copilot.
3. **Frontend Dashboard (`apps/frontend`)**: Next.js 14 App Router, Tailwind CSS, Leaflet/Mapbox tactical map.
