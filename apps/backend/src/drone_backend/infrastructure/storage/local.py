import json
from pathlib import Path
from typing import Dict, Any
from drone_backend.config.settings import get_settings

class LocalStorageManager:
    def __init__(self):
        self.settings = get_settings()
        
    def load_chat_history(self) -> Dict[str, Any]:
        path = self.settings.CHAT_HISTORY_FILE
        if path.exists():
            try:
                with open(path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass
        return {}

    def save_chat_history(self, history: Dict[str, Any]):
        path = self.settings.CHAT_HISTORY_FILE
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(history, f, indent=4)
