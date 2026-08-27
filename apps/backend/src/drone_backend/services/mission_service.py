import os
from typing import List, Dict, Any
from drone_backend.config.settings import get_settings

class MissionService:
    def __init__(self):
        self.settings = get_settings()

    def list_missions_with_detections(self) -> List[Dict[str, Any]]:
        det_dir = self.settings.MISSIONS_DIR
        if not det_dir.exists():
            return []
        missions = []
        for d in os.listdir(det_dir):
            mission_path = det_dir / d
            if mission_path.is_dir():
                files = [f for f in os.listdir(mission_path) if f.endswith(('.jpg', '.jpeg', '.png'))]
                if len(files) > 0:
                    missions.append({"id": d, "count": len(files)})
        return missions

    def list_mission_images(self, mission_id: str) -> List[Dict[str, str]]:
        path = self.settings.MISSIONS_DIR / mission_id
        if not path.exists():
            return []
        files = [f for f in os.listdir(path) if f.endswith(('.jpg', '.jpeg', '.png'))]
        files.sort(key=lambda x: os.path.getmtime(path / x), reverse=True)
        return [{"filename": f, "url": f"/missions/{mission_id}/{f}"} for f in files]
