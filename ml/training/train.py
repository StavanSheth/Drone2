# YOLO Training Script
from ultralytics import YOLO

def train():
    model = YOLO("yolov8m.pt")
    model.train(data="ml/configs/yolo.yaml", epochs=50, imgsz=640)

if __name__ == "__main__":
    train()
