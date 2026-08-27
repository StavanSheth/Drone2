/* eslint-disable @next/next/no-img-element */
"use client"
import { useState, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Asset {
  id: number;
  title: string;
  price: number;
  tag: string;
  meta: string;
  badge: string;
  badgeColor: string;
  img: string;
}

interface CartItem {
  id: number;
  title: string;
  price: number;
}

interface MissionTab {
  id: string;
  name: string;
  assets: number;
  size: string;
  status: "live" | "closed" | "default";
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const MISSION_TABS: MissionTab[] = [
  { id: "sw", name: "Sierra Wildfire Op", assets: 1187, size: "2.4GB", status: "live" },
  { id: "cr", name: "Canyon Rescue", assets: 28, size: "850MB", status: "closed" },
  { id: "mf", name: "Marine Foundation", assets: 315, size: "12GB", status: "default" },
];

const ASSETS: Asset[] = [
  {
    id: 1, title: "Zone Analysis", price: 49, tag: "AERIAL RGB",
    meta: "4K · GEO-TAGGED", badge: "AERIAL RGB", badgeColor: "#1a2a1a",
    img: "linear-gradient(135deg, #2d4a2d 0%, #1a3a1a 40%, #3d6b3d 70%, #4a8f4a 100%)",
  },
  {
    id: 2, title: "Hotspot Map", price: 125, tag: "THERMAL FLIR",
    meta: "RADIOMETRIC · HIGH GAIN", badge: "THERMAL FLIR", badgeColor: "#3a1a00",
    img: "linear-gradient(135deg, #8b3a00 0%, #cc5500 30%, #ff8800 60%, #ffcc00 100%)",
  },
  {
    id: 3, title: "Vegetation NDVI", price: 89, tag: "MULTISPECTRAL",
    meta: "NDVI · BURN SEVERITY", badge: "MULTISPECTRAL", badgeColor: "#0a2a1a",
    img: "linear-gradient(135deg, #0a3a1a 0%, #1a6b2a 40%, #2a9a3a 70%, #3acc4a 100%)",
  },
  {
    id: 4, title: "Evacuation Routes", price: 35, tag: "AERIAL RGB",
    meta: "POST-IMPACT · LOGISTICS", badge: "AERIAL RGB", badgeColor: "#001a3a",
    img: "linear-gradient(135deg, #001a3a 0%, #003a6b 30%, #0066aa 60%, #0099cc 100%)",
  },
];

const PURCHASED = [
  { id: 1, title: "Structural Heat Analysis #092", sub: "PURCHASED 2H AGO · SIERRA WILDFIRE", img: "linear-gradient(135deg,#3a1a00,#cc5500)" },
  { id: 2, title: "North Ridge Topography View", sub: "PURCHASED AUG 14 · SIERRA WILDFIRE", img: "linear-gradient(135deg,#001a3a,#0066aa)" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const S: Record<string, React.CSSProperties> = {
  root: { display: "flex", height: "100vh", background: "#f4f5f7", fontFamily: "'DM Sans', 'Segoe UI', sans-serif", overflow: "hidden", fontSize: 13 },
};

function Badge({ text, color = "#e8eaed", textColor = "#444" }: { text: string; color?: string; textColor?: string }) {
  return (
    <span style={{ background: color, color: textColor, fontSize: 9, fontWeight: 700, letterSpacing: 1.5, padding: "2px 7px", borderRadius: 3, textTransform: "uppercase" as const }}>
      {text}
    </span>
  );
}

// ─── Sidebar (Payment) ────────────────────────────────────────────────────────
function PaymentSidebar({
  item, onClose, onConfirm,
}: { item: Asset; onClose: () => void; onConfirm: (item: Asset) => void }) {
  const [step, setStep] = useState<"review" | "pay" | "done">("review");
  const [cardNum, setCardNum] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [name, setName] = useState("");

  const tax = +(item.price * 0.08).toFixed(2);
  const total = +(item.price + tax).toFixed(2);

  const inputStyle: React.CSSProperties = {
    width: "100%", border: "1px solid #dde1e7", borderRadius: 6, padding: "9px 12px",
    fontSize: 13, fontFamily: "inherit", background: "#fff", outline: "none",
    color: "#1a1a2e", boxSizing: "border-box",
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(10,10,20,0.45)", backdropFilter: "blur(4px)",
      display: "flex", justifyContent: "flex-end",
      animation: "fadeIn 0.2s ease",
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 380, background: "#fff", height: "100%", display: "flex", flexDirection: "column",
          boxShadow: "-8px 0 40px rgba(0,0,0,0.15)",
          animation: "slideIn 0.25s cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        {/* Header */}
        <div style={{ padding: "20px 22px 16px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, color: "#888", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 3 }}>
              {step === "done" ? "ORDER COMPLETE" : step === "pay" ? "SECURE PAYMENT" : "ASSET PURCHASE"}
            </div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#1a1a2e" }}>
              {step === "done" ? "Purchase Successful" : item.title}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "#f0f2f5", border: "none", borderRadius: 6, width: 32, height: 32, cursor: "pointer", fontSize: 16, color: "#666", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "20px 22px" }}>

          {step === "done" ? (
            <div style={{ textAlign: "center", paddingTop: 40 }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#e8f5e9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 28 }}>✓</div>
              <div style={{ fontWeight: 700, fontSize: 18, color: "#1a1a2e", marginBottom: 8 }}>Asset Unlocked!</div>
              <div style={{ color: "#888", fontSize: 13, lineHeight: 1.6, marginBottom: 24 }}>
                <strong>{item.title}</strong> has been added to your purchased assets. You can download it anytime.
              </div>
              <div style={{ background: "#f8f9fa", borderRadius: 10, padding: 16, textAlign: "left", marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12 }}>
                  <span style={{ color: "#888" }}>Order ID</span>
                  <span style={{ fontFamily: "monospace", color: "#444" }}>#SGM-45920</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: "#888" }}>Amount Charged</span>
                  <span style={{ fontWeight: 700, color: "#1a1a2e" }}>${total}</span>
                </div>
              </div>
              <button
                onClick={() => { onConfirm(item); onClose(); }}
                style={{ width: "100%", background: "#1a1a2e", color: "#fff", border: "none", borderRadius: 8, padding: "12px 0", fontWeight: 700, fontSize: 14, cursor: "pointer", letterSpacing: 0.5 }}
              >
                DOWNLOAD ASSET
              </button>
            </div>
          ) : step === "pay" ? (
            <>
              {/* Order summary */}
              <div style={{ background: "#f8f9fa", borderRadius: 10, padding: 14, marginBottom: 20 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 6, background: item.img, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "#1a1a2e" }}>{item.title}</div>
                    <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{item.meta}</div>
                  </div>
                </div>
                <div style={{ borderTop: "1px solid #e8eaed", paddingTop: 10, display: "flex", flexDirection: "column", gap: 5 }}>
                  {[["Subtotal", `$${item.price}`], ["Processing fee (8%)", `$${tax}`]].map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#666" }}>
                      <span>{k}</span><span>{v}</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 14, color: "#1a1a2e", marginTop: 4 }}>
                    <span>Total</span><span>${total}</span>
                  </div>
                </div>
              </div>

              {/* Card form */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: "#888", textTransform: "uppercase" as const }}>Card Details</div>
                <input style={inputStyle} placeholder="Cardholder Name" value={name} onChange={e => setName(e.target.value)} />
                <input
                  style={inputStyle} placeholder="1234 5678 9012 3456"
                  value={cardNum}
                  onChange={e => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 16);
                    setCardNum(v.replace(/(.{4})/g, "$1 ").trim());
                  }}
                />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <input style={inputStyle} placeholder="MM / YY" value={expiry}
                    onChange={e => {
                      let v = e.target.value.replace(/\D/g, "").slice(0, 4);
                      if (v.length > 2) v = v.slice(0, 2) + " / " + v.slice(2);
                      setExpiry(v);
                    }}
                  />
                  <input style={inputStyle} placeholder="CVV" value={cvv} maxLength={4} onChange={e => setCvv(e.target.value.replace(/\D/g, ""))} />
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 16, color: "#aaa", fontSize: 11 }}>
                <span>🔒</span> 256-bit SSL encrypted · PCI compliant
              </div>
            </>
          ) : (
            /* REVIEW STEP */
            <>
              <div style={{ background: item.img, borderRadius: 10, height: 140, marginBottom: 16, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 10, left: 10 }}>
                  <Badge text={item.badge} color="rgba(0,0,0,0.5)" textColor="#fff" />
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 17, color: "#1a1a2e", marginBottom: 4 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: "#888", letterSpacing: 0.5 }}>{item.meta}</div>
              </div>
              <div style={{ background: "#f8f9fa", borderRadius: 10, padding: 14, marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: "#aaa", textTransform: "uppercase" as const, marginBottom: 10 }}>
                  Included in this asset
                </div>
                {[
                  "Full-resolution UAV imagery",
                  "GeoTIFF + KMZ formats",
                  "Metadata & calibration report",
                  "Lifetime access & re-downloads",
                ].map(f => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7, fontSize: 12, color: "#444" }}>
                    <span style={{ color: "#2a9a3a", fontWeight: 700 }}>✓</span> {f}
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f0f4ff", borderRadius: 8, padding: "10px 14px" }}>
                <span style={{ fontSize: 13, color: "#555" }}>Asset price</span>
                <span style={{ fontWeight: 800, fontSize: 20, color: "#1a1a2e" }}>${item.price}</span>
              </div>
            </>
          )}
        </div>

        {/* Footer CTA */}
        {step !== "done" && (
          <div style={{ padding: "16px 22px", borderTop: "1px solid #eee" }}>
            {step === "review" ? (
              <button
                onClick={() => setStep("pay")}
                style={{ width: "100%", background: "#1a1a2e", color: "#fff", border: "none", borderRadius: 8, padding: "13px 0", fontWeight: 700, fontSize: 14, cursor: "pointer", letterSpacing: 0.5 }}
              >
                CONTINUE TO PAYMENT →
              </button>
            ) : (
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => setStep("review")}
                  style={{ flex: 1, background: "#f0f2f5", color: "#444", border: "none", borderRadius: 8, padding: "13px 0", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
                >
                  ← BACK
                </button>
                <button
                  onClick={() => { if (cardNum.length >= 19 && expiry.length >= 6 && cvv.length >= 3 && name) setStep("done"); }}
                  style={{
                    flex: 2, background: cardNum.length >= 19 && expiry.length >= 6 && cvv.length >= 3 && name ? "#1a1a2e" : "#b0b4bb",
                    color: "#fff", border: "none", borderRadius: 8, padding: "13px 0", fontWeight: 700, fontSize: 14,
                    cursor: cardNum.length >= 19 && expiry.length >= 6 && cvv.length >= 3 && name ? "pointer" : "not-allowed", letterSpacing: 0.5,
                    transition: "background 0.2s",
                  }}
                >
                  PAY ${total}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TrinetraMarketplace() {
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [purchaseItem, setPurchaseItem] = useState<Asset | null>(null);
  const [purchased, setPurchased] = useState<number[]>([]);
  const [realMissions, setRealMissions] = useState<{id: string, count: number}[]>([]);
  const [realImages, setRealImages] = useState<{filename: string, url: string}[]>([]);

  const isRealMission = (tabId: string) => !["sw", "cr", "mf"].includes(tabId);

  useEffect(() => {
    const fetchRealMissions = async () => {
      try {
        const res = await fetch("http://localhost:8000/list-missions-with-detections");
        if (res.ok) {
          const data = await res.json();
          setRealMissions(data);
        }
      } catch (err) {
        console.error("Failed to fetch real missions:", err);
      }
    };
    fetchRealMissions();
  }, []);

  useEffect(() => {
    const fetchRealImages = async () => {
      // Fetch for real missions AND explicitly for Sierra Wildfire (sw)
      if (activeTab && (isRealMission(activeTab) || activeTab === "sw")) {
        try {
          const res = await fetch(`http://localhost:8000/list-detections/${activeTab}`);
          if (res.ok) {
            const data = await res.json();
            setRealImages(data);
          }
        } catch (err) {
          console.error("Failed to fetch real images:", err);
        }
      } else {
        setRealImages([]);
      }
    };
    fetchRealImages();
  }, [activeTab]);

  const cartCount = cart.length;
  const cartTotal = cart.reduce((s, i) => s + i.price, 0);

  const handlePurchase = (asset: Asset) => setPurchaseItem(asset);
  const handleConfirm = (item: Asset) => {
    setPurchased(p => [...p, item.id]);
    setCart(c => c.filter(i => i.id !== item.id));
  };

  const toggleCart = (asset: Asset) => {
    setCart(c => c.find(i => i.id === asset.id)
      ? c.filter(i => i.id !== asset.id)
      : [...c, { id: asset.id, title: asset.title, price: asset.price }]
    );
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes slideIn { from { transform:translateX(100%) } to { transform:translateX(0) } }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #dde1e7; border-radius: 4px; }
      `}</style>

      <div style={S.root}>


        {/* ── MAIN CONTENT ── */}
        <div style={{ flex: 1, overflow: "auto", background: "#f4f5f7" }}>

          {/* Top bar */}
          <div style={{ background: "#fff", borderBottom: "1px solid #eaecf0", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, maxWidth: 460 }}>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: "#f4f5f7", borderRadius: 8, padding: "8px 14px", border: "1px solid #eaecf0" }}>
                <span style={{ color: "#bbb", fontSize: 14 }}>🔍</span>
                <input placeholder="Search mission archives..." style={{ border: "none", background: "transparent", outline: "none", fontSize: 13, color: "#333", fontFamily: "inherit", width: "100%" }} />
              </div>
              <div style={{ width: 36, height: 36, background: "#f4f5f7", borderRadius: 8, border: "1px solid #eaecf0", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16 }}>🔔</div>
            </div>
            <div
              onClick={() => { }}
              style={{ display: "flex", alignItems: "center", gap: 8, background: "#1a1a2e", color: "#fff", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}
            >
              <span>🛒</span> Cart ({cartCount}) {cartCount > 0 && <span style={{ color: "#ffcc00" }}>${cartTotal}</span>}
            </div>
          </div>

          <div style={{ padding: "24px 28px" }}>
            {/* Breadcrumb */}
            <div style={{ fontSize: 11, color: "#aaa", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>
              <span 
                style={{ cursor: "pointer", hover: { color: "#1a1a2e" } } as any} 
                onClick={() => setActiveTab(null)}
              >
                INTEL ARCHIVE
              </span> 
              {activeTab && (
                <>
                  <span style={{ color: "#ddd" }}> / </span>
                  <span style={{ color: "#1a1a2e", fontWeight: 600 }}>
                    {isRealMission(activeTab) ? `MISSION ${activeTab}` : MISSION_TABS.find(t => t.id === activeTab)?.name.toUpperCase() || "FOLDER"}
                  </span>
                </>
              )}
            </div>

            {/* Title & Actions */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <h1 style={{ fontWeight: 800, fontSize: 26, color: "#1a1a2e", letterSpacing: -0.5 }}>
                {!activeTab ? "Mission Intelligence Archive" : (isRealMission(activeTab) ? `Mission ${activeTab}` : MISSION_TABS.find(t => t.id === activeTab)?.name)}
              </h1>
              {activeTab && (
                <button 
                  onClick={() => setActiveTab(null)}
                  style={{ background: "#f0f2f5", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", color: "#666" }}
                >
                  ← BACK TO ARCHIVE
                </button>
              )}
            </div>
            <p style={{ color: "#666", fontSize: 13, lineHeight: 1.6, maxWidth: 560, marginBottom: 24 }}>
              {!activeTab 
                ? "Access georeferenced tactical imagery and human detection logs organized by deployment mission. Select a mission folder to view captured intelligence."
                : `Viewing intelligence assets for mission ${activeTab}. Includes high-resolution captures from UAV sensors during operational deployment.`
              }
            </p>

            {/* Filter row */}
            <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
              {["Filter", "Latest"].map(b => (
                <button key={b} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", border: "1px solid #dde1e7", borderRadius: 7, background: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 500, color: "#444" }}>
                  ≡ {b}
                </button>
              ))}
            </div>

            {!activeTab ? (
              /* FOLDER GRID VIEW */
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
                {MISSION_TABS.map(tab => (
                  <div
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      background: "#fff",
                      border: "1px solid #eaecf0",
                      borderRadius: 16, padding: "24px", cursor: "pointer",
                      transition: "all 0.2s",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                    }}
                    onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.08)", e.currentTarget.style.transform = "translateY(-2px)")}
                    onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)", e.currentTarget.style.transform = "translateY(0)")}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                      <div style={{ width: 44, height: 44, background: "#f0f2f5", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
                        📁
                      </div>
                      <Badge text={tab.status} color={tab.status === "live" ? "#dcfce7" : "#f3f4f6"} textColor={tab.status === "live" ? "#166534" : "#666"} />
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 16, color: "#1a1a2e", marginBottom: 4 }}>{tab.name}</div>
                    <div style={{ fontSize: 12, color: "#aaa", fontWeight: 500 }}>{tab.assets} Assets · {tab.size}</div>
                  </div>
                ))}
                {realMissions.filter(m => !MISSION_TABS.find(t => t.id === m.id)).map(m => (
                  <div
                    key={m.id}
                    onClick={() => setActiveTab(m.id)}
                    style={{
                      background: "#fff",
                      border: "1px solid #eaecf0",
                      borderRadius: 16, padding: "24px", cursor: "pointer",
                      transition: "all 0.2s",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                    }}
                    onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.08)", e.currentTarget.style.transform = "translateY(-2px)")}
                    onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)", e.currentTarget.style.transform = "translateY(0)")}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                      <div style={{ width: 44, height: 44, background: "#f0fdf4", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
                        📸
                      </div>
                      <Badge text="CAPTURED" color="#dcfce7" textColor="#166534" />
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 16, color: "#1a1a2e", marginBottom: 4 }}>Mission {m.id}</div>
                    <div style={{ fontSize: 12, color: "#aaa", fontWeight: 500 }}>{m.count} Captures · Live Intel</div>
                  </div>
                ))}
              </div>
            ) : (
              /* IMAGE GRID VIEW (INSIDE FOLDER) */
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 32 }}>
                  {activeTab === "sw" && realImages.length === 0 && ASSETS.map(asset => {
                    const inCart = cart.find(i => i.id === asset.id);
                    const isPurchased = purchased.includes(asset.id);
                    return (
                      <div
                        key={asset.id}
                        style={{ background: "#fff", borderRadius: 10, overflow: "hidden", border: "1px solid #eaecf0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
                      >
                        <div style={{ height: 100, background: asset.img, position: "relative" }}>
                          <div style={{ position: "absolute", top: 8, left: 8 }}>
                            <Badge text={asset.badge} color="rgba(0,0,0,0.55)" textColor="#fff" />
                          </div>
                        </div>
                        <div style={{ padding: "12px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
                            <div style={{ fontWeight: 700, fontSize: 13, color: "#1a1a2e" }}>{asset.title}</div>
                            <div style={{ fontWeight: 800, fontSize: 14, color: "#1a1a2e" }}>${asset.price}</div>
                          </div>
                          <div style={{ fontSize: 10, color: "#aaa", letterSpacing: 0.5, marginBottom: 10 }}>{asset.meta}</div>
                          <div style={{ display: "flex", gap: 6 }}>
                            {isPurchased ? (
                              <button style={{ flex: 1, background: "#dcfce7", color: "#166534", border: "none", borderRadius: 6, padding: "7px 0", fontWeight: 700, fontSize: 11, cursor: "default" }}>✓ PURCHASED</button>
                            ) : (
                              <button onClick={() => handlePurchase(asset)} style={{ flex: 1, background: "#1a1a2e", color: "#fff", border: "none", borderRadius: 6, padding: "7px 0", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>PURCHASE</button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {realImages.map((img, idx) => (
                    <div
                      key={idx}
                      style={{ background: "#fff", borderRadius: 10, overflow: "hidden", border: "1px solid #eaecf0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
                    >
                      <div style={{ height: 120, background: "#000", position: "relative" }}>
                        <img src={`http://localhost:8000${img.url}`} alt={img.filename} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: "absolute", top: 8, left: 8 }}>
                          <Badge text="INTELLIGENCE" color="rgba(0,0,0,0.55)" textColor="#fff" />
                        </div>
                      </div>
                      <div style={{ padding: "12px" }}>
                        <div style={{ fontWeight: 700, fontSize: 12, color: "#1a1a2e", marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{img.filename}</div>
                        <div style={{ fontSize: 10, color: "#aaa", letterSpacing: 0.5, marginBottom: 10 }}>HUMAN DETECTED · PERSISTENT LOG</div>
                        <button 
                          onClick={() => window.open(`http://localhost:8000${img.url}`, '_blank')}
                          style={{ width: "100%", background: "#1a1a2e", color: "#fff", border: "none", borderRadius: 6, padding: "7px 0", fontWeight: 700, fontSize: 11, cursor: "pointer" }}
                        >
                          OPEN FULL CAPTURE
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {activeTab && activeTab !== "sw" && realImages.length === 0 && (
                     <div style={{ gridColumn: 'span 4', textAlign: 'center', padding: '60px', background: '#fff', borderRadius: '16px', border: '1px dashed #eaecf0' }}>
                        <div style={{ fontSize: '40px', marginBottom: '16px' }}>📭</div>
                        <div style={{ fontWeight: 700, color: '#1a1a2e' }}>No assets found in this folder</div>
                        <div style={{ fontSize: '12px', color: '#aaa', marginTop: '4px' }}>UAV data might still be processing or no detections were recorded.</div>
                     </div>
                  )}
                </div>
              </>
            )}

            {/* Purchased assets */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: 14 }}>🔄</span>
                <h2 style={{ fontWeight: 700, fontSize: 16, color: "#1a1a2e" }}>Purchased Assets</h2>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {PURCHASED.map(p => (
                  <div key={p.id} style={{ background: "#fff", borderRadius: 10, border: "1px solid #eaecf0", padding: "14px 16px", display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 8, background: p.img, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "#1a1a2e", marginBottom: 2 }}>{p.title}</div>
                      <div style={{ fontSize: 10, color: "#aaa", letterSpacing: 0.5 }}>{p.sub}</div>
                    </div>
                    <button style={{ background: "#1a1a2e", color: "#fff", border: "none", borderRadius: 7, padding: "8px 16px", fontWeight: 700, fontSize: 11, letterSpacing: 0.5, cursor: "pointer" }}>
                      DOWNLOAD
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT MISSION SUMMARY ── */}
        <div style={{ width: 230, background: "#fff", borderLeft: "1px solid #eaecf0", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 16, flexShrink: 0, overflow: "auto" }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#1a1a2e", letterSpacing: 0.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            MISSION SUMMARY <span style={{ fontSize: 14, color: "#aaa", cursor: "pointer" }}>ℹ</span>
          </div>

          {/* Map preview */}
          <div style={{ height: 100, background: "linear-gradient(135deg,#e8eaf6 0%,#c5cae9 50%,#9fa8da 100%)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#3949ab", letterSpacing: 1.5, textTransform: "uppercase", textAlign: "center" }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>📍</div>
              ACTIVE SECTOR
            </div>
          </div>

          {/* Details */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: "LOCATION", value: "Sierra Nevada, CA", color: "#1a1a2e" },
              { label: "RISK LEVEL", value: "CRITICAL", color: "#dc2626" },
              { label: "TOTAL ASSETS", value: "1,240 Assets", color: "#1a1a2e" },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <div style={{ fontSize: 9, color: "#aaa", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 2 }}>{label}</div>
                <div style={{ fontWeight: 600, fontSize: 12, color }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Active cart */}
          {cart.length > 0 && (
            <>
              <div style={{ fontWeight: 700, fontSize: 11, color: "#1a1a2e", letterSpacing: 1, textTransform: "uppercase", borderTop: "1px solid #eaecf0", paddingTop: 14 }}>
                ACTIVE CART
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {cart.map(item => (
                  <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 28, height: 28, background: "#f0f2f5", borderRadius: 5, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#1a1a2e" }}>{item.title}</div>
                      <div style={{ fontSize: 11, color: "#aaa" }}>${item.price}.00</div>
                    </div>
                    <button onClick={() => setCart(c => c.filter(i => i.id !== item.id))} style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc", fontSize: 14 }}>✕</button>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: "1px solid #eaecf0", paddingTop: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 16, color: "#1a1a2e", marginBottom: 10 }}>
                  <span>SUBTOTAL</span><span>${cartTotal}.00</span>
                </div>
                <button style={{ width: "100%", background: "#1a1a2e", color: "#fff", border: "none", borderRadius: 8, padding: "11px 0", fontWeight: 700, fontSize: 12, cursor: "pointer", letterSpacing: 0.5 }}>
                  PROCEED TO CHECKOUT
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── PAYMENT SIDEBAR MODAL ── */}
      {purchaseItem && (
        <PaymentSidebar
          item={purchaseItem}
          onClose={() => setPurchaseItem(null)}
          onConfirm={handleConfirm}
        />
      )}
    </>
  );
}
