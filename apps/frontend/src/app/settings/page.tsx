"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listPorts, setPort } from "@/lib/api/telemetry";
import { PortInfo } from "@/types/telemetry";
import { ArrowLeft, Cpu, Radio, RefreshCw, CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [ports, setPorts] = useState<PortInfo[]>([]);
  const [active, setActive] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPorts = async () => {
    setRefreshing(true);
    try {
      const p = await listPorts();
      setPorts(p);
      const cur = p.find((x) => x.active);
      if (cur) setActive(cur.port);
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPorts();
  }, []);

  const handleSelectPort = async (port: string) => {
    setLoading(true);
    try {
      await setPort(port);
      setActive(port);
      await fetchPorts();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#101415] text-white font-hanken p-6 sm:p-10">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="p-2.5 rounded-xl bg-white/[0.06] border border-white/10 hover:bg-white/[0.12] text-white transition-all cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Hardware & Serial Settings
              </h1>
              <p className="text-xs text-white/60">
                Configure ESP-NOW receiver COM ports and hardware links
              </p>
            </div>
          </div>

          <Button
            onClick={fetchPorts}
            disabled={refreshing}
            variant="outline"
            className="bg-white/[0.06] border-white/10 text-white hover:bg-white/[0.12] rounded-xl text-xs flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh Ports
          </Button>
        </div>

        {/* COM Port Selection Card */}
        <Card className="bg-[#202522]/90 border border-white/10 backdrop-blur-[24px] rounded-[24px] shadow-[0_24px_60px_rgba(0,0,0,0.45)] text-white">
          <CardHeader className="border-b border-white/5 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#ff6415]/15 border border-[#ff6415]/30 flex items-center justify-center text-[#ff6415]">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-white">
                    Available Serial COM Ports
                  </CardTitle>
                  <p className="text-[11px] text-white/50">
                    Hot-swap USB serial links for the ESP-NOW telemetry receiver
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-3">
            {ports.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                <Cpu className="w-8 h-8 text-white/30 mx-auto mb-2" />
                <p className="text-xs text-white/60">No serial COM ports detected on host machine.</p>
                <p className="text-[11px] text-white/40 mt-1">Plug in your ESP32 / USB receiver and click Refresh.</p>
              </div>
            ) : (
              ports.map((p) => {
                const isSelected = active === p.port;
                return (
                  <div
                    key={p.port}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                      isSelected
                        ? "bg-[#ff6415]/10 border-[#ff6415]/40 shadow-[0_0_20px_rgba(255,100,21,0.1)]"
                        : "bg-white/[0.04] border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          isSelected ? "bg-[#ff6415] animate-pulse" : "bg-white/20"
                        }`}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-white">
                            {p.port}
                          </span>
                          {isSelected && (
                            <span className="flex items-center gap-1 text-[10px] font-semibold text-[#ff6415] bg-[#ff6415]/15 px-2 py-0.5 rounded-full border border-[#ff6415]/30">
                              <CheckCircle2 className="w-3 h-3" /> ACTIVE LINK
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-white/50 mt-0.5">
                          {p.description || "Generic Serial Interface"}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={loading || isSelected}
                      onClick={() => handleSelectPort(p.port)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#f45b0b] text-white shadow-[0_7px_18px_rgba(244,91,11,0.22)]"
                          : "bg-white/[0.08] hover:bg-white/[0.14] text-white border border-white/10"
                      }`}
                    >
                      {isSelected ? "Connected" : "Switch to Port"}
                    </button>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
