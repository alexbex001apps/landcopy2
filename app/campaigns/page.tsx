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
  const [saving, setSaving] = useState(false);
  const [identifying, setIdentifying] = useState(false);

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

  useEffect(() => { cargarCampaigns(); }, []);

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

    await supabase.from("campaigns").insert({
      user_id: user.id, nombre, producto, problema, beneficio,
      precio_anterior: precioAnterior, precio_oferta: precioOferta,
      pais, tono, headline, imagen_url, imagen_url_2, imagen_url_3,
      es_combo: !!(imagen2 || imagen3),
    });

    setShowForm(false);
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
  const usarCampaign = (c: Campaign, destino: string = "/copy") => {
    sessionStorage.setItem("campaign_activa", JSON.stringify(c));
    router.push(destino);
  };

  const eliminarCampaign = async (id: string) => {
    await supabase.from("campaigns").delete().eq("id", id);
    cargarCampaigns();
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">

      {/* Header */}
      <div className="max-w-[1400px] mx-auto px-4 pt-6 pb-0">
        <div className="flex items-center mb-0">
          <div className="flex items-center gap-2 flex-shrink-0" style={{width:"160px"}}>
            <div className="w-[72px] h-[72px] rounded-full bg-[#0d1a00] border border-[#2a2a2a] flex items-center justify-center flex-shrink-0">
              <svg width="38" height="38" viewBox="0 0 32 32" fill="none">
                <rect x="4" y="6" width="24" height="18" rx="2" stroke="white" strokeWidth="1.5" fill="white" fillOpacity="0.1"/>
                <rect x="4" y="6" width="24" height="5" rx="2" fill="white" fillOpacity="0.4"/>
                <circle cx="8" cy="8.5" r="1" fill="white"/>
                <circle cx="11" cy="8.5" r="1" fill="white"/>
              </svg>
            </div>
            <p className="text-white text-[14px] font-bold tracking-[0.12em] uppercase">Campañas</p>
          </div>
          <div className="flex-1 text-center px-5">
            <div className="inline-flex items-center gap-2 bg-orange-500 text-white text-[9px] font-bold px-3 py-1 rounded-full mb-2 tracking-widest">
              CAMPAIGN ENGINE · DATOS UNA SOLA VEZ
            </div>
            <h1 className="text-xl font-black text-white mb-1">
              Crea una campaña y <span style={{color:"#22c55e"}}>conecta</span> todos los módulos
            </h1>
            <p className="text-yellow-400 text-[11px]">Producto · fotos · precios · la IA identifica todo automáticamente</p>
          </div>
          <div className="flex-shrink-0" style={{width:"160px"}}>
            <button onClick={() => setShowForm(!showForm)} className="w-full bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-bold py-2 px-4 rounded-xl transition-colors">
              + Nueva campaña
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 pb-12 mt-6">

        {showForm && (
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-6 mb-8">
            <p className="text-orange-500 text-[10px] font-bold tracking-widest uppercase mb-4">Nueva campaña</p>

            <p className="text-yellow-400 text-[9px] font-bold uppercase tracking-wider mb-2">Fotos del producto (hasta 3)</p>
            <div className="flex gap-4 mb-6">
              {[1,2,3].map(slot => (
                <div key={slot} className="relative">
                  <label className={`flex flex-col items-center justify-center w-full h-[160px] border-2 border-dashed rounded-xl cursor-pointer transition-colors ${slot === 1 ? "border-orange-500/50 hover:border-orange-500" : "border-[#222] hover:border-[#444]"}`}>
                    {(slot === 1 ? imagen1 : slot === 2 ? imagen2 : imagen3) ? (
                      <div className="relative w-full h-full">
                        <img src={slot === 1 ? imagen1! : slot === 2 ? imagen2! : imagen3!} className="w-full h-full object-contain rounded-xl" />
                        <button onClick={e => { e.stopPropagation(); e.preventDefault(); if (slot === 1) setImagen1(null); if (slot === 2) setImagen2(null); if (slot === 3) setImagen3(null); }} className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">✕</button>
                      </div>
                    ) : (
                      <>
                        <span className="text-2xl mb-1">📷</span>
                        <span className="text-[9px] text-zinc-500">{slot === 1 ? "Principal *" : `Combo ${slot}`}</span>
                      </>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={e => handleImagen(e, slot as 1|2|3)} />
                  </label>
                  {slot === 1 && imagen1 && (
                    <button onClick={identificarProducto} disabled={identifying} className="w-full mt-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white text-[10px] font-bold px-4 py-2 rounded-lg active:scale-95 transition-transform">
                      {identifying ? "⏳ Identificando..." : "🔍 Identificar producto"}
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
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

        {loading ? (
          <div className="text-center py-20 text-yellow-400 text-sm">Cargando campañas...</div>
        ) : campaigns.length === 0 && !showForm ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🚀</div>
            <p className="text-white font-black text-xl mb-2">Crea tu primera campaña</p>
            <p className="text-yellow-400 text-sm mb-6">Llena los datos una vez y todos los módulos los usarán automáticamente</p>
            <button onClick={() => setShowForm(true)} className="bg-orange-500 text-white font-bold px-8 py-3 rounded-xl text-sm">+ Nueva campaña</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {campaigns.map(c => (
              <div key={c.id} className="bg-[#141414] border border-[#222] rounded-2xl overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.8)] hover:border-orange-500/40 hover:-translate-y-0.5 transition-all">
                <div className="p-4 flex items-center gap-3">
                  <div className="flex gap-2">
                    {c.imagen_url ? (
                      <img src={c.imagen_url} className="w-14 h-14 object-contain rounded-xl bg-[#111]" />
                    ) : (
                      <div className="w-14 h-14 bg-[#111] rounded-xl flex items-center justify-center text-2xl">📦</div>
                    )}
                    {c.imagen_url_2 && <img src={c.imagen_url_2} className="w-10 h-10 object-contain rounded-lg bg-[#111]" />}
                    {c.imagen_url_3 && <img src={c.imagen_url_3} className="w-10 h-10 object-contain rounded-lg bg-[#111]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-white text-sm font-bold truncate">{c.nombre}</p>
                      {c.es_combo && <span className="bg-orange-500/20 text-orange-400 text-[8px] font-bold px-2 py-0.5 rounded-full border border-orange-500/30 flex-shrink-0">COMBO</span>}
                    </div>
                    <p className="text-yellow-400 text-[10px] truncate">{c.precio_oferta && `$${c.precio_oferta}`} · {c.pais} · {c.tono}</p>
                    <p className="text-zinc-500 text-[9px] mt-0.5">📅 {formatFechaHora(c.created_at)}</p>
                  </div>
                </div>
                <div className="border-t border-[#1a1a1a] grid grid-cols-4">
                  <button onClick={() => usarCampaign(c, "/copy")} className="py-2.5 text-[10px] font-bold text-orange-500 hover:bg-orange-500/10 transition-colors border-r border-[#1a1a1a]">
                    → Copy
                  </button>
                  <button onClick={() => usarCampaign(c, "/anuncios")} className="py-2.5 text-[10px] font-bold text-yellow-400 hover:bg-yellow-400/10 transition-colors border-r border-[#1a1a1a]">
                    → Anuncios
                  </button>
                  <button onClick={() => usarCampaign(c, "/landing")} className="py-2.5 text-[10px] font-bold text-green-400 hover:bg-green-400/10 transition-colors border-r border-[#1a1a1a]">
                    → Landing
                  </button>
                  <button onClick={() => eliminarCampaign(c.id)} className="py-2.5 text-[10px] font-bold text-zinc-600 hover:text-red-400 hover:bg-red-400/10 transition-colors">
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}