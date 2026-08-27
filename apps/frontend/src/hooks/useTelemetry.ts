"use client";
import { useState, useEffect } from "react";
import { getGPS, getSerialLogs } from "@/lib/api/telemetry";
import { GPSData } from "@/types/telemetry";

export function useTelemetry() {
  const [gps, setGps] = useState<GPSData>({ lat: 0, lng: 0, hdop: 99.99, moves_left: 10 });
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const data = await getGPS();
        setGps(data);
      } catch (err) {
        // ignore offline errors
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return { gps, logs };
}
