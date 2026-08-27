"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

// Dynamic imports for Leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false });

// Helper component that uses hooks from react-leaflet
// Since hooks must be inside MapContainer, we create a sub-component
function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  // We use require inside the component to ensure it's only called on client
  const { useMap } = require("react-leaflet");
  const map = useMap();
  
  useEffect(() => {
    if (lat !== 0 && lng !== 0) {
      map.setView([lat, lng], map.getZoom());
    }
  }, [lat, lng, map]);
  
  return null;
}

export default function LiveTelemetry() {
  const [gps, setGps] = useState({ lat: 0, lng: 0, hdop: 99.99, last_update: "" });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGps = async () => {
      try {
        const res = await fetch("http://localhost:8000/gps");
        if (!res.ok) throw new Error("Failed to fetch GPS data");
        const data = await res.json();
        setGps(data);
        setError(null);
      } catch (err: any) {
        setError(err.message);
      }
    };

    const interval = setInterval(fetchGps, 1000); // Update every second
    return () => clearInterval(interval);
  }, []);

  const hasValidGps = gps.lat !== 0 || gps.lng !== 0;

  return (
    <div className="flex flex-col h-full bg-[#f5f3ef] p-6 space-y-6 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#1a1a1a]" style={{ fontFamily: "'Instrument Serif', serif" }}>
            Live ESP-NOW Telemetry
          </h2>
          <p className="text-sm text-[#9a9590]">Real-time GPS tracking via Serial Link</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase flex items-center gap-2 ${error ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"}`}>
          <div className={`w-2 h-2 rounded-full ${error ? "bg-red-500" : "bg-emerald-500 animate-pulse"}`} />
          {error ? "Link Offline" : "Live Feed Active"}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-[#e2dfd9] rounded-xl p-4 shadow-sm">
          <label className="text-[10px] font-bold text-[#b5b0a8] uppercase tracking-wider">Latitude</label>
          <div className="text-xl font-mono font-bold text-[#1a1a1a]">{gps.lat.toFixed(6)}</div>
        </div>
        <div className="bg-white border border-[#e2dfd9] rounded-xl p-4 shadow-sm">
          <label className="text-[10px] font-bold text-[#b5b0a8] uppercase tracking-wider">Longitude</label>
          <div className="text-xl font-mono font-bold text-[#1a1a1a]">{gps.lng.toFixed(6)}</div>
        </div>
        <div className="bg-white border border-[#e2dfd9] rounded-xl p-4 shadow-sm">
          <label className="text-[10px] font-bold text-[#b5b0a8] uppercase tracking-wider">HDOP (Precision)</label>
          <div className={`text-xl font-mono font-bold ${gps.hdop > 5 ? "text-amber-600" : "text-[#1a1a1a]"}`}>{gps.hdop.toFixed(2)}</div>
        </div>
      </div>

      <div className="flex-1 min-h-[400px] rounded-2xl overflow-hidden border border-[#e2dfd9] shadow-inner relative bg-[#ece9e4]">
        {!hasValidGps && (
          <div className="absolute inset-0 z-[1000] flex flex-col items-center justify-center bg-black/5 backdrop-blur-sm">
            <div className="bg-white p-6 rounded-2xl shadow-xl text-center max-w-xs border border-[#e2dfd9]">
              <div className="w-12 h-12 bg-[#ece9e4] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round"><path d="M1 6l7-3 8 3 7-3v17l-7 3-8-3-7 3V6z" /><line x1="8" y1="3" x2="8" y2="20" /><line x1="16" y1="6" x2="16" y2="23" /></svg>
              </div>
              <h3 className="font-bold text-[#1a1a1a]">Waiting for Signal</h3>
              <p className="text-xs text-[#9a9590] mt-1">Establishing ESP-NOW serial connection. Ensure Arduino is tethered to {typeof window !== 'undefined' && navigator.platform.includes('Win') ? 'COM3' : '/dev/ttyUSB0'}.</p>
            </div>
          </div>
        )}

        {typeof window !== "undefined" && (
          <MapContainer
            center={hasValidGps ? [gps.lat, gps.lng] : [20.5937, 78.9629] as any}
            zoom={hasValidGps ? 15 : 5}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {hasValidGps && (
              <>
                <Marker position={[gps.lat, gps.lng]}>
                  <Popup>
                    <strong>Drone Position</strong><br />
                    Lat: {gps.lat}<br />
                    Lng: {gps.lng}<br />
                    HDOP: {gps.hdop}
                  </Popup>
                </Marker>
                <RecenterMap lat={gps.lat} lng={gps.lng} />
              </>
            )}
          </MapContainer>
        )}
      </div>

      <div className="text-[10px] text-[#b5b0a8] font-mono flex items-center justify-between">
        <span>RAW STREAM: ESP_NOW_LINK_ACTIVE_V1</span>
        <span>LAST UPDATE: {gps.last_update || "NEVER"}</span>
      </div>
    </div>
  );
}
