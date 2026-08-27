"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, MapPin, Clock, AlertTriangle, Flame, Droplets,
  Mountain, Wind, ChevronRight, ArrowLeft, Target, Users, Radar
} from "lucide-react";

const DISASTER_TYPES = [
  { id: "flood", label: "Flood", icon: Droplets, color: "#3b82f6" },
  { id: "fire", label: "Wildfire", icon: Flame, color: "#ef4444" },
  { id: "earthquake", label: "Earthquake", icon: Mountain, color: "#f59e0b" },
  { id: "cyclone", label: "Cyclone", icon: Wind, color: "#8b5cf6" },
  { id: "rescue", label: "Search & Rescue", icon: Target, color: "#10b981" },
  { id: "assessment", label: "Damage Assessment", icon: AlertTriangle, color: "#f97316" },
];

const PRIORITY_LEVELS = [
  { id: "critical", label: "CRITICAL", color: "#ef4444" },
  { id: "high", label: "HIGH", color: "#f59e0b" },
  { id: "medium", label: "MEDIUM", color: "#3b82f6" },
  { id: "low", label: "LOW", color: "#10b981" },
];

export default function MissionsPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [mission, setMission] = useState({
    name: "",
    type: "",
    priority: "high",
    location: "",
    coordinates: "",
    team: "",
    description: "",
  });

  const handleSubmit = () => {
    localStorage.setItem("currentMission", JSON.stringify(mission));
    router.push("/mission/NW-3581");
  };

  const handleQuickDemo = () => {
    router.push("/mission/NW-3581");
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg-primary)" }}>
      {/* Left Visual Panel */}
      <div className="hidden lg:flex lg:w-2/5 relative items-center justify-center overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(0,212,255,0.05) 0%, rgba(139,92,246,0.05) 100%)",
          borderRight: "1px solid var(--glass-border)",
        }}>
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(rgba(0,212,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.2) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center z-10 px-10"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, var(--accent-primary), var(--accent-purple))", boxShadow: "var(--shadow-glow)" }}>
            <Target className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-3" style={{ fontFamily: "var(--font-heading)" }}>
            MISSION CONTROL
          </h2>
          <p style={{ color: "var(--text-secondary)" }} className="text-sm leading-relaxed">
            Configure your disaster management drone mission parameters before deployment.
          </p>

          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-3 mt-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-3">
                <motion.div
                  animate={{
                    background: step >= s ? "var(--accent-primary)" : "rgba(255,255,255,0.1)",
                    scale: step === s ? 1.2 : 1,
                  }}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ color: step >= s ? "#000" : "var(--text-muted)" }}
                >
                  {s}
                </motion.div>
                {s < 3 && (
                  <div className="w-8 h-px" style={{ background: step > s ? "var(--accent-primary)" : "rgba(255,255,255,0.1)" }} />
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-lg mb-4 flex items-center justify-between">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-xs font-semibold text-white/60 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          <button
            onClick={handleQuickDemo}
            className="px-3.5 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/10 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
          >
            <span className="material-symbols-outlined text-[15px] text-[#ff6415]">play_arrow</span>
            Quick Demo Mission
          </button>
        </div>
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait">
            {/* Step 1: Mission Type */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-xl font-bold mb-1" style={{ fontFamily: "var(--font-heading)" }}>
                  SELECT DISASTER TYPE
                </h3>
                <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
                  Choose the type of disaster scenario for this mission
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {DISASTER_TYPES.map((type) => {
                    const Icon = type.icon;
                    const isSelected = mission.type === type.id;
                    return (
                      <motion.button
                        key={type.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setMission({ ...mission, type: type.id })}
                        className="glass-card p-4 text-left cursor-pointer transition-all duration-300"
                        style={{
                          border: isSelected ? `2px solid ${type.color}` : "1px solid var(--glass-border)",
                          background: isSelected ? `${type.color}10` : "var(--bg-card)",
                          boxShadow: isSelected ? `0 0 20px ${type.color}20` : "none",
                        }}
                      >
                        <Icon className="w-6 h-6 mb-2" style={{ color: type.color }} />
                        <span className="text-sm font-semibold block" style={{ color: "var(--text-primary)" }}>
                          {type.label}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => mission.type && setStep(2)}
                  disabled={!mission.type}
                  className="btn-glow w-full mt-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
                  style={{
                    background: mission.type
                      ? "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))"
                      : "rgba(255,255,255,0.05)",
                    color: mission.type ? "#000" : "var(--text-muted)",
                    border: "none",
                    fontFamily: "var(--font-heading)",
                    fontSize: "15px",
                  }}
                >
                  CONTINUE <ChevronRight className="w-4 h-4" />
                </motion.button>
              </motion.div>
            )}

            {/* Step 2: Mission Details */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
              >
                <button onClick={() => setStep(1)} className="flex items-center gap-1 text-xs mb-4 cursor-pointer"
                  style={{ color: "var(--text-secondary)", background: "none", border: "none" }}>
                  <ArrowLeft className="w-3 h-3" /> Back
                </button>

                <h3 className="text-xl font-bold mb-1" style={{ fontFamily: "var(--font-heading)" }}>
                  MISSION DETAILS
                </h3>
                <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
                  Provide the operational parameters for deployment
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-2"
                      style={{ color: "var(--text-secondary)" }}>Mission Name</label>
                    <input value={mission.name} onChange={(e) => setMission({ ...mission, name: e.target.value })}
                      placeholder="e.g. Operation Flood Relief Alpha"
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--glass-border)", color: "var(--text-primary)" }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-2"
                      style={{ color: "var(--text-secondary)" }}>Priority</label>
                    <div className="flex gap-2">
                      {PRIORITY_LEVELS.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setMission({ ...mission, priority: p.id })}
                          className="flex-1 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all"
                          style={{
                            background: mission.priority === p.id ? `${p.color}20` : "rgba(255,255,255,0.03)",
                            border: mission.priority === p.id ? `1px solid ${p.color}` : "1px solid var(--glass-border)",
                            color: mission.priority === p.id ? p.color : "var(--text-muted)",
                            fontFamily: "var(--font-heading)",
                          }}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-2"
                      style={{ color: "var(--text-secondary)" }}>Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
                      <input value={mission.location} onChange={(e) => setMission({ ...mission, location: e.target.value })}
                        placeholder="City, Region"
                        className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--glass-border)", color: "var(--text-primary)" }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-2"
                      style={{ color: "var(--text-secondary)" }}>Team Members</label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
                      <input value={mission.team} onChange={(e) => setMission({ ...mission, team: e.target.value })}
                        placeholder="Number of team members"
                        className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--glass-border)", color: "var(--text-primary)" }}
                      />
                    </div>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => mission.name && setStep(3)}
                  disabled={!mission.name}
                  className="btn-glow w-full mt-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
                  style={{
                    background: mission.name
                      ? "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))"
                      : "rgba(255,255,255,0.05)",
                    color: mission.name ? "#000" : "var(--text-muted)",
                    border: "none",
                    fontFamily: "var(--font-heading)",
                    fontSize: "15px",
                  }}
                >
                  CONTINUE <ChevronRight className="w-4 h-4" />
                </motion.button>
              </motion.div>
            )}

            {/* Step 3: Review & Deploy */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
              >
                <button onClick={() => setStep(2)} className="flex items-center gap-1 text-xs mb-4 cursor-pointer"
                  style={{ color: "var(--text-secondary)", background: "none", border: "none" }}>
                  <ArrowLeft className="w-3 h-3" /> Back
                </button>

                <h3 className="text-xl font-bold mb-1" style={{ fontFamily: "var(--font-heading)" }}>
                  MISSION REVIEW
                </h3>
                <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
                  Verify all parameters before drone deployment
                </p>

                <div className="glass-card p-5 space-y-4">
                  {[
                    { label: "Mission", value: mission.name },
                    { label: "Type", value: DISASTER_TYPES.find(d => d.id === mission.type)?.label },
                    { label: "Priority", value: mission.priority?.toUpperCase() },
                    { label: "Location", value: mission.location || "Not set" },
                    { label: "Team", value: mission.team ? `${mission.team} members` : "Not set" },
                  ].map((item, i) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="flex justify-between items-center py-2"
                      style={{ borderBottom: "1px solid var(--glass-border)" }}
                    >
                      <span className="text-xs uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                        {item.label}
                      </span>
                      <span className="text-sm font-semibold">{item.value}</span>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-5">
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2"
                    style={{ color: "var(--text-secondary)" }}>Mission Notes (Optional)</label>
                  <textarea
                    value={mission.description}
                    onChange={(e) => setMission({ ...mission, description: e.target.value })}
                    placeholder="Additional operational notes..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--glass-border)", color: "var(--text-primary)" }}
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit}
                  className="btn-glow w-full mt-6 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
                  style={{
                    background: "linear-gradient(135deg, var(--accent-success), #059669)",
                    color: "#fff",
                    border: "none",
                    fontFamily: "var(--font-heading)",
                    fontSize: "16px",
                    boxShadow: "0 0 25px rgba(16, 185, 129, 0.3)",
                  }}
                >
                  <Radar className="w-5 h-5" />
                  DEPLOY MISSION
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
