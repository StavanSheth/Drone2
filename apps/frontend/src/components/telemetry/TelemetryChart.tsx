"use client";
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export const TelemetryChart = () => {
  return (
    <Card className="bg-card/40 border-border/40 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">
          Altitude & Velocity Telemetry
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-32 flex items-center justify-center border border-dashed border-border/40 rounded text-xs text-muted-foreground">
          Telemetry Real-Time Graph Active
        </div>
      </CardContent>
    </Card>
  );
};
