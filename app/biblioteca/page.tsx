"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface BibliotecaItem {
  id: string;
  tipo: "imagen" | "copy" | "landing";
  modulo: "landing" | "anuncios" | "redes" | "copy";
  nombre: string;
  contenido: string | null;
  imagen_url: string | null;
  producto: string | null;
  favorito: boolean;
  carpeta_id: string | null;
  created_at: string;
  metadata: any;
  notas: string | null;
}

interface Carpeta {
  id: string;
  nombre: string;
  color: string;
  descripcion: string | null;
  responsable: string | null;
  notas: string | null;
  created_at: string;
}

const MODULO_COLORS: Record<string, string> = {
  landing: "text-orange-500 border-orange-500/30 bg-orange-500/10",
  anuncios: "text-red-400 border-red-400/30 bg-red-400/10",
  redes: "text-green-400 border-green-400/30 bg-green-400/10",
  copy: "text-blue-400 border-blue-400/30 bg-blue-400/10",
};

const MODULO_BG: Record<string, string> = {
  landing: "from-[#1a0a00] to-[#2a1500]",
  anuncios: "from-[#1a0000] to-[#2a0a0a]",
  redes: "from-[#001a0a] to-[#003015]",
  copy: "from-[#000d1a] to-[#001a33]",
};

const COLORES_CARPETA = ["#f97316", "#22c55e", "#3b82f6", "#a855f7", "#ec4899", "#eab308", "#ef4444", "#14b8a6"];

