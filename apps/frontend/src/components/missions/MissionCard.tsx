"use client";
import React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export const MissionCard = ({ id, count }: { id: string; count: number }) => {
  return (
    <Link href={`/mission/${id}`}>
      <Card className="hover:border-primary/50 transition cursor-pointer bg-card/40 border-border/40">
        <CardHeader>
          <CardTitle className="text-sm font-mono text-cyan-400">Mission: {id}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">{count} Detections Archived</p>
        </CardContent>
      </Card>
    </Link>
  );
};
