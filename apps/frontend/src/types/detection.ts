export interface DetectionBox {
  cls: number;
  name: string;
  conf: number;
  box: number[];
  track_id?: number | null;
  bbox?: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
  frame_index?: number;
  timestamp?: string;
}

export interface DetectionResult {
  total_detected: number;
  human_count?: number;
  active_track_count?: number;
  unique_tracks_seen?: number;
  total_observations?: number;
  detections: DetectionBox[];
  saved_images: string[];
  voltage?: number;
  percentage?: number;
}

export interface TrackHistoryItem {
  track_id: number;
  mission_id: string;
  stream_id: string;
  class_name: string;
  first_seen: string;
  last_seen: string;
  first_frame: number;
  last_frame: number;
  observations_count: number;
  last_box: number[];
  last_conf: number;
  status: string;
}