export default function Biblioteca() {
  const [items, setItems] = useState<BibliotecaItem[]>([]);
  const [carpetas, setCarpetas] = useState<Carpeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [tabActivo, setTabActivo] = useState("todos");
  const [filtroModulo, setFiltroModulo] = useState("todos");
  const [carpetaActiva, setCarpetaActiva] = useState<string | null>("sin_carpeta");
  const [busqueda, setBusqueda] = useState("");
  const [copiado, setCopiado] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [modalCarpeta, setModalCarpeta] = useState(false);
  const [nuevaCarpetaNombre, setNuevaCarpetaNombre] = useState("");
  const [nuevaCarpetaColor, setNuevaCarpetaColor] = useState("#f97316");
  const [modalMover, setModalMover] = useState<string | null>(null);
  const [modalNotas, setModalNotas] = useState<string | null>(null);
  const [modalEditarCarpeta, setModalEditarCarpeta] = useState<Carpeta | null>(null);
  const [editCarpetaNombre, setEditCarpetaNombre] = useState("");
  const [editCarpetaDescripcion, setEditCarpetaDescripcion] = useState("");
  const [editCarpetaResponsable, setEditCarpetaResponsable] = useState("");
  const [editCarpetaNotas, setEditCarpetaNotas] = useState("");
  const [editCarpetaColor, setEditCarpetaColor] = useState("#f97316");
  const [notasTexto, setNotasTexto] = useState("");

  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) window.location.href = "/login";
    });
    cargar();
    cargarCarpetas();
  }, []);

  const cargar = async (forzar = false) => {
    const cached = sessionStorage.getItem("biblioteca_items");
    const cachedTotal = sessionStorage.getItem("biblioteca_total");
    const cachedPagina = sessionStorage.getItem("biblioteca_pagina");
    if (cached && cachedTotal !== null && !forzar) {
      setItems(JSON.parse(cached));
      setTotal(parseInt(cachedTotal || "0"));
      setPagina(parseInt(cachedPagina || "1"));
      setLoading(false);
      return;
    }
    setLoading(true);
    const resp = await fetch("/api/biblioteca?page=1");
    const data = await resp.json();
    const nuevos = data.items || [];
    setItems(nuevos);
    setTotal(data.total || 0);
    setPagina(1);
    try {
      sessionStorage.setItem("biblioteca_items", JSON.stringify(nuevos));
      sessionStorage.setItem("biblioteca_total", String(data.total || 0));
      sessionStorage.setItem("biblioteca_pagina", "1");
    } catch {}
    setLoading(false);
  };

  const cargarMas = async () => {
    setCargandoMas(true);
    const siguiente = pagina + 1;
    const resp = await fetch(`/api/biblioteca?page=${siguiente}`);
    const data = await resp.json();
    const nuevos = [...items, ...(data.items || [])];
    setItems(nuevos);
    setPagina(siguiente);
    try {
      sessionStorage.setItem("biblioteca_items", JSON.stringify(nuevos));
      sessionStorage.setItem("biblioteca_pagina", String(siguiente));
    } catch {}
    setCargandoMas(false);
  };

  const cargarCarpetas = async () => {
    const { data } = await supabase.from("carpetas").select("*").order("created_at", { ascending: true });
    setCarpetas(data || []);
  };

  const crearCarpeta = async () => {
    if (!nuevaCarpetaNombre.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("carpetas").insert({
      user_id: user.id,
      nombre: nuevaCarpetaNombre.trim(),
      color: nuevaCarpetaColor,
    }).select().single();
    if (data) setCarpetas(prev => [...prev, data]);
    setNuevaCarpetaNombre("");
    setModalCarpeta(false);
    showToast("Carpeta creada");
  };

  const eliminarCarpeta = async (id: string) => {
    await supabase.from("carpetas").delete().eq("id", id);
    setCarpetas(prev => prev.filter(c => c.id !== id));
    if (carpetaActiva === id) setCarpetaActiva(null);
    showToast("Carpeta eliminada");
  };
 const guardarCarpetaEditada = async () => {
    if (!modalEditarCarpeta) return;
    const updates = {
      nombre: editCarpetaNombre,
      color: editCarpetaColor,
      descripcion: editCarpetaDescripcion,
      responsable: editCarpetaResponsable,
      notas: editCarpetaNotas,
    };
    await supabase.from("carpetas").update(updates).eq("id", modalEditarCarpeta.id);
    setCarpetas(prev => prev.map(c => c.id === modalEditarCarpeta.id ? { ...c, ...updates } : c));
    setModalEditarCarpeta(null);
    showToast("Carpeta actualizada");
  };
  const guardarNotas = async () => {
    if (!modalNotas) return;
    await fetch("/api/biblioteca", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: modalNotas, notas: notasTexto }),
    });
    setItems(prev => {
      const nuevos = prev.map(i => i.id === modalNotas ? { ...i, notas: notasTexto } : i);
      try { sessionStorage.setItem("biblioteca_items", JSON.stringify(nuevos)); } catch {}
      return nuevos;
    });
    setModalNotas(null);
    showToast("Nota guardada");
  };
  const moverItem = async (itemId: string, carpetaId: string | null) => {
    await fetch("/api/biblioteca", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: itemId, carpeta_id: carpetaId }),
    });
    setItems(prev => {
      const nuevos = prev.map(i => i.id === itemId ? { ...i, carpeta_id: carpetaId } : i);
      try { sessionStorage.setItem("biblioteca_items", JSON.stringify(nuevos)); } catch {}
      return nuevos;
    });
    setModalMover(null);
    showToast("Movido a carpeta");
  };

  const toggleFavorito = async (item: BibliotecaItem) => {
    await fetch("/api/biblioteca", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, favorito: !item.favorito }),
    });
    setItems(prev => {
      const nuevos = prev.map(i => i.id === item.id ? { ...i, favorito: !i.favorito } : i);
      try { sessionStorage.setItem("biblioteca_items", JSON.stringify(nuevos)); } catch {}
      return nuevos;
    });
  };

  const eliminar = async (id: string) => {
    await fetch("/api/biblioteca", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setItems(prev => {
      const nuevos = prev.filter(i => i.id !== id);
      try { sessionStorage.setItem("biblioteca_items", JSON.stringify(nuevos)); } catch {}
      return nuevos;
    });
    setTotal(prev => Math.max(0, prev - 1));
    showToast("Eliminado");
  };

  const copiar = (texto: string, id: string) => {
    navigator.clipboard.writeText(texto);
    setCopiado(id);
    setTimeout(() => setCopiado(null), 2000);
    showToast("Copiado al portapapeles");
  };

  const descargar = (imageUrl: string, nombre: string) => {
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `${nombre.replace(/\s+/g, "-")}.png`;
    a.click();
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const itemsFiltrados = items.filter(item => {
    if (carpetaActiva === "sin_carpeta" && item.carpeta_id !== null) return false;
    if (carpetaActiva !== null && carpetaActiva !== "sin_carpeta" && item.carpeta_id !== carpetaActiva) return false;
    if (tabActivo === "favoritos" && !item.favorito) return false;
    if (tabActivo === "imagenes" && item.tipo !== "imagen") return false;
    if (tabActivo === "copys" && item.tipo !== "copy") return false;
    if (tabActivo === "landings" && item.tipo !== "landing") return false;
    if (filtroModulo !== "todos" && item.modulo !== filtroModulo) return false;
    if (busqueda && !item.nombre.toLowerCase().includes(busqueda.toLowerCase()) &&
        !item.producto?.toLowerCase().includes(busqueda.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: total,
    imagenes: items.filter(i => i.tipo === "imagen").length,
    copys: items.filter(i => i.tipo === "copy").length,
    landings: items.filter(i => i.tipo === "landing").length,
    favoritos: items.filter(i => i.favorito).length,
  };

  const formatFecha = (fecha: string) => {
    const d = new Date(fecha);
    const ahora = new Date();
    const diff = Math.floor((ahora.getTime() - d.getTime()) / 1000 / 60);
    if (diff < 60) return `Hace ${diff} min`;
    if (diff < 1440) return `Hace ${Math.floor(diff / 60)}h`;
    return `Hace ${Math.floor(diff / 1440)} días`;
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <style>{`@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`}</style>

      {toast && (
        <div className="fixed bottom-6 right-6 bg-green-500 text-white text-sm font-bold px-4 py-3 rounded-xl shadow-lg z-50">
          ✓ {toast}
        </div>
      )}

      {/* Modal nueva carpeta */}
      {modalCarpeta && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4" onClick={() => setModalCarpeta(false)}>
          <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h2 className="text-white font-bold text-sm mb-4">Nueva carpeta</h2>
            <input value={nuevaCarpetaNombre} onChange={e => setNuevaCarpetaNombre(e.target.value)} placeholder="Nombre de la carpeta" className="w-full bg-[#f0ead6] text-black text-sm px-3 py-2 rounded-lg outline-none mb-4" onKeyDown={e => e.key === "Enter" && crearCarpeta()} />
            <div className="mb-4">
              <p className="text-yellow-400 text-[9px] font-bold uppercase tracking-wider mb-2">Color</p>
              <div className="flex gap-2 flex-wrap">
                {COLORES_CARPETA.map(c => (
                  <button key={c} onClick={() => setNuevaCarpetaColor(c)} className="w-7 h-7 rounded-full border-2 transition-all" style={{ background: c, borderColor: nuevaCarpetaColor === c ? "white" : "transparent" }} />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setModalCarpeta(false)} className="flex-1 border border-[#1e1e1e] text-zinc-500 text-sm font-bold py-2 rounded-xl">Cancelar</button>
              <button onClick={crearCarpeta} disabled={!nuevaCarpetaNombre.trim()} className="flex-1 bg-orange-500 disabled:opacity-40 text-white text-sm font-bold py-2 rounded-xl">Crear</button>
            </div>
          </div>
        </div>
      )}
      {/* Modal editar carpeta */}
      {modalEditarCarpeta && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4" onClick={() => setModalEditarCarpeta(null)}>
          <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h2 className="text-white font-bold text-sm mb-4">✏️ Editar carpeta</h2>
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-yellow-400 text-[9px] font-bold uppercase tracking-wider">Nombre</label>
                <input value={editCarpetaNombre} onChange={e => setEditCarpetaNombre(e.target.value)} className="w-full mt-1 bg-[#f0ead6] text-black text-sm px-3 py-2 rounded-lg outline-none" />
              </div>
              <div>
                <label className="text-yellow-400 text-[9px] font-bold uppercase tracking-wider">Descripción</label>
                <input value={editCarpetaDescripcion} onChange={e => setEditCarpetaDescripcion(e.target.value)} className="w-full mt-1 bg-[#f0ead6] text-black text-sm px-3 py-2 rounded-lg outline-none" placeholder="Ej: Campaña navidad 2024" />
              </div>
              <div>
                <label className="text-yellow-400 text-[9px] font-bold uppercase tracking-wider">Responsable</label>
                <input value={editCarpetaResponsable} onChange={e => setEditCarpetaResponsable(e.target.value)} className="w-full mt-1 bg-[#f0ead6] text-black text-sm px-3 py-2 rounded-lg outline-none" placeholder="Ej: Carolina" />
              </div>
              <div>
                <label className="text-yellow-400 text-[9px] font-bold uppercase tracking-wider">Notas</label>
                <textarea value={editCarpetaNotas} onChange={e => setEditCarpetaNotas(e.target.value)} rows={3} className="w-full mt-1 bg-[#f0ead6] text-black text-sm px-3 py-2 rounded-lg outline-none resize-none" placeholder="Notas internas sobre esta carpeta..." />
              </div>
              <div>
                <label className="text-yellow-400 text-[9px] font-bold uppercase tracking-wider mb-2 block">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORES_CARPETA.map(c => (
                    <button key={c} onClick={() => setEditCarpetaColor(c)} className="w-7 h-7 rounded-full border-2 transition-all" style={{ background: c, borderColor: editCarpetaColor === c ? "white" : "transparent" }} />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setModalEditarCarpeta(null)} className="flex-1 border border-[#1e1e1e] text-zinc-500 text-sm font-bold py-2 rounded-xl">Cancelar</button>
              <button onClick={guardarCarpetaEditada} className="flex-1 bg-orange-500 text-white text-sm font-bold py-2 rounded-xl">Guardar</button>
            </div>
          </div>
        </div>
      )}
      {/* Modal notas */}
      {modalNotas && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4" onClick={() => setModalNotas(null)}>
          <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h2 className="text-white font-bold text-sm mb-4">✏️ Notas</h2>
            <textarea value={notasTexto} onChange={e => setNotasTexto(e.target.value)} rows={4} className="w-full bg-[#f0ead6] text-black text-sm px-3 py-2 rounded-lg outline-none resize-none mb-4" placeholder="Ej: Esta imagen rompió récords de venta..." />
            <div className="flex gap-2">
              <button onClick={() => setModalNotas(null)} className="flex-1 border border-[#1e1e1e] text-zinc-500 text-sm font-bold py-2 rounded-xl">Cancelar</button>
              <button onClick={guardarNotas} className="flex-1 bg-orange-500 text-white text-sm font-bold py-2 rounded-xl">Guardar</button>
            </div>
          </div>
        </div>
      )}
      {/* Modal mover a carpeta */}
      {modalMover && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4" onClick={() => setModalMover(null)}>
          <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h2 className="text-white font-bold text-sm mb-4">Mover a carpeta</h2>
            <div className="space-y-2 mb-4">
              <button onClick={() => moverItem(modalMover, null)} className="w-full flex items-center gap-3 p-3 rounded-xl border border-[#1e1e1e] hover:border-[#333] text-left">
                <span className="text-lg">📁</span>
                <span className="text-white text-sm">Sin carpeta</span>
              </button>
              {carpetas.map(c => (
                <button key={c.id} onClick={() => moverItem(modalMover, c.id)} className="w-full flex items-center gap-3 p-3 rounded-xl border border-[#1e1e1e] hover:border-[#333] text-left">
                  <div className="w-5 h-5 rounded" style={{ background: c.color }}></div>
                  <span className="text-white text-sm">{c.nombre}</span>
                  <span className="ml-auto text-yellow-400 text-[10px]">{items.filter(i => i.carpeta_id === c.id).length} items</span>
                </button>
              ))}
            </div>
            <button onClick={() => setModalMover(null)} className="w-full border border-[#1e1e1e] text-zinc-500 text-sm font-bold py-2 rounded-xl">Cancelar</button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="max-w-[1400px] mx-auto px-4 pt-6 pb-0">
        <div className="flex items-center mb-0">
          <div className="flex items-center gap-2 flex-shrink-0" style={{width:"160px"}}>
            <div className="w-[72px] h-[72px] rounded-full bg-[#0a0a1a] border border-[#2a2a2a] flex items-center justify-center flex-shrink-0">
              <svg width="38" height="38" viewBox="0 0 32 32" fill="none">
                <rect x="4" y="4" width="10" height="10" rx="2" fill="white" fillOpacity="0.4" stroke="white" strokeWidth="1.5"/>
                <rect x="18" y="4" width="10" height="10" rx="2" fill="white" fillOpacity="0.2" stroke="white" strokeWidth="1.5"/>
                <rect x="4" y="18" width="10" height="10" rx="2" fill="white" fillOpacity="0.2" stroke="white" strokeWidth="1.5"/>
                <rect x="18" y="18" width="10" height="10" rx="2" fill="white" fillOpacity="0.4" stroke="white" strokeWidth="1.5"/>
              </svg>
            </div>
            <p className="text-white text-[14px] font-bold tracking-[0.12em] uppercase">Biblioteca</p>
          </div>
          <div className="flex-1 text-center px-5">
            <div className="inline-flex items-center gap-2 bg-orange-500 text-white text-[9px] font-bold px-3 py-1 rounded-full mb-2 tracking-widest">
              TUS ACTIVOS DE MARKETING
            </div>
            <h1 className="text-xl font-black text-white mb-1">
              Todo tu contenido en un <span style={{color:"#f97316"}}>solo lugar</span>
            </h1>
            <p className="text-yellow-400 text-[11px]">Imágenes · Copys · Landings · Carpetas · Favoritos</p>
          </div>
          <div className="flex-shrink-0" style={{width:"160px"}}>
            <button onClick={() => setModalCarpeta(true)} className="w-full bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-bold py-2 px-4 rounded-xl transition-colors">
              + Nueva carpeta
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 pb-12 mt-6">

        {/* Stats */}
        <div className="grid grid-cols-5 gap-3 mb-6">
          {[
            { label: "Total", valor: stats.total, color: "text-white" },
            { label: "Imágenes", valor: stats.imagenes, color: "text-orange-500" },
            { label: "Copys", valor: stats.copys, color: "text-blue-400" },
            { label: "Landings", valor: stats.landings, color: "text-green-400" },
            { label: "Favoritos", valor: stats.favoritos, color: "text-yellow-400" },
          ].map((s, i) => (
            <div key={i} className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-4 text-center">
              <div className={`text-2xl font-black ${s.color}`}>{s.valor}</div>
              <div className="text-yellow-400 text-[10px] mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Carpetas */}
        {carpetas.length > 0 && (
          <div className="mb-6">
            <p className="text-yellow-400 text-[9px] font-bold uppercase tracking-wider mb-3">Carpetas</p>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setCarpetaActiva(null)} className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[10px] font-bold transition-all ${carpetaActiva === null ? "border-orange-500 bg-orange-500/10 text-orange-500" : "border-[#1a1a1a] text-zinc-500"}`}>
                📁 Todos
              </button>
              <button onClick={() => setCarpetaActiva("sin_carpeta")} className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[10px] font-bold transition-all ${carpetaActiva === "sin_carpeta" ? "border-yellow-500 bg-yellow-500/10 text-yellow-400" : "border-[#1a1a1a] text-zinc-500"}`}>
                📥 Sin clasificar
              </button>
              {carpetas.map(c => (
                <div key={c.id} className="flex items-center gap-1">
                  <button onClick={() => setCarpetaActiva(carpetaActiva === c.id ? null : c.id)} className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[10px] font-bold transition-all ${carpetaActiva === c.id ? "border-white/30 text-white" : "border-[#1a1a1a] text-zinc-400"}`} style={carpetaActiva === c.id ? { background: c.color + "20", borderColor: c.color + "50" } : {}}>
                    <div className="w-3 h-3 rounded" style={{ background: c.color }}></div>
                    {c.nombre}
                    <span className="text-[9px] opacity-60">{items.filter(i => i.carpeta_id === c.id).length}</span>
                  </button>
                  <button onClick={() => { setModalEditarCarpeta(c); setEditCarpetaNombre(c.nombre); setEditCarpetaDescripcion(c.descripcion || ""); setEditCarpetaResponsable(c.responsable || ""); setEditCarpetaNotas(c.notas || ""); setEditCarpetaColor(c.color); }} className="text-zinc-700 hover:text-blue-400 text-[10px] px-1">✏️</button>
                  <button onClick={() => eliminarCarpeta(c.id)} className="text-zinc-700 hover:text-red-400 text-[10px] px-1">✕</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-[#070707] border border-[#111] rounded-xl p-1">
          {[
            { id: "todos", label: "Todos" },
            { id: "imagenes", label: "Imágenes" },
            { id: "copys", label: "Copys" },
            { id: "landings", label: "Landings" },
            { id: "favoritos", label: "★ Favoritos" },
          ].map(t => (
            <button key={t.id} onClick={() => setTabActivo(t.id)} className={`flex-1 text-center py-1.5 rounded-lg text-[10px] font-bold transition-all ${tabActivo === t.id ? "bg-orange-500 text-white" : "text-zinc-500"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Filtros + busqueda */}
        <div className="flex items-center gap-2 mb-6">
          {["todos", "landing", "anuncios", "redes", "copy"].map(m => (
            <button key={m} onClick={() => setFiltroModulo(m)} className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${filtroModulo === m ? "bg-orange-500/10 border-orange-500/40 text-orange-500" : "border-[#1a1a1a] text-zinc-500"}`}>
              {m === "todos" ? "Todos los módulos" : m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-3 py-1.5">
            <span className="text-zinc-500 text-[11px]">🔍</span>
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar por producto..." className="bg-transparent text-[11px] text-white outline-none w-40 placeholder-zinc-600" />
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl overflow-hidden">
                <div className="h-[100px] relative overflow-hidden">
                  <div className="absolute inset-0 bg-[#141414]"></div>
                  <div className="absolute inset-0" style={{background:"linear-gradient(90deg, transparent, #ffffff0a, transparent)", backgroundSize:"200% 100%", animation:"shimmer 1.5s infinite"}}></div>
                </div>
                <div className="p-3 space-y-2">
                  <div className="h-3 w-3/4 rounded bg-[#141414] relative overflow-hidden">
                    <div className="absolute inset-0" style={{background:"linear-gradient(90deg, transparent, #ffffff0a, transparent)", backgroundSize:"200% 100%", animation:"shimmer 1.5s infinite"}}></div>
                  </div>
                  <div className="h-2 w-1/2 rounded bg-[#141414]"></div>
                  <div className="h-6 w-full rounded bg-[#141414]"></div>
                </div>
              </div>
            ))}
          </div>
        ) : itemsFiltrados.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📁</div>
            <p className="text-white font-black text-xl mb-2">
              {items.length === 0 ? "Tu biblioteca está vacía" : "Sin resultados"}
            </p>
            <p className="text-yellow-400 text-sm mb-6">
              {items.length === 0 ? "Guarda imágenes, copys y landings desde cada módulo" : "Prueba con otros filtros"}
            </p>
            {items.length === 0 && (
              <div className="flex gap-3 justify-center">
                <a href="/landing" className="bg-orange-500 text-white font-bold px-6 py-3 rounded-xl text-sm">→ Ir a Landing</a>
                <a href="/anuncios" className="border border-[#333] text-white font-bold px-6 py-3 rounded-xl text-sm">→ Ir a Anuncios</a>
              </div>
            )}
          </div>
        ) : (
          <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {itemsFiltrados.map(item => (
              <div key={item.id} className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl overflow-hidden hover:border-[#333] transition-colors">

                {/* Preview */}
                <div className={`h-[100px] bg-gradient-to-br ${MODULO_BG[item.modulo]} flex items-center justify-center relative`}>
                  {item.imagen_url ? (
                    <img src={item.imagen_url} className="w-full h-full object-contain" alt={item.nombre} loading="lazy" />
                  ) : (
                    <div className="text-4xl opacity-20">
                      {item.tipo === "copy" ? "📝" : item.tipo === "landing" ? "🖥️" : "🖼️"}
                    </div>
                  )}
                  <span className={`absolute top-2 left-2 text-[8px] font-bold px-2 py-0.5 rounded-full border ${MODULO_COLORS[item.modulo]}`}>
                    {item.modulo.toUpperCase()}
                  </span>
                  <button onClick={() => toggleFavorito(item)} className="absolute top-2 right-2 text-lg">
                    <span className={item.favorito ? "text-yellow-400" : "text-zinc-700"}>★</span>
                  </button>
                  {item.carpeta_id && (
                    <div className="absolute bottom-2 right-2 w-3 h-3 rounded" style={{ background: carpetas.find(c => c.id === item.carpeta_id)?.color || "#f97316" }}></div>
                  )}
                </div>

                {/* Info */}
                <div className="p-3">
                  <p className="text-white text-[11px] font-bold truncate mb-0.5">{item.nombre}</p>
                  <p className="text-yellow-400 text-[9px] mb-3">{item.producto || "—"} · {formatFecha(item.created_at)}</p>

                  {item.tipo === "copy" && item.contenido && (
                    <p className="text-zinc-600 text-[9px] leading-relaxed mb-3 line-clamp-2">{item.contenido}</p>
                  )}

                  <div className="flex gap-1.5">
                    {item.imagen_url && (
                      <button onClick={() => descargar(item.imagen_url!, item.nombre)} className="flex-1 bg-[#111] border border-[#1a1a1a] text-yellow-400 text-[9px] font-bold py-1.5 rounded-lg">⬇</button>
                    )}
                    {item.contenido && (
                      <button onClick={() => copiar(item.contenido!, item.id)} className="flex-1 bg-[#111] border border-[#1a1a1a] text-yellow-400 text-[9px] font-bold py-1.5 rounded-lg">
                        {copiado === item.id ? "✓" : "📋"}
                      </button>
                    )}
                    <button onClick={() => { setModalNotas(item.id); setNotasTexto(item.notas || ""); }} className="bg-[#111] border border-[#1a1a1a] text-zinc-400 text-[9px] font-bold px-2 py-1.5 rounded-lg">✏️</button>
                    <button onClick={() => setModalMover(item.id)} className="bg-[#111] border border-[#1a1a1a] text-zinc-400 text-[9px] font-bold px-2 py-1.5 rounded-lg">📁</button>
                    <button onClick={() => eliminar(item.id)} className="bg-[#111] border border-red-500/20 text-red-400 text-[9px] font-bold px-2 py-1.5 rounded-lg">✕</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {items.length < total && (
            <div className="text-center mt-6">
              <button onClick={cargarMas} disabled={cargandoMas} className="bg-[#111] border border-orange-500/40 hover:border-orange-500 text-orange-400 text-xs font-bold px-8 py-3 rounded-xl transition-colors disabled:opacity-40">
                {cargandoMas ? "⏳ Cargando..." : `⬇ Cargar más (${total - items.length} restantes)`}
              </button>
            </div>
          )}
          </>
        )}
      </div>
    </div>
  );
}