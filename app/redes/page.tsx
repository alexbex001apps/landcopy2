"use client";
import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import SinCampana from "@/components/SinCampana"; 
const PAISES = [
  { nombre: "Colombia", flag: "🇨🇴" },
  { nombre: "México", flag: "🇲🇽" },
  { nombre: "Venezuela", flag: "🇻🇪" },
  { nombre: "Costa Rica", flag: "🇨🇷" },
  { nombre: "Ecuador", flag: "🇪🇨" },
  { nombre: "General", flag: "🌎" },
];
 
const TONOS = ["Urgente", "Emocional", "Racional", "Casual", "Confianza", "Premium"];
 
const DESTINOS = [
  { id: "instagram", nombre: "Instagram", ratio: "ver formatos", icon: "📸" },
  { id: "tiktok", nombre: "TikTok", ratio: "9:16 · 1080×1920", icon: "🎵" },
  { id: "facebook", nombre: "Facebook", ratio: "1:1 · 1080×1080", icon: "👥" },
  { id: "whatsapp", nombre: "WhatsApp", ratio: "1:1 · 800×800", icon: "💬" },
  { id: "story", nombre: "Story", ratio: "9:16 · 1080×1920", icon: "📱" },
];
 
const FORMATOS_IG = [
  { id: "feed45", nombre: "Feed 4:5", width: 1080, height: 1350 },
  { id: "feed11", nombre: "Feed 1:1", width: 1080, height: 1080 },
  { id: "story916", nombre: "Story 9:16", width: 1080, height: 1920 },
  { id: "reels", nombre: "Reels portada", width: 1080, height: 1920 },
  { id: "carrusel", nombre: "Carrusel ×5", width: 1080, height: 1350 },
];
 
const TIPOS = [
  { id: "escena", nombre: "Producto en escena", desc: "El producto en ambiente real. Prompt técnico automático.", icon: "🏠" },
  { id: "texto", nombre: "Texto sobre fondo", desc: "Copy visual. Ideal para anuncios de oferta y quotes.", icon: "✍️" },
  { id: "ugc", nombre: "UGC / Persona usando", desc: "Persona real en escena cotidiana. El más viral.", icon: "🤳" },
  { id: "antesdespues", nombre: "Antes / Después", desc: "Dos paneles. Problema y solución con el producto.", icon: "⚡" },
];
 
type Idea = {
  id: string;
  desc: string;
  modo: "auto" | "manual" | "prompt";
  imageUrl?: string;
  favorita: boolean;
};
 
type TextoRed = {
  caption: string;
  hashtags: string;
  guion?: string;
};
 
