"use client";
import { useEffect, useState } from "react";
import BANCO from "./referencias.json";

const CATEGORIAS = Object.keys(BANCO);
const FORMATOS = [
  { id: "facebook", nombre: "Facebook Ad", size: "1200×628px" },
  { id: "instagram", nombre: "Instagram Ad", size: "1080×1080px" },
  { id: "stories", nombre: "Stories / TikTok", size: "1080×1920px" },
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
  const [generando, setGenerando] = useState(false);
  const [imagenGenerada, setImagenGenerada] = useState<string | null>(null);
  const [errorGeneracion, setErrorGeneracion] = useState<string | null>(null);

  useEffect(() => {
    const h = sessionStorage.getItem("anuncios_headlines");
    const p = sessionStorage.getItem("anuncios_producto");
    if (h) {
      const parsed = JSON.parse(h);
      setHeadlines(parsed);
      if (parsed.length > 0) { setCopySeleccionado(parsed[0]); setCharCount(parsed[0].length); }
    }
    if (p) setProductoData(JSON.parse(p));
  }, []);

  const generarAnuncio = async () => {
    setGenerando(true);
    setImagenGenerada(null);
    setErrorGeneracion(null);
    try {
      const resp = await fetch("/api/anuncios/generar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          producto: productoData?.producto || "producto",
          copy: copySeleccionado,
          colorFondo: plantillaSeleccionada?.colorFondo || "#ffffff",
          colorTexto: plantillaSeleccionada?.colorTexto || "#000000",
          posTexto: plantillaSeleccionada?.posTexto || "top",
          formato: formatoSeleccionado.id,
          imagen: imagenProducto,
          referenciaUrl: plantillaSeleccionada?.referenciaUrl || "",
        }),
      });
      const data = await resp.json();
      if (data.imageUrl) setImagenGenerada(data.imageUrl);
      else setErrorGeneracion(data.error || "Error desconocido");
    } catch (err: any) {
      setErrorGeneracion(err.message);
    } finally {
      setGenerando(false);
    }
  };

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

        {pantalla === 2 && (
          <div className="space-y-6">
            <div className="flex gap-3 overflow-x-auto pb-2">
              {CATEGORIAS.map(cat => (
                <button key={cat} onClick={() => setCategoriaActiva(cat)} className={`flex-shrink-0 px-4 py-2 rounded-full text-[11px] font-bold border transition-all ${categoriaActiva === cat ? "bg-orange-500 border-orange-500 text-white" : "border-[#1e1e1e] text-zinc-500 hover:border-[#333]"}`}>{cat}</button>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(BANCO as any)[categoriaActiva].map((plantilla: any) => (
                <div key={plantilla.id} onClick={() => setPlantillaSeleccionada(plantilla)} className={`rounded-2xl border cursor-pointer overflow-hidden transition-all ${plantillaSeleccionada?.id === plantilla.id ? "border-orange-500 ring-1 ring-orange-500" : "border-[#1a1a1a] hover:border-[#333]"}`}>
                  <div className="h-40 flex flex-col items-center justify-center p-4 relative overflow-hidden" style={{ backgroundColor: plantilla.colorFondo }}>
                    {plantilla.referenciaUrl ? (
                      <img src={plantilla.referenciaUrl} alt={plantilla.nombre} className="absolute inset-0 w-full h-full object-cover opacity-80" />
                    ) : null}
                    <div className={`absolute w-full px-4 z-10 ${plantilla.posTexto === "top" ? "top-3" : plantilla.posTexto === "bottom" ? "bottom-3" : "top-1/2 -translate-y-1/2"}`}>
                      <p className="text-center text-xs font-black leading-tight drop-shadow-lg" style={{ color: plantilla.colorTexto }}>{copySeleccionado || "Tu copy aquí"}</p>
                    </div>
                    {!plantilla.referenciaUrl && <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center text-2xl">📦</div>}
                  </div>
                  <div className="bg-[#0a0a0a] p-3">
                    <p className="text-[#f0ead6] text-[11px] font-bold">{plantilla.nombre}</p>
                    <p className="text-zinc-600 text-[10px]">{plantilla.descripcion}</p>
                    <p className="text-zinc-700 text-[9px] mt-1">Máx. {plantilla.maxChars} caracteres</p>
                    {plantilla.referenciaUrl && <span className="text-orange-500 text-[9px] font-bold">✓ Con imagen de referencia</span>}
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

        {pantalla === 3 && (
          <div className="space-y-6">
            {!imagenGenerada && !generando && (
              <div className="text-center py-12 space-y-4">
                <div className="w-20 h-20 bg-orange-500/10 border border-orange-500/30 rounded-full flex items-center justify-center text-4xl mx-auto">🎯</div>
                <h2 className="text-2xl font-black text-white">Todo listo para generar</h2>
                <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-5 text-left max-w-sm mx-auto space-y-2">
                  <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">Tu anuncio</p>
                  <p className="text-[#f0ead6] text-xs"><span className="text-zinc-500">Copy:</span> {copySeleccionado}</p>
                  <p className="text-[#f0ead6] text-xs"><span className="text-zinc-500">Plantilla:</span> {plantillaSeleccionada?.nombre}</p>
                  <p className="text-[#f0ead6] text-xs"><span className="text-zinc-500">Formato:</span> {formatoSeleccionado.nombre}</p>
                  {plantillaSeleccionada?.referenciaUrl && <p className="text-orange-500 text-[10px]">✓ Usando imagen de referencia</p>}
                </div>
                <button onClick={generarAnuncio} className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-3 rounded-xl text-sm transition-colors">
                  ⚡ Generar imagen ahora
                </button>
              </div>
            )}
            {generando && (
              <div className="text-center py-20 space-y-4">
                <div className="w-16 h-16 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto"></div>
                <p className="text-white font-bold">Generando tu anuncio...</p>
                <p className="text-zinc-500 text-sm">Esto toma entre 15 y 30 segundos</p>
              </div>
            )}
            {imagenGenerada && (
              <div className="space-y-4">
                <div className="bg-[#0a0a0a] border border-green-500/30 rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a]">
                    <span className="text-green-400 text-[10px] font-bold tracking-widest uppercase">✓ Anuncio generado</span>
                    <span className="text-zinc-600 text-[10px]">{formatoSeleccionado.nombre} · {formatoSeleccionado.size}</span>
                  </div>
                  <div className="p-4 flex justify-center">
                    <img src={imagenGenerada} alt="anuncio generado" className="max-w-full max-h-[500px] object-contain rounded-xl" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <button onClick={generarAnuncio} className="bg-[#0a0a0a] border border-[#1a1a1a] hover:border-[#333] text-zinc-400 text-xs font-bold py-3 rounded-xl transition-colors">↻ Regenerar</button>
                  <button onClick={() => setPantalla(2)} className="bg-[#0a0a0a] border border-[#1a1a1a] hover:border-[#333] text-zinc-400 text-xs font-bold py-3 rounded-xl transition-colors">← Cambiar plantilla</button>
                  <a href={imagenGenerada} download={`anuncio-${formatoSeleccionado.id}.png`} className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold py-3 rounded-xl transition-colors flex items-center justify-center">⬇ Descargar</a>
                </div>
                <button onClick={() => { setPantalla(1); setImagenGenerada(null); }} className="w-full border border-[#1a1a1a] text-zinc-600 text-xs font-bold py-2 rounded-xl hover:border-[#333] transition-colors">← Empezar de nuevo</button>
              </div>
            )}
            {errorGeneracion && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
                <p className="text-red-400 text-sm font-bold">Error al generar</p>
                <p className="text-red-400/70 text-xs mt-1">{errorGeneracion}</p>
                <button onClick={generarAnuncio} className="mt-3 bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold px-4 py-2 rounded-lg">Intentar de nuevo</button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}