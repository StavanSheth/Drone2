"use client";

import { useState, ReactNode } from "react";

interface SettingSection {
  id: string;
  title: string;
  icon: ReactNode;
}

const IC: Record<string, ReactNode> = {
  user: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  security: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  bell: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  drone: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M6.3 6.3a8 8 0 0 0 0 11.4"/><path d="M17.7 6.3a8 8 0 0 1 0 11.4"/><path d="M3.1 3.1a13.2 13.2 0 0 0 0 17.8"/><path d="M20.9 3.1a13.2 13.2 0 0 1 0 17.8"/></svg>,
  globe: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
};

const SECTIONS: SettingSection[] = [
  { id: "profile", title: "Profile", icon: IC.user },
  { id: "operational", title: "Operational", icon: IC.drone },
  { id: "security", title: "Security & Keys", icon: IC.security },
  { id: "notifications", title: "Notifications", icon: IC.bell },
  { id: "localization", title: "Localization", icon: IC.globe },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="set-page">
      <style>{`
        .settings-page {
          height: 100%;
          overflow-y: auto;
          padding: 40px 48px;
          background: #101415;
          font-family: 'Hanken Grotesk', sans-serif;
          color: #ffffff;
        }
        .set-h-title {
          font-size: 32px;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 8px;
        }
        .set-h-sub {
          font-size: 13.5px;
          color: rgba(255,255,255,0.6);
          margin-bottom: 36px;
        }

        .set-card {
          background: rgba(32,37,34,0.9);
          border: 1px solid rgba(255,255,255,0.1);
          backdrop-filter: blur(24px);
          border-radius: 24px;
          padding: 32px;
          margin-bottom: 28px;
          box-shadow: 0 12px 35px rgba(0,0,0,0.35);
        }
        .set-c-title {
          font-size: 17px;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 6px;
        }
        .set-c-sub {
          font-size: 12.5px;
          color: rgba(255,255,255,0.55);
          margin-bottom: 24px;
        }

        .set-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 0;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .set-row:last-child {
          border-bottom: none;
        }
        .set-lbl {
          font-size: 13.5px;
          font-weight: 600;
          color: #ffffff;
        }
        .set-desc {
          font-size: 11.5px;
          color: rgba(255,255,255,0.5);
          margin-top: 2px;
        }
        .set-inp {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 8px 14px;
          color: #ffffff;
          font-family: 'Hanken Grotesk', sans-serif;
          font-size: 13px;
          outline: none;
        }
        .set-inp:focus {
          border-color: #ff6415;
          box-shadow: 0 0 0 2px rgba(255,100,21,0.15);
        }
        .set-btn-save {
          background: #f45b0b;
          color: #ffffff;
          border: none;
          border-radius: 14px;
          padding: 10px 24px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 7px 18px rgba(244,91,11,0.22);
        }
        .set-btn-save:hover {
          background: #ff6817;
        }
`}</style>

      <div className="set-nav">
        <h1 className="set-title">Settings</h1>
        {SECTIONS.map(s => (
          <button 
            key={s.id} 
            className={`set-tab ${activeTab === s.id ? 'active' : ''}`}
            onClick={() => setActiveTab(s.id)}
          >
            {s.icon} {s.title}
          </button>
        ))}
      </div>

      <div className="set-content">
        {activeTab === "profile" && (
          <div className="set-card">
            <h2 className="set-h2">Account Profile</h2>
            <p className="set-h-sub">Manage your public information and mission credentials.</p>
            
            <div className="set-row">
              <label className="set-lbl">Display Name</label>
              <input className="set-inp" defaultValue="Stavan Sheth" />
            </div>
            
            <div className="set-grid-2">
              <div className="set-row">
                <label className="set-lbl">Operational ID</label>
                <input className="set-inp" value="SK-29401" readOnly />
              </div>
              <div className="set-row">
                <label className="set-lbl">Timezone</label>
                <input className="set-inp" defaultValue="UTC +5:30" />
              </div>
            </div>

            <div className="set-row">
              <label className="set-lbl">Bio / Unit Description</label>
              <textarea className="set-inp" style={{minHeight: 100, resize: 'none'}} defaultValue="Tactical drone commander overseeing Sierra Division operations." />
            </div>

            <div className="set-foot">
              <button className="s-btn-s">Save Profile</button>
            </div>
          </div>
        )}

        {activeTab === "operational" && (
          <div className="set-card">
            <h2 className="set-h2">Operational Preferences</h2>
            <p className="set-h-sub">Configure default mission parameters and drone behavior.</p>

            <div className="set-toggle-row">
              <div>
                <p className="st-info-h">Auto-Launch Sequence</p>
                <p className="st-info-p">Bypass confirmation for immediate drone deployment.</p>
              </div>
              <div className="st-switch on"><div className="st-knob" /></div>
            </div>

            <div className="set-toggle-row">
              <div>
                <p className="st-info-h">Cloud Sync telemetry</p>
                <p className="st-info-p">Store flight logs in encrypted remote storage.</p>
              </div>
              <div className="st-switch on"><div className="st-knob" /></div>
            </div>

            <div className="set-toggle-row">
              <div>
                <p className="st-info-h">Offline Mode</p>
                <p className="st-info-p">Operate without external satellite connectivity.</p>
              </div>
              <div className="st-switch"><div className="st-knob" /></div>
            </div>

            <div className="set-row" style={{marginTop: 24}}>
              <label className="set-lbl">Default Max Altitude (Meters)</label>
              <input className="set-inp" type="number" defaultValue="120" />
            </div>
            
            <div className="set-foot">
              <button className="s-btn-s">Update Config</button>
            </div>
          </div>
        )}

        {/* Other tabs can be added later/placeholders */}
        {["security", "notifications", "localization"].includes(activeTab) && (
          <div className="set-card" style={{display:'flex', flexDirection:'column', alignItems:'center', padding: '60px 0'}}>
             <div style={{opacity: 0.2, marginBottom: 16}}>{IC[activeTab as keyof typeof IC] || IC.globe}</div>
             <p style={{fontSize: 14, color: '#8a8480', fontWeight: 600}}>This section is under maintenance.</p>
          </div>
        )}
      </div>
    </div>
  );
}
