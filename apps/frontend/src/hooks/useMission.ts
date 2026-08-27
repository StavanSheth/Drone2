"use client";
import { useState, useEffect } from "react";
import { listMissions } from "@/lib/api/missions";

export function useMission() {
  const [missions, setMissions] = useState<Array<{ id: string; count: number }>>([]);
  
  useEffect(() => {
    listMissions().then(setMissions).catch(() => {});
  }, []);

  return { missions };
}
