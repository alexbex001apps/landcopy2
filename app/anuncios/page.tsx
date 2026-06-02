"use client";
import { useEffect, useState } from "react";

const BANCO: Record<string, { id: string; nombre: string; descripcion: string; posTexto: string; colorFondo: string; colorTexto: string; maxChars: number }[]> = {
  "Salud y bienestar": [
    { id: "salud-1", nombre: "Fondo blanco limpio", descripcion: "Producto centrado, texto arriba en negro", posTexto: "top", colorFondo: "#ffffff", colorTexto: "#000000", maxChars: 80 },
    { id: "salud-2", nombre: "Fondo verde suave", descripcion: "Texto abajo en blanco, ambiente natural", posTexto: "bottom", colorFondo: "#1a3a2a", colorTexto: "#ffffff", maxChars: 80 },
    { id: "salud-3", nombre: "Urgencia roja", descripcion: "Fondo rojo, texto centrado en blanco", posTexto: "center", colorFondo: "#8b0000", colorTexto: "#ffffff", maxChars: 60 },
    { id: "salud-4", nombre: "Minimalista gris", descripcion: "Fondo gris oscuro, texto arriba en naranja", posTexto: "top", colorFondo: "#1a1a1a", colorTexto: "#ff5000", maxChars: 80 },
    { id: "salud-5", nombre: "Confianza azul", descripcion: "Fondo azul profundo, texto abajo en blanco", posTexto: "bottom", colorFondo: "#0a1628", colorTexto: "#ffffff", maxChars: 80 },
  ],
  "Tecnología": [
    { id: "tech-1", nombre: "Dark tech", descripcion: "Fondo negro, texto en cyan neón", posTexto: "top", colorFondo: "#050505", colorTexto: "#00e5ff", maxChars: 80 },
    { id: "tech-2", nombre: "Premium oscuro", descripcion: "Fondo carbón, texto en blanco", posTexto: "bottom", colorFondo: "#111111", colorTexto: "#ffffff", maxChars: 80 },
    { id: "tech-3", nombre: "Azul eléctrico", descripcion: "Fondo azul, texto en blanco", posTexto: "center", colorFondo: "#0033cc", colorTexto: "#ffffff", maxChars: 60 },
    { id: "tech-4", nombre: "Contraste máximo", descripcion: "Fondo blanco, texto en negro", posTexto: "top", colorFondo: "#ffffff", colorTexto: "#000000", maxChars: 80 },
    { id: "tech-5", nombre: "Neón verde", descripcion: "Fondo negro, texto en verde", posTexto: "bottom", colorFondo: "#050505", colorTexto: "#00ff88", maxChars: 80 },
  ],
  "Urgencia y oferta": [
    { id: "urg-1", nombre: "Oferta roja", descripcion: "Rojo intenso, texto blanco grande", posTexto: "center", colorFondo: "#cc0000", colorTexto: "#ffffff", maxChars: 50 },
    { id: "urg-2", nombre: "Naranja urgente", descripcion: "Naranja brillante, texto negro", posTexto: "top", colorFondo: "#ff5000", colorTexto: "#000000", maxChars: 60 },
    { id: "urg-3", nombre: "Negro y amarillo", descripcion: "Máximo contraste, atención inmediata", posTexto: "bottom", colorFondo: "#111111", colorTexto: "#ffdd00", maxChars: 70 },
    { id: "urg-4", nombre: "Flash blanco", descripcion: "Blanco puro, texto rojo urgente", posTexto: "center", colorFondo: "#ffffff", colorTexto: "#cc0000", maxChars: 50 },
    { id: "urg-5", nombre: "Oscuro premium", descripcion: "Fondo oscuro, texto dorado", posTexto: "top", colorFondo: "#0a0a0a", colorTexto: "#ffd700", maxChars: 70 },
  ],
};

const CATEGORIAS = Object.keys(BANCO);
const FORMATOS = [
  { id: "facebook", nombre: "Facebook Ad", size: "1200×628px", ratio: "horizontal" },
  { id: "instagram", nombre: "Instagram Ad", size: "1080×1080px", ratio: "cuadrado" },
  { id: "stories", nombre: "Stories / TikTok", size: "1080×1920px", ratio: "vertical" },
];

