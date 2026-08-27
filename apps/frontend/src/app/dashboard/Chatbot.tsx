"use client";

import { useState, useRef, useEffect, ReactNode } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isThinking?: boolean;
}

const API_BASE = "http://localhost:8000";

const IC: Record<string, ReactNode> = {
  send: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>,
  bot: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><line x1="12" y1="7" x2="12" y2="11" /><line x1="8" y1="15" x2="8" y2="15" strokeWidth="3" /><line x1="16" y1="15" x2="16" y2="15" strokeWidth="3" /></svg>,
  sparkles: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v3m0 12v3M5.31 5.31l2.12 2.12m9.14 9.14l2.12 2.12M3 12h3m12 0h3M5.31 18.69l2.12-2.12m9.14-9.14l2.12-2.12" /></svg>,
};

export default function Chatbot() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", role: "assistant", content: "Hello Stavan Sheth. I am Trinetra AI. How can I assist with your drone operations today?" }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const parseContent = (text: string) => {
    // Basic Markdown/Pointer parser
    if (!text) return null;
    const lines = text.split("\n");
    return lines.map((line, i) => {
      let processed = line;

      // Bold handling: **text**
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;

      while ((match = boldRegex.exec(processed)) !== null) {
        if (match.index > lastIndex) {
          parts.push(processed.substring(lastIndex, match.index));
        }
        parts.push(<strong key={`${i}-${match.index}`}>{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      parts.push(processed.substring(lastIndex));

      // Pointer handling: -, *, or number
      const isPointer = /^[*-]\s/.test(line) || /^\d+\.\s/.test(line);

      return (
        <div key={i} style={{
          marginBottom: line.trim() === "" ? "12px" : "4px",
          paddingLeft: isPointer ? "16px" : "0",
          position: "relative"
        }}>
          {isPointer && <span style={{ position: "absolute", left: 0 }}>•</span>}
          {parts}
        </div>
      );
    });
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsgContent = input.trim();
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: userMsgContent };
    
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // 1. Thinking state
    const thinkingId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: thinkingId, role: "assistant", content: "", isThinking: true }]);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsgContent, session_id: sessionId }),
      });
      
      if (!res.ok) throw new Error("API issues");
      
      const data = await res.json();
      setSessionId(data.session_id);

      // 2. Remove thinking, start streaming replacement
      setMessages(prev => prev.filter(m => m.id !== thinkingId));

      const responseText = data.answer || "No response received";
      const words = responseText.split(" ");
      let currentText = "";

      // Create new message for streaming
      const aiMsgId = (Date.now() + 2).toString();
      setMessages(prev => [...prev, { id: aiMsgId, role: "assistant", content: "" }]);

      for (let i = 0; i < words.length; i++) {
        currentText += (i === 0 ? "" : " ") + words[i];
        setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: currentText } : m));
        // Sequential simulation for buttery smooth feel
        await new Promise(r => setTimeout(r, 15 + Math.random() * 20)); 
      }
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== thinkingId));
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: "assistant", 
        content: "Error: Could not connect to Trinetra AI Core. Please ensure the backend and Ollama are running." 
      }]);
    } finally {
      setIsTyping(false);
    }
  };


  return (
    <div className="chat-page">
      <style>{`
        .chat-page {
          height: 100%;
          display: flex;
          flex-direction: column;
          background: #101415;
          font-family: 'Hanken Grotesk', sans-serif;
          color: #ffffff;
        }

        .chat-header {
          padding: 20px 32px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          background: #101415;
        }
        .chat-h-title {
          font-size: 24px;
          font-weight: 700;
          color: #ffffff;
        }
        .chat-h-status {
          font-size: 11px;
          font-weight: 700;
          color: #ff6415;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 4px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .chat-feed {
          flex: 1;
          overflow-y: auto;
          padding: 32px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .chat-feed::-webkit-scrollbar { width: 4px; }
        .chat-feed::-webkit-scrollbar-thumb { background: #ff6415; border-radius: 10px; }

        .msg-wrap {
          display: flex;
          gap: 16px;
          max-width: 80%;
          animation: fadeUp 0.3s ease both;
        }
        .msg-wrap.user {
          align-self: flex-end;
          flex-direction: row-reverse;
        }

        .avatar {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 800;
          flex-shrink: 0;
        }
        .avatar.assistant {
          background: rgba(255,100,21,0.15);
          color: #ff6415;
          border: 1px solid rgba(255,100,21,0.3);
        }
        .avatar.user {
          background: #f45b0b;
          color: #fff;
          box-shadow: 0 7px 18px rgba(244,91,11,0.22);
        }

        .bubble {
          background: rgba(32,37,34,0.9);
          border: 1px solid rgba(255,255,255,0.1);
          backdrop-filter: blur(20px);
          padding: 16px 20px;
          border-radius: 20px;
          font-size: 13.5px;
          line-height: 1.6;
          color: #ffffff;
          box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        }
        .msg-wrap.user .bubble {
          background: #f45b0b;
          color: #fff;
          border: none;
          box-shadow: 0 7px 18px rgba(244,91,11,0.22);
        }

        .thinking {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 16px 20px;
        }
        .dot {
          width: 6px;
          height: 6px;
          background: #ff6415;
          border-radius: 50%;
          animation: bounce 1.4s infinite ease-in-out both;
        }
        .dot:nth-child(1) { animation-delay: -0.32s; }
        .dot:nth-child(2) { animation-delay: -0.16s; }

        .chat-input-bar {
          padding: 24px 32px;
          background: #101415;
          border-top: 1px solid rgba(255,255,255,0.08);
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .chat-input-box {
          flex: 1;
          display: flex;
          align-items: center;
          background: rgba(32,37,34,0.9);
          border: 1px solid rgba(255,255,255,0.12);
          backdrop-filter: blur(20px);
          border-radius: 18px;
          padding: 4px 16px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        }
        .chat-input-box input {
          flex: 1;
          border: none;
          background: transparent;
          padding: 12px 0;
          font-size: 13.5px;
          font-family: 'Hanken Grotesk', sans-serif;
          outline: none;
          color: #ffffff;
        }
        .chat-input-box input::placeholder {
          color: rgba(255,255,255,0.35);
        }

        .chat-send-btn {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          background: #f45b0b;
          color: #fff;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 7px 18px rgba(244,91,11,0.22);
          flex-shrink: 0;
        }
        .chat-send-btn:hover {
          background: #ff6817;
          transform: translateY(-1px);
        }
        .chat-send-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
          transform: none;
        }

        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1.0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
`}</style>

      <div className="chat-header">
        <h1 className="chat-h-title">Trinetra Intelligence</h1>
        <div className="chat-h-status">
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
          AI Core Online
        </div>
      </div>

      <div className="chat-feed" ref={scrollRef}>
        {messages.map((m) => (
          <div key={m.id} className={`msg-wrap ${m.role}`}>
            <div className="msg-icon">
              {m.role === "assistant" ? IC.bot : "KR"}
            </div>
            {m.isThinking ? (
              <div className="thinking">
                {IC.sparkles} Trinetra is thinking
                <div className="think-dots">
                  <div className="think-dot" />
                  <div className="think-dot" />
                  <div className="think-dot" />
                </div>
              </div>
            ) : (
              <div className="msg-box">
                {parseContent(m.content)}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="chat-input-area">
        <div className="chat-input-container">
          <input
            className="chat-input"
            placeholder="Ask Trinetra to analyze mission data..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button
            className="chat-send-btn"
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
          >
            {IC.send}
          </button>
        </div>
      </div>
    </div>
  );
}
