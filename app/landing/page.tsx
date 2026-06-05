"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Campaign {
  id: string;
  nombre: string;
  producto: string;
  problema: string;
  beneficio: string;
  precio_anterior: string;
  precio_oferta: string;
  pais: string;
  tono: string;
  headline: string;
  imagen_url: string | null;
  imagen_url_2: string | null;
  imagen_url_3: string | null;
  es_combo: boolean;
}

const SECCIONES_INDIVIDUAL = [
  { id: "hero", nombre: "Hero", sub: "Titular + foto + CTA" },
  { id: "problema", nombre: "El problema", sub: "Dolor amplificado" },
  { id: "solucion", nombre: "La solución", sub: "Producto como respuesta" },
  { id: "beneficios", nombre: "Beneficios", sub: "3 íconos + texto" },
  { id: "como_funciona", nombre: "Cómo funciona", sub: "3 pasos simples" },
  { id: "testimonios", nombre: "Testimonios", sub: "Prueba social" },
  { id: "oferta", nombre: "Oferta", sub: "Precio + urgencia" },
  { id: "cta_final", nombre: "CTA final", sub: "Cierre de venta" },
];

const SECCIONES_COMBO = [
  { id: "hero", nombre: "Hero", sub: "3 fotos + titular" },
  { id: "problema", nombre: "El problema", sub: "Dolor amplificado" },
  { id: "kit", nombre: "Qué incluye el kit", sub: "Card por producto" },
  { id: "solucion", nombre: "La solución", sub: "El kit como respuesta" },
  { id: "beneficios", nombre: "Beneficios", sub: "3 íconos + texto" },
  { id: "como_funciona", nombre: "Cómo funciona", sub: "3 pasos simples" },
  { id: "testimonios", nombre: "Testimonios", sub: "Prueba social" },
  { id: "oferta", nombre: "Oferta combo", sub: "Precio del kit" },
  { id: "cta_final", nombre: "CTA final", sub: "Cierre de venta" },
];

const ESTILOS = [
  { id: "oscuro", nombre: "Oscuro", sub: "Dark premium" },
  { id: "claro", nombre: "Claro", sub: "Clean white" },
  { id: "bold", nombre: "Bold", sub: "Alta energía" },
  { id: "suave", nombre: "Suave", sub: "Confianza" },
];