export default function Anuncios() {
  const [pantalla, setPantalla] = useState(1);
  const [headlines, setHeadlines] = useState<string[]>([]);
  const [productoData, setProductoData] = useState<any>(null);
  const [copySeleccionado, setCopySeleccionado] = useState("");
  const [imagenProducto, setImagenProducto] = useState<string | null>(null);
  const [categoriaActiva, setCategoriaActiva] = useState(CATEGORIAS[0]);
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState<any>(null);
  const [formatoSeleccionado, setFormatoSeleccionado] = useState(FORMATOS[0]);
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    const h = sessionStorage.getItem("anuncios_headlines");
    const p = sessionStorage.getItem("anuncios_producto");
    if (h) {
      const parsed = JSON.parse(h);
      setHeadlines(parsed);
      if (parsed.length > 0) setCopySeleccionado(parsed[0]);
    }
    if (p) setProductoData(JSON.parse(p));
  }, []);

  const handleImagen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImagenProducto(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-[#050505] pt-20 px-4 pb-12">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            {[1,2,3].map(n => (
              <div key={n} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black transition-all ${pantalla === n ? "bg-orange-500 text-white" : pantalla > n ? "bg-green-500 text-white" : "bg-[#111] border border-[#222] text-zinc-600"}`}>{pantalla > n ? "✓" : n}</div>
                {n < 3 && <div className={`w-8 h-px ${pantalla > n ? "bg-green-500" : "bg-[#222]"}`}></div>}
              </div>
            ))}
            <span className="text-zinc-600 text-xs ml-2">{pantalla === 1 ? "Tu producto" : pantalla === 2 ? "Elige la referencia" : "Tu anuncio listo"}</span>
          </div>
          <h1 className="text-2xl font-black text-white">Módulo <span className="text-orange-500">Anuncios</span></h1>
        </div>

        {/* PANTALLA 1 */}
        {pantalla === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-5 space-y-4">
                <p className="text-orange-500 text-[10px] font-bold tracking-widest uppercase">Foto del producto</p>
                {imagenProducto ? (
                  <div className="relative">
                    <img src={imagenProducto} alt="producto" className="w-full h-48 object-contain rounded-xl bg-[#111]" />
                    <button onClick={() => setImagenProducto(null)} className="absolute top-2 right-2 bg-black/70 text-white text-[10px] px-2 py-1 rounded-lg">✕ Cambiar</button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-[#222] rounded-xl cursor-pointer hover:border-orange-500/50 transition-colors">
                    <span className="text-3xl mb-2">📷</span>
                    <span className="text-zinc-500 text-xs">Sube la foto de tu producto</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImagen} />
                  </label>
                )}
              </div>

              <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-5 space-y-3">
                <p className="text-orange-500 text-[10px] font-bold tracking-widest uppercase">Datos del producto</p>
                <div>
                  <label className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Nombre</label>
                  <input defaultValue={productoData?.producto || ""} className="w-full mt-1 bg-[#f0ead6] text-black text-sm px-3 py-2 rounded-lg outline-none" placeholder="Nombre del producto" />
                </div>
                <div>
                  <label className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">País</label>
                  <select defaultValue={productoData?.pais || "Colombia"} className="w-full mt-1 bg-[#f0ead6] text-black text-sm px-3 py-2 rounded-lg outline-none">
                    <option>Colombia</option><option>México</option><option>Venezuela</option><option>Costa Rica</option><option>Ecuador</option><option>General</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-5 space-y-4">
              <p className="text-orange-500 text-[10px] font-bold tracking-widest uppercase">Copy del anuncio</p>
              {headlines.length > 0 && (
                <div className="space-y-2">
                  <p className="text-zinc-600 text-[10px]">Headlines desde Copy — elige uno:</p>
                  {headlines.map((h, i) => (
                    <div key={i} onClick={() => { setCopySeleccionado(h); setCharCount(h.length); }} className={`px-3 py-2 rounded-lg border cursor-pointer text-xs transition-all ${copySeleccionado === h ? "border-orange-500 bg-orange-500/10 text-[#f0ead6]" : "border-[#1e1e1e] text-zinc-500 hover:border-[#333]"}`}>{h}</div>
                  ))}
                </div>
              )}
              <div>
                <label className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">O escribe tu copy aquí</label>
                <textarea value={copySeleccionado} onChange={e => { setCopySeleccionado(e.target.value); setCharCount(e.target.value.length); }} rows={4} className="w-full mt-1 bg-[#f0ead6] text-black text-sm px-3 py-2 rounded-lg outline-none resize-none" placeholder="El texto que irá encima de la imagen..." />
                <div className={`text-[10px] mt-1 text-right ${charCount > 80 ? "text-red-400" : "text-zinc-600"}`}>{charCount} / 80 caracteres</div>
              </div>

              <div>
                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-2">Formato del anuncio</p>
                <div className="grid grid-cols-3 gap-2">
                  {FORMATOS.map(f => (
                    <div key={f.id} onClick={() => setFormatoSeleccionado(f)} className={`p-2 rounded-lg border cursor-pointer text-center transition-all ${formatoSeleccionado.id === f.id ? "border-orange-500 bg-orange-500/10" : "border-[#1e1e1e]"}`}>
                      <p className="text-[#f0ead6] text-[10px] font-bold">{f.nombre}</p>
                      <p className="text-zinc-600 text-[9px]">{f.size}</p>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={() => { if (copySeleccionado.trim()) setPantalla(2); }} disabled={!copySeleccionado.trim()} className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors text-sm">
                Siguiente — Elegir referencia visual →
              </button>
            </div>
          </div>
        )}

        {/* PANTALLA 2 */}
        {pantalla === 2 && (
          <div className="space-y-6">
            <div className="flex gap-3 overflow-x-auto pb-2">
              {CATEGORIAS.map(cat => (
                <button key={cat} onClick={() => setCategoriaActiva(cat)} className={`flex-shrink-0 px-4 py-2 rounded-full text-[11px] font-bold border transition-all ${categoriaActiva === cat ? "bg-orange-500 border-orange-500 text-white" : "border-[#1e1e1e] text-zinc-500 hover:border-[#333]"}`}>{cat}</button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {BANCO[categoriaActiva].map(plantilla => (
                <div key={plantilla.id} onClick={() => setPlantillaSeleccionada(plantilla)} className={`rounded-2xl border cursor-pointer overflow-hidden transition-all ${plantillaSeleccionada?.id === plantilla.id ? "border-orange-500 ring-1 ring-orange-500" : "border-[#1a1a1a] hover:border-[#333]"}`}>
                  <div className="h-40 flex flex-col items-center justify-center p-4 relative" style={{ backgroundColor: plantilla.colorFondo }}>
                    <div className={`absolute w-full px-4 ${plantilla.posTexto === "top" ? "top-3" : plantilla.posTexto === "bottom" ? "bottom-3" : "top-1/2 -translate-y-1/2"}`}>
                      <p className="text-center text-xs font-black leading-tight" style={{ color: plantilla.colorTexto }}>{copySeleccionado || "Tu copy aquí"}</p>
                    </div>
                    <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center text-2xl">📦</div>
                  </div>
                  <div className="bg-[#0a0a0a] p-3">
                    <p className="text-[#f0ead6] text-[11px] font-bold">{plantilla.nombre}</p>
                    <p className="text-zinc-600 text-[10px]">{plantilla.descripcion}</p>
                    <p className="text-zinc-700 text-[9px] mt-1">Máx. {plantilla.maxChars} caracteres</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setPantalla(1)} className="px-6 py-3 border border-[#1e1e1e] text-zinc-500 text-sm font-bold rounded-xl hover:border-[#333] transition-colors">← Volver</button>
              <button onClick={() => { if (plantillaSeleccionada) setPantalla(3); }} disabled={!plantillaSeleccionada} className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors text-sm">
                Generar mi anuncio →
              </button>
            </div>
          </div>
        )}

        {/* PANTALLA 3 — PLACEHOLDER */}
        {pantalla === 3 && (
          <div className="text-center space-y-6 py-12">
            <div className="w-20 h-20 bg-orange-500/10 border border-orange-500/30 rounded-full flex items-center justify-center text-4xl mx-auto">🎯</div>
            <div>
              <h2 className="text-2xl font-black text-white mb-2">¡Casi listo!</h2>
              <p className="text-zinc-500 text-sm">La generación de imagen con IA se activa en la próxima sesión.</p>
            </div>
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-5 text-left max-w-sm mx-auto space-y-2">
              <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">Resumen de tu anuncio</p>
              <p className="text-[#f0ead6] text-xs"><span className="text-zinc-500">Copy:</span> {copySeleccionado}</p>
              <p className="text-[#f0ead6] text-xs"><span className="text-zinc-500">Plantilla:</span> {plantillaSeleccionada?.nombre}</p>
              <p className="text-[#f0ead6] text-xs"><span className="text-zinc-500">Formato:</span> {formatoSeleccionado.nombre}</p>
            </div>
            <button onClick={() => setPantalla(1)} className="px-6 py-3 border border-[#1e1e1e] text-zinc-500 text-sm font-bold rounded-xl hover:border-[#333] transition-colors">← Empezar de nuevo</button>
          </div>
        )}

      </div>
    </div>
  );
}