"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
 
// ─────────────────────────────────────────────────────────────
// REDES — CENTRO DE CAMPAÑAS (Etapa 1: maqueta viva)
// Página nueva, no reemplaza /redes todavía. Aquí se prueba la
// estructura: modo (producto/negocio) + nivel + calendario.
// La generación real con IA llega en etapas siguientes.
// ─────────────────────────────────────────────────────────────
 
type Modo = "producto" | "negocio";
type NivelId = "normal" | "pro" | "class";
 
const NIVELES = [
  {
    id: "normal" as NivelId,
    nombre: "Normal",
    dias: 3,
    subtitulo: "Semana corta para probar",
    color: "#22c55e",
    redes: ["instagram"],
    incluye: ["1 red a elegir", "3 imágenes (1 por día)", "Caption + hashtags"],
    noIncluye: ["Carrusel", "Guión de video"],
    badge: null,
  },
  {
    id: "pro" as NivelId,
    nombre: "Pro",
    dias: 7,
    subtitulo: "Semana completa que vende",
    color: "#ff5000",
    redes: ["instagram", "facebook", "tiktok"],
    incluye: ["3 redes (IG, FB, TikTok)", "7 días frío → caliente", "Carrusel de 5 slides", "Guión de TikTok por día"],
    noIncluye: ["Variantes A/B"],
    badge: "MÁS USADO",
  },
  {
    id: "class" as NivelId,
    nombre: "Class",
    dias: 14,
    subtitulo: "El mes entero resuelto",
    color: "#a855f7",
    redes: ["instagram", "facebook", "tiktok", "whatsapp", "story", "shorts"],
    incluye: ["Todas las redes", "Calendario del mes", "Carruseles + Reels + Stories", "Exportar todo en ZIP"],
    noIncluye: [],
    badge: "PREMIUM",
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
 
// Temperatura: frío → tibio → caliente. Define el color del día.
const TEMP = {
  frio: { label: "Frío", color: "#0088cc" },
  tibio: { label: "Tibio", color: "#ff8800" },
  caliente: { label: "Caliente", color: "#cc0000" },
};
 
// Plantilla de días para MODO PRODUCTO (embudo de venta)
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
 
// Plantilla de días para MODO NEGOCIO (calendario de negocio local)
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
 
  const nivel = NIVELES.find(n => n.id === nivelId)!;
  const plantilla = modo === "producto" ? DIAS_PRODUCTO : DIAS_NEGOCIO;
  const dias = plantilla.slice(0, nivel.dias);
 
  return (
    <div className="min-h-screen bg-[#050505] text-[#F5F0E8]">
 
      {/* Header — mismo estilo que Redes */}
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
 
        {/* ───── BLOQUE 2: NIVEL ───── */}
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-5">
          <span className="text-xs font-bold tracking-widest uppercase text-[#FFF500] mb-3 block">2 · ¿Cuánto contenido quieres?</span>
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
                      <li key={i} className="text-[10px] text-[#C8C3B7] flex gap-1.5">
                        <span style={{ color: n.color }}>✓</span>{x}
                      </li>
                    ))}
                    {n.noIncluye.map((x, i) => (
                      <li key={i} className="text-[10px] text-[#555] flex gap-1.5">
                        <span>—</span>{x}
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>
        </div>
 
        {/* ───── BLOQUE 3: REDES DEL NIVEL ───── */}
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-5">
          <span className="text-xs font-bold tracking-widest uppercase text-[#FFF500] mb-3 block">3 · Redes incluidas en {nivel.nombre}</span>
          <div className="flex flex-wrap gap-2">
            {nivel.redes.map(r => (
              <div key={r} className="flex items-center gap-1.5 bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-2">
                <span className="text-sm">{REDES_INFO[r]?.icon}</span>
                <span className="text-[11px] font-bold text-[#EDE8DC]">{REDES_INFO[r]?.nombre}</span>
              </div>
            ))}
          </div>
        </div>
 
        {/* ───── BLOQUE 4: CALENDARIO MAQUETA ───── */}
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <span className="text-xs font-bold tracking-widest uppercase text-[#FFF500]">
              4 · Tu campaña de {nivel.dias} días {modo === "negocio" ? "(negocio)" : "(producto)"}
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
 
          <div className="mt-5 flex flex-col sm:flex-row gap-2">
            <button disabled
              className="flex-1 bg-[#FFF500] rounded-lg py-3 text-[#0d0d0d] text-sm font-black opacity-40 cursor-not-allowed flex items-center justify-center gap-2">
              ⚡ Generar campaña completa
            </button>
          </div>
          <p className="text-center text-[10px] text-[#555] mt-2">
            Maqueta — el motor de generación llega en la siguiente etapa
          </p>
        </div>
 
      </div>
    </div>
  );
}