"use client";
import { useEffect, useState } from "react";

const FORMATOS = [
  { id: "facebook", nombre: "Facebook Ad", size: "1200×628px" },
  { id: "instagram", nombre: "Instagram Ad", size: "1080×1080px" },
  { id: "stories", nombre: "Stories / TikTok", size: "1080×1920px" },
];

const TEMPERATURAS = [
  { id: "hot", icon: "🔥", nombre: "Hot Traffic", desc: "Urgencia, precio, escasez. Cierra la venta.", color: "#cc0000", bg: "#1a0000", border: "#cc0000" },
  { id: "warm", icon: "🌡️", nombre: "Warm Traffic", desc: "Beneficios, confianza, prueba social.", color: "#ff8800", bg: "#1a0e00", border: "#ff8800" },
  { id: "cold", icon: "❄️", nombre: "Cold Traffic", desc: "Presentación, curiosidad, enganche.", color: "#0088cc", bg: "#00101a", border: "#0088cc" },
];

const FRASES: Record<string, { texto: string; temp: "hot" | "warm" | "cold" }[]> = {
  hot: [
    { texto: "¡ÚLTIMAS UNIDADES!", temp: "hot" },
    { texto: "HOY SOLAMENTE", temp: "hot" },
    { texto: "STOCK LIMITADO", temp: "hot" },
    { texto: "OFERTA TERMINA HOY", temp: "hot" },
    { texto: "PRECIO ESPECIAL", temp: "hot" },
    { texto: "OFERTA FLASH", temp: "hot" },
    { texto: "¡NO TE QUEDES SIN EL TUYO!", temp: "hot" },
    { texto: "COMPRAR AHORA", temp: "hot" },
    { texto: "PEDIR AHORA", temp: "hot" },
    { texto: "QUIERO EL MÍO", temp: "hot" },
  ],
  warm: [
    { texto: "RESULTADOS REALES", temp: "warm" },
    { texto: "GARANTIZADO", temp: "warm" },
    { texto: "MILES LO USAN", temp: "warm" },
    { texto: "100% COMPROBADO", temp: "warm" },
    { texto: "ENVÍO GRATIS", temp: "warm" },
    { texto: "PAGO CONTRA ENTREGA", temp: "warm" },
    { texto: "100% NATURAL", temp: "warm" },
    { texto: "SIN EFECTOS SECUNDARIOS", temp: "warm" },
    { texto: "QUIERO SABER MÁS", temp: "warm" },
    { texto: "VER RESULTADOS", temp: "warm" },
  ],
  cold: [
    { texto: "¿SABÍAS QUE...?", temp: "cold" },
    { texto: "DESCUBRE CÓMO", temp: "cold" },
    { texto: "EL SECRETO QUE NADIE TE DIJO", temp: "cold" },
    { texto: "¿TE HA PASADO ESTO?", temp: "cold" },
    { texto: "CONOCE LA SOLUCIÓN", temp: "cold" },
    { texto: "APRENDE MÁS", temp: "cold" },
    { texto: "DESCUBRIR", temp: "cold" },
    { texto: "LA VERDAD SOBRE...", temp: "cold" },
    { texto: "LO QUE NO TE CUENTAN", temp: "cold" },
  ],
};

const COLORES_TEMP = { hot: "#cc0000", warm: "#ff8800", cold: "#0088cc" };

const SS_KEY = "anuncios_estado";

