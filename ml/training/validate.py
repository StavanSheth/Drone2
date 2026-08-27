from ultralytics import YOLO

def validate():
    model = YOLO("ml/models/production/V2.pt")
    metrics = model.val()
    print(metrics)

if __name__ == "__main__":
    validate()
