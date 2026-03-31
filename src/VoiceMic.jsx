import { useState, useEffect, useRef } from "react";

/**
 * VoiceMic — a small microphone button that transcribes speech into a textarea.
 *
 * Props:
 *   onTranscript(text)  — called with transcribed text to append to the field
 *   style               — optional wrapper style overrides
 */

const SpeechRecognition =
  typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

export default function VoiceMic({ onTranscript, style }) {
  const [listening, setListening] = useState(false);
  const [hover, setHover] = useState(false);
  const recRef = useRef(null);

  // Hide entirely if the browser has no support
  if (!SpeechRecognition) return null;

  const toggle = () => {
    if (listening) {
      recRef.current?.stop();
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = "en-US";

    rec.onresult = (e) => {
      let transcript = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          transcript += e.results[i][0].transcript;
        }
      }
      if (transcript) {
        onTranscript(transcript);
      }
    };

    rec.onerror = () => { setListening(false); recRef.current = null; };
    rec.onend = () => { setListening(false); recRef.current = null; };

    rec.start();
    recRef.current = rec;
    setListening(true);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => { recRef.current?.stop(); };
  }, []);

  return (
    <button
      type="button"
      onClick={toggle}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={listening ? "Stop recording" : "Click to speak"}
      style={{
        position: "relative",
        width: 28,
        height: 28,
        borderRadius: "50%",
        border: "none",
        background: listening ? "#C4687A" : hover ? "#0FB5B5" : "rgba(15,181,181,0.12)",
        color: listening ? "#fff" : "#0FB5B5",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        transition: "background 0.2s, transform 0.15s",
        transform: hover && !listening ? "scale(1.08)" : "scale(1)",
        animation: listening ? "micPulse 1.2s ease-in-out infinite" : "none",
        ...style,
      }}
    >
      {/* Mic icon (SVG) */}
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="2" width="6" height="12" rx="3" />
        <path d="M5 10a7 7 0 0 0 14 0" />
        <line x1="12" y1="18" x2="12" y2="22" />
        <line x1="8" y1="22" x2="16" y2="22" />
      </svg>
      <style>{`@keyframes micPulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(196,104,122,0.4); } 50% { box-shadow: 0 0 0 6px rgba(196,104,122,0); } }`}</style>
    </button>
  );
}
