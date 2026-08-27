"use client";
import { useEffect, useState } from "react";
import { createTelemetryWebSocket } from "@/lib/websocket/telemetry";

export function useWebSocket() {
  const [telemetry, setTelemetry] = useState<any>(null);

  useEffect(() => {
    const ws = createTelemetryWebSocket((data) => {
      setTelemetry(data);
    });
    return () => ws.close();
  }, []);

  return { telemetry };
}
