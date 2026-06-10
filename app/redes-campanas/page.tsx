"use client";
import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

// ─────────────────────────────────────────────────────────────
// REDES — CENTRO DE CAMPAÑAS (Etapa 2)
// Maqueta viva + bloque de datos que cambia según el modo.
// Producto: 1 foto + identificar con IA.
// Negocio: hasta 5 fotos + perfil de negocio.
// La generación real de la campaña llega en la etapa siguiente.
// ─────────────────────────────────────────────────────────────

type Modo = "producto" | "negocio";
type NivelId = "normal" | "pro" | "class";

const NIVELES = [
  {
    id: "normal" as NivelId, nombre: "Normal", dias: 3, subtitulo: "Semana corta para probar", color: "#22c55e",
    redes: ["instagram"],
    incluye: ["1 red a elegir", "3 imágenes (1 por día)", "Caption + hashtags"],
    noIncluye: ["Carrusel", "Guión de video"], badge: null,
  },
  {
    id: "pro" as NivelId, nombre: "Pro", dias: 7, subtitulo: "Semana completa que vende", color: "#ff5000",
    redes: ["instagram", "facebook", "tiktok"],
    incluye: ["3 redes (IG, FB, TikTok)", "7 días frío → caliente", "Carrusel de 5 slides", "Guión de TikTok por día"],
    noIncluye: ["Variantes A/B"], badge: "MÁS USADO",
  },
  {
    id: "class" as NivelId, nombre: "Class", dias: 14, subtitulo: "El mes entero resuelto", color: "#a855f7",
    redes: ["instagram", "facebook", "tiktok", "whatsapp", "story", "shorts"],
    incluye: ["Todas las redes", "Calendario del mes", "Carruseles + Reels + Stories", "Exportar todo en ZIP"],
    noIncluye: [], badge: "PREMIUM",
  },
];

const REDES_INFO: Record<string, { nombre: string; icon: string }> = {
  instagram: { nombre: "Instagram", icon: "📸" },
  facebook: { nombre: "Facebook", icon: "👥" },
  tiktok: { nombre: "TikTok", icon: "🎵" },
  whatsapp: { nombre: "WhatsApp", icon: "💬" },
  story: { nombre: "Stories", icon: "📱" },
  shorts: { nombre: "YT Shorts", icon: "▶️" },
};

const TEMP = {
  frio: { label: "Frío", color: "#0088cc" },
  tibio: { label: "Tibio", color: "#ff8800" },
  caliente: { label: "Caliente", color: "#cc0000" },
};

const PAISES = ["Colombia", "México", "Venezuela", "Costa Rica", "Ecuador", "General"];
const TONOS = ["Urgente", "Emocional", "Cercano", "Confianza", "Premium", "Divertido"];

const DIAS_PRODUCTO = [
  { titulo: "Presentación — engancha", temp: "frio" },
  { titulo: "El problema — agita el dolor", temp: "frio" },
  { titulo: "La solución — tu producto", temp: "tibio" },
  { titulo: "Prueba social — testimonios", temp: "tibio" },
  { titulo: "Beneficios — demostración", temp: "tibio" },
  { titulo: "Oferta — precio y urgencia", temp: "caliente" },
  { titulo: "Último llamado — cierre", temp: "caliente" },
  { titulo: "Recordatorio — escasez", temp: "caliente" },
  { titulo: "Nuevo ángulo — otro beneficio", temp: "tibio" },
  { titulo: "Comparativa — vs. alternativas", temp: "tibio" },
  { titulo: "Historia de cliente", temp: "tibio" },
  { titulo: "Pregunta frecuente resuelta", temp: "frio" },
  { titulo: "Oferta final — última oportunidad", temp: "caliente" },
  { titulo: "Cierre de campaña", temp: "caliente" },
];

