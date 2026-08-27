"use client";
import { useState } from "react";
import { analyzeFeed } from "@/lib/api/detections";

export function useDetections() {
  const [loading, setLoading] = useState(false);

  const analyze = async (base64: string, missionId?: string) => {
    setLoading(true);
    try {
      return await analyzeFeed(base64, missionId);
    } finally {
      setLoading(false);
    }
  };

  return { analyze, loading };
}
