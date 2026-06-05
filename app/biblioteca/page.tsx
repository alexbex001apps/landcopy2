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
  created_at: string;
  metadata: any;
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

export default function Biblioteca() {
  const [items, setItems] = useState<BibliotecaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabActivo, setTabActivo] = useState("todos");
  const [filtroModulo, setFiltroModulo] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [copiado, setCopiado] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) window.location.href = "/login";
    });
    cargar();
  }, []);

  const cargar = async () => {
    setLoading(true);
    const resp = await fetch("/api/biblioteca");
    const data = await resp.json();
    setItems(data.items || []);
    setLoading(false);
  };

  const toggleFavorito = async (item: BibliotecaItem) => {
    await fetch("/api/biblioteca", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, favorito: !item.favorito }),
    });
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, favorito: !i.favorito } : i));
  };

  const eliminar = async (id: string) => {
    await fetch("/api/biblioteca", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setItems(prev => prev.filter(i => i.id !== id));
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
    total: items.length,
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

      {toast && (
        <div className="fixed bottom-6 right-6 bg-green-500 text-white text-sm font-bold px-4 py-3 rounded-xl shadow-lg z-50">
          ✓ {toast}
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
            <p className="text-yellow-400 text-[11px]">Imágenes · Copys · Landings · Favoritos · Descarga y reutiliza</p>
          </div>
          <div className="flex-shrink-0" style={{width:"160px"}}></div>
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
          <div className="text-center py-20 text-yellow-400 text-sm">Cargando biblioteca...</div>
        ) : itemsFiltrados.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📁</div>
            <p className="text-white font-black text-xl mb-2">
              {items.length === 0 ? "Tu biblioteca está vacía" : "Sin resultados"}
            </p>
            <p className="text-yellow-400 text-sm mb-6">
              {items.length === 0
                ? "Guarda imágenes, copys y landings desde cada módulo"
                : "Prueba con otros filtros"}
            </p>
            {items.length === 0 && (
              <div className="flex gap-3 justify-center">
                <a href="/landing" className="bg-orange-500 text-white font-bold px-6 py-3 rounded-xl text-sm">→ Ir a Landing</a>
                <a href="/anuncios" className="border border-[#333] text-white font-bold px-6 py-3 rounded-xl text-sm">→ Ir a Anuncios</a>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {itemsFiltrados.map(item => (
              <div key={item.id} className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl overflow-hidden hover:border-[#333] transition-colors">

                {/* Preview */}
                <div className={`h-[140px] bg-gradient-to-br ${MODULO_BG[item.modulo]} flex items-center justify-center relative`}>
                  {item.imagen_url ? (
                    <img src={item.imagen_url} className="w-full h-full object-cover" alt={item.nombre} />
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
                    <button onClick={() => eliminar(item.id)} className="bg-[#111] border border-red-500/20 text-red-400 text-[9px] font-bold px-2 py-1.5 rounded-lg">✕</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}