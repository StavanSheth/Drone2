from pathlib import Path
from drone_backend.config.settings import get_settings

class MediaService:
    def __init__(self):
        self.settings = get_settings()
