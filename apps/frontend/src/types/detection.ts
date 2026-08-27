export interface DetectionBox {
  cls: number;
  name: string;
  conf: number;
  box: number[];
}

export interface DetectionResult {
  total_detected: number;
  detections: DetectionBox[];
  saved_images: string[];
  voltage?: number;
  percentage?: number;
}
