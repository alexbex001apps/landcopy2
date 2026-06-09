"use client";
import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

type EspId = "josue" | "caleb" | "nehemias";
type Mensaje = { de: "user" | EspId; texto: string };

const ESPECIALISTAS: Record<EspId, { nombre: string; color: string; colorSuave: string; rol: string }> = {
  josue: { nombre: "Josué", color: "#ff5000", colorSuave: "rgba(255,80,0,0.12)", rol: "Especialista en LandCopy" },
  caleb: { nombre: "Caleb", color: "#22c55e", colorSuave: "rgba(34,197,94,0.12)", rol: "Director Estratégico" },
  nehemias: { nombre: "Nehemías", color: "#38bdf8", colorSuave: "rgba(56,189,248,0.12)", rol: "Análisis y Optimización" },
};

const PREGUNTAS_RAPIDAS: Record<EspId, string[]> = {
  josue: ["¿Cómo creo una campaña?", "¿Cómo genero una landing?", "¿Cómo funciona la Biblioteca?"],
  caleb: ["¿Cómo mejoro mi anuncio frío?", "Dame 3 ángulos de venta", "¿Cómo armo una oferta irresistible?"],
  nehemias: ["Analiza mi campaña activa", "Puntúa mi headline 1-10", "Diagnostica mi oferta"],
};

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