const DIAS_NEGOCIO = [
  { titulo: "Bienvenida + horarios", temp: "frio" },
  { titulo: "Detrás de cámara", temp: "frio" },
  { titulo: "Testimonio de cliente", temp: "tibio" },
  { titulo: "Promo de la semana", temp: "caliente" },
  { titulo: "Conoce al equipo", temp: "frio" },
  { titulo: "Últimos cupos / reserva", temp: "caliente" },
  { titulo: "Frase + gracias a clientes", temp: "frio" },
  { titulo: "Producto/servicio estrella", temp: "tibio" },
  { titulo: "Antes / después", temp: "tibio" },
  { titulo: "Tip útil del rubro", temp: "frio" },
  { titulo: "Oferta relámpago", temp: "caliente" },
  { titulo: "Pregunta frecuente", temp: "frio" },
  { titulo: "Novedad / anuncio", temp: "tibio" },
  { titulo: "Cierre de mes + agradecimiento", temp: "caliente" },
];

export default function RedesCampanas() {
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) window.location.href = "/login";
    });
  }, []);

  const [modo, setModo] = useState<Modo>("producto");
  const [nivelId, setNivelId] = useState<NivelId>("pro");

  // ── Datos modo PRODUCTO ──
  const [pNombre, setPNombre] = useState("");
  const [pImagen, setPImagen] = useState<string | null>(null);
  const [pPrecioOferta, setPPrecioOferta] = useState("");
  const [pPrecioAnterior, setPPrecioAnterior] = useState("");
  const [pBeneficio, setPBeneficio] = useState("");
  const [pProblema, setPProblema] = useState("");
  const [pIdentificando, setPIdentificando] = useState(false);

  // ── Datos modo NEGOCIO ──
  const [nNombre, setNNombre] = useState("");
  const [nFotos, setNFotos] = useState<string[]>([]);
  const [nOfrece, setNOfrece] = useState("");
  const [nCiudad, setNCiudad] = useState("");
  const [nIdentificando, setNIdentificando] = useState(false);

  // ── Compartidos ──
  const [pais, setPais] = useState("Colombia");
  const [tono, setTono] = useState("Urgente");
  const [toast, setToast] = useState("");

  const pFileRef = useRef<HTMLInputElement>(null);
  const nFileRef = useRef<HTMLInputElement>(null);

  const nivel = NIVELES.find(n => n.id === nivelId)!;
  const plantilla = modo === "producto" ? DIAS_PRODUCTO : DIAS_NEGOCIO;
  const dias = plantilla.slice(0, nivel.dias);

  function mostrarToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  // Comprime una imagen a JPG liviano antes de guardarla en estado
  function comprimir(file: File): Promise<string> {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const img = new Image();
      img.onload = () => {
        const max = 800;
        let w = img.width, h = img.height;
        if (w > max) { h = (h * max) / w; w = max; }
        if (h > max) { w = (w * max) / h; h = max; }
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.src = URL.createObjectURL(file);
    });
  }

  async function handleImagenProducto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const b = await comprimir(file);
    setPImagen(b);
  }

  async function handleFotosNegocio(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const espacio = 5 - nFotos.length;
    const aProcesar = files.slice(0, espacio);
    const nuevas: string[] = [];
    for (const f of aProcesar) {
      nuevas.push(await comprimir(f));
    }
    setNFotos(prev => [...prev, ...nuevas].slice(0, 5));
  }

  // Identificar PRODUCTO con IA (usa el endpoint que ya existe en Campaigns/Landing)
  async function identificarProducto() {
    if (!pImagen) return;
    setPIdentificando(true);
    try {
      const resp = await fetch("/api/campaigns/identificar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imagen: pImagen }),
      });
      const data = await resp.json();
      if (data.nombre) setPNombre(data.nombre);
      if (data.producto && !data.nombre) setPNombre(data.producto);
      if (data.problema) setPProblema(data.problema);
      if (data.beneficio) setPBeneficio(data.beneficio);
      mostrarToast("✓ Producto identificado");
    } catch {
      mostrarToast("No se pudo identificar");
    }
    setPIdentificando(false);
  }

  // Identificar NEGOCIO con IA (reusa el mismo endpoint con la primera foto)
  async function identificarNegocio() {
    if (nFotos.length === 0) return;
    setNIdentificando(true);
    try {
      const resp = await fetch("/api/campaigns/identificar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imagen: nFotos[0] }),
      });
      const data = await resp.json();
      if (data.nombre) setNNombre(data.nombre);
      if (data.beneficio) setNOfrece(data.beneficio);
      mostrarToast("✓ Negocio identificado");
    } catch {
      mostrarToast("No se pudo identificar");
    }
    setNIdentificando(false);
  }

  // ¿Tiene datos mínimos para poder generar?
  const listoProducto = modo === "producto" && pNombre.trim().length > 0;
  const listoNegocio = modo === "negocio" && nNombre.trim().length > 0;
  const listo = listoProducto || listoNegocio;

  const inputCls = "w-full bg-[#f0ead6] border border-[#d4cdb8] text-[#1a1a1a] rounded-md px-3 py-2 text-xs outline-none placeholder-[#888]";
  const labelCls = "text-[10px] font-bold tracking-widest uppercase text-[#FFF500] mb-1 block";

  return (
    <div className="min-h-screen bg-[#050505] text-[#F5F0E8]">

      {toast && (
        <div className="fixed bottom-6 right-6 bg-[#FFF500] text-[#0d0d0d] text-sm font-black px-4 py-3 rounded-lg z-50 shadow-lg">{toast}</div>
      )}

      {/* Header */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 pt-6 pb-0">
        <div className="flex flex-col md:flex-row items-center mb-4">
          <div className="flex items-center justify-center gap-3 flex-shrink-0 mb-3 md:mb-0">
            <div className="w-[56px] h-[56px] md:w-[72px] md:h-[72px] rounded-full bg-[#0d001a] border border-[#2a2a2a] flex items-center justify-center">
              <svg width="36" height="36" viewBox="0 0 32 32" fill="none" className="md:w-[42px] md:h-[42px]">
                <circle cx="16" cy="16" r="10" stroke="white" strokeWidth="1.5" opacity="0.3"/>
                <circle cx="16" cy="16" r="6" stroke="white" strokeWidth="1.5" opacity="0.6"/>
                <circle cx="16" cy="16" r="2.5" fill="white"/>
                <line x1="16" y1="6" x2="16" y2="10" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="16" y1="22" x2="16" y2="26" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="6" y1="16" x2="10" y2="16" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="22" y1="16" x2="26" y2="16" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="text-white text-[15px] md:text-[18px] font-bold tracking-[0.10em] uppercase leading-tight">Redes ·<br/>Campañas</p>
          </div>
          <div className="flex-1 text-center">
            <div className="inline-flex items-center gap-2 bg-orange-500 text-white text-[9px] font-bold px-3 py-1 rounded-full mb-2 tracking-widest">
              IA GENERATIVA · CAMPAÑAS DE REDES
            </div>
            <h1 className="text-lg md:text-xl font-black text-white mb-1 px-2">
              Lanza campañas completas que <span style={{color:"#cc0000"}}>venden</span> y <span className="text-green-400">viralizan</span>
            </h1>
            <p className="text-yellow-400 text-[11px] px-2">Elige el modo y el nivel · la IA arma los días completos para cada red</p>
          </div>
          <div className="flex-shrink-0 hidden md:block" style={{width:"99px"}}></div>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-4 md:px-6 pb-20 mt-4 space-y-6">

        {/* ───── BLOQUE 1: MODO ───── */}
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-5">
          <span className="text-xs font-bold tracking-widest uppercase text-[#FFF500] mb-3 block">1 · ¿Qué vas a promocionar?</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button onClick={() => setModo("producto")}
              className={`text-left rounded-xl p-4 border transition-all ${modo === "producto" ? "border-orange-500 bg-[rgba(255,80,0,0.07)]" : "border-[#1e1e1e] bg-[#111] hover:border-[#333]"}`}>
              <div className="text-2xl mb-2">📦</div>
              <div className={`text-sm font-black mb-1 ${modo === "producto" ? "text-orange-400" : "text-white"}`}>Un producto</div>
              <div className="text-[11px] text-[#7A7772] leading-snug">Dropshipping o un producto que vendes. La IA crea imágenes del producto y campaña de venta.</div>
            </button>
            <button onClick={() => setModo("negocio")}
              className={`text-left rounded-xl p-4 border transition-all ${modo === "negocio" ? "border-cyan-500 bg-[rgba(56,189,248,0.07)]" : "border-[#1e1e1e] bg-[#111] hover:border-[#333]"}`}>
              <div className="text-2xl mb-2">🏪</div>
              <div className={`text-sm font-black mb-1 ${modo === "negocio" ? "text-cyan-400" : "text-white"}`}>Mi negocio local</div>
              <div className="text-[11px] text-[#7A7772] leading-snug">Peluquería, restaurante, tienda. Subes tus fotos reales y la IA arma tu mes de publicaciones.</div>
            </button>
          </div>
        </div>

        {/* ───── BLOQUE 2: DATOS (cambia según modo) ───── */}
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-5">
          <span className="text-xs font-bold tracking-widest uppercase text-[#FFF500] mb-3 block">
            2 · {modo === "producto" ? "Tu producto" : "Tu negocio"}
          </span>

          {modo === "producto" ? (
            // ── FORMULARIO PRODUCTO ──
            <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-4">
              {/* Foto producto */}
              <div>
                <span className={labelCls}>Foto del producto</span>
                <div onClick={() => !pImagen && pFileRef.current?.click()}
                  className="bg-[#1e1e1e] border border-dashed border-[#333] rounded-lg p-3 text-center cursor-pointer hover:border-[#FFF500] transition-colors min-h-[150px] flex items-center justify-center">
                  {pImagen ? (
                    <div className="relative inline-block">
                      <img src={pImagen} className="h-32 mx-auto rounded-md object-contain" alt="producto" />
                      <button onClick={(e) => { e.stopPropagation(); setPImagen(null); }}
                        className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">✕</button>
                    </div>
                  ) : (
                    <div>
                      <div className="text-[#FFF500] text-4xl mb-2">📷</div>
                      <div className="text-[#C8C3B7] text-[10px]">Toca para subir</div>
                      <div className="text-[#FFF500] text-[10px] font-bold mt-0.5">GPT-4o Vision lo analiza</div>
                    </div>
                  )}
                </div>
                <input ref={pFileRef} type="file" accept="image/*" onChange={handleImagenProducto} className="hidden" />
                {pImagen && (
                  <button onClick={identificarProducto} disabled={pIdentificando}
                    className="w-full mt-2 bg-orange-500 text-white text-[11px] font-bold py-2 rounded-lg disabled:opacity-40">
                    {pIdentificando ? "⏳ Identificando..." : "🔍 Identificar producto"}
                  </button>
                )}
              </div>

              {/* Campos producto */}
              <div className="space-y-2">
                <div>
                  <span className={labelCls}>Nombre del producto *</span>
                  <input value={pNombre} onChange={e => setPNombre(e.target.value)} placeholder="Ej: Rodillax" className={inputCls} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className={labelCls}>Precio oferta</span>
                    <input value={pPrecioOferta} onChange={e => setPPrecioOferta(e.target.value)} placeholder="49.000" className={inputCls} />
                  </div>
                  <div>
                    <span className={labelCls}>Precio anterior</span>
                    <input value={pPrecioAnterior} onChange={e => setPPrecioAnterior(e.target.value)} placeholder="89.000" className={inputCls} />
                  </div>
                </div>
                <div>
                  <span className={labelCls}>Beneficio principal</span>
                  <input value={pBeneficio} onChange={e => setPBeneficio(e.target.value)} placeholder="Se llena solo con 🔍" className={inputCls} />
                </div>
                <div>
                  <span className={labelCls}>Problema que resuelve</span>
                  <input value={pProblema} onChange={e => setPProblema(e.target.value)} placeholder="Se llena solo con 🔍" className={inputCls} />
                </div>
              </div>
            </div>
          ) : (
            // ── FORMULARIO NEGOCIO ──
            <div className="space-y-4">
              {/* Fotos negocio (hasta 5) */}
              <div>
                <span className={labelCls}>Fotos de tu negocio (hasta 5) — local, equipo, productos</span>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {nFotos.map((f, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-[#2a2a2a]">
                      <img src={f} className="w-full h-full object-cover" alt={`foto ${i + 1}`} />
                      <button onClick={() => setNFotos(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">✕</button>
                    </div>
                  ))}
                  {nFotos.length < 5 && (
                    <button onClick={() => nFileRef.current?.click()}
                      className="aspect-square rounded-lg border-2 border-dashed border-cyan-500/40 hover:border-cyan-500 flex flex-col items-center justify-center bg-[rgba(56,189,248,0.04)] transition-colors">
                      <span className="text-cyan-400 text-2xl">＋</span>
                      <span className="text-cyan-400 text-[8px] font-bold">Agregar</span>
                    </button>
                  )}
                </div>
                <input ref={nFileRef} type="file" accept="image/*" multiple onChange={handleFotosNegocio} className="hidden" />
                {nFotos.length > 0 && (
                  <button onClick={identificarNegocio} disabled={nIdentificando}
                    className="mt-2 bg-cyan-500 text-black text-[11px] font-bold py-2 px-4 rounded-lg disabled:opacity-40">
                    {nIdentificando ? "⏳ Identificando..." : "🔍 Identificar negocio"}
                  </button>
                )}
              </div>

              {/* Campos negocio */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <span className={labelCls}>Nombre del negocio *</span>
                  <input value={nNombre} onChange={e => setNNombre(e.target.value)} placeholder="Ej: Peluquería Maru" className={inputCls} />
                </div>
                <div>
                  <span className={labelCls}>¿Qué ofreces?</span>
                  <input value={nOfrece} onChange={e => setNOfrece(e.target.value)} placeholder="Cortes, color, peinados" className={inputCls} />
                </div>
                <div>
                  <span className={labelCls}>Ciudad</span>
                  <input value={nCiudad} onChange={e => setNCiudad(e.target.value)} placeholder="Medellín" className={inputCls} />
                </div>
              </div>
            </div>
          )}

          {/* País + Tono (compartidos) */}
          <div className="border-t border-[#1e1e1e] my-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className={labelCls}>País</span>
              <div className="flex flex-wrap gap-1">
                {PAISES.map(p => (
                  <button key={p} onClick={() => setPais(p)}
                    className={`text-[10px] font-bold px-2 py-1 rounded-sm border transition-all ${pais === p ? "bg-[rgba(255,215,0,0.1)] border-[rgba(255,215,0,0.4)] text-[#FFF500]" : "bg-[#1e1e1e] border-[#2a2a2a] text-[#EDE8DC]"}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className={labelCls}>Tono</span>
              <div className="flex flex-wrap gap-1">
                {TONOS.map(t => (
                  <button key={t} onClick={() => setTono(t)}
                    className={`text-[10px] font-bold px-2 py-1 rounded-sm border transition-all ${tono === t ? "bg-[rgba(255,215,0,0.1)] border-[rgba(255,215,0,0.4)] text-[#FFF500]" : "bg-[#1e1e1e] border-[#2a2a2a] text-[#EDE8DC]"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ───── BLOQUE 3: NIVEL ───── */}
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-5">
          <span className="text-xs font-bold tracking-widest uppercase text-[#FFF500] mb-3 block">3 · ¿Cuánto contenido quieres?</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {NIVELES.map(n => {
              const activo = nivelId === n.id;
              return (
                <button key={n.id} onClick={() => setNivelId(n.id)}
                  className={`text-left rounded-xl p-4 border transition-all relative ${activo ? "bg-[#111]" : "border-[#1e1e1e] bg-[#0d0d0d] hover:border-[#333]"}`}
                  style={activo ? { borderColor: n.color } : {}}>
                  {n.badge && (
                    <span className="absolute top-3 right-3 text-[8px] font-black px-2 py-0.5 rounded-full text-white" style={{ background: n.color }}>{n.badge}</span>
                  )}
                  <div className="text-base font-black mb-0.5" style={{ color: activo ? n.color : "#fff" }}>{n.nombre}</div>
                  <div className="text-[10px] text-[#7A7772] mb-3">{n.dias} días · {n.subtitulo}</div>
                  <ul className="space-y-1">
                    {n.incluye.map((x, i) => (
                      <li key={i} className="text-[10px] text-[#C8C3B7] flex gap-1.5"><span style={{ color: n.color }}>✓</span>{x}</li>
                    ))}
                    {n.noIncluye.map((x, i) => (
                      <li key={i} className="text-[10px] text-[#555] flex gap-1.5"><span>—</span>{x}</li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>
        </div>

        {/* ───── BLOQUE 4: REDES DEL NIVEL ───── */}
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-5">
          <span className="text-xs font-bold tracking-widest uppercase text-[#FFF500] mb-3 block">4 · Redes incluidas en {nivel.nombre}</span>
          <div className="flex flex-wrap gap-2">
            {nivel.redes.map(r => (
              <div key={r} className="flex items-center gap-1.5 bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-2">
                <span className="text-sm">{REDES_INFO[r]?.icon}</span>
                <span className="text-[11px] font-bold text-[#EDE8DC]">{REDES_INFO[r]?.nombre}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ───── BLOQUE 5: CALENDARIO MAQUETA ───── */}
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <span className="text-xs font-bold tracking-widest uppercase text-[#FFF500]">
              5 · Tu campaña de {nivel.dias} días {modo === "negocio" ? "(negocio)" : "(producto)"}
            </span>
            <div className="flex gap-3">
              {Object.values(TEMP).map(t => (
                <span key={t.label} className="text-[10px] flex items-center gap-1.5 text-[#C8C3B7]">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: t.color }}></span>{t.label}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
            {dias.map((d, i) => {
              const temp = TEMP[d.temp as keyof typeof TEMP];
              return (
                <div key={i} className="bg-[#111] border border-[#1e1e1e] rounded-xl p-2.5 min-h-[110px] flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-black text-[#7A7772]">DÍA {i + 1}</span>
                    <span className="w-3.5 h-3.5 rounded" style={{ background: temp.color }}></span>
                  </div>
                  <div className="text-[10px] font-bold text-white leading-tight mb-2">{d.titulo}</div>
                  <div className="flex flex-wrap gap-1 mt-auto">
                    {nivel.redes.slice(0, 4).map(r => (
                      <span key={r} className="w-4 h-4 rounded flex items-center justify-center text-[8px] bg-[#1a1a1a] border border-[#2a2a2a]">{REDES_INFO[r]?.icon}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5">
            <button disabled={!listo}
              className={`w-full rounded-lg py-3 text-sm font-black flex items-center justify-center gap-2 transition-all ${listo ? "bg-[#FFF500] text-[#0d0d0d] cursor-pointer hover:brightness-110" : "bg-[#FFF500] text-[#0d0d0d] opacity-30 cursor-not-allowed"}`}>
              ⚡ Generar campaña completa
            </button>
            <p className="text-center text-[10px] text-[#555] mt-2">
              {listo
                ? "Maqueta — el motor de generación llega en la siguiente etapa"
                : modo === "producto" ? "Agrega el nombre del producto para continuar" : "Agrega el nombre del negocio para continuar"}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
