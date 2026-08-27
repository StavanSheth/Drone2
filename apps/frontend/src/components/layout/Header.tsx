"use client";
import React from "react";
import { Badge } from "@/components/ui/badge";

export const Header = () => {
  return (
    <header className="h-14 border-b border-border/40 bg-background/95 backdrop-blur px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
        <span className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
          Trinetra Tactical Command
        </span>
      </div>
      <div className="flex items-center gap-4">
        <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
          SYS ONLINE
        </Badge>
      </div>
    </header>
  );
};
