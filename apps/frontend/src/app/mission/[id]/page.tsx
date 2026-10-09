/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useRef, useEffect, ReactNode, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import dynamic from 'next/dynamic';
import jsPDF from 'jspdf';
import CryptoJS from 'crypto-js';

const MapComponent = dynamic(() => import('@/components/MapComponent'), { 
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center bg-[#101415] text-white/50 text-[11px] font-mono font-bold">LOADING TACTICAL MAP...</div>
});

const IC: Record<string, ReactNode> = {
  shield: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
  bell: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>,
  settings: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
  expand: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" /></svg>,
  battery: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="16" height="10" rx="2" ry="2"></rect><line x1="22" y1="11" x2="22" y2="13"></line></svg>,
  box: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>,
  user: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
  compass: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>,
  activity: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>,
  signal: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 20h.01"></path><path d="M7 20v-4"></path><path d="M12 20v-8"></path><path d="M17 20V4"></path></svg>,
};

interface AgriData {
  cropType?: string;
  diseaseType?: string;
  confidence?: number;
  pesticide?: string;
  sprayAmount?: number;
}

export default function MissionDashboard() {
  const router = useRouter();
  const { id } = useParams();
  const missionId = Array.isArray(id) ? id[0] : (id as string);
  const [sessionFolder] = useState(() => `${missionId}_${new Date().toISOString().replace(/[:.]/g, '-')}`);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const feedContainerRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rawTerminalRef = useRef<HTMLDivElement>(null);
  const osdTerminalRef = useRef<HTMLDivElement>(null);

  // Active subview & mode states
  const [activeNavTab, setActiveNavTab] = useState<"LIVE" | "TELEMETRY" | "DETECTIONS" | "PAYLOADS" | "BATTERY" | "LOGS">("LIVE");
  const [activeBottomSection, setActiveBottomSection] = useState<"ANALYTICS" | "TRACKS" | "REPORTS" | "LOGS">("LOGS");
  const [isPlaying, setIsPlaying] = useState(true);

  // Telemetry & Hardware state
  const [telemetry, setTelemetry] = useState({
    lat: 0,
    lng: 0,
    alt: 0,
    vel: 0,
    batt: 0,
    voltage: 0,
    health: 0,
    delivered: 0,
    hdop: 0,
    movesLeft: 0,
    heading: 0,
    roll: 0,
    pitch: 0,
    yaw: 0,
    wind: 0
  });
  // GPS Priority & Multi-Source State
  // 1st Preference: Camera OCR
  // 2nd Preference: Manual Entry
  // 3rd Preference: COM Port / Computer
  // Manual Override: Bypasses automatic preferences
  const [gpsPrioritySource, setGpsPrioritySource] = useState<"OCR" | "MANUAL" | "COM" | "COMPUTER">("COM");
  const [manualOverride, setManualOverride] = useState<boolean>(false);
  const [manualLatInput, setManualLatInput] = useState<string>("");
  const [manualLngInput, setManualLngInput] = useState<string>("");
  const [isEditingGps, setIsEditingGps] = useState<boolean>(false);

  const [ocrGpsData, setOcrGpsData] = useState<{lat: number, lng: number, timestamp: number}>({ lat: 0, lng: 0, timestamp: 0 });
  const [comGpsData, setComGpsData] = useState<{lat: number, lng: number, timestamp: number}>({ lat: 0, lng: 0, timestamp: 0 });


  const [humanCount, setHumanCount] = useState(0);
  const [activeTrackCount, setActiveTrackCount] = useState(0);
  const [uniqueTracksSeen, setUniqueTracksSeen] = useState(0);
  const [trackingEnabled, setTrackingEnabled] = useState(true);
  const frameCounterRef = useRef(0);
  const [trackHistoryList, setTrackHistoryList] = useState<{
    track_id: number;
    class_name: string;
    conf: number;
    first_seen: string;
    last_seen: string;
    observations: number;
    box: number[];
  }[]>([]);
  const [detectionsList, setDetectionsList] = useState<{filename: string, url: string}[]>([]);
  const [latestDetections, setLatestDetections] = useState<{x?: number, y?: number, w?: number, h?: number, box?: number[], conf?: number, track_id?: number | null, class_name?: string}[]>([]);
  const [videoSize, setVideoSize] = useState({ w: 1280, h: 720 });
  const [selectedModel, setSelectedModel] = useState<"V2" | "YOLOv8m" | "version3" | "AgriCNN">("V2");

  // Payload Dispenser Controls State
  const [isPayloadModalOpen, setIsPayloadModalOpen] = useState<boolean>(false);
  const [payloadSourceMode, setPayloadSourceMode] = useState<"SIMULATION" | "SERIAL">("SIMULATION");
  const [payloadDelayMs, setPayloadDelayMs] = useState<number>(2000); // 1000ms to Infinity
  const [payloadCustomDelayInput, setPayloadCustomDelayInput] = useState<string>("2000");
  const [payloadTargetCount, setPayloadTargetCount] = useState<number>(5); // 1 to 10
  const [isAutoDropping, setIsAutoDropping] = useState<boolean>(false);

  // Serial & COM state
  const [availablePorts, setAvailablePorts] = useState<{port: string, description: string, active: boolean}[]>([]);
  const [selectedPort, setSelectedPort] = useState<string>("COM3");
  const [rawSerialLogs, setRawSerialLogs] = useState<string[]>([]);
  const [osdLogs, setOsdLogs] = useState<string[]>([]);

  // Activity events
  const [activityLogs, setActivityLogs] = useState<{
    time: string;
    tag: string;
    msg: string;
    color: string;
    lat: number;
    lng: number;
    alt: number;
    batt: number;
    voltage: number;
    vel: number;
    humanCount: number;
    humanIds?: string;
  }[]>([]);
  // Detection Audit History (for report and live inspection)
  const [detectionAuditTrail, setDetectionAuditTrail] = useState<{
    timestamp?: number;
    time: string;
    count: number;
    maxConf: number;
    model: string;
    lat: number;
    lng: number;
    trackIds?: number[];
  }[]>([]);

  const telemetryRef = useRef(telemetry);
  telemetryRef.current = telemetry;
  const humanCountRef = useRef(humanCount);
  humanCountRef.current = humanCount;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      setCameraActive(false);

      if (file.type.startsWith("video/")) {
        setUploadedImage(null);
        const url = URL.createObjectURL(file);
        setUploadedVideo(url);
        setIsPlaying(true);
        if (videoRef.current) {
          videoRef.current.srcObject = null;
          videoRef.current.src = url;
          videoRef.current.onloadedmetadata = () => {
            if (videoRef.current) {
              setVideoSize({
                w: videoRef.current.videoWidth || 1280,
                h: videoRef.current.videoHeight || 720,
              });
            }
          };
          videoRef.current.play().catch(() => {});
        }
      } else if (file.type.startsWith("image/")) {
        setUploadedVideo(null);
        if (videoRef.current) {
          videoRef.current.srcObject = null;
          videoRef.current.src = "";
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
          const result = ev.target?.result as string;
          setUploadedImage(result);
          setIsPlaying(false);
          const img = new Image();
          img.onload = () => {
            setVideoSize({ w: img.width, h: img.height });
          };
          img.src = result;
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const downloadImageWithDetections = () => {
    if (!uploadedImage) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);

      const isAgri = selectedModel === "AgriCNN";
      const labelText = isAgri ? "CROP" : "HUMAN";
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = Math.max(2, img.width * 0.005);
      ctx.font = `bold ${Math.max(12, img.width * 0.02)}px monospace`;
      
      latestDetections.forEach(det => {
        let x = 0, y = 0, w = 0, h = 0;
        if (det.box && Array.isArray(det.box)) {
          x = det.box[0]; y = det.box[1];
          w = det.box[2] - det.box[0]; h = det.box[3] - det.box[1];
        } else {
          x = det.x ?? 0; y = det.y ?? 0;
          w = det.w ?? 0; h = det.h ?? 0;
        }
        const conf = det.conf || 0;
        ctx.strokeRect(x, y, w, h);
        
        ctx.fillStyle = "#10b981";
        const txt = `${labelText} ${(conf * 100).toFixed(0)}%`;
        const tw = ctx.measureText(txt).width;
        const th = parseInt(ctx.font, 10);
        ctx.fillRect(x, y - th - 4, tw + 8, th + 4);
        
        ctx.fillStyle = "#000000";
        ctx.fillText(txt, x + 4, y - 4);
      });

      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `detection_${Date.now()}.jpg`;
      a.click();
    };
    img.src = uploadedImage;
  };

  const startRecording = () => {
    if (!videoRef.current) return;
    const canvas = recordingCanvasRef.current;
    if (!canvas) return;
    
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    recordedChunksRef.current = [];
    const stream = canvas.captureStream(30);
    const mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm" });
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        recordedChunksRef.current.push(e.data);
      }
    };
    
    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `recording_${Date.now()}.webm`;
      a.click();
      URL.revokeObjectURL(url);
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);
    addActivityLog("RECORDING", "Started capturing feed output...", "#ef4444");

    const drawLoop = () => {
      if (mediaRecorderRef.current?.state !== "recording") return;

      if (videoRef.current && videoRef.current.readyState >= 2) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        
        const isAgri = selectedModel === "AgriCNN";
        const labelText = isAgri ? "CROP" : "HUMAN";
        ctx.strokeStyle = "#10b981";
        ctx.lineWidth = Math.max(2, canvas.width * 0.003);
        ctx.font = `bold ${Math.max(12, canvas.width * 0.015)}px monospace`;
        
        latestDetections.forEach(det => {
          let x = 0, y = 0, w = 0, h = 0;
          if (det.box && Array.isArray(det.box)) {
            x = det.box[0]; y = det.box[1];
            w = det.box[2] - det.box[0]; h = det.box[3] - det.box[1];
          } else {
            x = det.x ?? 0; y = det.y ?? 0;
            w = det.w ?? 0; h = det.h ?? 0;
          }
          const conf = det.conf || 0;
          ctx.strokeRect(x, y, w, h);
          ctx.fillStyle = "#10b981";
          const txt = `${labelText} ${(conf * 100).toFixed(0)}%`;
          const tw = ctx.measureText(txt).width;
          const th = parseInt(ctx.font, 10);
          ctx.fillRect(x, y - th - 4, tw + 8, th + 4);
          ctx.fillStyle = "#000000";
          ctx.fillText(txt, x + 4, y - 4);
        });
      }
      animationFrameRef.current = requestAnimationFrame(drawLoop);
    };
    drawLoop();
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsRecording(false);
    addActivityLog("RECORDING", "Recording saved", "#10b981");
  };

  const addActivityLog = useCallback((tag: string, msg: string, color: string = "#3b82f6", explicitCount?: number, explicitHumanIds?: string) => {
    const time = new Date().toLocaleTimeString();
    const tel = telemetryRef.current;
    const count = explicitCount !== undefined ? explicitCount : humanCountRef.current;
    setActivityLogs(prev => {
      if (prev.length > 0 && prev[prev.length - 1].msg === msg && prev[prev.length - 1].tag === tag) return prev;
      return [...prev, {
        time,
        tag,
        msg,
        color,
        lat: tel.lat,
        lng: tel.lng,
        alt: tel.alt,
        batt: tel.batt,
        voltage: tel.voltage,
        vel: tel.vel,
        humanCount: count,
        humanIds: explicitHumanIds || "-",
      }].slice(-80);
    });
  }, []);

  // Initialize client-side system log on mount (avoids SSR hydration mismatch)
  useEffect(() => {
    addActivityLog("SYSTEM_INIT", `MISSION ${missionId} READY // SECURE CHROMA & YOLO ONLINE`, "#3b82f6");
  }, [addActivityLog, missionId]);

  // Encrypted Report state
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [encryptionKey, setEncryptionKey] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [agriData, setAgriData] = useState<AgriData | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedVideo, setUploadedVideo] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const recordingCanvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<BlobPart[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const [keyCopied, setKeyCopied] = useState(false);
  const [lastEncryptedData, setLastEncryptedData] = useState<string | null>(null);
  const [decryptMode, setDecryptMode] = useState(false);
  const [decryptKeyInput, setDecryptKeyInput] = useState("");
  const [decryptError, setDecryptError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Camera devices
  const [availableCameras, setAvailableCameras] = useState<{deviceId: string, label: string}[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");

  // Timeline stages
  const missionStages = [
    { label: "DEPARTURE", status: "complete", time: "12:04" },
    { label: "WAYPOINT ALPHA", status: "complete", time: "12:15" },
    { label: "SECTOR DEPLOY", status: "current", time: "12:32" },
    { label: "TARGET REACHED", status: "pending", time: "--:--" },
    { label: "DELIVERY", status: "pending", time: "--:--" },
  ];

  // Fetch Ports
  useEffect(() => {
    fetch("http://localhost:8000/list-ports")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAvailablePorts(data);
          const act = data.find((p: any) => p.active);
          if (act) {
            setSelectedPort(act.port);
            addActivityLog("COM_PORT", `HARDWARE COM PORT ACTIVE: ${act.port} (${act.description || 'UART Link'})`, "#10b981");
          }
        }
      })
      .catch(() => {});
  }, [addActivityLog]);

  const [cameraActive, setCameraActive] = useState<boolean>(false);

  // Enumerate Cameras
  const refreshCameraDevices = async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices
        .filter(d => d.kind === "videoinput")
        .map((d, i) => ({
          deviceId: d.deviceId,
          label: d.label && d.label.trim().length > 0 ? d.label : `Integrated Camera ${i + 1}`,
        }));
      setAvailableCameras(videoDevices);
    } catch (err) {
      console.warn("Camera device enumeration failed:", err);
    }
  };

  // Switch camera on demand
  const handleSwitchCamera = async (deviceId: string) => {
    setUploadedImage(null);
    setUploadedVideo(null);
    setSelectedCameraId(deviceId);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }

      let videoConstraints: MediaTrackConstraints | boolean = true;
      if (deviceId && deviceId !== "" && deviceId !== "sim") {
        videoConstraints = { deviceId: { ideal: deviceId } };
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: false,
        });
      } catch (err) {
        // Fallback to generic video if specific device constraints are rejected
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.src = "";
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            setVideoSize({
              w: videoRef.current.videoWidth || 1280,
              h: videoRef.current.videoHeight || 720,
            });
          }
          videoRef.current?.play().catch(() => {});
        };
      }
      setCameraActive(true);
      await refreshCameraDevices();
    } catch (err) {
      console.warn("Webcam access error:", err);
      setCameraActive(false);
    }
  };

  // Initial Camera Discovery
  useEffect(() => {
    refreshCameraDevices();
    // Try to auto-connect on load
    handleSwitchCamera("");
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Browser Geolocation — get laptop's real GPS on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setTelemetry(prev => ({ ...prev, lat: latitude, lng: longitude }));
          setComGpsData({ lat: latitude, lng: longitude, timestamp: Date.now() });
        },
        () => {
          // Geolocation denied or unavailable — stay at 0,0
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  // Frame buffer for 10s skip (stores last 20 frames = ~30s at 1.5s intervals)
  const frameBufferRef = useRef<{image: string, timestamp: number}[]>([]);
  const [frameBufferIndex, setFrameBufferIndex] = useState<number>(-1); // -1 = live
  const MAX_FRAME_BUFFER = 20;

  // GPS Priority Resolution Function
  const updateResolvedGps = useCallback((comLat?: number, comLng?: number, ocrLat?: number, ocrLng?: number) => {
    // 1. Check Manual Override first
    if (manualOverride) {
      const mLat = parseFloat(manualLatInput);
      const mLng = parseFloat(manualLngInput);
      if (!isNaN(mLat) && !isNaN(mLng)) {
        setTelemetry(prev => ({ ...prev, lat: mLat, lng: mLng }));
        setGpsPrioritySource("MANUAL");
        return;
      }
    }

    // 2. 1st Preference: Camera OCR (if valid and updated within last 10s)
    const curOcrLat = ocrLat !== undefined ? ocrLat : ocrGpsData.lat;
    const curOcrLng = ocrLng !== undefined ? ocrLng : ocrGpsData.lng;
    if (curOcrLat !== 0 && curOcrLng !== 0 && Math.abs(curOcrLat) <= 90 && Math.abs(curOcrLng) <= 180) {
      setTelemetry(prev => ({ ...prev, lat: curOcrLat, lng: curOcrLng }));
      setGpsPrioritySource("OCR");
      return;
    }

    // 3. 2nd Preference: Manual Entry (if manually set previously)
    if (isEditingGps || (manualLatInput !== "" && manualLatInput !== "0")) {
      const mLat = parseFloat(manualLatInput);
      const mLng = parseFloat(manualLngInput);
      if (!isNaN(mLat) && !isNaN(mLng)) {
        setTelemetry(prev => ({ ...prev, lat: mLat, lng: mLng }));
        setGpsPrioritySource("MANUAL");
        return;
      }
    }

    // 4. 3rd Preference: COM Port Hardware / Computer Serial
    const curComLat = comLat !== undefined ? comLat : comGpsData.lat;
    const curComLng = comLng !== undefined ? comLng : comGpsData.lng;
    if (curComLat !== 0 && curComLng !== 0) {
      setTelemetry(prev => ({ ...prev, lat: curComLat, lng: curComLng }));
      setGpsPrioritySource("COM");
      return;
    }

    setGpsPrioritySource("COMPUTER");
  }, [manualOverride, manualLatInput, manualLngInput, ocrGpsData, isEditingGps, comGpsData]);

  // Poll GPS & Telemetry
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("http://localhost:8000/gps");
        if (res.ok) {
          const data = await res.json();
          if (data.lat && data.lng) {
            setComGpsData({ lat: data.lat, lng: data.lng, timestamp: Date.now() });
          }
          setTelemetry(prev => ({
            ...prev,
            hdop: data.hdop ?? prev.hdop,
            movesLeft: typeof data.moves_left === 'number' ? data.moves_left : prev.movesLeft,
          }));
          updateResolvedGps(data.lat, data.lng);
        }
      } catch {}
    }, 1000);
    return () => clearInterval(interval);
  }, [updateResolvedGps]);

  // Poll Serial Logs
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("http://localhost:8000/serial-logs");
        if (res.ok) {
          const data = await res.json();
          if (data.logs && data.logs.length > 0) {
            setRawSerialLogs(data.logs);
            const latest = data.logs[data.logs.length - 1];
            if (latest && (latest.includes("LAT") || latest.includes("BATT") || latest.includes("OBJ"))) {
              addActivityLog("COM_SYNC", latest.replace(/\[.*?\]\s*/, ""), "#f59e0b");
            }
            if (payloadSourceMode === "SERIAL" && latest) {
              const match = latest.match(/(?:payload|drop|delivered)[^\d]*(\d+)/i);
              if (match) {
                const count = parseInt(match[1], 10);
                if (!isNaN(count) && count >= 0 && count <= 10) {
                  setTelemetry(prev => {
                    if (prev.delivered !== count) {
                      addActivityLog("SERIAL_PAYLOAD", `HARDWARE COM SYNC: PAYLOAD DROPPED UPDATED TO ${count}`, "#f59e0b");
                      return { ...prev, delivered: count };
                    }
                    return prev;
                  });
                }
              }
            }
          }
        }
      } catch {}
    }, 1200);
    return () => clearInterval(interval);
  }, [addActivityLog, payloadSourceMode]);

  // Payload Dispenser Auto-Drop Timer (Simulation Mode)
  useEffect(() => {
    if (!isAutoDropping || payloadSourceMode !== "SIMULATION") return;
    if (!isFinite(payloadDelayMs) || payloadDelayMs < 1000) return;

    const timer = setInterval(() => {
      setTelemetry(prev => {
        if (prev.delivered >= payloadTargetCount || prev.delivered >= 10) {
          setIsAutoDropping(false);
          addActivityLog(
            "PAYLOAD_COMPLETED",
            `TARGET DELIVERY COMPLETE: ${prev.delivered}/${payloadTargetCount} PAYLOADS DISPENSED`,
            "#10b981"
          );
          return prev;
        }
        const nextDelivered = Math.min(10, prev.delivered + 1);
        addActivityLog(
          "PAYLOAD_RELEASE",
          `PAYLOAD DISPENSER: RELEASED UNIT #${nextDelivered} (TARGET: ${payloadTargetCount}, DELAY: ${payloadDelayMs}ms)`,
          "#f45b0b"
        );
        if (nextDelivered >= payloadTargetCount || nextDelivered >= 10) {
          setIsAutoDropping(false);
          addActivityLog(
            "PAYLOAD_COMPLETED",
            `TARGET DELIVERY REACHED: ${nextDelivered}/${payloadTargetCount} PAYLOADS DISPENSED`,
            "#10b981"
          );
        }
        return { ...prev, delivered: nextDelivered };
      });
    }, payloadDelayMs);

    return () => clearInterval(timer);
  }, [isAutoDropping, payloadSourceMode, payloadDelayMs, payloadTargetCount, addActivityLog]);

  const handleDropSinglePayload = () => {
    setTelemetry(prev => {
      if (prev.delivered >= 10) {
        addActivityLog("PAYLOAD_LIMIT", "MAXIMUM CAPACITY REACHED: 10/10 PAYLOADS ALREADY DROPPED", "#ef4444");
        return prev;
      }
      const nextDelivered = prev.delivered + 1;
      addActivityLog(
        "PAYLOAD_RELEASE",
        `MANUAL RELEASE: DROPPED UNIT #${nextDelivered} (TOTAL: ${nextDelivered}/10)`,
        "#f45b0b"
      );
      return { ...prev, delivered: nextDelivered };
    });
  };

  const handleResetPayloads = () => {
    setIsAutoDropping(false);
    setTelemetry(prev => ({ ...prev, delivered: 0 }));
    addActivityLog("PAYLOAD_RESET", "PAYLOAD DISPENSER COUNTER RESET TO 0", "#3b82f6");
  };

  // Poll Feed OSD Logs
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("http://localhost:8000/feed-osd-logs");
        if (res.ok) {
          const data = await res.json();
          if (data.logs && data.logs.length > 0) {
            setOsdLogs(data.logs);
            const latest = data.logs[data.logs.length - 1];
            if (latest && (latest.includes("ALT") || latest.includes("NAV") || latest.includes("OBJ"))) {
              addActivityLog("FEED_OSD", latest.replace(/\[.*?\]\s*/, ""), "#3b82f6");
            }
          }
        }
      } catch {}
    }, 1500);
    return () => clearInterval(interval);
  }, [addActivityLog]);

  // Auto-scroll terminals
  useEffect(() => {
    if (rawTerminalRef.current) {
      rawTerminalRef.current.scrollTop = rawTerminalRef.current.scrollHeight;
    }
    if (osdTerminalRef.current) {
      osdTerminalRef.current.scrollTop = osdTerminalRef.current.scrollHeight;
    }
  }, [rawSerialLogs, osdLogs]);

  // Video Frame YOLO Analysis
  useEffect(() => {
    const processFrame = async () => {
      if (!isPlaying && !uploadedImage) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;

      let base64Image = "simulated_frame";

      if (uploadedImage) {
        base64Image = uploadedImage;
      } else if (video && canvas && video.readyState >= 2 && video.videoWidth > 0) {
        // If a live camera feed is active, capture a real frame
        const ctx = canvas.getContext("2d");
        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          if (videoSize.w !== video.videoWidth || videoSize.h !== video.videoHeight) {
            setVideoSize({ w: video.videoWidth, h: video.videoHeight });
          }
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          base64Image = canvas.toDataURL("image/jpeg", 0.6);

          // Store frame in buffer for 10s skip
          frameBufferRef.current.push({ image: base64Image, timestamp: Date.now() });
          if (frameBufferRef.current.length > MAX_FRAME_BUFFER) {
            frameBufferRef.current.shift();
          }
        }
      }

      try {
        frameCounterRef.current += 1;
        const res = await fetch("http://localhost:8000/analyze-feed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            image_base64: base64Image,
            voltage: telemetry.voltage || null,
            mission_id: sessionFolder,
            model_name: selectedModel,
            track: trackingEnabled,
            stream_id: `stream_${id || "default"}`,
            frame_index: frameCounterRef.current,
          })
        });
        if (res.ok) {
          const data = await res.json();
          // Read count with robust fallback across both tracking and single-frame endpoints
          const count = (typeof data.total_detected === "number" && data.total_detected > 0)
            ? data.total_detected
            : (typeof data.human_count === "number" && data.human_count > 0)
              ? data.human_count
              : (Array.isArray(data.detections) ? data.detections.length : 0);
          setHumanCount(count);
          if (data.active_track_count !== undefined && data.active_track_count !== null) {
            setActiveTrackCount(data.active_track_count);
          }
          if (data.unique_tracks_seen !== undefined && data.unique_tracks_seen !== null) {
            setUniqueTracksSeen(data.unique_tracks_seen);
          }
          if (Array.isArray(data.detections)) {
            setLatestDetections(data.detections);
            // Reconcile track history
            data.detections.forEach((d: any) => {
              if (d.track_id !== undefined && d.track_id !== null) {
                setTrackHistoryList(prev => {
                  const existingIdx = prev.findIndex(item => item.track_id === d.track_id);
                  const nowStr = new Date().toLocaleTimeString();
                  if (existingIdx >= 0) {
                    const updated = [...prev];
                    updated[existingIdx] = {
                      ...updated[existingIdx],
                      conf: d.conf || updated[existingIdx].conf,
                      last_seen: nowStr,
                      observations: updated[existingIdx].observations + 1,
                      box: d.box || updated[existingIdx].box,
                    };
                    return updated;
                  } else {
                    return [
                      ...prev,
                      {
                        track_id: d.track_id,
                        class_name: d.class_name || d.name || "person",
                        conf: d.conf || 0,
                        first_seen: nowStr,
                        last_seen: nowStr,
                        observations: 1,
                        box: d.box || [0, 0, 0, 0],
                      }
                    ];
                  }
                });
              }
            });
          }
          
          // Also keep track of Agricnn data if selected
          if (data.crop_type) {
              setAgriData({
                  cropType: data.crop_type,
                  diseaseType: data.disease_type,
                  confidence: data.confidence,
                  pesticide: data.pesticide,
                  sprayAmount: data.spray_amount
              });
          }

          // Log human detections dynamically and store for audit report
          if (count > 0) {
            const maxConf = data.detections?.reduce((acc: number, d: any) => Math.max(acc, d.conf || 0), 0) || 0;
            const trackIds: number[] = (data.detections || [])
              .map((d: any) => d.track_id)
              .filter((id: any) => typeof id === "number");
            const humanIdsStr = trackIds.length > 0
              ? trackIds.map((id: number) => `#${id}`).join(", ")
              : Array.from({ length: count }, (_, i) => `#${i + 1}`).join(", ");
            const idListMsg = ` [IDs: ${humanIdsStr}]`;

            addActivityLog(
              "HUMAN_DETECTED",
              `TARGET CONFIRMED (${count} Person(s)${idListMsg}, Conf: ${(maxConf * 100).toFixed(0)}%, Engine: ${selectedModel})`,
              "#10b981",
              count,
              humanIdsStr
            );
            setDetectionAuditTrail(prev => {
              const now = Date.now();
              const lastEvt = prev[prev.length - 1];
              // Avoid duplicate logs within 2 seconds
              if (lastEvt && lastEvt.timestamp && (now - lastEvt.timestamp < 2000)) return prev;
              return [
                ...prev,
                {
                  timestamp: now,
                  time: new Date().toLocaleTimeString(),
                  count,
                  maxConf,
                  model: selectedModel,
                  lat: telemetry.lat,
                  lng: telemetry.lng,
                  trackIds: trackIds.length > 0 ? trackIds : undefined,
                }
              ].slice(-50);
            });
          }
          // Update battery telemetry from backend
          if (data.telemetry?.voltage != null) {
            setTelemetry(prev => ({
              ...prev,
              voltage: data.telemetry.voltage,
              batt: data.telemetry.percentage ?? prev.batt
            }));
          }
          // Update OCR GPS if available
          if (data.telemetry?.lat && data.telemetry?.lon) {
            setOcrGpsData({ lat: data.telemetry.lat, lng: data.telemetry.lon, timestamp: Date.now() });
            updateResolvedGps(undefined, undefined, data.telemetry.lat, data.telemetry.lon);
            addActivityLog("OCR_GPS", `FEED OCR COORDINATES: ${data.telemetry.lat.toFixed(5)}N, ${data.telemetry.lon.toFixed(5)}W`, "#10b981");
          }
        }
      } catch (err) {
        // Silently swallow network errors (backend may not be reachable)
      }
    };
    const interval = setInterval(processFrame, 1500);
    return () => clearInterval(interval);
  }, [isPlaying, selectedModel, missionId, telemetry.voltage, telemetry.lat, telemetry.lng, updateResolvedGps, addActivityLog]);

  // CSV Export - Mission Activity Logs
  const handleDownloadCSV = () => {
    const headers = ["Timestamp", "Event_Tag", "Message", "Latitude", "Longitude", "Altitude_m", "Battery_Percent", "Voltage_V", "Speed_ms", "Humans_Detected", "Human_IDs"];
    const rows = activityLogs.map(l => {
      const derivedIds = (l.humanCount > 0 && (!l.humanIds || l.humanIds === "-"))
        ? Array.from({ length: l.humanCount }, (_, i) => `#${i + 1}`).join(", ")
        : (l.humanIds || "-");
      return [
        `"${l.time}"`,
        `"${l.tag}"`,
        `"${(l.msg || '').replace(/"/g, '""')}"`,
        (l.lat || 0).toFixed(6),
        (l.lng || 0).toFixed(6),
        (l.alt || 0).toFixed(2),
        (l.batt || 0).toFixed(1),
        (l.voltage || 0).toFixed(2),
        (l.vel || 0).toFixed(2),
        l.humanCount || 0,
        `"${derivedIds}"`
      ];
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `MISSION_${missionId}_ACTIVITY_LOGS.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addActivityLog("CSV_EXPORT", "ACTIVITY TELEMETRY LOGS EXPORTED AS CSV", "#10b981");
  };

  // CSV Export - Persistent Track Record
  const handleDownloadTracksCSV = () => {
    const headers = ["Track_ID", "Class_Name", "Confidence_Percent", "First_Seen", "Last_Seen", "Observations"];
    const rows = trackHistoryList.map(t => [
      `"#${t.track_id}"`,
      `"${t.class_name}"`,
      (t.conf * 100).toFixed(1),
      `"${t.first_seen}"`,
      `"${t.last_seen}"`,
      t.observations
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `MISSION_${missionId}_PERSISTENT_TRACKS.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addActivityLog("TRACKS_EXPORT", "PERSISTENT TRACK RECORD EXPORTED AS CSV", "#38bdf8");
  };

  // Report Export
  const handleDownloadReport = () => {
    setIsGeneratingReport(true);
    addActivityLog("REPORT_EXPORT", `GENERATING ENCRYPTED MISSION REPORT (AUDIT TRAILS: ${detectionAuditTrail.length})`, "#ff6415");
    setTimeout(() => {
      try {
        const doc = new jsPDF();
        const key = `TRN-ASM32-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
        
        let y = 18;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text("TRINETRA TACTICAL INTELLIGENCE & RESCUE REPORT", 10, y);
        y += 7;
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(`SECURITY CLASSIFICATION: TOP SECRET // AES-256 ENCRYPTED // TIMESTAMP: ${new Date().toISOString()}`, 10, y);
        y += 8;
        
        doc.setLineWidth(0.5);
        doc.line(10, y, 200, y);
        y += 6;

        // 1. Mission Overview
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("1. MISSION OVERVIEW & EXECUTIVE SUMMARY", 10, y);
        y += 6;
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "normal");
        doc.text(`• MISSION IDENTIFIER: ${missionId} (OPERATION SENTINEL)`, 14, y); y += 4.5;
        doc.text(`• COMMAND OPERATOR: STAVAN SHETH (ID: OP-SS-884)`, 14, y); y += 4.5;
        doc.text(`• ACTIVE AI INFERENCE ENGINE: ${selectedModel}`, 14, y); y += 4.5;
        doc.text(`• SERIAL COM PORT: ${selectedPort} (115200 BAUD)`, 14, y); y += 4.5;
        doc.text(`• CURRENT GPS LOCATION: ${telemetry.lat.toFixed(6)}° N, ${telemetry.lng.toFixed(6)}° W (PRIORITY: ${gpsPrioritySource})`, 14, y); y += 4.5;
        doc.text(`• BATTERY STATUS: ${telemetry.batt.toFixed(1)}% RESERVE (${telemetry.voltage.toFixed(2)}V 6S LiPo)`, 14, y); y += 4.5;
        doc.text(`• CURRENT ACTIVE HUMAN TARGETS: ${humanCount}`, 14, y); y += 4.5;
        doc.text(`• MEDICAL PAYLOAD DELIVERIES: ${telemetry.delivered} UNITS COMPLETED`, 14, y); y += 7;

        // 2. Human Detection Audit Trail
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("2. HUMAN DETECTION AUDIT TRAIL (CHRONOLOGICAL FROM ACQUISITION)", 10, y);
        y += 6;
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        if (detectionAuditTrail.length === 0) {
          doc.text("• No human detection events logged prior to this report export.", 14, y);
          y += 5;
        } else {
          detectionAuditTrail.forEach((evt, idx) => {
            if (y > 270) { doc.addPage(); y = 15; }
            const idsText = evt.trackIds && evt.trackIds.length > 0 ? ` [IDs: ${evt.trackIds.map(id => '#' + id).join(', ')}]` : '';
            doc.text(`• [${evt.time}] TARGET #${idx + 1}: ${evt.count} Person(s)${idsText} | Conf: ${(evt.maxConf * 100).toFixed(0)}% | GPS: (${evt.lat.toFixed(5)}, ${evt.lng.toFixed(5)}) | Model: ${evt.model}`, 14, y);
            y += 4.5;
          });
        }
        y += 4;

        // 3. Real-Time Activity & Event Timeline
        if (y > 240) { doc.addPage(); y = 15; }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("3. LIVE ACTIVITY LOG TIMELINE (SYSTEM, COM & FEED)", 10, y);
        y += 6;
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "normal");
        if (activityLogs.length === 0) {
          doc.text("• Activity stream initialized.", 14, y);
          y += 4.5;
        } else {
          activityLogs.slice(-30).forEach((act) => {
            if (y > 275) { doc.addPage(); y = 15; }
            doc.text(`[${act.time}] [${act.tag}] ${act.msg}`, 14, y);
            y += 4;
          });
        }
        y += 5;

        // 4. Raw Hardware COM & Feed OSD Log Snapshot
        if (y > 240) { doc.addPage(); y = 15; }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("4. COM SERIAL & FEED OSD TELEMETRY SNAPSHOT", 10, y);
        y += 6;
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "normal");
        const rawSubset = rawSerialLogs.slice(-8);
        if (rawSubset.length > 0) {
          doc.text("COM SERIAL TELEMETRY STREAM:", 14, y); y += 4;
          rawSubset.forEach(r => {
            if (y > 278) { doc.addPage(); y = 15; }
            doc.text(`  > ${r}`, 14, y);
            y += 3.8;
          });
        }
        const osdSubset = osdLogs.slice(-6);
        if (osdSubset.length > 0) {
          y += 2;
          doc.text("FEED OSD TELEMETRY STREAM:", 14, y); y += 4;
          osdSubset.forEach(o => {
            if (y > 278) { doc.addPage(); y = 15; }
            doc.text(`  > ${o}`, 14, y);
            y += 3.8;
          });
        }

        const pdfOutput = doc.output('datauristring');
        const encrypted = CryptoJS.AES.encrypt(pdfOutput, key).toString();
        setLastEncryptedData(encrypted);
        const blob = new Blob([encrypted], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const reportFilename = `MISSION_${missionId}_${new Date().toISOString().replace(/[:.]/g, '-')}.aes`;
        const link = document.createElement('a');
        link.href = url;
        link.download = reportFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        // Auto-save to backend repo
        fetch('http://localhost:8000/save-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mission_folder: sessionFolder, filename: reportFilename, encrypted_content: encrypted })
        }).catch(() => {});
        
        setEncryptionKey(key);
        setKeyCopied(false);
        setDecryptMode(false);
        setDecryptKeyInput("");
        setDecryptError(null);
      } finally {
        setIsGeneratingReport(false);
      }
    }, 1200);
  };

  // Decrypt and open a report (handles PDF data URIs, raw PDF binary, images, or raw text)
  const handleDecryptAndOpen = (encData: string, keyStr: string) => {
    try {
      setDecryptError(null);
      const decrypted = CryptoJS.AES.decrypt(encData, keyStr);
      const decryptedStr = decrypted.toString(CryptoJS.enc.Utf8);
      if (!decryptedStr || decryptedStr.length < 10) {
        setDecryptError("INVALID KEY \u2014 Decryption produced empty result. Verify the key matches the report.");
        return;
      }

      // Helper: open PDF in new tab from a URL/data-URI
      const openPdfInTab = (src: string, downloadName: string) => {
        const newWindow = window.open();
        if (newWindow) {
          newWindow.document.write(
            `<html><head><title>TRINETRA MISSION REPORT \u2014 ${missionId}</title></head>` +
            `<body style="margin:0;background:#000;"><iframe src="${src}" style="width:100%;height:100vh;border:none;"></iframe></body></html>`
          );
          newWindow.document.close();
        } else {
          const link = document.createElement('a');
          link.href = src;
          link.download = downloadName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      };
      
      // Detect content type from decrypted result
      if (decryptedStr.startsWith('data:application/pdf')) {
        // New format: PDF data URI
        openPdfInTab(decryptedStr, `MISSION_${missionId}_DECRYPTED.pdf`);
      } else if (decryptedStr.startsWith('%PDF-') || decryptedStr.substring(0, 20).includes('%PDF')) {
        // Legacy format: raw PDF binary string from doc.output()
        // Convert raw string to byte array then to Blob
        const rawLen = decryptedStr.length;
        const bytes = new Uint8Array(rawLen);
        for (let i = 0; i < rawLen; i++) {
          bytes[i] = decryptedStr.charCodeAt(i) & 0xff;
        }
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);
        openPdfInTab(blobUrl, `MISSION_${missionId}_DECRYPTED.pdf`);
      } else if (decryptedStr.startsWith('data:image/')) {
        // Image data URI \u2014 open in new tab
        const newWindow = window.open();
        if (newWindow) {
          newWindow.document.write(
            `<html><head><title>TRINETRA DECRYPTED IMAGE \u2014 ${missionId}</title></head>` +
            `<body style="margin:0;background:#000;display:flex;align-items:center;justify-content:center;min-height:100vh;">` +
            `<img src="${decryptedStr}" style="max-width:100%;max-height:100vh;object-fit:contain;"/>` +
            `</body></html>`
          );
          newWindow.document.close();
        }
      } else {
        // Raw text or unknown \u2014 download as text file
        const blob = new Blob([decryptedStr], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `MISSION_${missionId}_DECRYPTED.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
      addActivityLog("REPORT_DECRYPT", "MISSION REPORT DECRYPTED & OPENED SUCCESSFULLY", "#10b981");
    } catch (e) {
      setDecryptError("DECRYPTION FAILED — Check your key and try again.");
    }
  };

  // Handle uploaded .aes file
  const handleFileUploadDecrypt = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      if (content) {
        setLastEncryptedData(content);
        setDecryptMode(true);
        setDecryptError(null);
        addActivityLog("FILE_LOADED", `ENCRYPTED FILE LOADED: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`, "#3b82f6");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-[#101415] text-white font-['Hanken_Grotesk',sans-serif] flex flex-col antialiased">
      {/* ── TOP NAVBAR ── */}
      <header className="h-[56px] border-b border-white/10 bg-[#101415] px-6 flex items-center justify-between shrink-0 sticky top-0 z-40">
        <div className="flex items-center gap-5">
          <div 
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 font-extrabold text-[16px] tracking-tight cursor-pointer hover:opacity-80 transition-opacity"
          >
            <div className="w-7 h-7 rounded-lg bg-[#ff6415]/15 border border-[#ff6415]/30 flex items-center justify-center text-[#ff6415]">
              {IC.shield}
            </div>
            <span>Trinetra</span>
          </div>
          <div className="h-5 w-px bg-white/10" />
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-white/50 uppercase tracking-wider">Mission Status</span>
            <span className="text-[12px] font-bold text-white leading-tight">OPERATION SENTINEL - ALPHA ({missionId})</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <button 
            onClick={() => setActiveBottomSection("LOGS")}
            className="text-[12px] font-bold text-[#ff6415] uppercase tracking-wider py-1 border-b-2 border-[#ff6415]"
          >
            Missions
          </button>
          <button 
            onClick={() => setActiveBottomSection("ANALYTICS")}
            className="text-[12px] font-bold text-white/60 hover:text-white uppercase tracking-wider py-1 transition-colors"
          >
            Analytics
          </button>
          <button 
            onClick={() => setActiveBottomSection("REPORTS")}
            className="text-[12px] font-bold text-white/60 hover:text-white uppercase tracking-wider py-1 transition-colors"
          >
            Reports
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-[#ff6415]/10 border border-[#ff6415]/30 px-3 py-1 rounded-full text-[10px] font-bold text-[#ff6415]">
            <div className="w-1.5 h-1.5 rounded-full bg-[#ff6415] animate-pulse" />
            SYSTEM: STABLE
          </div>
          <button className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-white/70 hover:text-white transition-all">
            {IC.bell}
          </button>
          <button 
            onClick={() => router.push('/settings')}
            className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-white/70 hover:text-white transition-all"
          >
            {IC.settings}
          </button>
          <div className="w-8 h-8 rounded-full bg-[#f45b0b] text-white flex items-center justify-center text-[11px] font-bold shadow-[0_4px_12px_rgba(244,91,11,0.3)]">
            SS
          </div>
        </div>
      </header>

      {/* ── MAIN WORKSPACE CONTENT ── */}
      <main className="flex-1 p-4 lg:p-6 max-w-[1720px] mx-auto w-full space-y-4">
        
        {/* 1. MISSION TIMELINE CARD */}
        <section className="w-full bg-[#202522]/90 border border-white/10 backdrop-blur-[24px] rounded-[8px] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
          <div className="relative flex items-center justify-between max-w-5xl mx-auto px-4">
            {/* Background Line */}
            <div className="absolute top-3 left-10 right-10 h-0.5 bg-white/10 z-0" />
            {/* Active Progress Line */}
            <div className="absolute top-3 left-10 w-[50%] h-0.5 bg-[#f45b0b] z-0 shadow-[0_0_8px_rgba(244,91,11,0.5)]" />

            {missionStages.map((stage, idx) => {
              const isComplete = stage.status === "complete";
              const isCurrent = stage.status === "current";
              return (
                <div key={idx} className="relative z-10 flex flex-col items-center text-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                    isComplete 
                      ? "bg-[#f45b0b] text-white shadow-[0_0_12px_rgba(244,91,11,0.5)]"
                      : isCurrent
                      ? "bg-[#101415] border-2 border-[#ff6415] text-[#ff6415] shadow-[0_0_14px_rgba(255,100,21,0.4)]"
                      : "bg-[#161b1c] border border-white/20 text-white/30"
                  }`}>
                    {isComplete ? (
                      <span className="text-[10px] font-black">✓</span>
                    ) : isCurrent ? (
                      <div className="w-2 h-2 rounded-full bg-[#ff6415] animate-ping" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                    )}
                  </div>
                  <span className={`text-[10px] font-mono font-bold mt-2 tracking-wider ${
                    isCurrent ? "text-[#ff6415]" : isComplete ? "text-white" : "text-white/40"
                  }`}>
                    {stage.label}
                  </span>
                  <span className="text-[9px] font-mono text-white/40 mt-0.5">{stage.time}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* 2. MISSION KPI CARDS (2 -> 3 -> 6 Responsive Grid) */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
          {/* Battery */}
          <div className="bg-[#202522]/90 border border-white/10 border-l-4 border-l-[#3b82f6] backdrop-blur-[24px] rounded-[8px] p-3 shadow-md flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-white/50 text-[10px] font-bold uppercase tracking-wider">
              <span className="text-[#3b82f6]">{IC.battery}</span> BATTERY
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-mono font-bold text-[18px] text-white">{telemetry.batt.toFixed(1)}%</span>
              <span className="text-[11px] font-mono text-white/50">{telemetry.voltage.toFixed(2)}V</span>
            </div>
          </div>

          {/* Payloads */}
          <div 
            onClick={() => setIsPayloadModalOpen(true)}
            className="bg-[#202522]/90 border border-white/10 border-l-4 border-l-[#f45b0b] backdrop-blur-[24px] rounded-[8px] p-3 shadow-md flex flex-col justify-between cursor-pointer hover:border-white/20 hover:scale-[1.01] transition-all group"
            title="Click to configure payload dispenser & release timing"
          >
            <div className="flex items-center justify-between text-white/50 text-[10px] font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <span className="text-[#f45b0b]">{IC.box}</span> {selectedModel === "AgriCNN" ? "PAYLOAD" : "PAYLOADS"}
              </span>
              <span className="text-[9px] text-[#f45b0b] opacity-60 group-hover:opacity-100 font-mono transition-opacity flex items-center gap-1">
                ⚙ CONFIGURE
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-mono font-bold text-[18px] text-white">{selectedModel === "AgriCNN" ? "5" : telemetry.delivered}</span>
              <span className="text-[11px] font-mono text-[#f45b0b]">{selectedModel === "AgriCNN" ? "L" : "DROPPED"}</span>
              {isAutoDropping && (
                <span className="text-[9px] font-mono text-[#10b981] animate-pulse ml-auto bg-[#10b981]/15 px-1.5 py-0.5 rounded border border-[#10b981]/30">
                  AUTO-DROPPING...
                </span>
              )}
            </div>
          </div>

          {/* Humans */}
          <div className={`bg-[#202522]/90 border border-white/10 border-l-4 ${selectedModel === "AgriCNN" ? "border-l-[#10b981]" : "border-l-[#ef4444]"} backdrop-blur-[24px] rounded-[8px] p-3 shadow-md flex flex-col justify-between`}>
            <div className="flex items-center gap-1.5 text-white/50 text-[10px] font-bold uppercase tracking-wider">
              <span className={selectedModel === "AgriCNN" ? "text-[#10b981]" : "text-[#ef4444]"}>{IC.user}</span> {selectedModel === "AgriCNN" ? "CROP" : "HUMANS"}
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-mono font-bold text-[18px] text-white">{humanCount}</span>
              <span className={`text-[11px] font-mono ${selectedModel === "AgriCNN" ? "text-[#10b981]" : "text-[#ef4444]"}`}>{selectedModel === "AgriCNN" ? "DISEASE DETECTED" : "DETECTED"}</span>
            </div>
          </div>

          {/* Altitude */}
          <div className="bg-[#202522]/90 border border-white/10 border-l-4 border-l-[#d4d4d8] backdrop-blur-[24px] rounded-[8px] p-3 shadow-md flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-white/50 text-[10px] font-bold uppercase tracking-wider">
              <span className="text-white/60">↕</span> ALTITUDE
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-mono font-bold text-[18px] text-white">{telemetry.alt.toFixed(1)}m</span>
              <span className="text-[11px] font-mono text-white/40">MSL</span>
            </div>
          </div>

          {/* Speed */}
          <div className="bg-[#202522]/90 border border-white/10 border-l-4 border-l-[#d4d4d8] backdrop-blur-[24px] rounded-[8px] p-3 shadow-md flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-white/50 text-[10px] font-bold uppercase tracking-wider">
              <span className="text-white/60">{IC.compass}</span> SPEED
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-mono font-bold text-[18px] text-white">{telemetry.vel.toFixed(1)}m/s</span>
              <span className="text-[11px] font-mono text-white/40">GS</span>
            </div>
          </div>

          {/* Signal */}
          <div className="bg-[#202522]/90 border border-white/10 border-l-4 border-l-[#ff6415] backdrop-blur-[24px] rounded-[8px] p-3 shadow-md flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-white/50 text-[10px] font-bold uppercase tracking-wider">
              <span className="text-[#ff6415]">{IC.signal}</span> SIGNAL
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-mono font-bold text-[18px] text-white">99.1%</span>
              <span className="text-[11px] font-mono text-[#10b981]">STABLE</span>
            </div>
          </div>
        </section>

        {/* ── PAYLOAD DISPENSER POPUP MODAL (OPTION A) ── */}
        {isPayloadModalOpen && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsPayloadModalOpen(false);
            }}
          >
            <div className="w-full max-w-[520px] bg-[#161a1b] border border-white/15 rounded-[12px] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.85)] space-y-4">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#f45b0b]/15 border border-[#f45b0b]/30 flex items-center justify-center text-[#f45b0b]">
                    {IC.box}
                  </div>
                  <div>
                    <h3 className="text-[13px] font-bold text-white tracking-wide flex items-center gap-2">
                      PAYLOAD DISPENSER CONTROL
                      {isAutoDropping && (
                        <span className="text-[9px] font-mono text-[#10b981] bg-[#10b981]/15 border border-[#10b981]/30 px-1.5 py-0.5 rounded animate-pulse">
                          ● AUTO-RUNNING
                        </span>
                      )}
                    </h3>
                    <p className="text-[10px] font-mono text-white/50">
                      MISSION {missionId} // DISPENSER CAPACITY: 10 UNITS
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPayloadModalOpen(false)}
                  className="w-7 h-7 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors cursor-pointer text-sm"
                >
                  ✕
                </button>
              </div>

              {/* Source Mode Toggle (Simulation vs Serial Console) */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono font-bold text-white/60 uppercase tracking-wider block">
                  DATA SOURCE SELECTION
                </span>
                <div className="grid grid-cols-2 gap-2 bg-black/40 p-1 rounded-[8px] border border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setPayloadSourceMode("SIMULATION");
                      addActivityLog("SOURCE_SWITCH", "PAYLOAD DISPENSER SWITCHED TO SIMULATION MODE", "#3b82f6");
                    }}
                    className={`py-2 px-3 rounded-[6px] text-[11px] font-bold tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      payloadSourceMode === "SIMULATION"
                        ? "bg-[#f45b0b] text-white shadow-[0_2px_10px_rgba(244,91,11,0.4)]"
                        : "text-white/60 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <span>💻</span> SIMULATION
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPayloadSourceMode("SERIAL");
                      setIsAutoDropping(false);
                      addActivityLog("SOURCE_SWITCH", `PAYLOAD DISPENSER SWITCHED TO SERIAL COM CONSOLE (${selectedPort})`, "#f59e0b");
                    }}
                    className={`py-2 px-3 rounded-[6px] text-[11px] font-bold tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      payloadSourceMode === "SERIAL"
                        ? "bg-[#f59e0b] text-white shadow-[0_2px_10px_rgba(245,158,11,0.4)]"
                        : "text-white/60 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <span>🔌</span> SERIAL CONSOLE
                  </button>
                </div>
              </div>

              {/* Current Status & Progress Meter */}
              <div className="bg-white/[0.03] border border-white/10 rounded-[8px] p-3 space-y-2">
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-white/60">PAYLOAD INVENTORY</span>
                  <span className="font-bold text-white">
                    <span className="text-[#f45b0b] text-base">{telemetry.delivered}</span> / 10 DROPPED 
                    <span className="text-white/40 ml-1.5">({10 - telemetry.delivered} LOADED)</span>
                  </span>
                </div>
                
                {/* 10-Slot Segmented Dispenser Bar */}
                <div className="grid grid-cols-10 gap-1.5 pt-1">
                  {Array.from({ length: 10 }).map((_, slotIdx) => {
                    const isDropped = slotIdx < telemetry.delivered;
                    return (
                      <div
                        key={slotIdx}
                        className={`h-2.5 rounded-sm transition-all duration-300 ${
                          isDropped
                            ? "bg-[#f45b0b] shadow-[0_0_8px_rgba(244,91,11,0.6)]"
                            : "bg-white/10 border border-white/5"
                        }`}
                        title={`Payload #${slotIdx + 1}: ${isDropped ? "Dropped" : "Loaded"}`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* SIMULATION MODE CONTROLS */}
              {payloadSourceMode === "SIMULATION" && (
                <div className="space-y-4">
                  {/* Option 1: Delay Between Increments */}
                  <div className="space-y-2 bg-white/[0.02] border border-white/10 rounded-[8px] p-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-mono font-bold text-white/70 uppercase tracking-wider flex items-center gap-1.5">
                        <span>⏱</span> OPTION 1: DELAY BETWEEN INCREMENTS
                      </label>
                      <span className="text-[10px] font-mono text-[#f45b0b] font-bold">
                        {isFinite(payloadDelayMs) ? `${payloadDelayMs} ms` : "∞ MANUAL"}
                      </span>
                    </div>

                    {/* Quick Preset Chips */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {[
                        { label: "1000ms (1s)", val: 1000 },
                        { label: "2500ms (2.5s)", val: 2500 },
                        { label: "5000ms (5s)", val: 5000 },
                        { label: "10000ms (10s)", val: 10000 },
                        { label: "∞ MANUAL", val: Infinity },
                      ].map(chip => (
                        <button
                          key={chip.label}
                          type="button"
                          onClick={() => {
                            setPayloadDelayMs(chip.val);
                            if (isFinite(chip.val)) {
                              setPayloadCustomDelayInput(chip.val.toString());
                            }
                          }}
                          className={`px-2.5 py-1 rounded-[5px] text-[10px] font-mono font-bold transition-all cursor-pointer ${
                            payloadDelayMs === chip.val
                              ? "bg-[#f45b0b] text-white shadow-[0_0_10px_rgba(244,91,11,0.4)]"
                              : "bg-white/[0.05] hover:bg-white/[0.1] text-white/70 border border-white/5"
                          }`}
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>

                    {/* Custom Input */}
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[10px] font-mono text-white/50">Custom Delay:</span>
                      <div className="relative flex-1">
                        <input
                          type="number"
                          min={1000}
                          step={250}
                          disabled={!isFinite(payloadDelayMs)}
                          value={isFinite(payloadDelayMs) ? payloadCustomDelayInput : "MANUAL"}
                          onChange={(e) => {
                            const val = e.target.value;
                            setPayloadCustomDelayInput(val);
                            const parsed = parseInt(val, 10);
                            if (!isNaN(parsed) && parsed >= 1000) {
                              setPayloadDelayMs(parsed);
                            }
                          }}
                          placeholder="Min 1000"
                          className="w-full bg-black/40 border border-white/10 rounded-[6px] px-2.5 py-1 text-[11px] font-mono text-white placeholder-white/30 outline-none focus:border-[#f45b0b] disabled:opacity-40"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-mono text-white/40">
                          ms
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Option 2: Total Target Dropped Count (1 to 10) */}
                  <div className="space-y-2 bg-white/[0.02] border border-white/10 rounded-[8px] p-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-mono font-bold text-white/70 uppercase tracking-wider flex items-center gap-1.5">
                        <span>🎯</span> OPTION 2: TARGET DROPPED COUNT (1 TO 10)
                      </label>
                      <span className="text-[10px] font-mono text-[#10b981] font-bold">
                        TARGET: {payloadTargetCount} UNITS
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      {/* Stepper [-] [Value] [+] */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setPayloadTargetCount(prev => Math.max(1, prev - 1))}
                          className="w-8 h-8 rounded-[6px] bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white font-bold text-base flex items-center justify-center transition-all cursor-pointer"
                        >
                          -
                        </button>
                        <div className="w-16 h-8 rounded-[6px] bg-black/40 border border-white/10 flex items-center justify-center font-mono font-bold text-[14px] text-white">
                          {payloadTargetCount}
                        </div>
                        <button
                          type="button"
                          onClick={() => setPayloadTargetCount(prev => Math.min(10, prev + 1))}
                          className="w-8 h-8 rounded-[6px] bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white font-bold text-base flex items-center justify-center transition-all cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      {/* Quick Presets */}
                      <div className="flex items-center gap-1">
                        {[1, 3, 5, 8, 10].map(cnt => (
                          <button
                            key={cnt}
                            type="button"
                            onClick={() => setPayloadTargetCount(cnt)}
                            className={`w-7 h-7 rounded-[5px] text-[10px] font-mono font-bold transition-all cursor-pointer ${
                              payloadTargetCount === cnt
                                ? "bg-[#10b981] text-white shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                                : "bg-white/[0.05] hover:bg-white/[0.1] text-white/70 border border-white/5"
                            }`}
                          >
                            {cnt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Trigger Buttons */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {/* Start / Pause Auto Drop */}
                    <button
                      type="button"
                      disabled={!isFinite(payloadDelayMs)}
                      onClick={() => {
                        if (isAutoDropping) {
                          setIsAutoDropping(false);
                          addActivityLog("PAYLOAD_PAUSE", "AUTO-DROP TIMER PAUSED BY OPERATOR", "#f59e0b");
                        } else {
                          if (telemetry.delivered >= payloadTargetCount) {
                            if (telemetry.delivered >= 10) {
                              addActivityLog("PAYLOAD_LIMIT", "ALL 10 PAYLOADS ALREADY DROPPED", "#ef4444");
                              return;
                            }
                            setPayloadTargetCount(Math.min(10, telemetry.delivered + 1));
                          }
                          setIsAutoDropping(true);
                          addActivityLog(
                            "PAYLOAD_START",
                            `AUTO-DROP ARMED: RELEASING UNTIL ${payloadTargetCount} UNITS AT ${payloadDelayMs}ms INTERVAL`,
                            "#10b981"
                          );
                        }
                      }}
                      className={`py-2 px-3 rounded-[6px] text-[11px] font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md disabled:opacity-40 disabled:cursor-not-allowed ${
                        isAutoDropping
                          ? "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-900/30"
                          : "bg-[#f45b0b] hover:bg-[#ff6817] text-white shadow-[#f45b0b]/30"
                      }`}
                    >
                      {isAutoDropping ? "⏸ PAUSE" : "▶ START AUTO"}
                    </button>

                    {/* Single Step Drop */}
                    <button
                      type="button"
                      disabled={telemetry.delivered >= 10}
                      onClick={handleDropSinglePayload}
                      className="py-2 px-3 rounded-[6px] bg-white/[0.08] hover:bg-white/[0.15] border border-white/10 text-white text-[11px] font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <span>🎯</span> DROP (+1)
                    </button>

                    {/* Reset Button */}
                    <button
                      type="button"
                      onClick={handleResetPayloads}
                      className="py-2 px-3 rounded-[6px] bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 text-[11px] font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>↺</span> RESET (0)
                    </button>
                  </div>
                </div>
              )}

              {/* SERIAL CONSOLE MODE DETAILS */}
              {payloadSourceMode === "SERIAL" && (
                <div className="space-y-3 bg-white/[0.02] border border-white/10 rounded-[8px] p-3 font-mono">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-white/60">ACTIVE SERIAL PORT:</span>
                    <span className="text-[#f59e0b] font-bold">{selectedPort} (115200 BAUD)</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-[10px] text-[#10b981] bg-[#10b981]/10 border border-[#10b981]/30 p-2 rounded-[6px]">
                    <div className="w-2 h-2 rounded-full bg-[#10b981] animate-ping" />
                    <span>LISTENING FOR HARDWARE TELEMETRY PACKETS ON COM BUS</span>
                  </div>

                  <div className="text-[10px] text-white/50 space-y-1">
                    <p>• Micro-controller drops will automatically increment the delivered counter upon UART confirmation.</p>
                    <p>• Recent Serial Packets: {rawSerialLogs.length} received.</p>
                  </div>

                  {rawSerialLogs.length > 0 && (
                    <div className="bg-black/60 rounded p-2 text-[9px] text-white/70 space-y-0.5 max-h-20 overflow-y-auto">
                      {rawSerialLogs.slice(-3).map((l, idx) => (
                        <div key={idx} className="truncate text-white/60 font-mono">
                          {l}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={handleDropSinglePayload}
                      className="py-1.5 px-3 rounded-[6px] bg-white/[0.08] hover:bg-white/[0.15] border border-white/10 text-white text-[10px] font-bold tracking-wider uppercase transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <span>🎯</span> MANUAL OVERRIDE DROP (+1)
                    </button>
                    <button
                      type="button"
                      onClick={handleResetPayloads}
                      className="py-1.5 px-3 rounded-[6px] bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 text-[10px] font-bold tracking-wider uppercase transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <span>↺</span> RESET (0)
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* ── 12-COLUMN MAIN WORKSPACE GRID ── */}
        <div className="grid grid-cols-12 gap-4 items-start">
          
          {/* ════ LEFT COLUMN (~70% Width | col-span-12 lg:col-span-8) ════ */}
          <div className="col-span-12 lg:col-span-8 space-y-4">
            
            {/* 3. MAIN CAMERA / UAV FEED CARD */}
            <div ref={feedContainerRef} className="w-full aspect-video bg-black border border-white/10 rounded-[8px] relative overflow-hidden shadow-[0_14px_40px_rgba(0,0,0,0.6)] flex flex-col justify-between p-4 group">
              {/* Actual Video Stream & Canvas */}
              <video 
                ref={videoRef}
                autoPlay 
                playsInline 
                muted 
                onLoadedMetadata={(e: any) => {
                  if (e.target && !uploadedImage) {
                    setVideoSize({ w: e.target.videoWidth, h: e.target.videoHeight });
                  }
                }}
                className="absolute inset-0 w-full h-full object-cover z-0" 
              />
              <canvas ref={canvasRef} className="hidden" />
              <canvas ref={recordingCanvasRef} className="hidden" />

              {uploadedImage && (
                <div className="absolute inset-0 z-[5] bg-black">
                  <img src={uploadedImage} alt="Uploaded Feed" className="w-full h-full object-contain" />
                  <button 
                    onClick={() => {
                      setUploadedImage(null);
                      setIsPlaying(true);
                      handleSwitchCamera(selectedCameraId);
                    }}
                    className="absolute top-2 right-2 bg-black/60 hover:bg-black/90 text-white/80 hover:text-white border border-white/20 text-xs font-bold px-2 py-1 rounded-[4px] shadow backdrop-blur transition-colors"
                  >
                    ✕ CLEAR IMAGE
                  </button>
                </div>
              )}

              {/* Connect Camera Prompt overlay if inactive */}
              {!cameraActive && !uploadedImage && (
                <div 
                  onClick={() => handleSwitchCamera("")}
                  className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 cursor-pointer hover:bg-black/50 transition-all p-4 text-center"
                >
                  <div className="w-12 h-12 rounded-full bg-[#f45b0b]/20 border border-[#f45b0b]/50 text-[#ff6415] flex items-center justify-center text-xl mb-2 shadow-[0_0_20px_rgba(244,91,11,0.3)]">
                    🎥
                  </div>
                  <span className="font-mono text-[12px] font-bold text-white tracking-wide">CONNECT INTEGRATED CAMERA</span>
                  <span className="text-[10px] text-white/60 mt-1">Click to grant browser webcam access</span>
                </div>
              )}

              {/* Bounding Box Visualizer Overlay */}
              {latestDetections.map((det: any, idx) => {
                // Handle both {x,y,w,h} and backend {box: [x1, y1, x2, y2]} formats
                let x = 0, y = 0, w = 0, h = 0;
                if (det.box && Array.isArray(det.box)) {
                  x = det.box[0];
                  y = det.box[1];
                  w = det.box[2] - det.box[0];
                  h = det.box[3] - det.box[1];
                } else {
                  x = det.x;
                  y = det.y;
                  w = det.w;
                  h = det.h;
                }
                const conf = det.conf || 0;
                const isAgri = selectedModel === "AgriCNN";
                const hasTrackId = det.track_id !== undefined && det.track_id !== null;

                const trackColorPalette = [
                  { border: "border-[#3b82f6] shadow-[0_0_12px_rgba(59,130,246,0.55)]", bg: "bg-[#2563eb]" },
                  { border: "border-[#10b981] shadow-[0_0_12px_rgba(16,185,129,0.55)]", bg: "bg-[#059669]" },
                  { border: "border-[#f59e0b] shadow-[0_0_12px_rgba(245,158,11,0.55)]", bg: "bg-[#d97706]" },
                  { border: "border-[#ec4899] shadow-[0_0_12px_rgba(236,72,153,0.55)]", bg: "bg-[#db2777]" },
                  { border: "border-[#8b5cf6] shadow-[0_0_12px_rgba(139,92,246,0.55)]", bg: "bg-[#7c3aed]" },
                  { border: "border-[#06b6d4] shadow-[0_0_12px_rgba(6,182,212,0.55)]", bg: "bg-[#0891b2]" },
                  { border: "border-[#f97316] shadow-[0_0_12px_rgba(249,115,22,0.55)]", bg: "bg-[#ea580c]" },
                  { border: "border-[#14b8a6] shadow-[0_0_12px_rgba(20,184,166,0.55)]", bg: "bg-[#0d9488]" },
                ];

                const colorScheme = hasTrackId
                  ? trackColorPalette[Math.abs(det.track_id) % trackColorPalette.length]
                  : { border: "border-[#10b981] shadow-[0_0_10px_rgba(16,185,129,0.4)]", bg: "bg-[#10b981]" };

                const displayName = (det.class_name || det.name || "TARGET").toUpperCase();
                const labelText = isAgri
                  ? `CROP ${(conf * 100).toFixed(0)}%`
                  : hasTrackId
                  ? `${displayName} #${det.track_id} ${(conf * 100).toFixed(0)}%`
                  : `${displayName} ${(conf * 100).toFixed(0)}%`;
                
                return (
                  <div 
                    key={idx}
                    className={`absolute border-2 z-10 pointer-events-none rounded transition-all ${colorScheme.border}`}
                    style={{
                      left: `${(x / (videoSize.w || 1280)) * 100}%`,
                      top: `${(y / (videoSize.h || 720)) * 100}%`,
                      width: `${(w / (videoSize.w || 1280)) * 100}%`,
                      height: `${(h / (videoSize.h || 720)) * 100}%`,
                    }}
                  >
                    <span className={`absolute -top-5 left-0 ${colorScheme.bg} text-white text-[9px] font-mono font-bold px-1.5 py-[1px] rounded shadow tracking-wider whitespace-nowrap`}>
                      {labelText}
                    </span>
                  </div>
                );
              })}

              {/* A. Top-Left OSD */}
              <div className="relative z-20 flex items-center gap-2.5 bg-[#101415]/85 border border-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-[6px] font-mono text-[11px] font-bold w-fit shadow-md">
                <div className="w-2 h-2 rounded-full bg-[#ef4444] animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                <span className="text-white">LIVE</span>
                <span className="text-white/20">|</span>
                <span className="text-white/80">UAV-01</span>
                <span className="text-white/20">|</span>
                <span className="text-[#ff6415]">{telemetry.lat.toFixed(4)}° N, {telemetry.lng.toFixed(4)}° W</span>
              </div>

              {/* B. Top-Right Telemetry & Tracking Mini-Cards */}
              <div className="absolute top-4 right-4 z-20 flex gap-2">
                <div className="bg-[#101415]/85 border border-white/10 backdrop-blur-md px-3 py-1.5 rounded-[6px] text-center min-w-[58px]">
                  <span className="block text-[8px] font-mono font-bold text-white/50 uppercase">ALT</span>
                  <span className="block text-[12px] font-mono font-bold text-white">{telemetry.alt.toFixed(0)}m</span>
                </div>
                <div className="bg-[#101415]/85 border border-white/10 backdrop-blur-md px-3 py-1.5 rounded-[6px] text-center min-w-[58px]">
                  <span className="block text-[8px] font-mono font-bold text-white/50 uppercase">SPD</span>
                  <span className="block text-[12px] font-mono font-bold text-white">{telemetry.vel.toFixed(1)}</span>
                </div>
                <div className="bg-[#101415]/85 border border-white/10 backdrop-blur-md px-3 py-1.5 rounded-[6px] text-center min-w-[62px]">
                  <span className="block text-[8px] font-mono font-bold text-[#10b981] uppercase">ACTIVE</span>
                  <span className="block text-[12px] font-mono font-bold text-[#10b981]">{activeTrackCount}</span>
                </div>
                <div className="bg-[#101415]/85 border border-white/10 backdrop-blur-md px-3 py-1.5 rounded-[6px] text-center min-w-[62px]">
                  <span className="block text-[8px] font-mono font-bold text-[#3b82f6] uppercase">UNIQUE</span>
                  <span className="block text-[12px] font-mono font-bold text-[#3b82f6]">{uniqueTracksSeen}</span>
                </div>
              </div>



              {/* Bottom Controls Container */}
              <div className="relative z-20 space-y-2 mt-auto">
                {/* D. Playback Timeline */}
                <div className="flex items-center gap-3 font-mono text-[10px] text-white/60">
                  <span className="w-12 text-right">
                    {frameBufferIndex === -1 ? "" : `${(-((frameBufferRef.current.length - frameBufferIndex) * 1.5)).toFixed(1)}s`}
                  </span>
                  <div 
                    className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden relative cursor-pointer group"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const percent = (e.clientX - rect.left) / rect.width;
                      const buf = frameBufferRef.current;
                      if (buf.length > 0) {
                        if (percent > 0.95) {
                          setFrameBufferIndex(-1);
                          setIsPlaying(true);
                          if (videoRef.current) videoRef.current.play().catch(() => {});
                        } else {
                          const targetIdx = Math.floor(percent * buf.length);
                          setFrameBufferIndex(targetIdx);
                          const img = new Image();
                          img.onload = () => {
                            const canvas = canvasRef.current;
                            if (canvas) {
                              const ctx = canvas.getContext("2d");
                              if (ctx) {
                                canvas.width = img.width;
                                canvas.height = img.height;
                                ctx.drawImage(img, 0, 0);
                              }
                            }
                          };
                          img.src = buf[targetIdx].image;
                          if (videoRef.current) videoRef.current.pause();
                          setIsPlaying(false);
                        }
                      }
                    }}
                  >
                    <div 
                      className="h-full bg-[#f45b0b] rounded-full shadow-[0_0_8px_rgba(244,91,11,0.5)] transition-all duration-200 group-hover:bg-[#ff6817]" 
                      style={{ 
                        width: `${frameBufferIndex === -1 ? 100 : Math.max(5, (frameBufferIndex / Math.max(1, frameBufferRef.current.length)) * 100)}%` 
                      }} 
                    />
                  </div>
                  <span className={`w-8 font-bold transition-colors ${frameBufferIndex === -1 ? "text-[#ff6415]" : "text-white/40"}`}>
                    LIVE
                  </span>
                </div>

                {/* E, F, G. Controls Bar */}
                <div className="flex items-center justify-between bg-[#101415]/85 border border-white/10 backdrop-blur-md px-3.5 py-2 rounded-[8px]">
                  {/* Left: Source & Model Selectors */}
                  <div className="flex items-center gap-2">
                    <select 
                      value={selectedCameraId}
                      onChange={(e) => handleSwitchCamera(e.target.value)}
                      className="bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 rounded-[6px] px-2.5 py-1 text-[11px] font-bold text-white outline-none cursor-pointer transition-colors"
                    >
                      <option value="" className="bg-[#101415]">🎥 Integrated / Default Camera</option>
                      {availableCameras.map(cam => (
                        <option key={cam.deviceId} value={cam.deviceId} className="bg-[#101415]">{cam.label}</option>
                      ))}
                    </select>
                    <div className="h-4 w-px bg-white/10" />
                    <div className="relative overflow-hidden cursor-pointer bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 rounded-[6px] px-2.5 py-1 transition-colors flex items-center justify-center">
                      <span className="text-[11px] font-bold text-white whitespace-nowrap">📷 UPLOAD</span>
                      <input 
                        type="file" 
                        accept="image/*,video/*" 
                        onChange={handleFileUpload} 
                        className="absolute inset-0 opacity-0 cursor-pointer w-full"
                      />
                    </div>
                    <div className="h-4 w-px bg-white/10" />
                    <div className="flex gap-1">
                      {(["V2", "YOLOv8m", "version3", "AgriCNN"] as const).map(mod => (
                        <button
                          key={mod}
                          onClick={() => {
                            setSelectedModel(mod);
                            addActivityLog("MODEL_SWITCH", `AI ENGINE LOADED: ${mod}`, "#ff6415");
                          }}
                          className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase transition-all ${
                            selectedModel === mod 
                              ? "bg-[#f45b0b] text-white shadow-[0_2px_8px_rgba(244,91,11,0.4)]"
                              : "bg-white/[0.05] hover:bg-white/[0.1] text-white/60"
                          }`}
                        >
                          {mod === "V2" ? "V2" : mod === "version3" ? "V3" : mod}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Center: Playback Controls */}
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => {
                        // Skip back 10 seconds (~7 frames at 1.5s)
                        const buf = frameBufferRef.current;
                        if (buf.length > 0) {
                          const skipFrames = Math.min(7, buf.length);
                          const targetIdx = Math.max(0, buf.length - skipFrames - 1);
                          setFrameBufferIndex(targetIdx);
                          // Draw the buffered frame on the canvas
                          const img = new Image();
                          img.onload = () => {
                            const canvas = canvasRef.current;
                            if (canvas) {
                              const ctx = canvas.getContext("2d");
                              if (ctx) {
                                canvas.width = img.width;
                                canvas.height = img.height;
                                ctx.drawImage(img, 0, 0);
                              }
                            }
                          };
                          img.src = buf[targetIdx].image;
                          // Pause video during review
                          if (videoRef.current) videoRef.current.pause();
                          setIsPlaying(false);
                        }
                      }}
                      className="text-white/60 hover:text-white text-xs font-mono cursor-pointer"
                    >↶10</button>
                    <button 
                      onClick={() => {
                        const newPlaying = !isPlaying;
                        setIsPlaying(newPlaying);
                        if (videoRef.current) {
                          if (newPlaying) {
                            videoRef.current.play().catch(() => {});
                            setFrameBufferIndex(-1); // Return to live
                          } else {
                            videoRef.current.pause();
                          }
                        }
                      }}
                      className="w-7 h-7 rounded-full bg-[#f45b0b] text-white flex items-center justify-center text-xs font-bold shadow-[0_2px_10px_rgba(244,91,11,0.4)]"
                    >
                      {isPlaying ? "⏸" : "▶"}
                    </button>
                    <button 
                      onClick={() => {
                        // Skip forward 10 seconds (~7 frames)
                        const buf = frameBufferRef.current;
                        if (frameBufferIndex >= 0 && frameBufferIndex < buf.length - 1) {
                          const targetIdx = Math.min(buf.length - 1, frameBufferIndex + 7);
                          setFrameBufferIndex(targetIdx);
                          const img = new Image();
                          img.onload = () => {
                            const canvas = canvasRef.current;
                            if (canvas) {
                              const ctx = canvas.getContext("2d");
                              if (ctx) {
                                canvas.width = img.width;
                                canvas.height = img.height;
                                ctx.drawImage(img, 0, 0);
                              }
                            }
                          };
                          img.src = buf[targetIdx].image;
                        } else {
                          // Already at live — resume
                          setFrameBufferIndex(-1);
                          setIsPlaying(true);
                          if (videoRef.current) videoRef.current.play().catch(() => {});
                        }
                      }}
                      className="text-white/60 hover:text-white text-xs font-mono cursor-pointer"
                    >10↷</button>
                  </div>

                  {/* Right: Actions & Fullscreen */}
                  <div className="flex items-center gap-2">
                    {uploadedImage && (
                      <button 
                        onClick={downloadImageWithDetections}
                        className="px-2.5 py-1 rounded-[6px] bg-[#10b981]/20 hover:bg-[#10b981]/30 border border-[#10b981]/50 text-[#10b981] text-[11px] font-bold transition-all"
                      >
                        📥 DOWNLOAD IMAGE
                      </button>
                    )}
                    
                    {!uploadedImage && (
                      isRecording ? (
                        <button 
                          onClick={stopRecording}
                          className="px-2.5 py-1 rounded-[6px] bg-red-500 hover:bg-red-600 text-white text-[11px] font-bold transition-all animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                        >
                          ⏹ STOP RECORDING
                        </button>
                      ) : (
                        <button 
                          onClick={startRecording}
                          className="px-2.5 py-1 rounded-[6px] bg-white/[0.06] hover:bg-red-500/20 border border-white/10 hover:border-red-500/50 hover:text-red-400 text-white text-[11px] font-bold transition-all"
                        >
                          🔴 RECORD
                        </button>
                      )
                    )}

                    <div className="h-4 w-px bg-white/10 mx-1" />
                    <button 
                      onClick={() => {
                        if (document.fullscreenElement) {
                          document.exitFullscreen().catch(() => {});
                        } else if (feedContainerRef.current) {
                          feedContainerRef.current.requestFullscreen().catch(() => {});
                        }
                      }}
                      className="p-1.5 rounded-[6px] bg-white/[0.06] hover:bg-white/[0.12] text-white/70 hover:text-white transition-all"
                    >
                      ⛶
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. WORKSPACE NAVIGATION CARD */}
            <div className="w-full bg-[#202522]/90 border border-white/10 backdrop-blur-[24px] rounded-[8px] p-2 flex flex-wrap items-center gap-1.5 shadow-sm">
              {(["LIVE", "TELEMETRY", "DETECTIONS", "PAYLOADS", "BATTERY", "LOGS"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveNavTab(tab)}
                  className={`px-4 py-2 rounded-[6px] text-[11px] font-bold tracking-wider uppercase transition-all ${
                    activeNavTab === tab
                      ? "bg-[#ff6415]/15 border border-[#ff6415] text-[#ff6415] shadow-[0_0_12px_rgba(255,100,21,0.2)]"
                      : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* 5. SENSOR CARDS (4 Columns Desktop) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* IMU Roll */}
              <div className="bg-[#202522]/90 border border-white/10 border-t-2 border-t-[#3b82f6] backdrop-blur-[24px] rounded-[8px] p-4 h-24 flex flex-col justify-between shadow-sm">
                <span className="text-[10px] font-mono font-bold text-white/50 uppercase tracking-wider">IMU ROLL</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-[18px] font-mono font-bold text-white">+{telemetry.roll}</span>
                  <span className="text-[11px] font-mono text-white/50">deg</span>
                </div>
              </div>

              {/* IMU Pitch */}
              <div className="bg-[#202522]/90 border border-white/10 border-t-2 border-t-[#3b82f6] backdrop-blur-[24px] rounded-[8px] p-4 h-24 flex flex-col justify-between shadow-sm">
                <span className="text-[10px] font-mono font-bold text-white/50 uppercase tracking-wider">IMU PITCH</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-[18px] font-mono font-bold text-white">{telemetry.pitch}</span>
                  <span className="text-[11px] font-mono text-white/50">deg</span>
                </div>
              </div>

              {/* IMU Yaw */}
              <div className="bg-[#202522]/90 border border-white/10 border-t-2 border-t-[#3b82f6] backdrop-blur-[24px] rounded-[8px] p-4 h-24 flex flex-col justify-between shadow-sm">
                <span className="text-[10px] font-mono font-bold text-white/50 uppercase tracking-wider">IMU YAW</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-[18px] font-mono font-bold text-white">{telemetry.yaw.toFixed(1)}</span>
                  <span className="text-[11px] font-mono text-white/50">deg</span>
                </div>
              </div>

              {/* Wind Resistance */}
              <div className="bg-[#202522]/90 border border-white/10 border-t-2 border-t-[#f45b0b] backdrop-blur-[24px] rounded-[8px] p-4 h-24 flex flex-col justify-between shadow-sm">
                <span className="text-[10px] font-mono font-bold text-white/50 uppercase tracking-wider">WIND RES</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-[18px] font-mono font-bold text-white">{telemetry.wind}</span>
                  <span className="text-[11px] font-mono text-white/50">m/s NW</span>
                </div>
              </div>
            </div>

            {/* 6. ANALYTICS / REPORTS / LOGS SELECTOR */}
            <div className="flex items-center gap-2">
              {(["ANALYTICS", "TRACKS", "REPORTS", "LOGS"] as const).map(sec => (
                <button
                  key={sec}
                  onClick={() => setActiveBottomSection(sec)}
                  className={`px-5 py-2 rounded-[8px] text-[11px] font-bold uppercase tracking-wider transition-all ${
                    activeBottomSection === sec 
                      ? "bg-[#f45b0b] text-white shadow-[0_7px_18px_rgba(244,91,11,0.25)]"
                      : "bg-[#202522]/90 border border-white/10 text-white/60 hover:text-white hover:bg-white/[0.06]"
                  }`}
                >
                  {sec === "TRACKS" ? `TRACKS (${uniqueTracksSeen})` : sec}
                </button>
              ))}
            </div>

            {/* 7. ACTIVITY LOGS / SUBVIEW CARD */}
            <div className="w-full bg-[#161b1c] border border-white/10 rounded-[8px] p-4 min-h-[240px] flex flex-col justify-between shadow-md">
              {activeBottomSection === "LOGS" && (
                <>
                  <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
                    <div className="flex items-center gap-2 text-[11px] font-mono font-bold text-white">
                      <span>↻ ACTIVITY LOGS</span>
                      <span className="flex items-center gap-1 text-[9px] text-[#10b981] bg-[#10b981]/15 px-2 py-0.5 rounded-full border border-[#10b981]/30">
                        ● LIVE ({activityLogs.length})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleDownloadCSV}
                        className="px-2.5 py-1.5 rounded-[6px] bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <span>📥</span> DOWNLOAD CSV
                      </button>
                      <button
                        onClick={handleDownloadReport}
                        disabled={isGeneratingReport}
                        className="px-3.5 py-1.5 rounded-[6px] bg-[#f45b0b] hover:bg-[#ff6817] text-white text-[11px] font-bold transition-all flex items-center gap-1.5 shadow-[0_4px_12px_rgba(244,91,11,0.22)] cursor-pointer"
                      >
                        {isGeneratingReport ? "ENCRYPTING..." : "EXPORT ENCRYPTED PDF"}
                      </button>
                    </div>
                  </div>
                  
                  <div className="h-48 overflow-y-auto font-mono text-[11px] space-y-2 pr-2">
                    {activityLogs.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-white/40 text-xs">
                        AWAITING TELEMETRY & FEED EVENTS...
                      </div>
                    ) : (
                      activityLogs.map((log, i) => (
                        <div key={i} className="flex flex-col gap-0.5 text-white/70 py-1 border-b border-white/[0.04]">
                          <div className="flex items-start gap-2">
                            <span className="text-[#3b82f6] shrink-0 font-mono">[{log.time}]</span>
                            <span className="font-bold shrink-0 font-mono" style={{ color: log.color }}>{log.tag}:</span>
                            <span className="text-white/90">{log.msg}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-[9px] font-mono text-white/40 pl-6">
                            <span>📍 GPS: {log.lat.toFixed(5)}N, {log.lng.toFixed(5)}W</span>
                            <span>⚡ BATT: {log.batt.toFixed(0)}% ({log.voltage.toFixed(2)}V)</span>
                            <span>⛰ ALT: {log.alt.toFixed(1)}m</span>
                            <span>💨 SPD: {log.vel.toFixed(1)}m/s</span>
                            {log.humanCount > 0 && <span className="text-[#10b981] font-bold">🎯 TARGETS: {log.humanCount}</span>}
                            {log.humanIds && log.humanIds !== "-" && (
                              <span className="text-[#38bdf8] font-bold bg-[#38bdf8]/10 px-1.5 py-0.5 rounded border border-[#38bdf8]/30">
                                🆔 {log.humanIds}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}

              {activeBottomSection === "ANALYTICS" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <span className="text-[12px] font-bold text-white">FLIGHT TELEMETRY METRICS</span>
                    <span className="text-[10px] font-mono text-[#ff6415]">REAL-TIME VECTOR SYNC</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 font-mono text-center">
                    <div className="bg-white/[0.04] p-3 rounded-[6px] border border-white/5">
                      <span className="text-[9px] text-white/50 block">AVG ALTITUDE</span>
                      <span className="text-[16px] font-bold text-white">{telemetry.alt.toFixed(1)} m</span>
                    </div>
                    <div className="bg-white/[0.04] p-3 rounded-[6px] border border-white/5">
                      <span className="text-[9px] text-white/50 block">MAX VELOCITY</span>
                      <span className="text-[16px] font-bold text-[#ff6415]">{telemetry.vel.toFixed(1)} m/s</span>
                    </div>
                    <div className="bg-white/[0.04] p-3 rounded-[6px] border border-white/5">
                      <span className="text-[9px] text-white/50 block">RESERVE POWER</span>
                      <span className="text-[16px] font-bold text-[#10b981]">{telemetry.batt.toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              )}

              {activeBottomSection === "TRACKS" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-mono font-bold text-white">BYTETRACK TARGET REGISTRY</span>
                      <span className="text-[9px] font-mono bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 px-1.5 py-0.5 rounded">
                        {activeTrackCount} ACTIVE / {uniqueTracksSeen} TOTAL OBSERVED
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleDownloadTracksCSV}
                        className="px-2.5 py-1 bg-[#38bdf8]/15 hover:bg-[#38bdf8]/25 text-[#38bdf8] border border-[#38bdf8]/30 text-[10px] font-bold rounded-[6px] transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <span>📥</span> EXPORT TRACKS CSV
                      </button>
                      <button
                        onClick={() => {
                          fetch(`http://localhost:8000/tracking/sessions/${sessionFolder}/stream_${id || "default"}/reset`, { method: "POST" })
                            .catch(() => {});
                          setTrackHistoryList([]);
                          setActiveTrackCount(0);
                          setUniqueTracksSeen(0);
                          frameCounterRef.current = 0;
                        }}
                        className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold rounded-[6px] transition-colors cursor-pointer"
                      >
                        RESET TRACKER
                      </button>
                    </div>
                  </div>

                  <div className="h-44 overflow-y-auto font-mono text-[10px] space-y-1.5 pr-2">
                    {trackHistoryList.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-white/40 space-y-1">
                        <span className="text-base">🎯</span>
                        <span>NO PERSISTENT TARGET TRACKS RECORDED YET</span>
                        <span className="text-[9px] text-white/20">TARGETS WILL RECEIVE UNIQUE BYTETRACK IDENTIFIERS AS SOON AS CONFIRMED</span>
                      </div>
                    ) : (
                      trackHistoryList.map(trk => (
                        <div key={trk.track_id} className="p-2 rounded bg-white/[0.03] border border-white/5 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className="text-white font-bold bg-[#3b82f6]/20 border border-[#3b82f6]/40 px-2 py-0.5 rounded text-[10px]">
                              TRACK #{trk.track_id}
                            </span>
                            <span className="text-white font-bold uppercase">{trk.class_name}</span>
                            <span className="text-[9px] bg-[#10b981]/15 text-[#10b981] px-1.5 py-0.5 rounded border border-[#10b981]/30">
                              CONF: {(trk.conf * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-white/50 text-[9px]">
                            <span>FRAMES: {trk.observations}</span>
                            <span>FIRST: {trk.first_seen}</span>
                            <span>LAST: {trk.last_seen}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeBottomSection === "REPORTS" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-mono font-bold text-white">MISSION INTELLIGENCE & AUDIT TRAIL</span>
                      <span className="text-[9px] font-mono bg-[#ff6415]/15 text-[#ff6415] border border-[#ff6415]/30 px-1.5 py-0.5 rounded">
                        {detectionAuditTrail.length} ACQUISITIONS
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleDownloadCSV}
                        className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold rounded-[6px] transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <span>📥</span> CSV EXPORT
                      </button>
                      <button
                        onClick={handleDownloadReport}
                        disabled={isGeneratingReport}
                        className="px-3 py-1 bg-[#f45b0b] hover:bg-[#ff6817] text-white text-[10px] font-bold rounded-[6px] transition-colors cursor-pointer shadow-[0_2px_8px_rgba(244,91,11,0.3)]"
                      >
                        {isGeneratingReport ? "ENCRYPTING..." : "ENCRYPTED PDF"}
                      </button>
                    </div>
                  </div>

                  {/* Live Report Detection Audit Stream */}
                  <div className="h-44 overflow-y-auto font-mono text-[10px] space-y-1.5 pr-2">
                    {detectionAuditTrail.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-white/40 space-y-1">
                        <span className="text-base">🎯</span>
                        <span>TARGET SCANNING ACTIVE — DETECTION AUDIT LOGS WILL BE RECORDED CHRONOLOGICALLY</span>
                        <span className="text-[9px] text-white/20">ALL DETECTIONS AUTOMATICALLY ARCHIVED FROM FIRST ACQUISITION MOMENT</span>
                      </div>
                    ) : (
                      detectionAuditTrail.map((evt, idx) => (
                        <div key={idx} className="p-2 rounded bg-white/[0.03] border border-white/5 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className="text-[#10b981] font-bold">#{idx + 1}</span>
                            <span className="text-[#3b82f6]">[{evt.time}]</span>
                            <span className="text-white font-bold">HUMAN TARGET CONFIRMED ({evt.count} Person{evt.count > 1 ? "s" : ""})</span>
                            {evt.trackIds && evt.trackIds.length > 0 && (
                              <span className="text-[9px] bg-[#3b82f6]/15 text-[#3b82f6] px-1.5 py-0.5 rounded border border-[#3b82f6]/30">
                                IDs: {evt.trackIds.map(id => '#' + id).join(', ')}
                              </span>
                            )}
                            <span className="text-[9px] bg-[#10b981]/15 text-[#10b981] px-1.5 py-0.5 rounded border border-[#10b981]/30">
                              CONF: {(evt.maxConf * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-white/50 text-[9px]">
                            <span>📍 {evt.lat.toFixed(5)}° N, {evt.lng.toFixed(5)}° W</span>
                            <span>ENGINE: {evt.model}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* ════ RIGHT COLUMN (~30% Width | col-span-12 lg:col-span-4) ════ */}
          <div className="col-span-12 lg:col-span-4 space-y-4">

            {/* AgriCNN Data Card */}
            {selectedModel === "AgriCNN" && agriData && (
              <div className="w-full bg-[#202522]/90 border border-white/10 backdrop-blur-[24px] rounded-[8px] p-3 shadow-md flex flex-col">
                <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2">
                  <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></div>
                  <h3 className="font-mono font-bold text-[11px] text-[#10b981] uppercase tracking-wider">Agricultural Scan</h3>
                </div>
                <div className="space-y-2 text-[11px] font-mono">
                  <div className="flex justify-between">
                    <span className="text-white/50">Crop Type:</span>
                    <span className="text-white font-bold">{agriData.cropType || "Unknown"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Condition:</span>
                    <span className={`font-bold ${agriData.diseaseType === "healthy" ? "text-[#10b981]" : "text-[#f59e0b]"}`}>{agriData.diseaseType || "Unknown"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Confidence:</span>
                    <span className="text-white font-bold">{agriData.confidence}%</span>
                  </div>
                  <div className="flex justify-between mt-2 pt-2 border-t border-white/10">
                    <span className="text-white/50">Treatment:</span>
                    <span className="text-white font-bold text-right max-w-[150px] whitespace-normal break-words">{agriData.pesticide}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Spray Est.:</span>
                    <span className="text-white font-bold">{agriData.sprayAmount} L</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* 8. TACTICAL GPS CARD (~256px Height) */}
            <div className="w-full h-64 bg-[#202522]/90 border border-white/10 backdrop-blur-[24px] rounded-[8px] p-3 shadow-md flex flex-col">
              <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold text-white flex items-center gap-1.5">
                    <span className="text-[#ff6415]">◎</span> TACTICAL GPS
                  </span>
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                    manualOverride 
                      ? "bg-[#ef4444]/15 text-[#ef4444] border-[#ef4444]/30"
                      : gpsPrioritySource === "OCR"
                      ? "bg-[#10b981]/15 text-[#10b981] border-[#10b981]/30"
                      : gpsPrioritySource === "MANUAL"
                      ? "bg-[#f59e0b]/15 text-[#f59e0b] border-[#f59e0b]/30"
                      : "bg-[#3b82f6]/15 text-[#3b82f6] border-[#3b82f6]/30"
                  }`}>
                    {manualOverride ? "OVERRIDE" : `SRC: ${gpsPrioritySource}`}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setManualOverride(!manualOverride);
                      updateResolvedGps();
                    }}
                    title="Toggle Manual GPS Override"
                    className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold transition-all ${
                      manualOverride 
                        ? "bg-[#ef4444] text-white shadow" 
                        : "bg-white/[0.06] hover:bg-white/[0.12] text-white/70"
                    }`}
                  >
                    {manualOverride ? "MANUAL OVERRIDE" : "AUTO"}
                  </button>
                  <button onClick={() => setIsEditingGps(!isEditingGps)} className="text-white/60 hover:text-white text-xs">✎</button>
                  <button className="text-white/60 hover:text-white text-xs">{IC.expand}</button>
                </div>
              </div>

              {isEditingGps && (
                <div className="bg-black/70 p-2 rounded-[6px] mb-2 flex items-center gap-2 text-[10px] font-mono border border-white/10 z-10">
                  <input 
                    placeholder="Lat" 
                    value={manualLatInput} 
                    onChange={(e) => setManualLatInput(e.target.value)} 
                    className="bg-white/10 border border-white/10 px-2 py-0.5 rounded text-white w-24 text-[10px] outline-none"
                  />
                  <input 
                    placeholder="Lng" 
                    value={manualLngInput} 
                    onChange={(e) => setManualLngInput(e.target.value)} 
                    className="bg-white/10 border border-white/10 px-2 py-0.5 rounded text-white w-24 text-[10px] outline-none"
                  />
                  <button 
                    onClick={() => {
                      setManualOverride(true);
                      updateResolvedGps();
                      setIsEditingGps(false);
                    }}
                    className="bg-[#f45b0b] hover:bg-[#ff6817] text-white px-2.5 py-0.5 rounded font-bold text-[9px]"
                  >
                    SET
                  </button>
                </div>
              )}

              <div className="flex-1 rounded-[6px] overflow-hidden relative border border-white/5">
                <MapComponent lat={telemetry.lat} lng={telemetry.lng} />
              </div>
            </div>

            {/* 9. UAV TELEMETRY CARD (~225px Height) */}
            <div className="w-full bg-[#202522]/90 border border-white/10 backdrop-blur-[24px] rounded-[8px] p-4 shadow-md space-y-2.5">
              <div className="text-[11px] font-mono font-bold text-white border-b border-white/10 pb-2 flex items-center gap-1.5">
                <span className="text-[#ff6415]">◉</span> UAV TELEMETRY
              </div>
              
              <div className="flex justify-between items-center py-1 border-b border-white/5 text-[11px] font-mono">
                <span className="text-white/50">LAT</span>
                <span className="text-white font-bold">{telemetry.lat.toFixed(6)}° N</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/5 text-[11px] font-mono">
                <span className="text-white/50">LON</span>
                <span className="text-white font-bold">{telemetry.lng.toFixed(6)}° W</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/5 text-[11px] font-mono">
                <span className="text-white/50">ALT</span>
                <span className="text-white font-bold">{telemetry.alt.toFixed(1)} m</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/5 text-[11px] font-mono">
                <span className="text-white/50">SPD</span>
                <span className="text-white font-bold">{telemetry.vel.toFixed(1)} m/s</span>
              </div>
              <div className="flex justify-between items-center pt-1 text-[11px] font-mono">
                <span className="text-white/50">HDG</span>
                <span className="text-[#3b82f6] font-bold">{telemetry.heading}° S</span>
              </div>
            </div>

            {/* 10. SERIAL CONSOLE CARD (min ~200px Height) */}
            <div className="w-full bg-[#0c0e10] border border-white/10 rounded-[8px] p-3 shadow-md flex flex-col min-h-[200px]">
              <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
                <span className="text-[10px] font-mono font-bold text-white/80 flex items-center gap-1.5">
                  <span className="text-[#ff6415]">▣</span> SERIAL CONSOLE
                </span>
                <div className="flex items-center gap-1.5">
                  <select 
                    value={selectedPort}
                    onChange={(e) => {
                      setSelectedPort(e.target.value);
                      addActivityLog("COM_PORT", `HARDWARE COM PORT SWITCHED: ${e.target.value}`, "#10b981");
                    }}
                    className="bg-[#ff6415]/10 border border-[#ff6415]/30 rounded text-[9px] font-mono font-bold text-[#ff6415] px-1.5 py-0.5 outline-none cursor-pointer max-w-[120px] truncate"
                  >
                    {availablePorts.length > 0 ? (
                      availablePorts.map((p: any) => (
                        <option key={p.port} value={p.port} className="bg-[#0c0e10]">
                          {p.port} {p.description ? `(${p.description})` : ''}
                        </option>
                      ))
                    ) : (
                      <option value="COM3" className="bg-[#0c0e10]">COM3 (Default)</option>
                    )}
                  </select>
                  <span className="text-[9px] font-mono text-[#10b981] bg-[#10b981]/15 px-1.5 py-0.5 rounded border border-[#10b981]/30">
                    CONNECTED
                  </span>
                </div>
              </div>
              
              <div ref={rawTerminalRef} className="flex-1 overflow-y-auto font-mono text-[10px] space-y-1 text-white/70 h-32 pr-1">
                {rawSerialLogs.map((line, idx) => (
                  <div key={idx} className={line.includes("STREAM ACTIVE") ? "text-[#ff6415] font-bold" : ""}>
                    {line}
                  </div>
                ))}
                <span className="inline-block w-1.5 h-3 bg-[#ff6415] animate-pulse align-middle" />
              </div>
            </div>

            {/* 11. FEED CONSOLE CARD */}
            <div className="w-full bg-[#0c0e10] border border-white/10 rounded-[8px] p-3 shadow-md flex flex-col min-h-[200px]">
              <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
                <span className="text-[10px] font-mono font-bold text-white/80 flex items-center gap-1.5">
                  <span className="text-[#3b82f6]">◔</span> FEED CONSOLE
                </span>
                <span className="text-[9px] font-mono text-white/40">AUTO-SYNC</span>
              </div>
              <div ref={osdTerminalRef} className="flex-1 overflow-y-auto font-mono text-[10px] space-y-1 text-white/70 h-32 pr-1">
                {osdLogs.map((line, idx) => (
                  <div key={idx} className="text-white/70">{line}</div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* ── FOOTER ── */}
      <footer className="h-9 border-t border-white/10 bg-[#101415] px-6 flex items-center justify-between text-[10px] font-mono text-white/50 shrink-0">
        <div className="flex items-center gap-6">
          <span>OPERATOR: <strong className="text-white">STAVAN SHETH</strong></span>
          <span>MISSION_ID: <strong className="text-white">{missionId}</strong></span>
          <span>CHROMA_RAG: <strong className="text-[#10b981]">ONLINE</strong></span>
        </div>
        <div className="flex items-center gap-4">
          <span>ESP-NOW LINK: <strong className="text-[#ff6415]">99.1% HDOP={telemetry.hdop}</strong></span>
        </div>
      </footer>

      {/* Encryption Key Notification Modal */}
      {encryptionKey && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#181d1a] border border-white/20 rounded-[16px] p-6 max-w-lg w-full text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-[#f45b0b] text-white flex items-center justify-center mx-auto text-xl font-bold">
              ✓
            </div>
            <h3 className="text-lg font-bold text-white">Report Encrypted & Downloaded</h3>
            <p className="text-xs text-white/60">Save your military decryption key to view the mission report:</p>
            
            {/* Key Display + Copy */}
            <div className="flex items-center gap-2">
              <div className="flex-1 p-3 bg-black/50 border border-white/10 rounded font-mono text-[#ff6415] font-bold text-sm select-all text-left">
                {encryptionKey}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(encryptionKey).then(() => {
                    setKeyCopied(true);
                    setTimeout(() => setKeyCopied(false), 2500);
                  });
                }}
                className={`px-3 py-3 rounded-[8px] font-bold text-xs transition-all shrink-0 ${
                  keyCopied 
                    ? "bg-[#10b981] text-white" 
                    : "bg-white/10 hover:bg-white/20 text-white"
                }`}
              >
                {keyCopied ? "✓ COPIED" : "📋 COPY"}
              </button>
            </div>

            {/* Decrypt Mode Toggle */}
            {!decryptMode ? (
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    if (lastEncryptedData && encryptionKey) {
                      handleDecryptAndOpen(lastEncryptedData, encryptionKey);
                    }
                  }}
                  className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-[8px] font-bold text-xs transition-all"
                >
                  🔓 OPEN REPORT NOW
                </button>
                <button 
                  onClick={() => { setDecryptMode(true); setDecryptKeyInput(""); setDecryptError(null); }}
                  className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-[8px] font-bold text-xs transition-all"
                >
                  📂 OPEN .AES FILE
                </button>
              </div>
            ) : (
              <div className="space-y-3 text-left">
                <div className="text-[10px] font-mono font-bold text-white/60 uppercase">DECRYPT & OPEN ENCRYPTED REPORT</div>
                
                {/* File Upload */}
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".aes"
                    onChange={handleFileUploadDecrypt}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-2 bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 rounded-[6px] text-white text-[11px] font-bold transition-colors text-center"
                  >
                    📂 SELECT .AES FILE
                  </button>
                  {lastEncryptedData && (
                    <span className="flex items-center text-[10px] font-mono text-[#10b981] px-2">✓ FILE LOADED</span>
                  )}
                </div>

                {/* Key Input */}
                <input
                  type="text"
                  value={decryptKeyInput}
                  onChange={(e) => setDecryptKeyInput(e.target.value)}
                  placeholder="Enter decryption key (e.g. TRN-ASM32-...)"
                  className="w-full bg-black/40 border border-white/10 rounded-[6px] px-3 py-2.5 text-white font-mono text-sm outline-none focus:border-[#ff6415]/50 placeholder:text-white/30"
                />

                {decryptError && (
                  <div className="text-[10px] font-mono text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/20 rounded px-3 py-1.5">
                    ⚠ {decryptError}
                  </div>
                )}

                <button
                  onClick={() => {
                    if (lastEncryptedData && decryptKeyInput.trim()) {
                      handleDecryptAndOpen(lastEncryptedData, decryptKeyInput.trim());
                    } else {
                      setDecryptError("Please load a .aes file and enter the decryption key.");
                    }
                  }}
                  className="w-full py-2.5 bg-[#10b981] hover:bg-[#0d9668] text-white rounded-[8px] font-bold text-xs shadow-lg transition-colors"
                >
                  🔓 DECRYPT & OPEN PDF
                </button>

                <button
                  onClick={() => { setDecryptMode(false); setDecryptError(null); }}
                  className="w-full py-1.5 text-white/40 hover:text-white/70 text-[10px] font-mono transition-colors"
                >
                  ← BACK
                </button>
              </div>
            )}

            <button 
              onClick={() => { setEncryptionKey(null); setDecryptMode(false); setDecryptError(null); }}
              className="w-full py-2.5 bg-[#f45b0b] hover:bg-[#ff6817] text-white rounded-[8px] font-bold text-xs shadow-lg"
            >
              ACKNOWLEDGE & DISMISS
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
