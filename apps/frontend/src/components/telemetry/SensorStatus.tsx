"use client";
import React from "react";
import { Badge } from "@/components/ui/badge";

export const SensorStatus = ({ hdop = 1.2 }: { hdop?: number }) => {
  return (
    <div className="flex items-center justify-between p-3 bg-black/30 border border-border/30 rounded">
      <span className="text-xs text-muted-foreground">GPS Precision (HDOP)</span>
      <Badge variant="outline" className={hdop < 2.0 ? "text-emerald-400 border-emerald-500/30" : "text-amber-400"}>
        {hdop.toFixed(2)}
      </Badge>
    </div>
  );
};
