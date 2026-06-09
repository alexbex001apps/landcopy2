"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
 
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
  created_at: string;
}
 
const PAISES = ["Colombia", "México", "Venezuela", "Ecuador", "Perú", "Costa Rica", "General"];
const TONOS = ["Urgente", "Emocional", "Informativo", "Confianza", "Aspiracional"];
 
export default function Campaigns() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showArchivo, setShowArchivo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [identifying, setIdentifying] = useState(false);
  const [activa, setActiva] = useState<Campaign | null>(null);
  const [busqueda, setBusqueda] = useState("");
 
  const [nombre, setNombre] = useState("");
  const [producto, setProducto] = useState("");
  const [problema, setProblema] = useState("");
  const [beneficio, setBeneficio] = useState("");
  const [precioOferta, setPrecioOferta] = useState("");
  const [precioAnterior, setPrecioAnterior] = useState("");
  const [pais, setPais] = useState("Colombia");
  const [tono, setTono] = useState("Urgente");
  const [headline, setHeadline] = useState("");
  const [imagen1, setImagen1] = useState<string | null>(null);
  const [imagen2, setImagen2] = useState<string | null>(null);
  const [imagen3, setImagen3] = useState<string | null>(null);
 
  const supabase = createClient();
 
  useEffect(() => {
    cargarCampaigns();
    try {
      const a = sessionStorage.getItem("campaign_activa");
      if (a) setActiva(JSON.parse(a));
    } catch {}
  }, []);
 
  const cargarCampaigns = async () => {
    setLoading(true);
    const { data } = await supabase.from("campaigns").select("*").order("created_at", { ascending: false });
    setCampaigns(data || []);
    setLoading(false);
  };
 
  const handleImagen = (e: React.ChangeEvent<HTMLInputElement>, slot: 1 | 2 | 3) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      if (slot === 1) setImagen1(base64);
      if (slot === 2) setImagen2(base64);
      if (slot === 3) setImagen3(base64);
    };
    reader.readAsDataURL(file);
  };
 
  const identificarProducto = async () => {
    if (!imagen1) return;
    setIdentifying(true);
    try {
      const resp = await fetch("/api/campaigns/identificar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imagen: imagen1 }),
      });
      const data = await resp.json();
      if (data.nombre) setNombre(data.nombre);
      if (data.producto) setProducto(data.producto);
      if (data.problema) setProblema(data.problema);
      if (data.beneficio) setBeneficio(data.beneficio);
      if (data.caracteristicas) setProducto(data.caracteristicas);
    } catch {}
    setIdentifying(false);
  };
 
  const guardarCampaign = async () => {
    if (!nombre.trim()) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
 
    let imagen_url = null;
    let imagen_url_2 = null;
    let imagen_url_3 = null;
 
    if (imagen1) {
      const blob = await fetch(imagen1).then(r => r.blob());
      const path = `${user.id}/${Date.now()}_1.jpg`;
      await supabase.storage.from("campaign-images").upload(path, blob, { contentType: "image/jpeg" });
      const { data: urlData } = supabase.storage.from("campaign-images").getPublicUrl(path);
      imagen_url = urlData.publicUrl;
    }
    if (imagen2) {
      const blob = await fetch(imagen2).then(r => r.blob());
      const path = `${user.id}/${Date.now()}_2.jpg`;
      await supabase.storage.from("campaign-images").upload(path, blob, { contentType: "image/jpeg" });
      const { data: urlData } = supabase.storage.from("campaign-images").getPublicUrl(path);
      imagen_url_2 = urlData.publicUrl;
    }
    if (imagen3) {
      const blob = await fetch(imagen3).then(r => r.blob());
      const path = `${user.id}/${Date.now()}_3.jpg`;
      await supabase.storage.from("campaign-images").upload(path, blob, { contentType: "image/jpeg" });
      const { data: urlData } = supabase.storage.from("campaign-images").getPublicUrl(path);
      imagen_url_3 = urlData.publicUrl;
    }
 
    const { data: inserted } = await supabase.from("campaigns").insert({
      user_id: user.id, nombre, producto, problema, beneficio,
      precio_anterior: precioAnterior, precio_oferta: precioOferta,
      pais, tono, headline, imagen_url, imagen_url_2, imagen_url_3,
      es_combo: !!(imagen2 || imagen3),
    }).select().single();
 
    if (inserted) {
      sessionStorage.setItem("campaign_activa", JSON.stringify(inserted));
      setActiva(inserted as Campaign);
    }
 
    setShowForm(false);
    setShowArchivo(false);
    setNombre(""); setProducto(""); setProblema(""); setBeneficio("");
    setPrecioOferta(""); setPrecioAnterior(""); setHeadline("");
    setImagen1(null); setImagen2(null); setImagen3(null);
    cargarCampaigns();
    setSaving(false);
  };
 
  const formatFechaHora = (fecha: string) => {
    const d = new Date(fecha);
    const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
    let h = d.getHours();
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()} · ${h}:${min} ${ampm}`;
  };
 
  const activarCampaign = (c: Campaign) => {
    sessionStorage.setItem("campaign_activa", JSON.stringify(c));
    setActiva(c);
    setShowArchivo(false);
    setShowForm(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
 
  const irAModulo = (destino: string) => {
    if (activa) sessionStorage.setItem("campaign_activa", JSON.stringify(activa));
    router.push(destino);
  };
 
  const cancelarActiva = () => {
    sessionStorage.removeItem("campaign_activa");
    setActiva(null);
  };
 
  const eliminarCampaign = async (id: string) => {
    await supabase.from("campaigns").delete().eq("id", id);
    if (activa && activa.id === id) cancelarActiva();
    cargarCampaigns();
  };
 
  const abrirNueva = () => { setShowForm(true); setShowArchivo(false); };
  const abrirArchivo = () => { setShowArchivo(true); setShowForm(false); };
 
  const campañasFiltradas = campaigns.filter(c => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return true;
    return (c.producto || "").toLowerCase().includes(q) || (c.nombre || "").toLowerCase().includes(q);
  });
 
  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <style>{`@keyframes latidoCampana { 0%,100% { transform:scale(1); } 50% { transform:scale(1.12); } }`}</style>
 
      {/* Header — apilado y centrado en móvil, en fila en desktop */}
      <div className="max-w-[1400px] mx-auto px-4 pt-6 pb-0">
        <div className="flex flex-col md:flex-row items-center mb-0">
          <div className="flex items-center justify-center gap-2 flex-shrink-0 mb-3 md:mb-0 md:w-[160px]">
            <div className="w-[56px] h-[56px] md:w-[72px] md:h-[72px] rounded-full bg-[#0d1a00] border border-[#2a2a2a] flex items-center justify-center flex-shrink-0">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="md:w-[38px] md:h-[38px]">
                <rect x="4" y="6" width="24" height="18" rx="2" stroke="white" strokeWidth="1.5" fill="white" fillOpacity="0.1"/>
                <rect x="4" y="6" width="24" height="5" rx="2" fill="white" fillOpacity="0.4"/>
                <circle cx="8" cy="8.5" r="1" fill="white"/>
                <circle cx="11" cy="8.5" r="1" fill="white"/>
              </svg>
            </div>
            <p className="text-white text-[14px] font-bold tracking-[0.12em] uppercase">Campañas</p>
          </div>
          <div className="flex-1 text-center md:px-5">
            <div className="inline-flex items-center gap-2 bg-orange-500 text-white text-[9px] font-bold px-3 py-1 rounded-full mb-2 tracking-widest">
              CAMPAIGN ENGINE · DATOS UNA SOLA VEZ
            </div>
            <h1 className="text-lg md:text-xl font-black text-white mb-1 px-2">
              Crea una campaña y <span style={{color:"#22c55e"}}>conecta</span> todos los módulos
            </h1>
            <p className="text-yellow-400 text-[11px] px-2">Producto · fotos · precios · la IA identifica todo automáticamente</p>
          </div>
          <div className="flex-shrink-0 hidden md:block" style={{width:"160px"}}></div>
        </div>
      </div>
 
      <div className="max-w-[1400px] mx-auto px-4 pb-12 mt-6">
 
        {/* Buscador + 2 botones (siempre visibles) */}
        <div className="max-w-3xl mx-auto mb-6">
          <div className="flex items-center gap-2 bg-[#f0ead6] rounded-xl px-4 py-2.5 mb-3">
            <span className="text-orange-500">🔍</span>
            <input
              value={busqueda}
              onChange={e => { setBusqueda(e.target.value); if (e.target.value.trim()) setShowArchivo(true); }}
              placeholder="Escribe el nombre de un producto..."
              className="flex-1 bg-transparent text-black text-sm outline-none placeholder-[#888] min-w-0"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={abrirNueva} className={`flex-1 font-bold py-3 rounded-xl text-sm transition-colors ${showForm ? "bg-orange-500 text-white" : "bg-transparent border border-[#333] text-[#f0ead6] hover:border-orange-500/50"}`}>
              ➕ Nueva campaña
            </button>
            <button onClick={abrirArchivo} className={`flex-1 font-bold py-3 rounded-xl text-sm transition-colors ${showArchivo ? "bg-orange-500 text-white" : "bg-transparent border border-[#333] text-[#f0ead6] hover:border-orange-500/50"}`}>
              📁 Campañas ya hechas
            </button>
          </div>
        </div>
 
        {/* FORMULARIO NUEVA CAMPAÑA */}
        {showForm && (
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-4 md:p-6 mb-8">
            <p className="text-orange-500 text-[10px] font-bold tracking-widest uppercase mb-4">Nueva campaña</p>
 
            <p className="text-yellow-400 text-[9px] font-bold uppercase tracking-wider mb-2">Fotos del producto (hasta 3)</p>
            <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6">
              {[1,2,3].map(slot => (
                <div key={slot} className="relative">
                  <label className={`flex flex-col items-center justify-center w-full h-[110px] md:h-[160px] border-2 border-dashed rounded-xl cursor-pointer transition-colors ${slot === 1 ? "border-orange-500/50 hover:border-orange-500" : "border-[#222] hover:border-[#444]"}`}>
                    {(slot === 1 ? imagen1 : slot === 2 ? imagen2 : imagen3) ? (
                      <div className="relative w-full h-full">
                        <img src={slot === 1 ? imagen1! : slot === 2 ? imagen2! : imagen3!} className="w-full h-full object-contain rounded-xl" />
                        <button onClick={e => { e.stopPropagation(); e.preventDefault(); if (slot === 1) setImagen1(null); if (slot === 2) setImagen2(null); if (slot === 3) setImagen3(null); }} className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">✕</button>
                      </div>
                    ) : (
                      <>
                        <span className="text-2xl mb-1">📷</span>
                        <span className="text-[9px] text-zinc-500 text-center px-1">{slot === 1 ? "Principal *" : `Combo ${slot}`}</span>
                      </>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={e => handleImagen(e, slot as 1|2|3)} />
                  </label>
                  {slot === 1 && imagen1 && (
                    <button onClick={identificarProducto} disabled={identifying} className="w-full mt-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white text-[9px] md:text-[10px] font-bold px-2 py-2 rounded-lg active:scale-95 transition-transform">
                      {identifying ? "⏳..." : "🔍 Identificar"}
                    </button>
                  )}
                </div>
              ))}
            </div>
 
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-yellow-400 text-[9px] font-bold uppercase tracking-wider">Nombre de la campaña *</label>
                <input value={nombre} onChange={e => setNombre(e.target.value)} className="w-full mt-1 bg-[#f0ead6] text-black text-sm px-3 py-2 rounded-lg outline-none" placeholder="Ej: Poncho Impermeable Colombia" />
              </div>
              <div>
                <label className="text-yellow-400 text-[9px] font-bold uppercase tracking-wider">Nombre del producto</label>
                <input value={producto} onChange={e => setProducto(e.target.value)} className="w-full mt-1 bg-[#f0ead6] text-black text-sm px-3 py-2 rounded-lg outline-none" placeholder="Se llena solo con 🔍" />
              </div>
              <div>
                <label className="text-yellow-400 text-[9px] font-bold uppercase tracking-wider">Problema que resuelve</label>
                <input value={problema} onChange={e => setProblema(e.target.value)} className="w-full mt-1 bg-[#f0ead6] text-black text-sm px-3 py-2 rounded-lg outline-none" placeholder="Se llena solo con 🔍" />
              </div>
              <div>
                <label className="text-yellow-400 text-[9px] font-bold uppercase tracking-wider">Beneficio principal</label>
                <input value={beneficio} onChange={e => setBeneficio(e.target.value)} className="w-full mt-1 bg-[#f0ead6] text-black text-sm px-3 py-2 rounded-lg outline-none" placeholder="Se llena solo con 🔍" />
              </div>
              <div>
                <label className="text-yellow-400 text-[9px] font-bold uppercase tracking-wider">Precio oferta</label>
                <input value={precioOferta} onChange={e => setPrecioOferta(e.target.value)} className="w-full mt-1 bg-[#f0ead6] text-black text-sm px-3 py-2 rounded-lg outline-none" placeholder="49.000" />
              </div>
              <div>
                <label className="text-yellow-400 text-[9px] font-bold uppercase tracking-wider">Precio anterior</label>
                <input value={precioAnterior} onChange={e => setPrecioAnterior(e.target.value)} className="w-full mt-1 bg-[#f0ead6] text-black text-sm px-3 py-2 rounded-lg outline-none" placeholder="89.000" />
              </div>
              <div>
                <label className="text-yellow-400 text-[9px] font-bold uppercase tracking-wider">País</label>
                <select value={pais} onChange={e => setPais(e.target.value)} className="w-full mt-1 bg-[#f0ead6] text-black text-sm px-3 py-2 rounded-lg outline-none">
                  {PAISES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-yellow-400 text-[9px] font-bold uppercase tracking-wider">Tono</label>
                <select value={tono} onChange={e => setTono(e.target.value)} className="w-full mt-1 bg-[#f0ead6] text-black text-sm px-3 py-2 rounded-lg outline-none">
                  {TONOS.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="mb-4">
              <label className="text-yellow-400 text-[9px] font-bold uppercase tracking-wider">Headline principal</label>
              <input value={headline} onChange={e => setHeadline(e.target.value)} className="w-full mt-1 bg-[#f0ead6] text-black text-sm px-3 py-2 rounded-lg outline-none" placeholder="Ej: ¿Tus rodillas ya no aguantan más?" />
            </div>
 
            <div className="flex gap-3">
              <button onClick={() => setShowForm(false)} className="px-6 py-3 border border-[#1e1e1e] text-yellow-400 text-sm font-bold rounded-xl">Cancelar</button>
              <button onClick={guardarCampaign} disabled={saving || !nombre.trim()} className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-bold py-3 rounded-xl text-sm">
                {saving ? "⏳ Guardando..." : "💾 Crear campaña"}
              </button>
            </div>
          </div>
        )}
 
        {/* CAMPAÑA ACTIVA EN EL CENTRO */}
        {!showForm && activa && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-[#0d1a0a] border border-[#22c55e66] rounded-2xl p-4 md:p-6">
              <p className="text-green-400 text-[10px] font-bold tracking-widest uppercase mb-4 text-center">● Campaña activa</p>
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 text-center sm:text-left">
                <div className="flex gap-2 flex-shrink-0">
                  {activa.imagen_url ? (
                    <img src={activa.imagen_url} className="w-24 h-24 object-contain rounded-xl bg-[#111]" />
                  ) : (
                    <div className="w-24 h-24 bg-[#111] rounded-xl flex items-center justify-center text-3xl">📦</div>
                  )}
                  {activa.imagen_url_2 && <img src={activa.imagen_url_2} className="w-12 h-12 object-contain rounded-lg bg-[#111]" />}
                  {activa.imagen_url_3 && <img src={activa.imagen_url_3} className="w-12 h-12 object-contain rounded-lg bg-[#111]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                    <p className="text-white text-xl md:text-2xl font-black truncate">{activa.nombre}</p>
                    {activa.es_combo && <span className="bg-orange-500/20 text-orange-400 text-[8px] font-bold px-2 py-0.5 rounded-full border border-orange-500/30 flex-shrink-0">COMBO</span>}
                  </div>
                  {activa.beneficio && <p className="text-yellow-400 text-[12px] leading-snug">✓ {activa.beneficio}</p>}
                  {activa.problema && <p className="text-zinc-400 text-[11px] mt-0.5 leading-snug">Resuelve: {activa.problema}</p>}
                  <p className="text-zinc-500 text-[11px] mt-1">{activa.precio_oferta && `$${activa.precio_oferta}`} · {activa.pais} · {activa.tono}</p>
                </div>
              </div>
 
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-5">
                <button onClick={() => irAModulo("/copy")} className="py-2.5 text-[11px] font-bold text-orange-500 bg-orange-500/10 border border-orange-500/30 rounded-lg hover:bg-orange-500/20 transition-colors">→ Copy</button>
                <button onClick={() => irAModulo("/redes")} className="py-2.5 text-[11px] font-bold text-purple-400 bg-purple-500/10 border border-purple-500/30 rounded-lg hover:bg-purple-500/20 transition-colors">→ Redes</button>
                <button onClick={() => irAModulo("/anuncios")} className="py-2.5 text-[11px] font-bold text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-colors">→ Anuncios</button>
                <button onClick={() => irAModulo("/landing")} className="py-2.5 text-[11px] font-bold text-green-400 bg-green-500/10 border border-green-500/30 rounded-lg hover:bg-green-500/20 transition-colors">→ Landing</button>
              </div>
 
              <div className="text-center mt-4">
                <button onClick={cancelarActiva} className="text-red-400 text-[11px] font-bold border border-red-500/30 px-5 py-2 rounded-lg hover:border-red-500 transition-colors">✕ Cancelar campaña</button>
              </div>
            </div>
          </div>
        )}
 
        {/* ESTADO VACÍO (sin form, sin activa, sin archivo) */}
        {!showForm && !activa && !showArchivo && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4" style={{ animation: "latidoCampana 2s ease-in-out infinite" }}>💛</div>
            <p className="text-white font-black text-2xl mb-2">Aquí empieza todo</p>
            <p className="text-yellow-400 text-sm max-w-md mx-auto leading-relaxed px-4">La campaña es el corazón de LandCopy. Crea una nueva o busca una que ya hiciste arriba.</p>
          </div>
        )}
 
        {/* ARCHIVO DE CAMPAÑAS (grid pequeño) */}
        {!showForm && showArchivo && (
          <div className="mt-2">
            <p className="text-orange-500 text-[10px] font-bold tracking-widest uppercase mb-4">
              📁 Tus campañas {busqueda.trim() && `· filtrando "${busqueda}"`}
            </p>
            {loading ? (
              <div className="text-center py-12 text-yellow-400 text-sm">Cargando campañas...</div>
            ) : campañasFiltradas.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 text-sm">
                {busqueda.trim() ? `No hay campañas que coincidan con "${busqueda}"` : "Aún no tienes campañas guardadas"}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {campañasFiltradas.map(c => (
                  <div key={c.id} className={`bg-[#141414] border rounded-xl overflow-hidden transition-all hover:-translate-y-0.5 ${activa && activa.id === c.id ? "border-green-500/60" : "border-[#222] hover:border-orange-500/40"}`}>
                    <div onClick={() => activarCampaign(c)} className="p-3 cursor-pointer">
                      <div className="flex items-center gap-2 mb-2">
                        {c.imagen_url ? (
                          <img src={c.imagen_url} className="w-12 h-12 object-contain rounded-lg bg-[#111] flex-shrink-0" />
                        ) : (
                          <div className="w-12 h-12 bg-[#111] rounded-lg flex items-center justify-center text-xl flex-shrink-0">📦</div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-[11px] font-bold truncate">{c.nombre}</p>
                          <p className="text-yellow-400 text-[9px] truncate">{c.precio_oferta && `$${c.precio_oferta}`} · {c.pais}</p>
                        </div>
                      </div>
                      <p className="text-zinc-600 text-[8px]">📅 {formatFechaHora(c.created_at)}</p>
                      {activa && activa.id === c.id && <p className="text-green-400 text-[8px] font-bold mt-1">● Activa ahora</p>}
                    </div>
                    <div className="border-t border-[#1a1a1a] grid grid-cols-2">
                      <button onClick={() => activarCampaign(c)} className="py-2 text-[9px] font-bold text-orange-500 hover:bg-orange-500/10 transition-colors border-r border-[#1a1a1a]">Activar</button>
                      <button onClick={() => eliminarCampaign(c.id)} className="py-2 text-[9px] font-bold text-zinc-600 hover:text-red-400 hover:bg-red-400/10 transition-colors">Eliminar</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
 
      </div>
    </div>
  );
}