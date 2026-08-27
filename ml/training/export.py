from ultralytics import YOLO

def export_onnx():
    model = YOLO("ml/models/production/V2.pt")
    model.export(format="onnx")

if __name__ == "__main__":
    export_onnx()