export default function Redes() {
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) window.location.href = "/login";
    });
  }, []);
 
  const [paso, setPaso] = useState(1);
 
  const [producto, setProducto] = useState("");
  const [imagen, setImagen] = useState<string | null>(null);
  const [precioOferta, setPrecioOferta] = useState("");
  const [precioAnterior, setPrecioAnterior] = useState("");
  const [beneficio, setBeneficio] = useState("");
  const [problema, setProblema] = useState("");
  const [pais, setPais] = useState("Colombia");
  const [tono, setTono] = useState("Urgente");
  const [desdeCopy, setDesdeCopy] = useState(false);
  const [hayCampana, setHayCampana] = useState(false);
  const [destino, setDestino] = useState("instagram");
  const [formatoIg, setFormatoIg] = useState("feed45");
  const [tipo, setTipo] = useState("escena");
  const [textoEncima, setTextoEncima] = useState(true);
  const [promptCustom, setPromptCustom] = useState("");
  const [modoAvanzado, setModoAvanzado] = useState(false);
 
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [tabTexto, setTabTexto] = useState("instagram");
  const [textos, setTextos] = useState<Record<string, TextoRed>>({});
  const [cargandoTexto, setCargandoTexto] = useState<string | null>(null);
  const [copiado, setCopiado] = useState<string | null>(null);
  const [toast, setToast] = useState("");
 
  const [modalCompartir, setModalCompartir] = useState<{ url: string; caption: string } | null>(null);
 
  const fileRef = useRef<HTMLInputElement>(null);
 
  useEffect(() => {
    const datos = sessionStorage.getItem("redes_producto");
    if (datos) {
      const d = JSON.parse(datos);
      setProducto(d.producto || "");
      setImagen(d.imagen || null);
      setPrecioOferta(d.precioOferta || "");
      setPrecioAnterior(d.precioAnterior || "");
      setBeneficio(d.beneficio || "");
      setProblema(d.problema || "");
      setPais(d.pais || "Colombia");
      setTono(d.tono || "Urgente");
      setDesdeCopy(true);
      setHayCampana(true);
      sessionStorage.removeItem("redes_producto");
      return;
    }
    const camp = sessionStorage.getItem("campaign_activa");
    if (camp) {
      const c = JSON.parse(camp);
      setProducto(c.producto || "");
      setImagen(c.imagen_url || null);
      setPrecioOferta(c.precio_oferta || "");
      setPrecioAnterior(c.precio_anterior || "");
      setBeneficio(c.beneficio || "");
      setProblema(c.problema || "");
      setPais(c.pais || "Colombia");
      setTono(c.tono || "Urgente");
      setHayCampana(true);
    }
    try {
      const guardado = sessionStorage.getItem("redes_estado");
      if (guardado) {
        const s = JSON.parse(guardado);
        if (s.ideas) setIdeas(s.ideas);
        if (s.textos) setTextos(s.textos);
        if (s.tipo) setTipo(s.tipo);
        if (s.destino) setDestino(s.destino);
        if (s.tabTexto) setTabTexto(s.tabTexto);
        if (s.paso) setPaso(s.paso);
      }
    } catch {}
  }, []);
 
  useEffect(() => {
    try {
      const estado = { ideas, textos, tipo, destino, tabTexto, paso };
      sessionStorage.setItem("redes_estado", JSON.stringify(estado));
    } catch {}
  }, [ideas, textos, tipo, destino, tabTexto, paso]);
  function handleImagen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const canvas = document.createElement("canvas");
    const img = new Image();
    img.onload = () => {
      const max = 800;
      let w = img.width, h = img.height;
      if (w > max) { h = (h * max) / w; w = max; }
      if (h > max) { w = (w * max) / h; h = max; }
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      setImagen(canvas.toDataURL("image/jpeg", 0.7));
    };
    img.src = URL.createObjectURL(file);
  }
 
  function mostrarToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }
 
  function copiar(texto: string, id: string) {
    navigator.clipboard.writeText(texto);
    setCopiado(id);
    setTimeout(() => setCopiado(null), 2000);
  }
 
  function toggleFavorita(id: string) {
    setIdeas(prev => prev.map(i => i.id === id ? { ...i, favorita: !i.favorita } : i));
  }
 
 // Genera UNA imagen sola, la guarda apenas llega y limpia su bandera (patrón Landing)
  async function generarUna(v: number) {
    try {
      const res = await fetch("/api/redes/generar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          producto, imagen, precioOferta, precioAnterior,
          beneficio, problema, pais, tono, destino,
          formatoIg, tipo, textoEncima,
          promptCustom: v === 0 && modoAvanzado ? promptCustom : "",
          soloUna: `idea-${v}`,
        }),
      });
      const data = await res.json();
      setIdeas(prev => prev.map(i => i.id === `idea-${v}` ? { ...data.idea, id: `idea-${v}`, favorita: i.favorita } : i));
    } catch (err) {
      console.error(`Error en idea-${v}:`, err);
    }
  }
 
  async function generarIdeas(soloUna?: string) {
    if (!producto) return;
 
    // Caso "regenerar una sola" — mantiene comportamiento previo
    if (soloUna) {
      setLoading(true);
      const v = parseInt(soloUna.replace("idea-", ""), 10);
      await generarUna(isNaN(v) ? 0 : v);
      setLoading(false);
      return;
    }
 
    // Generación NUEVA — las 4 EN PARALELO (como Landing), cada una aparece al llegar
    setPaso(3);
    setLoading(true);
 
    // 1) Pintar las 4 cajas vacías con su spinner
    const base: Idea[] = [0, 1, 2, 3].map(v => ({
      id: `idea-${v}`,
      desc: "Generando...",
      modo: "auto" as const,
      imageUrl: "",
      favorita: false,
    }));
    setIdeas(base);
 
    // 2) Lanzar las 4 al mismo tiempo (sin esperar en fila)
    await Promise.all([0, 1, 2, 3].map(v => generarUna(v)));
 
    setLoading(false);
    generarTextos();
  }
 
  async function mejorarIdea(id: string) {
    const idea = ideas.find(i => i.id === id);
    if (!idea) return;
    setCargandoTexto(`mejorar-${id}`);
    try {
      const res = await fetch("/api/redes/generar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          producto, imagen, precioOferta, precioAnterior,
          beneficio, problema, pais, tono, destino,
          formatoIg, tipo, textoEncima,
          mejorar: true, promptBase: idea.desc, soloUna: id,
        }),
      });
      const data = await res.json();
      setIdeas(prev => prev.map(i => i.id === id ? { ...data.idea, id, favorita: i.favorita } : i));
    } catch (err) {
      console.error(err);
    }
    setCargandoTexto(null);
  }
 
  async function generarTextos(red?: string) {
    const redes = red ? [red] : ["instagram", "tiktok", "facebook", "whatsapp"];
    for (const r of redes) {
      setCargandoTexto(`texto-${r}`);
      try {
        const res = await fetch("/api/redes/texto", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ producto, precioOferta, precioAnterior, beneficio, problema, pais, tono, red: r }),
        });
        const data = await res.json();
        setTextos(prev => ({ ...prev, [r]: data }));
      } catch (err) {
        console.error(err);
      }
      setCargandoTexto(null);
    }
  }
 
  async function mejorarTexto(red: string, campo: string) {
    const textoActual = textos[red];
    if (!textoActual) return;
    setCargandoTexto(`mejorar-texto-${red}-${campo}`);
    try {
      const res = await fetch("/api/redes/texto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ producto, precioOferta, precioAnterior, beneficio, problema, pais, tono, red, mejorar: true, campo, textoActual }),
      });
      const data = await res.json();
      setTextos(prev => ({ ...prev, [red]: { ...prev[red], ...data } }));
    } catch (err) {
      console.error(err);
    }
    setCargandoTexto(null);
  }
 
  async function guardarImagen(idea: Idea) {
    try {
      const res = await fetch("/api/redes/guardar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, producto, pais, tono, destino, tipo, textos: textos[tabTexto] }),
      });
      const data = await res.json();
      if (data.url) {
        mostrarToast("✓ Imagen guardada");
        setModalCompartir({ url: data.url, caption: textos[tabTexto]?.caption || "" });
      }
    } catch (err) {
      console.error(err);
    }
  }
 
  function descargarImagen(url: string, nombre: string) {
    const a = document.createElement("a");
    a.href = url;
    a.download = nombre;
    a.click();
  }
 
  function descargarFavoritas() {
    const favs = ideas.filter(i => i.favorita && i.imageUrl);
    favs.forEach((i, idx) => descargarImagen(i.imageUrl!, `${producto}-favorita-${idx + 1}.png`));
  }
 
  const destinoActual = DESTINOS.find(d => d.id === destino);
  const textoActual = textos[tabTexto];
 
  return (
    <div className="min-h-screen bg-[#050505] text-[#F5F0E8]">
 
      {toast && (
        <div className="fixed bottom-6 right-6 bg-[#FFF500] text-[#0d0d0d] text-sm font-black px-4 py-3 rounded-lg z-50 shadow-lg">
          {toast}
        </div>
      )}
 
      {modalCompartir && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "16px" }}>
          <div className="bg-[#161616] border border-[#2a2a2a] rounded-2xl p-6 w-full max-w-[360px]">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[#FFF500] text-xs font-black tracking-widest uppercase">Compartir imagen</span>
              <button onClick={() => setModalCompartir(null)} className="text-[#7A7772] hover:text-white">✕</button>
            </div>
            <div className="space-y-2">
              <button onClick={() => { navigator.clipboard.writeText(modalCompartir.url); mostrarToast("✓ Link copiado"); }}
                className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg py-2.5 text-xs font-bold text-[#F5F0E8] flex items-center justify-center gap-2">
                🔗 Copiar link
              </button>
              <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(modalCompartir.caption + "\n" + modalCompartir.url)}`, "_blank")}
                className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg py-2.5 text-xs font-bold text-[#F5F0E8] flex items-center justify-center gap-2">
                📱 WhatsApp
              </button>
              <button onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(modalCompartir.url)}&text=${encodeURIComponent(modalCompartir.caption)}`, "_blank")}
                className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg py-2.5 text-xs font-bold text-[#F5F0E8] flex items-center justify-center gap-2">
                ✈️ Telegram
              </button>
              <button onClick={() => descargarImagen(modalCompartir.url, `${producto}-imagen.png`)}
                className="w-full bg-[#FFF500] rounded-lg py-2.5 text-xs font-black text-[#0d0d0d] flex items-center justify-center gap-2">
                ↓ Descargar
              </button>
            </div>
          </div>
        </div>
      )}
 
      {/* Header homogeneizado igual que Copy — responsivo */}
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
            <p className="text-white text-[20px] font-bold tracking-[0.12em] uppercase">Redes</p>
          </div>
          <div className="flex-1 text-center">
            <div className="inline-flex items-center gap-2 bg-orange-500 text-white text-[9px] font-bold px-3 py-1 rounded-full mb-2 tracking-widest">
              IA GENERATIVA · IMÁGENES PARA REDES
            </div>
            <h1 className="text-lg md:text-xl font-black text-white mb-1 px-2">
              Crea imágenes que <span style={{color:"#cc0000"}}>venden</span> y <span className="text-green-400">viralizan</span>
            </h1>
            <p className="text-yellow-400 text-[11px] px-2">Producto · destino · tipo · la IA genera imagen + texto + hashtags + guión TikTok</p>
          </div>
          <div className="flex-shrink-0 hidden md:block" style={{width:"99px"}}></div>
        </div>
      </div>
 
      {/* Steps */}
      <div className="flex bg-[#1e1e1e] border-b border-[#2a2a2a]">
        {[
          { n: 1, label: "Paso 1 — Producto", sub: producto || "Configura tu producto" },
          { n: 2, label: "Paso 2 — Tipo", sub: tipo ? TIPOS.find(t => t.id === tipo)?.nombre : "Elige tipo de imagen" },
          { n: 3, label: "Paso 3 — Resultado", sub: "Galería + texto + descarga" },
        ].map((s) => (
          <div key={s.n} onClick={() => setPaso(s.n)}
            className={`flex-1 flex items-center justify-center gap-1 md:gap-2 px-1 md:px-4 py-2.5 border-r border-[#2a2a2a] last:border-r-0 cursor-pointer relative ${paso === s.n ? "bg-[rgba(255,215,0,0.05)]" : ""}`}>
            <div className={`w-5 h-5 rounded-sm flex items-center justify-center text-xs font-black flex-shrink-0 ${paso >= s.n ? "bg-[#FFF500] text-[#0d0d0d]" : "bg-[#2a2a2a] text-[#555]"}`}>
              {paso > s.n ? "✓" : s.n}
            </div>
            <div>
              <div className={`text-[9px] md:text-xs font-bold tracking-widest uppercase ${paso >= s.n ? "text-[#FFF500]" : "text-[#555]"}`}>{s.label}</div>
              <div className="text-xs text-[#555250] mt-0.5 hidden sm:block">{s.sub}</div>
            </div>
            {paso === s.n && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FFF500]" />}
          </div>
        ))}
      </div>
 
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 pb-20">
      {!hayCampana ? <SinCampana /> : (
      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 mt-4">
 
        {/* Panel izquierdo */}
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-5">
 
          {desdeCopy && (
            <div className="bg-[#1e1e1e] border border-[rgba(134,239,172,0.2)] rounded-md p-2.5 mb-3 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#86EFAC] flex-shrink-0" />
              <div className="text-xs text-[#EDE8DC] flex-1 leading-tight">
                Desde <span className="text-[#86EFAC] font-bold">Copy</span> — {producto} · {pais} · {tono}
              </div>
              <button onClick={() => setDesdeCopy(false)} className="text-xs font-bold text-[#FFF500] border border-[rgba(255,215,0,0.25)] px-1.5 py-0.5 rounded-sm">
                Cambiar
              </button>
            </div>
          )}
 
          <span className="text-xs font-bold tracking-widest uppercase text-[#FFF500] mb-1.5 block">Producto</span>
          {producto && desdeCopy ? (
            <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-md p-2.5 mb-3 flex items-center gap-2">
              <div className="w-9 h-9 rounded-md bg-[#FFF500] flex items-center justify-center text-xs font-black text-[#0d0d0d] flex-shrink-0">
                {producto.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold text-white">{producto}</div>
                <div className="text-xs text-[#7A7772]">${precioOferta} / ${precioAnterior} · {pais}</div>
              </div>
              <span className="text-xs font-bold text-[#0d0d0d] bg-[#FFF500] px-1.5 py-0.5 rounded-sm">Activo</span>
            </div>
          ) : (
            <div className="space-y-2 mb-3">
              <input value={producto} onChange={e => setProducto(e.target.value)} placeholder="Nombre del producto *"
                className="w-full bg-[#f0ead6] border border-[#d4cdb8] text-[#1a1a1a] rounded-md px-3 py-2 text-xs h-8 outline-none placeholder-[#888]" />
              <div className="grid grid-cols-2 gap-2">
                <input value={precioOferta} onChange={e => setPrecioOferta(e.target.value)} placeholder="Precio oferta"
                  className="w-full bg-[#f0ead6] border border-[#d4cdb8] text-[#1a1a1a] rounded-md px-3 py-2 text-xs h-8 outline-none placeholder-[#888]" />
                <input value={precioAnterior} onChange={e => setPrecioAnterior(e.target.value)} placeholder="Precio anterior"
                  className="w-full bg-[#f0ead6] border border-[#d4cdb8] text-[#1a1a1a] rounded-md px-3 py-2 text-xs h-8 outline-none placeholder-[#888]" />
              </div>
              <input value={beneficio} onChange={e => setBeneficio(e.target.value)} placeholder="Beneficio principal"
                className="w-full bg-[#f0ead6] border border-[#d4cdb8] text-[#1a1a1a] rounded-md px-3 py-2 text-xs h-8 outline-none placeholder-[#888]" />
              <input value={problema} onChange={e => setProblema(e.target.value)} placeholder="Problema que resuelve"
                className="w-full bg-[#f0ead6] border border-[#d4cdb8] text-[#1a1a1a] rounded-md px-3 py-2 text-xs h-8 outline-none placeholder-[#888]" />
            </div>
          )}
 
          <span className="text-xs font-bold tracking-widest uppercase text-[#FFF500] mb-1.5 block">Imagen del producto</span>
          <div onClick={() => !imagen && fileRef.current?.click()}
            className="bg-[#1e1e1e] border border-dashed border-[#333] rounded-md p-3 text-center mb-3 cursor-pointer hover:border-[#FFF500] transition-colors">
            {imagen ? (
              <div className="relative inline-block">
                <img src={imagen} className="h-40 mx-auto rounded-md object-contain" alt="producto" />
                <button onClick={(e) => { e.stopPropagation(); setImagen(null); }}
                  className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">✕</button>
              </div>
            ) : (
              <>
                <div className="text-[#FFF500] text-6xl mb-3">📷</div>
                <div className="text-[#C8C3B7] text-xs">Arrastra o selecciona · JPG PNG WEBP</div>
                <div className="text-[#FFF500] text-xs font-bold mt-0.5">GPT-4o Vision lo analiza</div>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleImagen} className="hidden" />
 
          <span className="text-xs font-bold tracking-widest uppercase text-[#FFF500] mb-1.5 block">País</span>
          <div className="flex flex-wrap gap-1 mb-3">
            {PAISES.map(p => (
              <button key={p.nombre} onClick={() => setPais(p.nombre)}
                className={`text-xs font-bold px-2 py-1 rounded-sm border transition-all ${pais === p.nombre ? "bg-[rgba(255,215,0,0.1)] border-[rgba(255,215,0,0.4)] text-[#FFF500]" : "bg-[#1e1e1e] border-[#2a2a2a] text-[#EDE8DC]"}`}>
                {p.flag} {p.nombre}
              </button>
            ))}
          </div>
 
          <span className="text-xs font-bold tracking-widest uppercase text-[#FFF500] mb-1.5 block">Tono</span>
          <div className="flex flex-wrap gap-1 mb-3">
            {TONOS.map(t => (
              <button key={t} onClick={() => setTono(t)}
                className={`text-xs font-bold px-2 py-1 rounded-sm border transition-all ${tono === t ? "bg-[rgba(255,215,0,0.1)] border-[rgba(255,215,0,0.4)] text-[#FFF500]" : "bg-[#1e1e1e] border-[#2a2a2a] text-[#EDE8DC]"}`}>
                {t}
              </button>
            ))}
          </div>
 
          <div className="border-t border-[#1e1e1e] my-3" />
 
          <span className="text-xs font-bold tracking-widest uppercase text-[#FFF500] mb-1.5 block">¿Para qué red?</span>
          <div className="grid grid-cols-2 gap-1 mb-2">
            {DESTINOS.map(d => (
              <button key={d.id} onClick={() => setDestino(d.id)}
                className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 border text-left transition-all ${destino === d.id ? "border-[rgba(255,215,0,0.5)] bg-[rgba(255,215,0,0.07)]" : "bg-[#1e1e1e] border-[#2a2a2a]"}`}>
                <span className="text-xs">{d.icon}</span>
                <div>
                  <div className={`text-xs font-bold ${destino === d.id ? "text-[#FFF500]" : "text-[#EDE8DC]"}`}>{d.nombre}</div>
                  <div className="text-xs text-[#7A7772]">{d.ratio}</div>
                </div>
              </button>
            ))}
          </div>
 
          <button className="w-full bg-[rgba(255,215,0,0.08)] border border-[rgba(255,215,0,0.25)] rounded-md py-2 mb-2 text-xs font-bold text-[#FFF500] flex items-center justify-center gap-1.5">
            ⚡ Generar para TODOS los formatos
          </button>
 
          {destino === "instagram" && (
            <div className="bg-[#2a2a2a] rounded-md p-2 mb-2">
              <div className="text-xs font-bold text-[#7A7772] tracking-widest uppercase mb-1.5">Formatos de Instagram</div>
              <div className="grid grid-cols-2 gap-1">
                {FORMATOS_IG.map(f => (
                  <button key={f.id} onClick={() => setFormatoIg(f.id)}
                    className={`text-xs font-bold px-2 py-1 rounded-sm border flex items-center gap-1 ${formatoIg === f.id ? "border-[rgba(255,215,0,0.4)] text-[#FFF500]" : "border-[#333] text-[#C8C3B7]"}`}>
                    {f.nombre}
                  </button>
                ))}
              </div>
            </div>
          )}
 
          <div className="border-t border-[#1e1e1e] my-3" />
 
          <span className="text-xs font-bold tracking-widest uppercase text-[#FFF500] mb-1.5 block">Tipo de imagen</span>
          <div className="grid grid-cols-2 gap-1.5 mb-3">
            {TIPOS.map(t => (
              <button key={t.id} onClick={() => setTipo(t.id)}
                className={`rounded-md p-2 text-left border transition-all ${tipo === t.id ? "border-[rgba(255,215,0,0.5)] bg-[rgba(255,215,0,0.06)]" : "bg-[#1e1e1e] border-[#2a2a2a]"}`}>
                <div className="text-xs mb-1">{t.icon}</div>
                <div className={`text-xs font-bold ${tipo === t.id ? "text-[#FFF500]" : "text-[#EDE8DC]"}`}>{t.nombre}</div>
                <div className="text-xs text-[#7A7772] leading-tight mt-0.5">{t.desc}</div>
              </button>
            ))}
          </div>
 
          <div className="flex items-center justify-between bg-[#1e1e1e] border border-[#2a2a2a] rounded-md px-3 py-2 mb-2">
            <div>
              <div className="text-xs font-bold text-[#EDE8DC]">Texto encima de la imagen</div>
              <div className="text-xs text-[#7A7772] mt-0.5">Precio, beneficio y CTA superpuestos</div>
            </div>
            <button onClick={() => setTextoEncima(!textoEncima)}
              className={`w-8 h-4 rounded-full relative transition-colors flex-shrink-0 ${textoEncima ? "bg-[#FFF500]" : "bg-[#333]"}`}>
              <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-[#0d0d0d] transition-all ${textoEncima ? "right-0.5" : "left-0.5"}`} />
            </button>
          </div>
 
          {modoAvanzado && (
            <textarea value={promptCustom} onChange={e => setPromptCustom(e.target.value)}
              placeholder="Escribe tu prompt personalizado..."
              className="w-full bg-[#f0ead6] border border-[#d4cdb8] text-[#1a1a1a] rounded-md px-3 py-2 text-sm outline-none resize-none h-16 mb-2 placeholder-[#888]" />
          )}
 
          <button onClick={() => generarIdeas()} disabled={!producto || loading}
            className="w-full bg-[#FFF500] border-none rounded-md py-2.5 text-[#0d0d0d] text-xs font-black cursor-pointer flex items-center justify-center gap-1.5 mb-1.5 disabled:opacity-40">
            ⚡ Generar 4 ideas ahora
          </button>
          <button onClick={() => setModoAvanzado(!modoAvanzado)}
            className="w-full bg-transparent border border-[#333] rounded-md py-2 text-[#C8C3B7] text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5">
            ⚙️ {modoAvanzado ? "Ocultar" : "Prompt personalizado · modo avanzado"}
          </button>
 
        </div>
 
        {/* Panel derecho */}
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-4 md:p-5">
 
          {!loading && ideas.length === 0 && (
            <div className="flex items-center justify-center h-64 text-[#555250] text-sm flex-col gap-2">
              <span className="text-3xl">🎨</span>
              <span>Configura el producto y presiona Generar</span>
            </div>
          )}
 
          {loading && (
            <div className="bg-[#161616] border border-[#1e1e1e] rounded-xl p-5 mb-4">
              <div className="text-[#FFF500] text-xs font-bold tracking-widest uppercase mb-3">⚙️ Generando imágenes · gpt-image-2</div>
              {["Analizando producto y mercado", "Construyendo prompts técnicos", "Generando imágenes con IA", "Preparando texto y hashtags"].map((t, i) => (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <span className="text-[#7A7772] text-xs">⟳</span>
                  <span className="text-[#EDE8DC] text-sm flex-1">{t}</span>
                  <div className="w-20 h-0.5 bg-[#1e1e1e] rounded-full">
                    <div className="h-0.5 rounded-full bg-[#FFF500] animate-pulse" style={{ width: "60%" }} />
                  </div>
                </div>
              ))}
            </div>
          )}
 
          {ideas.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-[#FFF500] tracking-widest uppercase">
                  4 ideas · {destinoActual?.nombre} · {TIPOS.find(t => t.id === tipo)?.nombre}
                </span>
                <span className="text-xs text-[#7A7772] hidden sm:block">gpt-image-2 · automático</span>
              </div>
 
              <div className="grid grid-cols-2 gap-3 mb-3">
                {ideas.map((idea) => (
                  <div key={idea.id} className={`bg-[#161616] border rounded-lg overflow-hidden ${idea.favorita ? "border-[#FFF500]" : "border-[#1e1e1e]"}`}>
                    <div className="relative bg-[#0a0a0a] w-full overflow-hidden rounded-t-lg" style={{ paddingTop: "125%" }}>
                      {idea.imageUrl ? (
                        <img src={idea.imageUrl} className="absolute inset-0 w-full h-full object-cover" alt={idea.desc} />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center"><span className="text-4xl opacity-30">🖼️</span></div>
                      )}
                      <span className={`absolute top-1.5 left-1.5 text-xs font-black px-1.5 py-0.5 rounded-sm ${idea.modo === "auto" ? "bg-[#FFF500] text-[#0d0d0d]" : idea.modo === "manual" ? "bg-[#86EFAC] text-black" : "bg-[#C084FC] text-white"}`}>
                        {idea.modo === "auto" ? "Auto" : idea.modo === "manual" ? "Manual" : "Prompt"}
                      </span>
                      <button onClick={() => toggleFavorita(idea.id)}
                        className={`absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[rgba(0,0,0,0.6)] flex items-center justify-center text-sm border-none cursor-pointer ${idea.favorita ? "text-[#F472B6]" : "text-[#555]"}`}>
                        ♥
                      </button>
                    </div>
                    <div className="p-2">
                      <div className="text-xs text-[#C8C3B7] leading-tight mb-1.5">{idea.desc}</div>
                      <div className="flex flex-wrap gap-1">
                        <button onClick={() => generarIdeas(idea.id)} disabled={loading}
                          className="text-xs font-bold px-2.5 py-1.5 rounded-md bg-[rgba(255,215,0,0.15)] border border-[rgba(255,215,0,0.3)] text-[#FFF500] disabled:opacity-40 cursor-pointer">
                          ↻ Regenerar
                        </button>
                        <button onClick={() => mejorarIdea(idea.id)} disabled={cargandoTexto === `mejorar-${idea.id}`}
                          className="text-xs font-bold px-2.5 py-1.5 rounded-md bg-[rgba(0,212,255,0.1)] border border-[rgba(0,212,255,0.25)] text-[#00D4FF] disabled:opacity-40 cursor-pointer">
                          {cargandoTexto === `mejorar-${idea.id}` ? "⟳" : "✦ Mejorar"}
                        </button>
                        {idea.imageUrl && (
                          <button onClick={() => descargarImagen(idea.imageUrl!, `${producto}-${idea.id}.png`)}
                            className="text-xs font-bold px-2.5 py-1.5 rounded-md bg-[#FFF500] text-[#0d0d0d] cursor-pointer">
                            ↓
                          </button>
                        )}
                        <button onClick={() => guardarImagen(idea)}
                          className="text-xs font-bold px-2.5 py-1.5 rounded-md bg-[rgba(134,239,172,0.1)] border border-[rgba(134,239,172,0.2)] text-[#86EFAC] cursor-pointer">
                          ♥ Guardar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
 
              <div className="flex flex-col sm:flex-row gap-2 mb-4">
                <button onClick={() => generarIdeas()} disabled={loading}
                  className="flex-1 bg-[#161616] border border-[#1e1e1e] rounded-md py-1.5 text-xs font-bold text-[#EDE8DC] cursor-pointer flex items-center justify-center gap-1 disabled:opacity-40">
                  ↻ Regenerar todas
                </button>
                <button className="flex-1 bg-[#161616] border border-[#1e1e1e] rounded-md py-1.5 text-xs font-bold text-[#EDE8DC] cursor-pointer flex items-center justify-center gap-1">
                  ✦ Mejorar todas
                </button>
                <button onClick={() => copiar(ideas.map(i => i.desc).join("\n\n"), "prompts")}
                  className="flex-1 bg-[#161616] border border-[#1e1e1e] rounded-md py-1.5 text-xs font-bold text-[#EDE8DC] cursor-pointer flex items-center justify-center gap-1">
                  {copiado === "prompts" ? "✓ Copiado" : "⎘ Copiar prompts"}
                </button>
              </div>
 
              <span className="text-xs font-bold tracking-widest uppercase text-[#FFF500] mb-2 block">Texto para publicar</span>
              <div className="flex gap-1 bg-[#161616] border border-[#1e1e1e] rounded-md p-1 mb-3">
                {["instagram", "tiktok", "facebook", "whatsapp"].map(r => (
                  <button key={r} onClick={() => { setTabTexto(r); if (!textos[r]) generarTextos(r); }}
                    className={`flex-1 text-center py-1 rounded-sm text-xs font-bold tracking-widest uppercase cursor-pointer ${tabTexto === r ? "bg-[#FFF500] text-[#0d0d0d]" : "text-[#555]"}`}>
                    {r === "instagram" ? "IG" : r === "tiktok" ? "TK" : r === "facebook" ? "FB" : "WA"}
                  </button>
                ))}
              </div>
 
              <div className="bg-[#161616] border border-[#1e1e1e] rounded-lg p-3 mb-2">
                <div className="text-xs font-bold text-[#FFF500] tracking-widest uppercase mb-2">Caption · {tabTexto}</div>
                {cargandoTexto === `texto-${tabTexto}` ? (
                  <div className="text-xs text-[#7A7772]">Generando caption...</div>
                ) : textoActual ? (
                  <>
                    <div className="text-sm text-[#EDE8DC] leading-relaxed mb-2">{textoActual.caption}</div>
                    <div className="text-xs text-[#C8C3B7] leading-relaxed opacity-80">{textoActual.hashtags}</div>
                  </>
                ) : (
                  <div className="text-xs text-[#555]">Generando texto automáticamente...</div>
                )}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <button onClick={() => generarTextos(tabTexto)}
                    className="text-xs font-bold px-2 py-1 rounded-sm bg-[rgba(255,215,0,0.15)] border border-[rgba(255,215,0,0.3)] text-[#FFF500] cursor-pointer">
                    ↻ Regenerar
                  </button>
                  <button onClick={() => mejorarTexto(tabTexto, "caption")} disabled={cargandoTexto === `mejorar-texto-${tabTexto}-caption`}
                    className="text-xs font-bold px-2 py-1 rounded-sm bg-[rgba(0,212,255,0.1)] border border-[rgba(0,212,255,0.25)] text-[#00D4FF] cursor-pointer disabled:opacity-40">
                    {cargandoTexto === `mejorar-texto-${tabTexto}-caption` ? "⟳" : "✦ Mejorar"}
                  </button>
                  <button onClick={() => textoActual && copiar(textoActual.caption, "caption")}
                    className="text-xs font-bold px-2 py-1 rounded-sm bg-[#1e1e1e] border border-[#2a2a2a] text-[#7A7772] cursor-pointer">
                    {copiado === "caption" ? "✓ Copiado" : "⎘ Copiar texto"}
                  </button>
                  <button onClick={() => textoActual && copiar(textoActual.hashtags, "hashtags")}
                    className="text-xs font-bold px-2 py-1 rounded-sm bg-[#1e1e1e] border border-[#2a2a2a] text-[#7A7772] cursor-pointer">
                    {copiado === "hashtags" ? "✓ Copiado" : "# Hashtags"}
                  </button>
                  <button className="text-xs font-bold px-2 py-1 rounded-sm bg-[rgba(134,239,172,0.1)] border border-[rgba(134,239,172,0.2)] text-[#86EFAC] cursor-pointer">
                    ♥ Guardar
                  </button>
                </div>
              </div>
 
              {tabTexto === "tiktok" && textoActual?.guion && (
                <div className="bg-[#161616] border border-[rgba(192,132,252,0.2)] rounded-lg p-3 mb-2">
                  <div className="text-xs font-bold text-[#C084FC] tracking-widest uppercase mb-2">🎵 Guión TikTok · 30 segundos</div>
                  <div className="text-xs text-[#EDE8DC] leading-relaxed whitespace-pre-wrap">{textoActual.guion}</div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <button onClick={() => generarTextos("tiktok")}
                      className="text-xs font-bold px-2 py-1 rounded-sm bg-[rgba(255,215,0,0.15)] border border-[rgba(255,215,0,0.3)] text-[#FFF500] cursor-pointer">
                      ↻ Regenerar
                    </button>
                    <button onClick={() => mejorarTexto("tiktok", "guion")}
                      className="text-xs font-bold px-2 py-1 rounded-sm bg-[rgba(0,212,255,0.1)] border border-[rgba(0,212,255,0.25)] text-[#00D4FF] cursor-pointer">
                      ✦ Mejorar hook
                    </button>
                    <button onClick={() => textoActual.guion && copiar(textoActual.guion, "guion")}
                      className="text-xs font-bold px-2 py-1 rounded-sm bg-[#1e1e1e] border border-[#2a2a2a] text-[#7A7772] cursor-pointer">
                      {copiado === "guion" ? "✓ Copiado" : "⎘ Copiar guión"}
                    </button>
                    <button className="text-xs font-bold px-2 py-1 rounded-sm bg-[rgba(134,239,172,0.1)] border border-[rgba(134,239,172,0.2)] text-[#86EFAC] cursor-pointer">
                      ♥ Guardar
                    </button>
                  </div>
                </div>
              )}
 
              <div className="flex flex-col sm:flex-row gap-2 mt-3">
                <button onClick={() => ideas.filter(i => i.imageUrl).forEach((i, idx) => descargarImagen(i.imageUrl!, `${producto}-${idx + 1}.png`))}
                  className="flex-1 bg-[#FFF500] border-none rounded-md py-2 text-[#0d0d0d] text-xs font-black cursor-pointer flex items-center justify-center gap-1.5">
                  ↓ Descargar todas
                </button>
                <button onClick={descargarFavoritas}
                  className="flex-1 bg-[rgba(244,114,182,0.1)] border border-[rgba(244,114,182,0.25)] rounded-md py-2 text-[#F472B6] text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5">
                  ♥ Solo favoritas
                </button>
                <button className="flex-1 bg-transparent border border-[#2a2a2a] rounded-md py-2 text-[#7A7772] text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5">
                  ⬇ ZIP organizado
                </button>
              </div>
            </>
          )}
        </div>
      </div>)}</div>
    </div>
  );
}