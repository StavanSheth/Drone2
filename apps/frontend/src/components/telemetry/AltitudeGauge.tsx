"use client";
import React from "react";

export const AltitudeGauge = ({ altitude = 45.2 }: { altitude?: number }) => {
  return (
    <div className="flex flex-col items-center justify-center p-4 bg-black/40 border border-border/40 rounded-lg">
      <span className="text-xs text-muted-foreground uppercase">Altitude (AGL)</span>
      <span className="text-2xl font-mono font-bold text-cyan-400">{altitude.toFixed(1)} m</span>
    </div>
  );
};
