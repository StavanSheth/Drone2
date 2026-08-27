export interface GPSData {
  lat: number;
  lng: number;
  hdop: number;
  moves_left: number;
  last_update?: string;
}

export interface BatteryStatus {
  voltage: number;
  percentage: number;
  status: "Healthy" | "Critical";
}

export interface PortInfo {
  port: string;
  description: string;
  hwid: string;
  active: boolean;
}
