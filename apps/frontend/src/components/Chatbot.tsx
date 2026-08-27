"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Send, Plus, Copy, Check, Bot, User, Loader2,
  MessageSquare, Clock, Maximize2, Minimize2, Trash2
} from "lucide-react";

const API_BASE = "http://localhost:8000";

function formatText(text) {
  let formatted = text;
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  formatted = formatted.replace(/\n\s*[\-*]\s+(.*)/g, "<br/><br/>• $1");
  formatted = formatted.replace(/\n\s*(\d+\.)\s+(.*)/g, "<br/><br/><strong>$1</strong> $2");
  formatted = formatted.replace(/\n\n+/g, "<br/><br/>");
  formatted = formatted.replace(/\n/g, "<br/>");
  formatted = formatted.replace(/\*/g, "");
  return formatted;
}

export default function Chatbot({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Welcome! How can I assist you with your drone operations today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen) {
      loadSessions();
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const loadSessions = async () => {
    try {
      const res = await fetch(`${API_BASE}/chat/sessions`);
      const data = await res.json();
      setSessions(data);
    } catch (err) {
      console.error("Failed to load sessions:", err);
    }
  };

  const loadSession = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/chat/sessions/${id}`);
      const data = await res.json();
      setSessionId(data.id);
      const loadedMsgs = data.messages.map((msg) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      }));
      setMessages(loadedMsgs.length > 0 ? loadedMsgs : [
        { role: "assistant", content: "Welcome! How can I assist you with your drone operations today?" }
      ]);
      setShowHistory(false);
    } catch (err) {
      console.error("Failed to load session:", err);
    }
  };

  const startNewChat = () => {
    setSessionId(null);
    setMessages([
      { role: "assistant", content: "Welcome! How can I assist you with your drone operations today?" }
    ]);
    setShowHistory(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    // Add placeholder
    setMessages((prev) => [...prev, { role: "assistant", content: "%%THINKING%%" }]);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, session_id: sessionId }),
      });
      const data = await res.json();
      setSessionId(data.session_id);

      // Replace thinking with actual answer using typing effect
      const answer = data.answer || "No response received";
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: answer };
        return updated;
      });
      loadSessions();
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "Error: Could not connect to backend. Make sure the server and Ollama are running.",
        };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text, idx) => {
    const clean = text.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ");
    navigator.clipboard.writeText(clean);
    setCopiedId(idx);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const panelClass = expanded
    ? "fixed inset-4 z-50"
    : "fixed right-4 bottom-4 w-[420px] h-[600px] z-50";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className={`${panelClass} flex rounded-2xl overflow-hidden`}
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--glass-border)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(0,212,255,0.05)",
          }}
        >
          {/* Sidebar - History */}
          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 260, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col overflow-hidden"
                style={{ borderRight: "1px solid var(--glass-border)", background: "rgba(0,0,0,0.2)" }}
              >
                <div className="p-4">
                  <button
                    onClick={startNewChat}
                    className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                    style={{
                      background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
                      color: "#000",
                      border: "none",
                      fontFamily: "var(--font-heading)",
                      fontSize: "13px",
                    }}
                  >
                    <Plus className="w-4 h-4" /> NEW CHAT
                  </button>
                </div>
                <div className="px-4 pb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                    Recent Sessions
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1.5">
                  {sessions.map((sess) => (
                    <motion.button
                      key={sess.id}
                      whileHover={{ x: 3 }}
                      onClick={() => loadSession(sess.id)}
                      className="w-full text-left p-3 rounded-xl cursor-pointer transition-all"
                      style={{
                        background: sessionId === sess.id ? "rgba(0,212,255,0.1)" : "rgba(255,255,255,0.03)",
                        border: sessionId === sess.id ? "1px solid rgba(0,212,255,0.2)" : "1px solid transparent",
                        color: "var(--text-primary)",
                      }}
                    >
                      <div className="text-xs font-medium truncate">{sess.title || "Untitled"}</div>
                      <div className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>
                        <Clock className="w-3 h-3 inline mr-1" />
                        {sess.created_at ? new Date(sess.created_at).toLocaleDateString() : ""}
                      </div>
                    </motion.button>
                  ))}
                  {sessions.length === 0 && (
                    <p className="text-center text-xs py-8" style={{ color: "var(--text-muted)" }}>
                      No conversations yet
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between px-4 h-14 shrink-0"
              style={{ borderBottom: "1px solid var(--glass-border)" }}>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                  style={{
                    background: showHistory ? "rgba(0,212,255,0.1)" : "rgba(255,255,255,0.05)",
                    border: "1px solid var(--glass-border)",
                    color: showHistory ? "var(--accent-primary)" : "var(--text-secondary)",
                  }}
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
                <div>
                  <h3 className="text-sm font-bold" style={{ fontFamily: "var(--font-heading)" }}>
                    AERO-BOT
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--accent-success)" }} />
                    <span className="text-[10px]" style={{ color: "var(--accent-success)" }}>Online</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer"
                  style={{ background: "transparent", border: "none", color: "var(--text-muted)" }}
                >
                  {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer"
                  style={{ background: "transparent", border: "none", color: "var(--text-muted)" }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-1"
                      style={{ background: "rgba(139, 92, 246, 0.15)" }}>
                      <Bot className="w-4 h-4" style={{ color: "var(--accent-purple)" }} />
                    </div>
                  )}
                  <div className={`max-w-[80%] ${msg.role === "user" ? "order-first" : ""}`}>
                    <div
                      className="px-4 py-3 rounded-2xl text-sm leading-relaxed"
                      style={{
                        background: msg.role === "user"
                          ? "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))"
                          : "rgba(255,255,255,0.05)",
                        color: msg.role === "user" ? "#000" : "var(--text-primary)",
                        borderBottomRightRadius: msg.role === "user" ? "6px" : "16px",
                        borderBottomLeftRadius: msg.role === "assistant" ? "6px" : "16px",
                        border: msg.role === "assistant" ? "1px solid var(--glass-border)" : "none",
                      }}
                    >
                      {msg.content === "%%THINKING%%" ? (
                        <div className="flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Thinking...</span>
                        </div>
                      ) : (
                        <div dangerouslySetInnerHTML={{ __html: formatText(msg.content) }} />
                      )}
                    </div>
                    {msg.role === "assistant" && msg.content !== "%%THINKING%%" && (
                      <div className="flex items-center gap-2 mt-1.5 ml-1">
                        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                          {new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <button
                          onClick={() => copyText(msg.content, idx)}
                          className="cursor-pointer opacity-50 hover:opacity-100 transition-opacity"
                          style={{ background: "none", border: "none", color: "var(--text-muted)" }}
                        >
                          {copiedId === idx ? (
                            <Check className="w-3 h-3" style={{ color: "var(--accent-success)" }} />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-1"
                      style={{ background: "rgba(0, 212, 255, 0.15)" }}>
                      <User className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
                    </div>
                  )}
                </motion.div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 pb-4 pt-2">
              <div className="flex items-center gap-2 p-2 rounded-xl"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--glass-border)" }}>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about your mission..."
                  disabled={loading}
                  className="flex-1 px-3 py-2 text-sm outline-none"
                  style={{ background: "transparent", color: "var(--text-primary)", border: "none" }}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer shrink-0"
                  style={{
                    background: input.trim()
                      ? "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))"
                      : "rgba(255,255,255,0.05)",
                    border: "none",
                    color: input.trim() ? "#000" : "var(--text-muted)",
                  }}
                >
                  <Send className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
