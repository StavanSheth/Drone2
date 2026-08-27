"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";
import { useEffect, useState } from "react";

interface MapComponentProps {
  lat: number;
  lng: number;
  pcLat?: number;
  pcLng?: number;
}

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function MapComponent({ lat, lng, pcLat, pcLng }: MapComponentProps) {
  const position: [number, number] = [lat, lng];

  return (
    <div style={{ height: "100%", width: "100%", borderRadius: "12px", overflow: "hidden" }}>
      <MapContainer 
        center={position} 
        zoom={13} 
        scrollWheelZoom={true} 
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Drone Marker */}
        <Marker position={position}>
          <Popup>
            <div style={{ fontWeight: 700, color: '#1a1a1a' }}>UAV-01 (Drone)</div>
            <div style={{ fontSize: '11px', color: '#666' }}>
              Lat: {position[0].toFixed(6)}<br />
              Lng: {position[1].toFixed(6)}
            </div>
          </Popup>
        </Marker>

        {/* PC Marker */}
        {pcLat !== undefined && pcLng !== undefined && (
          <Marker position={[pcLat, pcLng]}>
            <Popup>
              <div style={{ fontWeight: 700, color: '#3b82f6' }}>Command Terminal (PC)</div>
              <div style={{ fontSize: '11px', color: '#666' }}>
                Lat: {pcLat.toFixed(6)}<br />
                Lng: {pcLng.toFixed(6)}
              </div>
            </Popup>
          </Marker>
        )}

        <ChangeView center={position} />
      </MapContainer>
    </div>
  );
}
