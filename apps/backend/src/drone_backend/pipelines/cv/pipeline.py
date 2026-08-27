from .detector import detect_humans, extract_osd_text, calculate_battery_percentage

class CVPipeline:
    def __init__(self):
        pass
        
    def process_frame(self, image_bytes: bytes, mission_id: str = "default", model_name: str = "V2"):
        return detect_humans(image_bytes, mission_id, model_name)

_cv_pipe = None

def get_cv_pipeline() -> CVPipeline:
    global _cv_pipe
    if _cv_pipe is None:
        _cv_pipe = CVPipeline()
    return _cv_pipe
