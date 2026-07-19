"use client";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";

// Bucket publico de Supabase (proyecto landcopy) — mismas poses que usa Leonel en Social Red
const ASSETS_BASE =
  "https://mrzkfethdxkfoostoaff.supabase.co/storage/v1/object/public/leonel-assets";

const POSES = {
  reposo: `${ASSETS_BASE}/leonel_master.png`,
  pensando: `${ASSETS_BASE}/pensando.png`,
  senalando: `${ASSETS_BASE}/senalando.png`,
  explicando: `${ASSETS_BASE}/explicando.png`,
  indice: `${ASSETS_BASE}/indice.png`,
  laptop: `${ASSETS_BASE}/laptop.png`,
  celular: `${ASSETS_BASE}/celular.png`,
  pulgar_arriba: `${ASSETS_BASE}/pulgar_arriba.png`,
  brazos_cruzados: `${ASSETS_BASE}/brazos_cruzados.png`,
} as const;

type PoseKey = keyof typeof POSES;

// Poses que Leonel usa al terminar de responder, elegidas al azar para que se sienta vivo
const RESPONSE_POSES: PoseKey[] = ["reposo", "explicando", "senalando", "indice", "pulgar_arriba", "laptop", "celular"];

type Mensaje = { role: "user" | "leonel"; content: string };

// Rutas publicas (landings de clientes) — Leonel NUNCA debe salir ahi
const RUTAS_SIN_CHAT = ["/v/", "/share/", "/venezuela", "/ayuda-venezuela"];

