"use client";
import React from "react";
import { Badge } from "@/components/ui/badge";

export const MissionStatus = ({ status = "ACTIVE" }: { status?: string }) => {
  return (
    <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
      {status}
    </Badge>
  );
};