function CalebFace({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40">
      <circle cx="20" cy="22" r="12" fill="#22c55e"/>
      <path d="M8 20 Q8 8 20 8 Q32 8 32 20 L32 22 L28 22 L28 16 L12 16 L12 22 L8 22 Z" fill="#15803d"/>
      <rect x="14" y="20" width="4" height="4" rx="2" fill="#0a0a0a"/>
      <rect x="22" y="20" width="4" height="4" rx="2" fill="#0a0a0a"/>
      <path d="M13 28 Q20 36 27 28 L27 31 Q20 37 13 31 Z" fill="#15803d"/>
      <path d="M15 27 Q20 31 25 27" stroke="#0a0a0a" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

function NehemiasFace({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40">
      <circle cx="20" cy="21" r="12" fill="#38bdf8"/>
      <circle cx="15" cy="21" r="5" fill="none" stroke="#0a0a0a" strokeWidth="2"/>
      <circle cx="25" cy="21" r="5" fill="none" stroke="#0a0a0a" strokeWidth="2"/>
      <line x1="19" y1="20.5" x2="21" y2="20.5" stroke="#0a0a0a" strokeWidth="2"/>
      <circle cx="15" cy="21" r="2" fill="#0a0a0a"/>
      <circle cx="25" cy="21" r="2" fill="#0a0a0a"/>
      <path d="M16 29 L24 29" stroke="#0a0a0a" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

function Avatar({ esp, size = 26 }: { esp: EspId; size?: number }) {
  if (esp === "caleb") return <CalebFace size={size} />;
  if (esp === "nehemias") return <NehemiasFace size={size} />;
  return <JosueRobot size={size * 0.85} />;
}

export default function JosueChat() {
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState<EspId>("josue");
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    { de: "josue", texto: "¡Hola! Soy Josué 👋 Bienvenido al Consejo IA de LandCopy. Pregúntame de la plataforma, o toca arriba a Caleb (estrategia) o Nehemías (análisis)." }
  ]);
  const [input, setInput] = useState("");
  const [cargando, setCargando] = useState(false);
  const [campana, setCampana] = useState<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes, abierto]);

  useEffect(() => {
    if (!abierto) return;
    try {
      const c = sessionStorage.getItem("campaign_activa");
      setCampana(c ? JSON.parse(c) : null);
    } catch { setCampana(null); }
  }, [abierto]);

  const esp = ESPECIALISTAS[activo];

  const enviar = async (pregunta: string) => {
    if (!pregunta.trim() || cargando) return;
    setMensajes(prev => [...prev, { de: "user", texto: pregunta }]);
    setInput("");
    setCargando(true);
    try {
      const historial = mensajes.slice(-10).map(m => ({
        role: m.de === "user" ? "user" : "assistant",
        content: m.de === "user" ? m.texto : `[${ESPECIALISTAS[m.de as EspId]?.nombre || "Josué"}]: ${m.texto}`,
      }));

      // ===== RECOLECTAR TODO LO QUE EL CONSEJO PUEDE VER =====
      const partes: string[] = [];
      const imagenes: string[] = [];

      // 1. Campaña activa (datos + foto del producto)
      if (campana) {
        partes.push(`CAMPAÑA ACTIVA → Producto: ${campana.producto || "?"} | Problema: ${campana.problema || "?"} | Beneficio: ${campana.beneficio || "?"} | Precio oferta: ${campana.precio_oferta || "?"} | Precio anterior: ${campana.precio_anterior || "?"} | País: ${campana.pais || "?"} | Tono: ${campana.tono || "?"} | Headline: ${campana.headline || "?"}`);
        if (typeof campana.imagen_url === "string" && campana.imagen_url.startsWith("http")) imagenes.push(campana.imagen_url);
      }

      // 2. Landing: textos por sección
      try {
        const lc = sessionStorage.getItem("landing_contenido");
        if (lc) {
          const cont = JSON.parse(lc);
          const textos = Object.entries(cont)
            .filter(([, v]) => typeof v === "string" && (v as string).trim())
            .map(([seccion, v]) => `[${seccion}]: ${(v as string).slice(0, 400)}`);
          if (textos.length > 0) partes.push(`LANDING GENERADA (textos reales por sección):\n${textos.join("\n")}`);
        }
      } catch {}

      // 3. Landing: imágenes por sección (URLs Supabase)
      try {
        const li = sessionStorage.getItem("landing_imagenes");
        if (li) {
          const imgs = JSON.parse(li);
          const secciones: string[] = [];
          Object.entries(imgs).forEach(([seccion, url]) => {
            if (typeof url === "string" && url.startsWith("http")) {
              imagenes.push(url);
              secciones.push(seccion);
            }
          });
          if (secciones.length > 0) partes.push(`IMÁGENES DE LANDING ADJUNTAS (en orden): ${secciones.join(", ")}`);
        }
      } catch {}

      // 4. Resultado de Copy
      try {
        const res = sessionStorage.getItem("landcopy_resultado");
        if (res) {
          const r = JSON.parse(res);
          const resumen = ["hero", "problema", "solucion", "beneficios", "cta"]
            .filter(k => typeof r[k] === "string" && r[k].trim())
            .map(k => `[${k}]: ${r[k].slice(0, 300)}`);
          if (Array.isArray(r.headlines) && r.headlines.length) resumen.push(`[headlines]: ${r.headlines.slice(0, 6).join(" | ")}`);
          if (resumen.length > 0) partes.push(`COPY GENERADO:\n${resumen.join("\n")}`);
        }
      } catch {}

      // 5. Headlines enviados a Anuncios
      try {
        const hl = sessionStorage.getItem("anuncios_headlines");
        if (hl) {
          const arr = JSON.parse(hl);
          if (Array.isArray(arr) && arr.length) partes.push(`HEADLINES SELECCIONADOS PARA ANUNCIOS: ${arr.slice(0, 7).join(" | ")}`);
        }
      } catch {}

      const contexto = partes.length > 0 ? partes.join("\n\n") : null;

     const payload = JSON.stringify({ pregunta, especialista: activo, historial, contexto, imagenes: imagenes.slice(0, 5), pagina: pathname });
      const llamar = () => fetch("/api/josue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
      }).then(r => r.json());

      let data = await llamar().catch(() => null);
      if (!data?.respuesta) {
        // Reintento automático: 1 vez, silencioso
        data = await llamar().catch(() => null);
      }
      setMensajes(prev => [...prev, { de: activo, texto: data?.respuesta || "Me llegó mucha información de golpe 😅 — pregúntame de nuevo." }]);
    } catch {
      setMensajes(prev => [...prev, { de: activo, texto: "Hubo un error. Intenta de nuevo 🙏" }]);
    } finally {
      setCargando(false);
    }
  };

  return (
    <>
      {/* Botón flotante */}
      <button onClick={() => setAbierto(!abierto)} style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 1000, background: "transparent", border: "none", cursor: "pointer", filter: "drop-shadow(0 4px 20px rgba(255,80,0,0.8))" }}>
        <JosueRobot size={50} />
      </button>

      {/* Panel del Consejo IA */}
      {abierto && (
        <div style={{ position: "fixed", bottom: "100px", right: "24px", width: "min(360px, calc(100vw - 32px))", maxHeight: "min(560px, calc(100vh - 130px))", background: "#0a0a0a", border: `1px solid ${esp.color}`, borderRadius: "20px", zIndex: 1000, display: "flex", flexDirection: "column", overflow: "hidden", transition: "border-color 0.3s" }}>

          {/* Header */}
          <div style={{ background: "#111", borderBottom: "1px solid #1a1a1a", padding: "10px 16px", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ color: "#fff", fontSize: "13px", fontWeight: 700, fontFamily: "sans-serif" }}>⚡ Consejo IA</span>
            <button onClick={() => setAbierto(false)} style={{ marginLeft: "auto", background: "none", border: "none", color: "#facc15", fontSize: "18px", cursor: "pointer" }}>✕</button>
          </div>

          {/* Pestañas de especialistas */}
          <div style={{ display: "flex", gap: "4px", padding: "8px", background: "#070707", borderBottom: "1px solid #151515" }}>
            {(Object.keys(ESPECIALISTAS) as EspId[]).map(id => {
              const e = ESPECIALISTAS[id];
              const on = activo === id;
              return (
                <button key={id} onClick={() => setActivo(id)} style={{ flex: 1, textAlign: "center", padding: "6px 4px", borderRadius: "9px", background: on ? e.colorSuave : "#0d0d0d", border: `1px solid ${on ? e.color : "#1a1a1a"}`, cursor: "pointer", opacity: on ? 1 : 0.6 }}>
                  <div style={{ display: "flex", justifyContent: "center" }}><Avatar esp={id} size={22} /></div>
                  <div style={{ color: on ? e.color : "#facc15", fontSize: "9px", fontWeight: 700, fontFamily: "sans-serif", marginTop: "2px" }}>{e.nombre}</div>
                </button>
              );
            })}
          </div>

          {/* Botón Abrir Mastermind */}
          <button
            onClick={() => { setAbierto(false); router.push("/mastermind"); }}
            style={{ margin: "8px 12px", padding: "10px 12px", background: "rgba(255,80,0,0.12)", border: "1px solid #ff5000", borderRadius: "10px", color: "#ff5000", fontSize: "12px", fontWeight: 700, fontFamily: "sans-serif", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
          >
            🔥 Abrir Mastermind <span style={{ marginLeft: "auto" }}>→</span>
          </button>

          {/* Chip campaña activa */}
          <div style={{ padding: "6px 12px", background: campana ? "#081308" : "#130d08", borderBottom: campana ? "1px solid #14301a" : "1px solid #2a1d0d", display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: campana ? "#22c55e" : "#f97316", flexShrink: 0 }}></div>
            <span style={{ color: campana ? "#22c55e" : "#facc15", fontSize: "9px", fontWeight: 700, fontFamily: "sans-serif" }}>
              {campana ? `CAMPAÑA ACTIVA: ${String(campana.nombre || campana.producto || "Sin nombre").slice(0, 30)}` : "Sin campaña activa — activa una en Mis Campañas"}
            </span>
          </div>

          {/* Mensajes */}
          <div style={{ flex: 1, overflowY: "auto", padding: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
            {mensajes.map((m, i) => {
              if (m.de === "user") {
                return (
                  <div key={i} style={{ display: "flex", justifyContent: "flex-end" }}>
                    <div style={{ maxWidth: "75%", padding: "8px 12px", borderRadius: "12px 12px 4px 12px", background: "#1a1a1a", border: "1px solid #2a2a2a", color: "#f0ead6", fontSize: "11px", lineHeight: 1.5, fontFamily: "sans-serif" }}>{m.texto}</div>
                  </div>
                );
              }
              const e = ESPECIALISTAS[m.de as EspId] || ESPECIALISTAS.josue;
              return (
                <div key={i} style={{ display: "flex", justifyContent: "flex-start", gap: "8px", alignItems: "flex-end" }}>
                  <div style={{ flexShrink: 0 }}><Avatar esp={m.de as EspId} size={24} /></div>
                  <div style={{ maxWidth: "78%" }}>
                    <div style={{ color: e.color, fontSize: "9px", fontWeight: 700, fontFamily: "sans-serif", marginBottom: "2px" }}>{e.nombre}</div>
                    <div style={{ padding: "8px 12px", borderRadius: "4px 12px 12px 12px", background: "#111", border: `1px solid ${e.color}40`, color: "#f0ead6", fontSize: "11px", lineHeight: 1.5, fontFamily: "sans-serif", whiteSpace: "pre-wrap" }}>{m.texto}</div>
                  </div>
                </div>
              );
            })}
            {cargando && (
              <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
                <div style={{ flexShrink: 0 }}><Avatar esp={activo} size={24} /></div>
                <div style={{ background: "#111", border: `1px solid ${esp.color}40`, padding: "8px 12px", borderRadius: "4px 12px 12px 12px", color: esp.color, fontSize: "11px", fontFamily: "sans-serif" }}>
                  {esp.nombre} está pensando...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Preguntas rápidas */}
          <div style={{ padding: "6px 10px", borderTop: "1px solid #151515", display: "flex", gap: "5px", overflowX: "auto" }}>
            {PREGUNTAS_RAPIDAS[activo].map((q, i) => (
              <button key={i} onClick={() => enviar(q)} disabled={cargando} style={{ flexShrink: 0, background: esp.colorSuave, border: `1px solid ${esp.color}50`, color: esp.color, fontSize: "9px", fontWeight: 600, fontFamily: "sans-serif", borderRadius: "99px", padding: "4px 10px", cursor: "pointer", whiteSpace: "nowrap" }}>
                {q}
              </button>
            ))}
          </div>

          {/* Banner construccion */}
          <div style={{ padding: "6px 12px", background: "#0d0d0d", borderTop: "1px solid #1a1a1a", textAlign: "center" }}>
            <span style={{ color: "#00ff88", fontSize: "9px", fontWeight: 700, fontFamily: "sans-serif" }}>🚧 LandCopy está en construcción activa — esto puede mejorar pronto</span>
          </div>

          {/* Input */}
          <div style={{ padding: "10px 12px", borderTop: "1px solid #1a1a1a", display: "flex", gap: "8px" }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && enviar(input)}
              placeholder={`Pregúntale a ${esp.nombre}...`}
              style={{ flex: 1, background: "#111", border: "1px solid #1e1e1e", borderRadius: "8px", padding: "8px 10px", color: "#f0ead6", fontSize: "11px", outline: "none", fontFamily: "sans-serif" }}
            />
            <button onClick={() => enviar(input)} disabled={!input.trim() || cargando} style={{ background: esp.color, border: "none", borderRadius: "8px", padding: "8px 12px", color: "#0a0a0a", fontSize: "12px", fontWeight: 700, cursor: "pointer", opacity: !input.trim() || cargando ? 0.5 : 1 }}>
              →
            </button>
          </div>
        </div>
      )}
    </>
  );
}