export default function LeonelChat() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [pose, setPose] = useState<PoseKey>("brazos_cruzados");
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    { role: "leonel", content: "Hola, soy Leonel 👋 Conozco LandCopy por dentro, la estrategia para vender y el análisis de lo que ya tienes hecho. ¿En qué te ayudo?" },
  ]);
  const [input, setInput] = useState("");
  const [cargando, setCargando] = useState(false);
  const [campana, setCampana] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [mensajes, open]);

  useEffect(() => {
    if (!open) return;
    try {
      const c = sessionStorage.getItem("campaign_activa");
      setCampana(c ? JSON.parse(c) : null);
    } catch { setCampana(null); }
  }, [open]);

  // Puente para los botones "Que Leonel lo analice" de otras pantallas.
  // Sin arreglo de dependencias a proposito: se re-registra en cada render para
  // que la funcion siempre vea el estado fresco del chat.
  useEffect(() => {
    (window as any).leonelAnalizar = (pregunta: string, contexto?: string, imagenes?: string[]) => {
      setOpen(true);
      enviarMensaje(pregunta, { contexto, imagenes });
    };
    return () => { try { delete (window as any).leonelAnalizar; } catch {} };
  });

  const rutaPublica = RUTAS_SIN_CHAT.some((r) => pathname?.startsWith(r));

  function enviar() {
    const pregunta = input.trim();
    if (!pregunta) return;
    setInput("");
    return enviarMensaje(pregunta);
  }

  // extra: contexto e imagenes que llegan de un boton "analizar" de otra pantalla
  async function enviarMensaje(pregunta: string, extra?: { contexto?: string; imagenes?: string[] }) {
    if (!pregunta || cargando) return;
    setMensajes((prev) => [...prev, { role: "user", content: pregunta }]);
    setCargando(true);
    setPose("pensando");

    try {
      const historial = mensajes.slice(-10).map((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.content,
      }));

      // ===== RECOLECTAR TODO LO QUE LEONEL PUEDE VER =====
      const partes: string[] = [];
      const imagenes: string[] = [];

      // 0. Lo que mando el boton de otra pantalla (tiene prioridad: es lo que el usuario senalo)
      if (extra?.contexto) partes.push(extra.contexto);
      if (Array.isArray(extra?.imagenes)) {
        extra.imagenes.forEach((u) => { if (typeof u === "string" && u.startsWith("http")) imagenes.push(u); });
      }

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
            .filter((k) => typeof r[k] === "string" && r[k].trim())
            .map((k) => `[${k}]: ${r[k].slice(0, 300)}`);
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

      const payload = JSON.stringify({ pregunta, historial, contexto, imagenes: imagenes.slice(0, 5), pagina: pathname });
      const llamar = () => fetch("/api/leonel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
      }).then((r) => r.json());

      let data = await llamar().catch(() => null);
      if (!data?.respuesta) {
        // Reintento automático: 1 vez, silencioso
        data = await llamar().catch(() => null);
      }
      setMensajes((prev) => [...prev, { role: "leonel", content: data?.respuesta || "Me llegó mucha información de golpe 😅 — pregúntame de nuevo." }]);
    } catch {
      setMensajes((prev) => [...prev, { role: "leonel", content: "Hubo un error. Intenta de nuevo 🙏" }]);
    } finally {
      setCargando(false);
      setPose(RESPONSE_POSES[Math.floor(Math.random() * RESPONSE_POSES.length)]);
    }
  }

  if (rutaPublica) return null;

  return (
    <>
      <style>{`
        @keyframes leonel-glow {
          0%, 100% {
            filter: drop-shadow(0 0 3px rgba(255, 80, 0, 0.6)) drop-shadow(0 0 9px rgba(255, 80, 0, 0.35));
          }
          50% {
            filter: drop-shadow(0 0 6px rgba(255, 176, 0, 0.75)) drop-shadow(0 0 15px rgba(255, 176, 0, 0.4));
          }
        }
        @keyframes leonel-float {
          0%, 100% { transform: translateY(0) }
          50% { transform: translateY(-6px) }
        }
        .leonel-btn-img {
          animation: leonel-glow 3s ease-in-out infinite, leonel-float 4s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .leonel-btn-img { animation: none !important }
        }
      `}</style>

      {/* Leonel flotante, siempre visible, siempre en el mismo lugar */}
      <button
        onClick={() => { if (open) setPose("brazos_cruzados"); setOpen(!open); }}
        aria-label={open ? "Cerrar chat con Leonel" : "Abrir chat con Leonel"}
        className={`fixed right-4 z-[60] h-40 w-28 flex items-end justify-center active:scale-95 transition-all duration-300 ${
          open ? "bottom-20 sm:bottom-0" : "bottom-0"
        }`}
      >
        <img
          src={POSES[pose]}
          alt="Leonel"
          className="leonel-btn-img h-full w-auto object-contain object-bottom"
        />
      </button>

      {/* Panel de chat */}
      {open && (
        <div className="fixed inset-0 z-50 sm:inset-auto sm:bottom-5 sm:right-5 sm:h-[560px] sm:w-[360px] bg-[#0a0a0a] sm:rounded-2xl sm:border sm:border-white/10 sm:shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/40">
            <div>
              <p className="text-white text-sm font-semibold leading-tight">Leonel</p>
              <p className="text-white/50 text-xs leading-tight">Tu asistente de LandCopy</p>
            </div>
            <button
              onClick={() => { setOpen(false); setPose("brazos_cruzados"); }}
              aria-label="Cerrar chat"
              className="text-white/60 hover:text-white text-xl leading-none px-2"
            >
              ×
            </button>
          </div>

          {/* Mensajes */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {mensajes.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-snug whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-white/10 text-white rounded-br-sm"
                      : "bg-black/60 border border-white/10 text-white/90 rounded-bl-sm"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {cargando && (
              <div className="flex justify-start items-center gap-2">
                <span className="text-white/40 text-xs">Leonel está pensando...</span>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-white/10 p-3 flex gap-2 bg-black/40">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && enviar()}
              placeholder="Escríbele a Leonel..."
              className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-orange-500/50"
            />
            <button
              onClick={enviar}
              disabled={cargando || !input.trim()}
              className="h-10 w-10 rounded-full bg-orange-500 disabled:bg-white/10 disabled:text-white/30 text-black flex items-center justify-center active:scale-95 transition-transform"
              aria-label="Enviar mensaje"
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}
