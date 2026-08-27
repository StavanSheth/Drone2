"use client";
import React from "react";

export const AIResponse = ({ answer, sources }: { answer: string; sources: string[] }) => {
  return (
    <div className="space-y-2 text-sm">
      <div className="p-3 rounded-lg bg-card/60 border border-border/40 text-foreground">
        {answer}
      </div>
      {sources.length > 0 && (
        <div className="text-xs text-muted-foreground">
          Sources: {sources.join(", ")}
        </div>
      )}
    </div>
  );
};
