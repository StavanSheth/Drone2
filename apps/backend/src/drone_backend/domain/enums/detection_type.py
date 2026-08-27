from enum import Enum

class DetectionType(str, Enum):
    HUMAN = "human"
    VEHICLE = "vehicle"
    OBSTACLE = "obstacle"
    CUSTOM = "custom"