export default function Anuncios() {
  const [pantalla, setPantalla] = useState(1);
  const [productoData, setProductoData] = useState<any>(null);
  const [headlines, setHeadlines] = useState<string[]>([]);
  const [imagenProducto, setImagenProducto] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precioOferta, setPrecioOferta] = useState("");
  const [precioAnterior, setPrecioAnterior] = useState("");
  const [headline, setHeadline] = useState("");
  const [temperatura, setTemperatura] = useState<"hot" | "warm" | "cold">("hot");
  const [frasesSeleccionadas, setFrasesSeleccionadas] = useState<string[]>([]);
  const [dolorChips, setDolorChips] = useState<string[]>([]);
  const [dolorSel, setDolorSel] = useState<string[]>([]);
  const [generandoDolor, setGenerandoDolor] = useState(false);
  const [promptPropio, setPromptPropio] = useState("");
  const [formatoSeleccionado, setFormatoSeleccionado] = useState(FORMATOS[0]);
  const [generando, setGenerando] = useState(false);
  const [imagenGenerada, setImagenGenerada] = useState<string | null>(null);
  const [errorGeneracion, setErrorGeneracion] = useState<string | null>(null);
  const [editando, setEditando] = useState(false);
  const [instruccionEdicion, setInstruccionEdicion] = useState("");
  const [imagenOriginal, setImagenOriginal] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Campaña activa tiene prioridad sobre todo
    const campaign = sessionStorage.getItem("campaign_activa");
    if (campaign) {
      const c = JSON.parse(campaign);
      setNombre(c.producto || "");
      setPrecioOferta(c.precio_oferta || "");
      setPrecioAnterior(c.precio_anterior || "");
      if (c.imagen_url) setImagenProducto(c.imagen_url);
      setDescripcion(c.problema || c.beneficio || "");
      setHydrated(true);
      return;
    }

    const h = sessionStorage.getItem("anuncios_headlines");
    const p = sessionStorage.getItem("anuncios_producto");
    const fromCopy = sessionStorage.getItem("anuncios_producto");
    if (fromCopy) sessionStorage.removeItem(SS_KEY);
    const saved = fromCopy ? null : sessionStorage.getItem(SS_KEY);

    if (saved) {
      try {
        const s = JSON.parse(saved);
        setPantalla(s.pantalla || 1);
        setNombre(s.nombre || "");
        setDescripcion(s.descripcion || "");
        setPrecioOferta(s.precioOferta || "");
        setPrecioAnterior(s.precioAnterior || "");
        setHeadline(s.headline || "");
        setTemperatura(s.temperatura || "hot");
        setFrasesSeleccionadas(s.frasesSeleccionadas || []);
        setDolorChips(s.dolorChips || []);
        setDolorSel(s.dolorSel || []);
        setPromptPropio(s.promptPropio || "");
        setFormatoSeleccionado(FORMATOS.find(f => f.id === s.formatoId) || FORMATOS[0]);
        setImagenProducto(sessionStorage.getItem("anuncios_img_producto") || null);
        setImagenGenerada(sessionStorage.getItem("anuncios_img_generada") || null);
        setHeadlines(s.headlines || []);
      } catch {}
    } else {
      if (h) {
        const parsed = JSON.parse(h);
        setHeadlines(parsed);
        if (parsed.length > 0) setHeadline(parsed[0]);
      }
      if (p) {
        const data = JSON.parse(p);
        setProductoData(data);
        setNombre(data.producto || "");
        setImagenProducto(data.imagen || null);
        setPrecioOferta(data.precioOferta || "");
        setPrecioAnterior(data.precioAnterior || "");
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const estado = {
      pantalla, nombre, descripcion, precioOferta, precioAnterior,
      headline, temperatura, frasesSeleccionadas, dolorChips, dolorSel,
      promptPropio, formatoId: formatoSeleccionado.id, headlines,
    };
    try { sessionStorage.setItem(SS_KEY, JSON.stringify(estado)); } catch {}
    try { if (imagenProducto) sessionStorage.setItem("anuncios_img_producto", imagenProducto); } catch {}
    try { if (imagenGenerada) sessionStorage.setItem("anuncios_img_generada", imagenGenerada); } catch {}
  }, [hydrated, pantalla, nombre, descripcion, precioOferta, precioAnterior,
    headline, temperatura, frasesSeleccionadas, dolorChips, dolorSel,
    promptPropio, formatoSeleccionado, imagenProducto, imagenGenerada, headlines]);

  const generarDolor = async () => {
    if (!nombre) return;
    setGenerandoDolor(true);
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 300,
          messages: [{ role: "user", content: `Eres un experto en copywriting de ventas latinoamericano. Genera 8 puntos de dolor y deseo para el producto: "${nombre}". Descripción: "${descripcion}". Incluye: dolores físicos o prácticos, dolor emocional, cansancio de buscar soluciones, ilusión y deseo aspiracional ("siempre lo quisiste", "al fin llegó"), comparativa ("sin X sin Y"), y 1 frase antes/después. Máximo 7 palabras cada punto. Responde SOLO con JSON: {"dolores": ["...", "...", "...", "...", "...", "...", "...", "..."], "antesdespues": "Antes: sufriendo el problema → Después: viviendo la solución"}` }]
        })
      });
      const data = await resp.json();
      const content = data.content?.[0]?.text || "{}";
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const json = JSON.parse(cleaned);
      const chips = [...(json.dolores || []), json.antesdespues || ""].filter(Boolean);
      setDolorChips(chips);
      setDolorSel(chips.slice(0, 3));
    } catch (err) {
      setDolorChips(["Dolor constante", "Sin solución efectiva", "Cansado de sufrir", "Calidad de vida afectada", "Antes: sufriendo el problema → Después: viviendo la solución"]);
      setDolorSel(["Dolor constante", "Sin solución efectiva"]);
    } finally {
      setGenerandoDolor(false);
    }
  };

  const toggleFrase = (texto: string) => {
    setFrasesSeleccionadas(prev => {
      if (prev.includes(texto)) return prev.filter(f => f !== texto);
      if (prev.length >= 7) return prev;
      return [...prev, texto];
    });
  };

  const toggleDolor = (texto: string) => {
    setDolorSel(prev => prev.includes(texto) ? prev.filter(d => d !== texto) : [...prev, texto]);
  };

  const generarAnuncio = async () => {
    setGenerando(true);
    setImagenGenerada(null);
    setErrorGeneracion(null);
    try {
      const resp = await fetch("/api/anuncios/generar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          producto: nombre, headline, temperatura, frasesSeleccionadas,
          dolorSel, precioOferta, precioAnterior,
          formato: formatoSeleccionado.id,
          imagen: imagenProducto, promptPropio,
        }),
      });
      const data = await resp.json();
      if (data.imageUrl) { setImagenGenerada(data.imageUrl); }
      else setErrorGeneracion(data.error || "Error desconocido");
    } catch (err: any) {
      setErrorGeneracion(err.message);
    } finally {
      setGenerando(false);
    }
  };

  const editarAnuncio = async () => {
    if (!imagenGenerada || !instruccionEdicion.trim()) return;
    setEditando(true);
    setErrorGeneracion(null);
    try {
      const resp = await fetch("/api/anuncios/generar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          producto: nombre, headline, temperatura, frasesSeleccionadas,
          dolorSel, precioOferta, precioAnterior,
          formato: formatoSeleccionado.id,
          imagen: imagenGenerada,
          promptPropio: instruccionEdicion,
        }),
      });
      const data = await resp.json();
      if (data.imageUrl) {
        setImagenOriginal(imagenGenerada);
        setImagenGenerada(data.imageUrl);
        setInstruccionEdicion("");
      } else setErrorGeneracion(data.error || "Error al editar");
    } catch (err: any) {
      setErrorGeneracion(err.message);
    } finally {
      setEditando(false);
    }
  };

  const handleImagen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImagenProducto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const tempActual = TEMPERATURAS.find(t => t.id === temperatura)!;

  return (
    <div className="min-h-screen bg-[#050505] text-white">

      {/* Header */}
      <div className="max-w-[1400px] mx-auto px-4 pt-6 pb-0">
        <div className="flex items-center mb-0">
          <div className="flex items-center gap-2 flex-shrink-0" style={{width:"160px"}}>
            <div className="w-[72px] h-[72px] rounded-full bg-[#1a0000] border border-[#2a2a2a] flex items-center justify-center flex-shrink-0">
              <svg width="42" height="42" viewBox="0 0 32 32" fill="none">
                <path d="M6 14 L20 8 L20 24 L6 18 Z" fill="white" fillOpacity="0.4" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                <rect x="6" y="14" width="4" height="4" fill="white" fillOpacity="0.6"/>
                <circle cx="24" cy="12" r="2" fill="white"/>
                <circle cx="24" cy="20" r="2" fill="white"/>
                <line x1="22" y1="16" x2="26" y2="16" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="text-white text-[14px] font-bold tracking-[0.12em] uppercase">Anuncios</p>
          </div>
          <div className="flex-1 text-center px-5">
            <div className="inline-flex items-center gap-2 bg-orange-500 text-white text-[9px] font-bold px-3 py-1 rounded-full mb-2 tracking-widest">
              IA GENERATIVA · META ADS PROFESIONAL
            </div>
            <h1 className="text-xl font-black text-white mb-1">
              Crea anuncios que <span style={{color:"#cc0000"}}>venden</span> y <span className="text-orange-500">convierten</span>
            </h1>
            <p className="text-yellow-400 text-[11px]">Producto · temperatura · frases · la IA genera el anuncio listo para Meta Ads</p>
          </div>
          <div className="flex-shrink-0" style={{width:"160px"}}></div>
        </div>
      </div>

      {/* Steps bar full width */}
      <div className="flex bg-[#1a1a1a] border-t border-b border-[#2a2a2a] mt-4">
        {[
          { n: 1, label: "Paso 1 — Producto", sub: "Tu producto" },
          { n: 2, label: "Paso 2 — Temperatura", sub: "Hot / Warm / Cold" },
          { n: 3, label: "Paso 3 — Tu anuncio", sub: "Genera y descarga" },
        ].map((s) => (
          <div key={s.n} onClick={() => setPantalla(s.n)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-r border-[#2a2a2a] last:border-r-0 cursor-pointer relative">
            <div className={`w-[22px] h-[22px] rounded flex items-center justify-center text-[11px] font-black flex-shrink-0 ${pantalla === s.n ? "bg-orange-500 text-white" : pantalla > s.n ? "bg-green-500 text-white" : "bg-[#2a2a2a] text-[#555]"}`}>
              {pantalla > s.n ? "✓" : s.n}
            </div>
            <div>
              <div className={`text-[10px] font-bold tracking-widest uppercase ${pantalla === s.n ? "text-orange-500" : pantalla > s.n ? "text-green-400" : "text-yellow-400"}`}>{s.label}</div>
              <div className="text-[9px] text-yellow-400 mt-0.5">{s.sub}</div>
            </div>
            {pantalla === s.n && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-orange-500" />}
          </div>
        ))}
      </div>

      <div className="max-w-[1400px] mx-auto px-4 pb-12 mt-6">

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
                    <span className="text-yellow-400 text-xs">Sube la foto de tu producto</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImagen} />
                  </label>
                )}
              </div>
              <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-5 space-y-3">
                <p className="text-orange-500 text-[10px] font-bold tracking-widest uppercase">Formato</p>
                <div className="grid grid-cols-3 gap-2">
                  {FORMATOS.map(f => (
                    <div key={f.id} onClick={() => setFormatoSeleccionado(f)} className={`p-2 rounded-lg border cursor-pointer text-center transition-all ${formatoSeleccionado.id === f.id ? "border-orange-500 bg-orange-500/10" : "border-[#1e1e1e]"}`}>
                      <p className="text-[#f0ead6] text-[10px] font-bold">{f.nombre}</p>
                      <p className="text-yellow-400 text-[9px]">{f.size}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-5 space-y-3">
                <p className="text-orange-500 text-[10px] font-bold tracking-widest uppercase">Producto</p>
                <div>
                  <label className="text-yellow-400 text-[10px] font-bold uppercase tracking-wider">Nombre *</label>
                  <input value={nombre} onChange={e => setNombre(e.target.value)} className="w-full mt-1 bg-[#f0ead6] text-black text-sm px-3 py-2 rounded-lg outline-none" placeholder="Ej: Rodillax" />
                </div>
                <div>
                  <label className="text-yellow-400 text-[10px] font-bold uppercase tracking-wider">Descripción breve</label>
                  <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={2} className="w-full mt-1 bg-[#f0ead6] text-black text-sm px-3 py-2 rounded-lg outline-none resize-none" placeholder="¿Qué hace tu producto? 1-2 líneas" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-yellow-400 text-[10px] font-bold uppercase tracking-wider">Precio oferta</label>
                    <input value={precioOferta} onChange={e => setPrecioOferta(e.target.value)} className="w-full mt-1 bg-[#f0ead6] text-black text-sm px-3 py-2 rounded-lg outline-none" placeholder="49.000" />
                  </div>
                  <div>
                    <label className="text-yellow-400 text-[10px] font-bold uppercase tracking-wider">Precio anterior</label>
                    <input value={precioAnterior} onChange={e => setPrecioAnterior(e.target.value)} className="w-full mt-1 bg-[#f0ead6] text-black text-sm px-3 py-2 rounded-lg outline-none" placeholder="69.000" />
                  </div>
                </div>
                <div>
                  <label className="text-yellow-400 text-[10px] font-bold uppercase tracking-wider">Headline principal *</label>
                  {headlines.length > 0 && (
                    <div className="flex gap-1 flex-wrap mt-1 mb-2">
                      {headlines.map((h, i) => (
                        <button key={i} onClick={() => setHeadline(h)} className={`text-[9px] px-2 py-1 rounded-md border transition-all ${headline === h ? "border-orange-500 bg-orange-500/10 text-orange-400" : "border-[#1e1e1e] text-yellow-400"}`}>{h.slice(0, 25)}...</button>
                      ))}
                    </div>
                  )}
                  <input value={headline} onChange={e => setHeadline(e.target.value)} className="w-full bg-[#f0ead6] text-black text-sm px-3 py-2 rounded-lg outline-none" placeholder="Ej: ¿Tus rodillas ya no aguantan más?" />
                </div>
              </div>

              <button onClick={() => { if (nombre.trim() && headline.trim()) { setPantalla(2); if (nombre && !dolorChips.length) generarDolor(); } }} disabled={!nombre.trim() || !headline.trim()} className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors text-sm">
                Siguiente — Temperatura y frases →
              </button>
            </div>
          </div>
        )}

        {/* PANTALLA 2 */}
        {pantalla === 2 && (
          <div className="space-y-6">
            {(dolorChips.length > 0 || generandoDolor) && (
              <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-orange-500 text-[10px] font-bold tracking-widest uppercase">Puntos de dolor — generados por IA</p>
                  <button onClick={generarDolor} disabled={generandoDolor} className="text-yellow-400 text-[9px] font-bold border border-[#1e1e1e] px-2 py-1 rounded-lg">{generandoDolor ? "⏳ Generando..." : "↻ Regenerar"}</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {dolorChips.map((d, i) => (
                    <button key={i} onClick={() => toggleDolor(d)} className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all ${dolorSel.includes(d) ? "border-red-500 bg-red-500/20 text-red-400" : "border-[#1e1e1e] text-yellow-400"}`}>{d}</button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-orange-500 text-[10px] font-bold tracking-widest uppercase mb-4">Temperatura y frases — máximo 7 frases</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {TEMPERATURAS.map(temp => (
                  <div key={temp.id} className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${temperatura === temp.id ? temp.border : "#1a1a1a"}` }}>
                    <div onClick={() => setTemperatura(temp.id as any)} className="p-4 cursor-pointer" style={{ background: temp.bg }}>
                      <div className="text-2xl mb-2">{temp.icon}</div>
                      <p className="font-black text-sm mb-1" style={{ color: temp.color }}>{temp.nombre}</p>
                      <p className="text-yellow-400 text-[10px]">{temp.desc}</p>
                      {temperatura === temp.id && <span className="inline-block mt-2 text-[8px] font-black px-2 py-0.5 rounded text-white" style={{ background: temp.color }}>ELEGIDO</span>}
                    </div>
                    <div className="p-3 space-y-1.5 bg-[#0a0a0a]">
                      {FRASES[temp.id].map((f, i) => {
                        const sel = frasesSeleccionadas.includes(f.texto);
                        return (
                          <button key={i} onClick={() => toggleFrase(f.texto)} className="w-full text-left text-[10px] font-bold px-3 py-2 rounded-lg border transition-all" style={{
                            borderColor: sel ? temp.color : "#1e1e1e",
                            background: sel ? temp.color : "transparent",
                            color: sel ? "#fff" : temp.color,
                          }}>
                            {f.texto}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#111] border border-[#1a1a1a] rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-yellow-400 text-xs">Frases seleccionadas</span>
              <span className={`text-sm font-black ${frasesSeleccionadas.length >= 7 ? "text-red-400" : "text-orange-500"}`}>{frasesSeleccionadas.length} / 7</span>
            </div>

            {frasesSeleccionadas.length > 0 && (
              <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl px-4 py-3">
                <p className="text-yellow-400 text-[9px] font-bold uppercase tracking-widest mb-2">Seleccionadas</p>
                <div className="flex flex-wrap gap-2">
                  {frasesSeleccionadas.map((f, i) => {
                    const tempId = Object.keys(FRASES).find(k => FRASES[k as keyof typeof FRASES].some(fr => fr.texto === f)) as keyof typeof COLORES_TEMP;
                    return <span key={i} className="text-[9px] font-black px-2 py-1 rounded text-white" style={{ background: COLORES_TEMP[tempId] || "#ff5000" }}>{f}</span>;
                  })}
                </div>
              </div>
            )}

            <div className="bg-[#0a0a0a] border border-dashed border-[#333] rounded-xl p-4">
              <p className="text-yellow-400 text-[9px] font-bold uppercase tracking-widest mb-2">✏️ Prompt propio — opcional, para usuarios avanzados</p>
              <textarea value={promptPropio} onChange={e => setPromptPropio(e.target.value)} rows={2} className="w-full bg-[#111] border border-[#1a1a1a] text-yellow-400 text-xs px-3 py-2 rounded-lg outline-none resize-none" placeholder="Escribe tu instrucción directa aquí..." />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setPantalla(1)} className="px-6 py-3 border border-[#1e1e1e] text-yellow-400 text-sm font-bold rounded-xl hover:border-[#333] transition-colors">← Volver</button>
              <button onClick={() => setPantalla(3)} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors text-sm">
                Generar anuncio {tempActual.icon} {tempActual.nombre} →
              </button>
            </div>
          </div>
        )}

        {/* PANTALLA 3 */}
        {pantalla === 3 && (
          <div className="space-y-6">
            {!imagenGenerada && !generando && (
              <div className="text-center py-12 space-y-4">
                <div className="text-6xl">{tempActual.icon}</div>
                <h2 className="text-2xl font-black text-white">Todo listo — {tempActual.nombre}</h2>
                <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-5 text-left max-w-md mx-auto space-y-2">
                  <p className="text-[#f0ead6] text-xs"><span className="text-yellow-400">Producto:</span> {nombre}</p>
                  <p className="text-[#f0ead6] text-xs"><span className="text-yellow-400">Headline:</span> {headline}</p>
                  {precioOferta && <p className="text-[#f0ead6] text-xs"><span className="text-yellow-400">Precio:</span> {precioAnterior && <s className="text-yellow-400/50">{precioAnterior}</s>} → {precioOferta}</p>}
                  {frasesSeleccionadas.length > 0 && (
                    <div>
                      <p className="text-yellow-400 text-[10px] mb-1">Frases:</p>
                      <div className="flex flex-wrap gap-1">
                        {frasesSeleccionadas.map((f, i) => <span key={i} className="text-[8px] font-bold px-2 py-0.5 rounded text-white bg-orange-500">{f}</span>)}
                      </div>
                    </div>
                  )}
                  <p className="text-[#f0ead6] text-xs"><span className="text-yellow-400">Formato:</span> {formatoSeleccionado.nombre}</p>
                </div>
                <button onClick={generarAnuncio} className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-3 rounded-xl text-sm transition-colors">
                  ⚡ Generar imagen ahora
                </button>
                <div><button onClick={() => setPantalla(2)} className="text-yellow-400 text-xs border border-[#1e1e1e] px-4 py-2 rounded-lg">← Editar frases</button></div>
              </div>
            )}

            {generando && (
              <div className="text-center py-20 space-y-4">
                <div className="w-16 h-16 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto"></div>
                <p className="text-white font-bold">Generando tu anuncio {tempActual.icon}...</p>
                <p className="text-yellow-400 text-sm">Esto toma entre 15 y 30 segundos</p>
                <p className="text-xs font-bold" style={{color:"#00ff88"}}>⚠️ No salgas de esta pantalla hasta que se genere tu imagen</p>
              </div>
            )}

            {imagenGenerada && (
              <div className="space-y-4">
                <div className="bg-[#0a0a0a] border border-green-500/30 rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a]">
                    <span className="text-green-400 text-[10px] font-bold tracking-widest uppercase">✓ Anuncio generado — {tempActual.nombre}</span>
                    <span className="text-yellow-400 text-[10px]">{formatoSeleccionado.nombre} · {formatoSeleccionado.size}</span>
                  </div>
                  <div className="p-4 flex justify-center">
                    <img src={imagenGenerada} alt="anuncio generado" className="max-w-full max-h-[500px] object-contain rounded-xl" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <button onClick={generarAnuncio} className="bg-[#0a0a0a] border border-[#1a1a1a] hover:border-[#333] text-yellow-400 text-xs font-bold py-3 rounded-xl transition-colors">↻ Regenerar</button>
                  <button onClick={() => setPantalla(2)} className="bg-[#0a0a0a] border border-[#1a1a1a] hover:border-[#333] text-yellow-400 text-xs font-bold py-3 rounded-xl transition-colors">← Editar frases</button>
                  <a href={imagenGenerada} download={`anuncio-${formatoSeleccionado.id}.png`} className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold py-3 rounded-xl transition-colors flex items-center justify-center">⬇ Descargar</a>
                </div>
                <button onClick={() => { setPantalla(1); setImagenGenerada(null); setFrasesSeleccionadas([]); sessionStorage.removeItem(SS_KEY); }} className="w-full border border-[#1a1a1a] text-yellow-400 text-xs font-bold py-2 rounded-xl hover:border-[#333] transition-colors">← Empezar de nuevo</button>
                <div className="bg-[#0a0a0a] border border-[#1e1e1e] rounded-xl p-4 space-y-3">
                  <p className="text-yellow-400 text-[10px] font-bold uppercase tracking-widest">✏️ Editar imagen</p>
                  <textarea value={instruccionEdicion} onChange={e => setInstruccionEdicion(e.target.value)} rows={2} className="w-full bg-[#111] border border-[#1a1a1a] text-yellow-400 text-xs px-3 py-2 rounded-lg outline-none resize-none" placeholder="Ej: Pon el precio más grande · Cambia el badge a verde · Más luz al producto..." />
                  <button onClick={editarAnuncio} disabled={editando || !instruccionEdicion.trim()} className="w-full bg-[#111] border border-yellow-400/30 hover:border-yellow-400 text-yellow-400 text-xs font-bold py-2.5 rounded-xl transition-colors disabled:opacity-40">
                    {editando ? "⏳ Aplicando cambios..." : "✏️ Aplicar cambios"}
                  </button>
                  {imagenOriginal && <button onClick={() => { setImagenGenerada(imagenOriginal); setImagenOriginal(null); }} className="w-full text-yellow-400/50 text-[10px] font-bold py-1">↩ Deshacer último cambio</button>}
                </div>
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