export default function Landing() {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [sinCampaña, setSinCampaña] = useState(false);
  const [paso, setPaso] = useState(1);
  const [estilo, setEstilo] = useState("oscuro");
  const [vistaMovil, setVistaMovil] = useState(false);
  const [seccionActiva, setSeccionActiva] = useState("hero");
  const [contenido, setContenido] = useState<Record<string, string>>({});
  const [generando, setGenerando] = useState(false);
  const [seccionGenerando, setSeccionGenerando] = useState<string | null>(null);

  // Formulario sin campaña
  const [fNombre, setFNombre] = useState("");
  const [fProducto, setFProducto] = useState("");
  const [fProblema, setFProblema] = useState("");
  const [fBeneficio, setFBeneficio] = useState("");
  const [fPrecioOferta, setFPrecioOferta] = useState("");
  const [fPrecioAnterior, setFPrecioAnterior] = useState("");
  const [fPais, setFPais] = useState("Colombia");
  const [fTono, setFTono] = useState("Urgente");
  const [fImagen1, setFImagen1] = useState<string | null>(null);
  const [fImagen2, setFImagen2] = useState<string | null>(null);
  const [fImagen3, setFImagen3] = useState<string | null>(null);
  const [fIdentificando, setFIdentificando] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) window.location.href = "/login";
    });
    const c = sessionStorage.getItem("campaign_activa");
    if (c) setCampaign(JSON.parse(c));
  }, []);

  const secciones = campaign?.es_combo ? SECCIONES_COMBO : SECCIONES_INDIVIDUAL;

  const handleImagen = (e: React.ChangeEvent<HTMLInputElement>, slot: 1 | 2 | 3) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const b = reader.result as string;
      if (slot === 1) setFImagen1(b);
      if (slot === 2) setFImagen2(b);
      if (slot === 3) setFImagen3(b);
    };
    reader.readAsDataURL(file);
  };

  const identificarProducto = async () => {
    if (!fImagen1) return;
    setFIdentificando(true);
    try {
      const resp = await fetch("/api/campaigns/identificar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imagen: fImagen1 }),
      });
      const data = await resp.json();
      if (data.nombre) setFNombre(data.nombre);
      if (data.producto) setFProducto(data.producto);
      if (data.problema) setFProblema(data.problema);
      if (data.beneficio) setFBeneficio(data.beneficio);
    } catch {}
    setFIdentificando(false);
  };

  const datosActivos = campaign ? {
    producto: campaign.producto,
    problema: campaign.problema,
    beneficio: campaign.beneficio,
    precioOferta: campaign.precio_oferta,
    precioAnterior: campaign.precio_anterior,
    pais: campaign.pais,
    tono: campaign.tono,
    headline: campaign.headline,
    imagen_url: campaign.imagen_url,
    imagen_url_2: campaign.imagen_url_2,
    imagen_url_3: campaign.imagen_url_3,
    es_combo: campaign.es_combo,
  } : {
    producto: fProducto,
    problema: fProblema,
    beneficio: fBeneficio,
    precioOferta: fPrecioOferta,
    precioAnterior: fPrecioAnterior,
    pais: fPais,
    tono: fTono,
    headline: "",
    imagen_url: fImagen1,
    imagen_url_2: fImagen2,
    imagen_url_3: fImagen3,
    es_combo: !!(fImagen2 || fImagen3),
  };

  const generarLanding = async () => {
    setGenerando(true);
    setPaso(2);
    const seccionesAGenerar = campaign?.es_combo ? SECCIONES_COMBO : SECCIONES_INDIVIDUAL;
    for (const s of seccionesAGenerar) {
      setSeccionGenerando(s.id);
      try {
        const resp = await fetch("/api/landing/generar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ seccion: s.id, ...datosActivos }),
        });
        const data = await resp.json();
        if (data.texto) setContenido(prev => ({ ...prev, [s.id]: data.texto }));
      } catch {}
    }
    setSeccionGenerando(null);
    setGenerando(false);
    setPaso(3);
  };

  const regenerarSeccion = async (seccionId: string) => {
    setSeccionGenerando(seccionId);
    try {
      const resp = await fetch("/api/landing/generar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seccion: seccionId, ...datosActivos }),
      });
      const data = await resp.json();
      if (data.texto) setContenido(prev => ({ ...prev, [seccionId]: data.texto }));
    } catch {}
    setSeccionGenerando(null);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">

      {/* Header */}
      <div className="max-w-[1400px] mx-auto px-4 pt-6 pb-0">
        <div className="flex items-center mb-0">
          <div className="flex items-center gap-2 flex-shrink-0" style={{width:"160px"}}>
            <div className="w-[72px] h-[72px] rounded-full bg-[#001a0a] border border-[#2a2a2a] flex items-center justify-center flex-shrink-0">
              <svg width="38" height="38" viewBox="0 0 32 32" fill="none">
                <rect x="4" y="6" width="24" height="18" rx="2" stroke="white" strokeWidth="1.5" fill="white" fillOpacity="0.1"/>
                <rect x="4" y="6" width="24" height="5" rx="2" fill="white" fillOpacity="0.4"/>
                <circle cx="8" cy="8.5" r="1" fill="white"/>
                <circle cx="11" cy="8.5" r="1" fill="white"/>
                <rect x="8" y="14" width="8" height="5" rx="1" fill="white" fillOpacity="0.5"/>
                <line x1="18" y1="14" x2="24" y2="14" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="18" y1="17" x2="24" y2="17" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="text-white text-[14px] font-bold tracking-[0.12em] uppercase">Landing</p>
          </div>
          <div className="flex-1 text-center px-5">
            <div className="inline-flex items-center gap-2 bg-orange-500 text-white text-[9px] font-bold px-3 py-1 rounded-full mb-2 tracking-widest">
              IA GENERATIVA · LANDING DE VENTAS
            </div>
            <h1 className="text-xl font-black text-white mb-1">
              Crea páginas que <span style={{color:"#f97316"}}>venden</span> y <span style={{color:"#22c55e"}}>convierten</span>
            </h1>
            <p className="text-yellow-400 text-[11px]">Producto · sección · estilo · la IA genera la landing completa lista para publicar</p>
          </div>
          <div className="flex-shrink-0" style={{width:"160px"}}></div>
        </div>
      </div>

      {/* Steps */}
      <div className="flex bg-[#1a1a1a] border-t border-b border-[#2a2a2a] mt-4">
        {[
          { n: 1, label: "Paso 1 — Tu producto", sub: "Datos o campaña" },
          { n: 2, label: "Paso 2 — Generando", sub: "8 secciones con IA" },
          { n: 3, label: "Paso 3 — Resultado", sub: "Descarga o comparte" },
        ].map((s) => (
          <div key={s.n} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-r border-[#2a2a2a] last:border-r-0 relative">
            <div className={`w-[22px] h-[22px] rounded flex items-center justify-center text-[11px] font-black flex-shrink-0 ${paso === s.n ? "bg-orange-500 text-white" : paso > s.n ? "bg-green-500 text-white" : "bg-[#2a2a2a] text-[#555]"}`}>
              {paso > s.n ? "✓" : s.n}
            </div>
            <div>
              <div className={`text-[10px] font-bold tracking-widest uppercase ${paso === s.n ? "text-orange-500" : paso > s.n ? "text-green-400" : "text-yellow-400"}`}>{s.label}</div>
              <div className="text-[9px] text-yellow-400 mt-0.5">{s.sub}</div>
            </div>
            {paso === s.n && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-orange-500" />}
          </div>
        ))}
      </div>

      <div className="max-w-[1400px] mx-auto px-4 pb-12 mt-6">

        {/* PASO 1 — Sin campaña: invitación */}
        {paso === 1 && !campaign && !sinCampaña && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-8 text-center mb-6">
              <div className="text-5xl mb-4">🚀</div>
              <h2 className="text-xl font-black text-white mb-2">¿Tienes una campaña activa?</h2>
              <p className="text-zinc-500 text-sm mb-6 leading-relaxed">Con una campaña tus datos viajan automáticamente — producto, fotos, precios, headline y beneficios. Sin llenar nada de nuevo.</p>
              <div className="flex gap-3 justify-center mb-6">
                <a href="/campaigns" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors">→ Ir a Mis Campañas</a>
                <button onClick={() => setSinCampaña(true)} className="border border-[#333] text-[#f0ead6] font-bold px-6 py-3 rounded-xl text-sm hover:border-[#555] transition-colors">Continuar sin campaña</button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { icon: "📸", txt: "Foto viaja automáticamente" },
                  { icon: "⚡", txt: "Sin llenar datos de nuevo" },
                  { icon: "💾", txt: "Todo queda guardado" },
                ].map((v, i) => (
                  <div key={i} className="bg-[#111] border border-[#1a1a1a] rounded-xl p-4 text-center">
                    <div className="text-2xl mb-2">{v.icon}</div>
                    <p className="text-[10px] text-zinc-500">{v.txt}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PASO 1 — Con campaña activa */}
        {paso === 1 && campaign && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-[#0d1a0a] border border-[#22c55e30] rounded-xl p-4 flex items-center gap-3 mb-6">
              <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
              <div className="flex gap-2">
                {campaign.imagen_url && <img src={campaign.imagen_url} className="w-10 h-10 object-contain rounded-lg bg-[#111]" />}
                {campaign.imagen_url_2 && <img src={campaign.imagen_url_2} className="w-8 h-8 object-contain rounded-lg bg-[#111]" />}
                {campaign.imagen_url_3 && <img src={campaign.imagen_url_3} className="w-8 h-8 object-contain rounded-lg bg-[#111]" />}
              </div>
              <div className="flex-1">
                <p className="text-[9px] text-green-400 uppercase tracking-widest mb-0.5">Campaña activa {campaign.es_combo && <span className="bg-orange-500/20 text-orange-400 px-1 rounded ml-1">COMBO</span>}</p>
                <p className="text-white text-sm font-bold">{campaign.nombre}</p>
                <p className="text-zinc-500 text-[10px]">{campaign.precio_oferta && `$${campaign.precio_oferta}`} · {campaign.pais} · {campaign.tono}</p>
              </div>
              <a href="/campaigns" className="text-[9px] text-zinc-500 border border-[#333] px-3 py-1.5 rounded-lg hover:border-[#555]">Cambiar</a>
            </div>

            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-6 mb-6">
              <p className="text-orange-500 text-[10px] font-bold tracking-widest uppercase mb-4">Estilo visual</p>
              <div className="grid grid-cols-4 gap-3 mb-6">
                {ESTILOS.map(e => (
                  <div key={e.id} onClick={() => setEstilo(e.id)} className={`p-3 rounded-xl border cursor-pointer text-center transition-all ${estilo === e.id ? "border-green-500 bg-green-500/10" : "border-[#1a1a1a] hover:border-[#333]"}`}>
                    <p className="text-white text-[11px] font-bold">{e.nombre}</p>
                    <p className="text-zinc-500 text-[9px]">{e.sub}</p>
                  </div>
                ))}
              </div>
              <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-3 mb-4 flex items-center gap-3">
                <span className="text-yellow-400 text-[10px]">🖼️ {campaign.es_combo ? "9" : "8"} secciones · {campaign.es_combo ? "9" : "8"} imágenes con gpt-image-2</span>
                <span className="ml-auto text-zinc-500 text-[9px]">Costo estimado: ~${campaign.es_combo ? "0.36" : "0.32"} USD</span>
              </div>
              <button onClick={generarLanding} className="w-full bg-green-500 hover:bg-green-600 text-black font-black py-3 rounded-xl text-sm transition-colors">
                ⚡ Generar landing completa ahora
              </button>
            </div>
          </div>
        )}

        {/* PASO 1 — Sin campaña: formulario */}
        {paso === 1 && sinCampaña && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-orange-500 text-[10px] font-bold tracking-widest uppercase">Datos del producto</p>
                <p className="text-zinc-600 text-[9px]">Al terminar puedes guardar como campaña</p>
              </div>

              <p className="text-yellow-400 text-[9px] font-bold uppercase tracking-wider mb-2">Foto del producto</p>
              <div className="flex gap-4 mb-6">
                {[1,2,3].map(slot => (
                  <div key={slot} className="relative">
                    <label className={`flex flex-col items-center justify-center w-[110px] h-[90px] border-2 border-dashed rounded-xl cursor-pointer transition-colors ${slot === 1 ? "border-orange-500/50 hover:border-orange-500" : "border-[#222] hover:border-[#444]"}`}>
                      {(slot === 1 ? fImagen1 : slot === 2 ? fImagen2 : fImagen3) ? (
                        <img src={slot === 1 ? fImagen1! : slot === 2 ? fImagen2! : fImagen3!} className="w-full h-full object-contain rounded-xl" />
                      ) : (
                        <>
                          <span className="text-xl mb-1">📷</span>
                          <span className="text-[8px] text-zinc-500">{slot === 1 ? "Principal *" : `Combo ${slot}`}</span>
                        </>
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={e => handleImagen(e, slot as 1|2|3)} />
                    </label>
                    {slot === 1 && fImagen1 && (
                      <button onClick={identificarProducto} disabled={fIdentificando} className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[8px] font-bold px-3 py-1 rounded-full whitespace-nowrap">
                        {fIdentificando ? "⏳..." : "🔍 Identificar"}
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-yellow-400 text-[9px] font-bold uppercase tracking-wider">Nombre del producto *</label>
                  <input value={fNombre} onChange={e => setFNombre(e.target.value)} className="w-full mt-1 bg-[#f0ead6] text-black text-sm px-3 py-2 rounded-lg outline-none" placeholder="Ej: Rodillax" />
                </div>
                <div>
                  <label className="text-yellow-400 text-[9px] font-bold uppercase tracking-wider">Beneficio principal</label>
                  <input value={fBeneficio} onChange={e => setFBeneficio(e.target.value)} className="w-full mt-1 bg-[#f0ead6] text-black text-sm px-3 py-2 rounded-lg outline-none" placeholder="Se llena solo con 🔍" />
                </div>
                <div>
                  <label className="text-yellow-400 text-[9px] font-bold uppercase tracking-wider">Problema que resuelve</label>
                  <input value={fProblema} onChange={e => setFProblema(e.target.value)} className="w-full mt-1 bg-[#f0ead6] text-black text-sm px-3 py-2 rounded-lg outline-none" placeholder="Se llena solo con 🔍" />
                </div>
                <div>
                  <label className="text-yellow-400 text-[9px] font-bold uppercase tracking-wider">Precio oferta</label>
                  <input value={fPrecioOferta} onChange={e => setFPrecioOferta(e.target.value)} className="w-full mt-1 bg-[#f0ead6] text-black text-sm px-3 py-2 rounded-lg outline-none" placeholder="49.000" />
                </div>
                <div>
                  <label className="text-yellow-400 text-[9px] font-bold uppercase tracking-wider">Precio anterior</label>
                  <input value={fPrecioAnterior} onChange={e => setFPrecioAnterior(e.target.value)} className="w-full mt-1 bg-[#f0ead6] text-black text-sm px-3 py-2 rounded-lg outline-none" placeholder="89.000" />
                </div>
                <div>
                  <label className="text-yellow-400 text-[9px] font-bold uppercase tracking-wider">País</label>
                  <select value={fPais} onChange={e => setFPais(e.target.value)} className="w-full mt-1 bg-[#f0ead6] text-black text-sm px-3 py-2 rounded-lg outline-none">
                    {["Colombia","México","Venezuela","Ecuador","Costa Rica","General"].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button onClick={generarLanding} disabled={!fNombre.trim()} className="flex-1 bg-green-500 hover:bg-green-600 disabled:opacity-40 text-black font-black py-3 rounded-xl text-sm transition-colors">
                  ⚡ Generar landing ahora
                </button>
                <button className="border border-orange-500/40 text-orange-400 font-bold px-4 py-3 rounded-xl text-sm hover:border-orange-500 transition-colors">
                  💾 Guardar como campaña
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PASO 2 — Generando */}
        {paso === 2 && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-6">
              <p className="text-green-400 text-[10px] font-bold tracking-widest uppercase mb-4">Generando landing...</p>
              <div className="space-y-2">
                {secciones.map(s => (
                  <div key={s.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${contenido[s.id] ? "border-green-500/30 bg-green-500/5" : seccionGenerando === s.id ? "border-orange-500/30 bg-orange-500/5" : "border-[#1a1a1a]"}`}>
                    <div className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${contenido[s.id] ? "bg-green-500 text-white" : seccionGenerando === s.id ? "bg-orange-500 text-white" : "bg-[#1a1a1a] text-zinc-600"}`}>
                      {contenido[s.id] ? "✓" : seccionGenerando === s.id ? "⟳" : "·"}
                    </div>
                    <div>
                      <p className="text-white text-[11px] font-bold">{s.nombre}</p>
                      <p className="text-zinc-600 text-[9px]">{s.sub}</p>
                    </div>
                    {contenido[s.id] && <span className="ml-auto text-green-400 text-[9px] font-bold">Listo</span>}
                    {seccionGenerando === s.id && <span className="ml-auto text-orange-400 text-[9px] font-bold">Generando...</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PASO 3 — Resultado */}
        {paso === 3 && (
          <div className="grid grid-cols-[220px_1fr_200px] gap-4">

            {/* Panel izquierdo — secciones */}
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-3">
              <p className="text-orange-500 text-[9px] font-bold tracking-widest uppercase mb-3">{secciones.length} Secciones</p>
              <div className="space-y-1">
                {secciones.map(s => (
                  <div key={s.id} onClick={() => setSeccionActiva(s.id)} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${seccionActiva === s.id ? "border-orange-500/40 bg-orange-500/5" : "border-transparent hover:border-[#1a1a1a]"}`}>
                    <div className={`w-4 h-4 rounded text-[8px] font-bold flex items-center justify-center flex-shrink-0 ${contenido[s.id] ? "bg-green-500 text-white" : "bg-[#1a1a1a] text-zinc-600"}`}>
                      {contenido[s.id] ? "✓" : "·"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-[10px] font-bold truncate">{s.nombre}</p>
                      <p className="text-zinc-600 text-[8px] truncate">{s.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 space-y-1.5">
                <button onClick={() => generarLanding()} className="w-full bg-[#111] border border-[#1a1a1a] text-yellow-400 text-[9px] font-bold py-2 rounded-lg">↻ Regenerar todo</button>
                <button onClick={() => { setContenido({}); setPaso(1); }} className="w-full border border-red-500/20 text-red-400 text-[9px] font-bold py-2 rounded-lg">🗑️ Borrar todo</button>
              </div>
            </div>

            {/* Preview central */}
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-[#1a1a1a]">
                <div className="flex gap-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                </div>
                <div className="flex-1 bg-[#111] border border-[#1a1a1a] rounded px-2 py-1 text-[9px] text-zinc-600">
                  landcopy2.vercel.app/p/{datosActivos.producto?.toLowerCase().replace(/\s+/g, '-') || 'landing'}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setVistaMovil(false)} className={`text-[8px] font-bold px-2 py-1 rounded transition-colors ${!vistaMovil ? "bg-orange-500 text-white" : "text-zinc-500 border border-[#1a1a1a]"}`}>Desktop</button>
                  <button onClick={() => setVistaMovil(true)} className={`text-[8px] font-bold px-2 py-1 rounded transition-colors ${vistaMovil ? "bg-orange-500 text-white" : "text-zinc-500 border border-[#1a1a1a]"}`}>Móvil</button>
                </div>
              </div>
              <div className="p-4 overflow-y-auto max-h-[600px]">
                {secciones.map(s => (
                  <div key={s.id} onClick={() => setSeccionActiva(s.id)} className={`mb-3 p-3 rounded-xl border cursor-pointer transition-all ${seccionActiva === s.id ? "border-orange-500" : "border-[#1a1a1a] hover:border-[#333]"}`}>
                    <p className="text-[8px] text-zinc-600 uppercase tracking-widest mb-1">{s.nombre}</p>
                    {contenido[s.id] ? (
                      <p className="text-[#f0ead6] text-[10px] leading-relaxed line-clamp-3">{contenido[s.id]}</p>
                    ) : (
                      <p className="text-zinc-700 text-[10px] italic">Sin generar</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Panel derecho */}
            <div className="space-y-3">
              {/* Sección activa — acciones */}
              <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-3">
                <p className="text-orange-500 text-[9px] font-bold tracking-widest uppercase mb-2">{secciones.find(s => s.id === seccionActiva)?.nombre}</p>
                <div className="space-y-1.5">
                  <button onClick={() => regenerarSeccion(seccionActiva)} disabled={seccionGenerando === seccionActiva} className="w-full bg-[#111] border border-[#1a1a1a] text-yellow-400 text-[9px] font-bold py-2 rounded-lg disabled:opacity-40">
                    {seccionGenerando === seccionActiva ? "⟳ Generando..." : "↻ Regenerar sección"}
                  </button>
                  <button className="w-full bg-[#111] border border-[#1a1a1a] text-yellow-400 text-[9px] font-bold py-2 rounded-lg">✎ Editar texto</button>
                  <button className="w-full bg-[#111] border border-[#1a1a1a] text-yellow-400 text-[9px] font-bold py-2 rounded-lg">🖼️ Generar imagen</button>
                  <button className="w-full bg-[#111] border border-[#1a1a1a] text-yellow-400 text-[9px] font-bold py-2 rounded-lg">💾 Guardar sección</button>
                  <button className="w-full bg-[#111] border border-[#1a1a1a] text-zinc-600 text-[9px] font-bold py-2 rounded-lg">👁️ Ocultar</button>
                </div>
              </div>

              {/* Estilo */}
              <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-3">
                <p className="text-orange-500 text-[9px] font-bold tracking-widest uppercase mb-2">Estilo visual</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {ESTILOS.map(e => (
                    <div key={e.id} onClick={() => setEstilo(e.id)} className={`p-2 rounded-lg border cursor-pointer text-center transition-all ${estilo === e.id ? "border-green-500 bg-green-500/10" : "border-[#1a1a1a]"}`}>
                      <p className="text-white text-[9px] font-bold">{e.nombre}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Publicar */}
              <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-3">
                <p className="text-orange-500 text-[9px] font-bold tracking-widest uppercase mb-2">Publicar</p>
                <div className="space-y-1.5">
                  <button className="w-full bg-green-500 hover:bg-green-600 text-black text-[9px] font-bold py-2 rounded-lg transition-colors">⬇ Descargar HTML</button>
                  <button className="w-full border border-orange-500/40 text-orange-400 text-[9px] font-bold py-2 rounded-lg">🔗 Link compartible</button>
                  <button className="w-full border border-purple-500/40 text-purple-400 text-[9px] font-bold py-2 rounded-lg">💾 Guardar en Biblioteca</button>
                  <button className="w-full border border-red-500/20 text-red-400 text-[9px] font-bold py-2 rounded-lg">🗑️ Borrar todo</button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}