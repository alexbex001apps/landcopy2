"use client";
import { useState, useRef, useEffect } from "react";

const PREGUNTAS_RAPIDAS = [
  "¿Cómo genero un anuncio?",
  "¿Qué es Hot Traffic?",
  "¿Cómo funciona el módulo Copy?",
  "¿Qué es Warm Traffic?",
  "¿Cuántas frases puedo elegir?",
  "¿Puedo editar la imagen?",
  "¿Qué genera el módulo Redes?",
  "¿LandCopy está terminado?",
  "¿Para qué productos funciona?",
  "¿Qué es Cold Traffic?",
];

type Mensaje = { de: "josue" | "user"; texto: string };

function JosueRobot({ size = 60 }: { size?: number }) {
  return (
    <svg width={size} height={size * 1.4} viewBox="0 0 120 165" xmlns="http://www.w3.org/2000/svg" style={{ animation: "float 3s ease-in-out infinite" }}>
      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        @keyframes blink { 0%,88%,100%{transform:scaleY(1)} 92%{transform:scaleY(0.05)} }
        @keyframes wiggle { 0%,100%{transform:rotate(-5deg)} 50%{transform:rotate(5deg)} }
        @keyframes wave { 0%,100%{transform:rotate(-15deg)} 50%{transform:rotate(15deg)} }
      `}</style>
      <g style={{ animation: "wiggle 2s ease-in-out infinite", transformOrigin: "60px 18px" }}>
        <line x1="60" y1="18" x2="60" y2="6" stroke="#ff5000" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="60" cy="4" r="4" fill="#ff5000"/>
      </g>
      <rect x="25" y="18" width="70" height="55" rx="12" fill="#1a1a1a" stroke="#ff5000" strokeWidth="2"/>
      <g style={{ animation: "blink 3s ease-in-out infinite", transformOrigin: "43px 42px" }}>
        <rect x="35" y="34" width="16" height="16" rx="4" fill="#ff5000"/>
        <circle cx="43" cy="42" r="4" fill="#0a0a0a"/>
        <circle cx="45" cy="40" r="1.5" fill="#fff" opacity="0.8"/>
      </g>
      <g style={{ animation: "blink 3s ease-in-out infinite", animationDelay: "0.1s", transformOrigin: "77px 42px" }}>
        <rect x="69" y="34" width="16" height="16" rx="4" fill="#ff5000"/>
        <circle cx="77" cy="42" r="4" fill="#0a0a0a"/>
        <circle cx="79" cy="40" r="1.5" fill="#fff" opacity="0.8"/>
      </g>
      <path d="M44 62 Q60 72 76 62" stroke="#ff5000" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <rect x="30" y="78" width="60" height="50" rx="10" fill="#111" stroke="#ff5000" strokeWidth="2"/>
      <rect x="42" y="88" width="36" height="20" rx="6" fill="#0a0a0a" stroke="#ff5000" strokeWidth="1"/>
      <circle cx="50" cy="98" r="4" fill="#ff5000" opacity="0.9"/>
      <circle cx="60" cy="98" r="4" fill="#ff8800" opacity="0.7"/>
      <circle cx="70" cy="98" r="4" fill="#ff5000" opacity="0.4"/>
      <rect x="10" y="80" width="18" height="35" rx="9" fill="#1a1a1a" stroke="#ff5000" strokeWidth="2"/>
      <g style={{ animation: "wave 2s ease-in-out infinite", transformOrigin: "101px 82px" }}>
        <rect x="92" y="80" width="18" height="35" rx="9" fill="#1a1a1a" stroke="#ff5000" strokeWidth="2"/>
        <circle cx="101" cy="117" r="7" fill="#ff5000"/>
      </g>
      <rect x="35" y="130" width="20" height="26" rx="8" fill="#1a1a1a" stroke="#ff5000" strokeWidth="2"/>
      <rect x="65" y="130" width="20" height="26" rx="8" fill="#1a1a1a" stroke="#ff5000" strokeWidth="2"/>
      <rect x="31" y="151" width="26" height="10" rx="5" fill="#ff5000"/>
      <rect x="61" y="151" width="26" height="10" rx="5" fill="#ff5000"/>
    </svg>
  );
}

export default function JosueChat() {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    { de: "josue", texto: "¡Hola! Soy Josué 👋 La mascota de LandCopy. ¿En qué te puedo ayudar hoy?" }
  ]);
  const [input, setInput] = useState("");
  const [cargando, setCargando] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  const enviar = async (pregunta: string) => {
    if (!pregunta.trim() || cargando) return;
    setMensajes(prev => [...prev, { de: "user", texto: pregunta }]);
    setInput("");
    setCargando(true);
    try {
      const resp = await fetch("/api/josue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pregunta }),
      });
      const data = await resp.json();
      setMensajes(prev => [...prev, { de: "josue", texto: data.respuesta || "No pude responder eso. Intenta de nuevo." }]);
    } catch {
      setMensajes(prev => [...prev, { de: "josue", texto: "Hubo un error. Intenta de nuevo 🙏" }]);
    } finally {
      setCargando(false);
    }
  };

  return (
    <>
      {/* Botón flotante */}
      <button onClick={() => setAbierto(!abierto)} style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 1000, background: "transparent", border: "none", cursor: "pointer", filter: "drop-shadow(0 4px 12px rgba(255,80,0,0.4))" }}>
        <JosueRobot size={50} />
      </button>

      {/* Panel de chat */}
      {abierto && (
        <div style={{ position: "fixed", bottom: "100px", right: "24px", width: "340px", maxHeight: "520px", background: "#0a0a0a", border: "1px solid #ff5000", borderRadius: "20px", zIndex: 1000, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Header */}
          <div style={{ background: "#111", borderBottom: "1px solid #1a1a1a", padding: "12px 16px", display: "flex", alignItems: "center", gap: "10px" }}>
            <JosueRobot size={32} />
            <div>
              <p style={{ color: "#ff5000", fontSize: "13px", fontWeight: 700, margin: 0, fontFamily: "sans-serif" }}>Josué</p>
              <p style={{ color: "#555", fontSize: "10px", margin: 0, fontFamily: "sans-serif" }}>Asistente LandCopy · En construcción 🚧</p>
            </div>
            <button onClick={() => setAbierto(false)} style={{ marginLeft: "auto", background: "none", border: "none", color: "#555", fontSize: "18px", cursor: "pointer" }}>✕</button>
          </div>

          {/* Mensajes */}
          <div style={{ flex: 1, overflowY: "auto", padding: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
            {mensajes.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.de === "user" ? "flex-end" : "flex-start", gap: "8px", alignItems: "flex-end" }}>
                {m.de === "josue" && <JosueRobot size={24} />}
                <div style={{
                  maxWidth: "75%", padding: "8px 12px", borderRadius: m.de === "josue" ? "12px 12px 12px 4px" : "12px 12px 4px 12px",
                  background: m.de === "josue" ? "#1a1a1a" : "#ff5000",
                  border: m.de === "josue" ? "1px solid #2a2a2a" : "none",
                  color: "#f0ead6", fontSize: "11px", lineHeight: 1.5, fontFamily: "sans-serif"
                }}>
                  {m.texto}
                </div>
              </div>
            ))}
            {cargando && (
              <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
                <JosueRobot size={24} />
                <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", padding: "8px 12px", borderRadius: "12px 12px 12px 4px", color: "#ff5000", fontSize: "11px", fontFamily: "sans-serif" }}>
                  Josué está pensando...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Preguntas rápidas */}
          <div style={{ padding: "8px 12px", borderTop: "1px solid #1a1a1a", display: "flex", gap: "5px", flexWrap: "wrap" }}>
            {PREGUNTAS_RAPIDAS.slice(0, 5).map((p, i) => (
              <button key={i} onClick={() => enviar(p)} style={{ background: "#111", border: "1px solid #1e1e1e", color: "#ff5000", fontSize: "9px", fontWeight: 700, padding: "3px 8px", borderRadius: "20px", cursor: "pointer", fontFamily: "sans-serif" }}>
                {p}
              </button>
            ))}
          </div>

          {/* Input */}
          <div style={{ padding: "10px 12px", borderTop: "1px solid #1a1a1a", display: "flex", gap: "8px" }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && enviar(input)}
              placeholder="Pregúntale a Josué..."
              style={{ flex: 1, background: "#111", border: "1px solid #1e1e1e", borderRadius: "8px", padding: "8px 10px", color: "#f0ead6", fontSize: "11px", outline: "none", fontFamily: "sans-serif" }}
            />
            <button onClick={() => enviar(input)} disabled={!input.trim() || cargando} style={{ background: "#ff5000", border: "none", borderRadius: "8px", padding: "8px 12px", color: "white", fontSize: "12px", fontWeight: 700, cursor: "pointer", opacity: !input.trim() || cargando ? 0.5 : 1 }}>
              →
            </button>
          </div>
        </div>
      )}
    </>
  );
}