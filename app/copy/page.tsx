"use client";
import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
 
export default function Copy() {
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) window.location.href = "/login";
    });
  }, []);
 
  const ss = typeof window !== "undefined" ? sessionStorage : null;
  const [producto, setProducto] = useState(() => ss?.getItem("lc_producto") || "");
  const [caracteristicas, setCaracteristicas] = useState(() => ss?.getItem("lc_caracteristicas") || "");
  const [problema, setProblema] = useState(() => ss?.getItem("lc_problema") || "");
  const [beneficio, setBeneficio] = useState(() => ss?.getItem("lc_beneficio") || "");
  const [precioOferta, setPrecioOferta] = useState(() => ss?.getItem("lc_precioOferta") || "");
  const [precioAnterior, setPrecioAnterior] = useState(() => ss?.getItem("lc_precioAnterior") || "");
  const [clientes, setClientes] = useState(() => ss?.getItem("lc_clientes") || "");
  const [competidor, setCompetidor] = useState(() => ss?.getItem("lc_competidor") || "");
  const [pais, setPais] = useState(() => ss?.getItem("lc_pais") || "Colombia");
  const [tono, setTono] = useState(() => ss?.getItem("lc_tono") || "Urgente");
  const [categoria, setCategoria] = useState(() => ss?.getItem("lc_categoria") || "Salud y bienestar");
  const [imagen, setImagen] = useState<string | null>(() => ss?.getItem("lc_imagen") || null);
  const [loading, setLoading] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [tiempoInicio, setTiempoInicio] = useState(0);
  const tiempoInicioRef = useRef(0);
  const [tiempoReal, setTiempoReal] = useState(0);
  const [resultado, setResultado] = useState<any>(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("landcopy_resultado");
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });
  const [tabActivo, setTabActivo] = useState("landing");
  const [guardados, setGuardados] = useState<any[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("landcopy_guardados");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [queGenerar, setQueGenerar] = useState<string[]>([]);
  const [seccionCargando, setSeccionCargando] = useState<string | null>(null);
  const [copiado, setCopiado] = useState<string | null>(null);
  const [toastGuardado, setToastGuardado] = useState(false);
  const [expandido, setExpandido] = useState<number | null>(null);
  const [analisisCompetidor, setAnalisisCompetidor] = useState<any>(null);
  const [analisisActivo, setAnalisisActivo] = useState(false);
  const [analizando, setAnalizando] = useState(false);
  const [errorAnalisis, setErrorAnalisis] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
 useEffect(() => {
    useEffect(() => {
    localStorage.setItem("landcopy_guardados", JSON.stringify(guardados));
  }, [guardados]);
    sessionStorage.setItem("lc_producto", producto);
    sessionStorage.setItem("lc_caracteristicas", caracteristicas);
    sessionStorage.setItem("lc_problema", problema);
    sessionStorage.setItem("lc_beneficio", beneficio);
    sessionStorage.setItem("lc_precioOferta", precioOferta);
    sessionStorage.setItem("lc_precioAnterior", precioAnterior);
    sessionStorage.setItem("lc_clientes", clientes);
    sessionStorage.setItem("lc_competidor", competidor);
    sessionStorage.setItem("lc_pais", pais);
    sessionStorage.setItem("lc_tono", tono);
    sessionStorage.setItem("lc_categoria", categoria);
    if (imagen) sessionStorage.setItem("lc_imagen", imagen);
    else sessionStorage.removeItem("lc_imagen");
  }, [producto, caracteristicas, problema, beneficio, precioOferta, precioAnterior, clientes, competidor, pais, tono, categoria, imagen]);
  const paises = [
    { nombre: "Colombia", flag: "🇨🇴" },
    { nombre: "México", flag: "🇲🇽" },
    { nombre: "Venezuela", flag: "🇻🇪" },
    { nombre: "Costa Rica", flag: "🇨🇷" },
    { nombre: "Ecuador", flag: "🇪🇨" },
    { nombre: "General", flag: "🌎" },
  ];
 
  const tonos = [
    { nombre: "Urgente", color: "orange" },
    { nombre: "Emocional", color: "pink" },
    { nombre: "Racional", color: "cyan" },
    { nombre: "Casual", color: "white" },
    { nombre: "Confianza", color: "green" },
    { nombre: "Premium", color: "purple" },
  ];
 
  const tonoColor: any = {
    orange: "border-orange-500 bg-orange-500/10 text-orange-500",
    pink: "border-pink-500 bg-pink-500/10 text-pink-500",
    cyan: "border-cyan-400 bg-cyan-400/10 text-cyan-400",
    white: "border-zinc-600 bg-zinc-800 text-zinc-300",
    green: "border-green-400 bg-green-400/10 text-green-400",
    purple: "border-purple-500 bg-purple-500/10 text-purple-500",
  };
 
  const productosLluvia = ["📦","🛍️","💊","💻","🏋️","🍳","💄","⚡","🧴","🎮","🌿","🔋","🥘","💅","🪴","🩺","📱","🧬","🏅","🧘"];
 
  const frasesGenerando = [
    "Tu competencia no está haciendo esto ahora mismo...",
    "Construyendo copy que vende mientras esperas...",
    "La IA está analizando tu mercado objetivo...",
    "Generando 7 días de campaña completa...",
    "Cada palabra está siendo diseñada para convertir...",
    "Esto tomaría 2-3 días a un copywriter profesional...",
  ];
 
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
 
  function quitarImagen(e: React.MouseEvent) {
    e.stopPropagation();
    setImagen(null);
    if (fileRef.current) fileRef.current.value = "";
  }
 
  async function guardar(texto: string, tipo: string) {
    const hora = new Date().toLocaleTimeString();
    const nuevoGuardado = { texto, tipo, producto, hora, id: Date.now().toString() };
    try {
      const res = await fetch("/api/copys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto, tipo, producto, hora }),
      });
      const data = await res.json();
      if (data.id) nuevoGuardado.id = data.id;
    } catch {}
    setGuardados(prev => [nuevoGuardado, ...prev]);
    setToastGuardado(true);
    setTimeout(() => setToastGuardado(false), 2000);
  }
 
  function copiar(texto: string, id: string) {
    navigator.clipboard.writeText(texto);
    setCopiado(id);
    setTimeout(() => setCopiado(null), 2000);
  }
 
  async function regenerar(seccion: string) {
    setSeccionCargando(`regenerar-${seccion}`);
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ producto, caracteristicas, problema, beneficio, precioOferta, precioAnterior, clientes, pais, tono, categoria, seccion }),
    });
    const data = await res.json();
    setResultado((prev: any) => ({ ...prev, [seccion]: data[seccion] || prev[seccion] }));
    setSeccionCargando(null);
  }
 
  async function mejorar(seccion: string) {
    setSeccionCargando(`mejorar-${seccion}`);
    const textoActual = resultado[seccion];
    const res = await fetch("/api/mejorar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texto: textoActual, producto, pais, tono }),
    });
    const data = await res.json();
    setResultado((prev: any) => ({ ...prev, [seccion]: data.texto || prev[seccion] }));
    setSeccionCargando(null);
  }
 
  async function analizarCompetidor() {
    if (!competidor) return;
    setAnalizando(true);
    setErrorAnalisis(null);
    setAnalisisCompetidor(null);
    setAnalisisActivo(false);
    try {
      const res = await fetch("/api/competidor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: competidor, producto, pais, tono }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setErrorAnalisis(data.error || "No pudimos analizar esa página.");
      } else {
        setAnalisisCompetidor(data);
      }
    } catch {
      setErrorAnalisis("No pudimos conectar con esa página. Verifica la URL.");
    }
    setAnalizando(false);
  }
 
  async function generar(conImagen = false) {
    if (!producto) return;
    setLoading(true);
    setTiempoInicio(Date.now());
    tiempoInicioRef.current = Date.now();
    setProgreso(0);
    setResultado(null);
    const pasos = [10, 25, 40, 55, 70, 85, 95, 100];
    let i = 0;
    const interval = setInterval(() => {
      if (i < pasos.length) { setProgreso(pasos[i]); i++; }
      else clearInterval(interval);
    }, 800);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ producto, caracteristicas, problema, beneficio, precioOferta, precioAnterior, clientes, competidor, pais, tono, categoria, imagen: conImagen ? imagen : null, queGenerar }),
      });
      const data = await res.json();
      clearInterval(interval);
      setProgreso(100);
      setResultado(data);
      sessionStorage.setItem("landcopy_resultado", JSON.stringify(data));
      setTiempoReal(Math.round((Date.now() - tiempoInicioRef.current) / 1000));
    } catch {
      clearInterval(interval);
    }
    setLoading(false);
  }
 
  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="max-w-[1400px] mx-auto px-6 pt-24 pb-20">
 
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 text-orange-500 text-xs font-semibold px-4 py-1.5 rounded-full mb-4">
            IA generativa · copy profesional
          </div>
          <h1 className="text-4xl font-black text-white mb-2">
            Crea copy que <span className="text-orange-500">vende</span>,{" "}
            <span className="text-cyan-400">conecta</span> y{" "}
            <span className="text-green-400">convierte</span>
          </h1>
          <p className="text-zinc-500 text-base">Sube tu producto — la IA genera landing, WhatsApp, Meta Ads, redes y campaña de 7 días en segundos</p>
        </div>
 
        <div className="grid grid-cols-[380px_1fr] gap-6">
 
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-5 pb-3 border-b border-[#151515]">
              <span className="text-orange-500 text-lg">📦</span>
              <span className="text-white font-bold text-sm">Datos del producto</span>
            </div>
 
            <div className="mb-4">
              <label className="text-orange-500 text-[10px] font-bold tracking-widest uppercase flex items-center gap-1 mb-1.5">Imagen del producto</label>
              <div onClick={() => !imagen && fileRef.current?.click()} className="border border-dashed border-[#222] rounded-xl p-6 text-center cursor-pointer hover:border-orange-500 transition-colors relative">
                {imagen ? (
                  <div className="relative inline-block">
                    <img src={imagen} className="h-40 mx-auto rounded-lg object-contain" alt="producto" />
                    <button onClick={quitarImagen} className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">✕</button>
                  </div>
                ) : (
                  <>
                    <div className="text-orange-500 text-5xl mb-3">📷</div>
                    <div className="text-[#f0ead6] text-xs font-semibold mb-1">Arrastra o selecciona · JPG PNG WEBP</div>
                    <div className="text-orange-500 text-[10px] font-bold">GPT-4o Vision analiza colores, forma y tipo de producto</div>
                  </>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleImagen} className="hidden" />
            </div>
 
            <div className="mb-3">
              <label className="text-orange-500 text-[10px] font-bold tracking-widest uppercase mb-1.5 block">Nombre del producto *</label>
              <input value={producto} onChange={e => setProducto(e.target.value)} placeholder="Ej: Rodillax" className="w-full bg-[#f0ead6] border border-[#d4cdb8] text-[#1a1a1a] rounded-lg px-3 py-2 text-xs h-[34px] outline-none placeholder-[#999]" />
            </div>
 
            <div className="mb-3">
              <label className="text-orange-500 text-[10px] font-bold tracking-widest uppercase mb-1.5 block">Características — Amazon · MeLi · tu tienda</label>
              <textarea value={caracteristicas} onChange={e => setCaracteristicas(e.target.value)} placeholder="Pega aquí · la IA convierte cada característica en beneficio emocional..." className="w-full bg-[#f0ead6] border border-[#d4cdb8] text-[#1a1a1a] rounded-lg px-3 py-2 text-xs outline-none placeholder-[#999] resize-none h-16" />
              <p className="text-orange-500 text-[10px] mt-1 font-medium">La IA detecta el formato y lo procesa automáticamente</p>
            </div>
 
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="text-orange-500 text-[10px] font-bold tracking-widest uppercase mb-1.5 block h-[18px]">Problema</label>
                <input value={problema} onChange={e => setProblema(e.target.value)} placeholder="Dolor de rodilla" className="w-full bg-[#f0ead6] border border-[#d4cdb8] text-[#1a1a1a] rounded-lg px-3 py-2 text-xs h-[34px] outline-none placeholder-[#999]" />
              </div>
              <div>
                <label className="text-orange-500 text-[10px] font-bold tracking-widest uppercase mb-1.5 block h-[18px]">Beneficio principal</label>
                <input value={beneficio} onChange={e => setBeneficio(e.target.value)} placeholder="Alivio en 10 min" className="w-full bg-[#f0ead6] border border-[#d4cdb8] text-[#1a1a1a] rounded-lg px-3 py-2 text-xs h-[34px] outline-none placeholder-[#999]" />
              </div>
            </div>
 
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="text-orange-500 text-[10px] font-bold tracking-widest uppercase mb-1.5 block h-[18px]">Precio oferta</label>
                <input value={precioOferta} onChange={e => setPrecioOferta(e.target.value)} placeholder="$49.900" className="w-full bg-[#f0ead6] border border-[#d4cdb8] text-[#1a1a1a] rounded-lg px-3 py-2 text-xs h-[34px] outline-none placeholder-[#999]" />
              </div>
              <div>
                <label className="text-orange-500 text-[10px] font-bold tracking-widest uppercase mb-1.5 block h-[18px]">Precio anterior</label>
                <input value={precioAnterior} onChange={e => setPrecioAnterior(e.target.value)} placeholder="$89.900" className="w-full bg-[#f0ead6] border border-[#d4cdb8] text-[#1a1a1a] rounded-lg px-3 py-2 text-xs h-[34px] outline-none placeholder-[#999]" />
              </div>
            </div>
 
            <div className="mb-3">
              <label className="text-orange-500 text-[10px] font-bold tracking-widest uppercase mb-1.5 block">Clientes actuales (aprox.)</label>
              <input value={clientes} onChange={e => setClientes(e.target.value)} placeholder="Ej: 17.000+ clientes satisfechos" className="w-full bg-[#f0ead6] border border-[#d4cdb8] text-[#1a1a1a] rounded-lg px-3 py-2 text-xs h-[34px] outline-none placeholder-[#999]" />
            </div>
 
            <div className="mb-3">
              <label className="text-cyan-400 text-[10px] font-bold tracking-widest uppercase mb-1.5 block">Analizar competidor</label>
              <div className="flex gap-2">
                <input value={competidor} onChange={e => setCompetidor(e.target.value)} placeholder="https://competidor.com/producto" className="flex-1 bg-[#f0ead6] border border-[#d4cdb8] text-[#1a1a1a] rounded-lg px-3 py-2 text-xs h-[34px] outline-none placeholder-[#999]" />
                <button onClick={analizarCompetidor} disabled={!competidor || analizando} className="bg-cyan-400/10 border border-cyan-400/30 text-cyan-400 rounded-lg px-3 text-xs font-bold whitespace-nowrap disabled:opacity-40">{analizando ? "Analizando..." : "Analizar"}</button>
              </div>
              <p className="text-green-400 text-[10px] mt-1 font-medium">La IA lee su copy y genera uno que lo supera punto por punto</p>
 
              {analizando && (
                <div className="mt-3 bg-[#0d0d0d] border border-[#1e2a3a] rounded-xl p-4 flex flex-col gap-3">
                  <div className="text-cyan-400 text-[10px] font-bold tracking-widest uppercase mb-1">🔍 Analizando competidor...</div>
                  {[
                    { icon: "🌐", texto: "Leyendo página del competidor", color: "bg-cyan-400", w: "100%", pts: null },
                    { icon: "📝", texto: "TITULAR — beneficio claro, urgencia, voz del cliente", color: "bg-orange-500", w: "75%", pts: "25 pts" },
                    { icon: "💡", texto: "PROPUESTA — diferenciación, dolor, credibilidad", color: "bg-purple-500", w: "55%", pts: "25 pts" },
                    { icon: "⭐", texto: "PRUEBA SOCIAL — testimonios, números, resultados", color: "bg-yellow-400", w: "35%", pts: "25 pts" },
                    { icon: "⚡", texto: "URGENCIA Y CTA — escasez, acción, razón para hoy", color: "bg-green-400", w: "15%", pts: "25 pts" },
                  ].map((p, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-sm w-5">{p.icon}</span>
                      <span className="text-[#f0ead6] text-[11px] flex-1">{p.texto}</span>
                      {p.pts && <span className="text-cyan-400 text-[10px] font-bold whitespace-nowrap">{p.pts}</span>}
                      <div className="w-16 h-[3px] bg-[#111] rounded-full">
                        <div className={`h-[3px] rounded-full ${p.color} transition-all duration-500`} style={{ width: p.w }}></div>
                      </div>
                    </div>
                  ))}
                  <div className="text-[#f0ead6] text-[10px] font-bold mt-1 text-right">Total: 100 pts</div>
                </div>
              )}
 
              {errorAnalisis && !analizando && (
                <div className="mt-3 bg-[#130808] border border-[#7f1d1d] rounded-xl p-4 flex gap-3">
                  <span className="text-red-400 text-lg mt-0.5">⚠</span>
                  <div>
                    <div className="text-red-400 text-[11px] font-bold mb-1">No pudimos analizar esa página</div>
                    <div className="text-[#f0ead6] text-[11px] leading-relaxed">{errorAnalisis}</div>
                    <button onClick={() => setErrorAnalisis(null)} className="mt-2 text-cyan-400 border border-cyan-400 rounded-md px-3 py-1 text-[10px] font-bold">↻ Intentar con otra URL</button>
                  </div>
                </div>
              )}
 
              {analisisCompetidor && !analizando && (
                <div className="mt-3 bg-[#0d0d0d] border border-[#1e3a2e] rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1a1a1a]">
                    <span className="text-cyan-400 text-[10px] font-bold tracking-widest uppercase">ANÁLISIS DEL COMPETIDOR</span>
                    <span className="bg-cyan-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">{new URL(competidor).hostname}</span>
                  </div>
                  <div className="flex gap-2 px-4 py-2 border-b border-[#111]">
                    <div className="flex-1 bg-[#111] rounded-lg p-2 text-center border border-[#222]">
                      <div className="text-red-400 text-lg font-black">{analisisCompetidor.score_ellos}</div>
                      <div className="text-[#f0ead6] text-[10px] font-bold mt-0.5">Score ellos</div>
                    </div>
                    <div className="flex-1 bg-[#111] rounded-lg p-2 text-center border border-[#222]">
                      <div className="text-green-400 text-lg font-black">{analisisCompetidor.score_nuestro}</div>
                      <div className="text-[#f0ead6] text-[10px] font-bold mt-0.5">Score tuyo</div>
                    </div>
                    <div className="flex-1 bg-[#111] rounded-lg p-2 text-center border border-[#222]">
                      <div className="text-cyan-400 text-lg font-black">+{analisisCompetidor.score_nuestro - analisisCompetidor.score_ellos}</div>
                      <div className="text-[#f0ead6] text-[10px] font-bold mt-0.5">Tu ventaja</div>
                    </div>
                  </div>
                  {analisisCompetidor.puntos?.map((p: any, i: number) => (
                    <div key={i} className="grid grid-cols-2 border-b border-[#111] last:border-none">
                      <div className="p-3 bg-[#130808] border-r border-[#1a1a1a]">
                        <div className="text-red-400 text-[10px] font-black mb-1">✕ {p.categoria}</div>
                        <div className="text-[#f0ead6] text-[11px] leading-relaxed">{p.ellos}</div>
                      </div>
                      <div className="p-3 bg-[#081308]">
                        <div className="text-green-400 text-[10px] font-black mb-1">✓ {p.categoria}</div>
                        <div className="text-[#f0ead6] text-[11px] leading-relaxed font-semibold">{p.nosotros}</div>
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-2 px-4 py-3 border-t border-[#1a1a1a]">
                    <button onClick={() => setAnalisisActivo(true)} className="flex-1 bg-orange-500 text-white font-bold py-2 rounded-lg text-xs">⚡ Usar este análisis al generar</button>
                    <button onClick={() => { setAnalisisCompetidor(null); setAnalisisActivo(false); }} className="text-[#f0ead6] border border-[#555] rounded-lg px-4 py-2 text-xs font-bold">Ignorar</button>
                  </div>
                </div>
              )}
 
              {analisisActivo && !analisisCompetidor && (
                <div className="mt-3 bg-[#081308] border border-[#166534] rounded-lg px-3 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <div>
                      <div className="text-green-400 text-[11px] font-bold">Análisis del competidor activo</div>
                      <div className="text-[#f0ead6] text-[10px]">{competidor}</div>
                    </div>
                  </div>
                  <button onClick={() => setAnalisisActivo(false)} className="text-red-400 border border-red-400 rounded-md px-2 py-1 text-[10px] font-bold">✕ Quitar</button>
                </div>
              )}
            </div>
 
            <hr className="border-[#111] my-4" />
 
            <div className="mb-3">
              <label className="text-orange-500 text-[10px] font-bold tracking-widest uppercase mb-1.5 block">País objetivo</label>
              <div className="flex flex-wrap gap-1.5">
                {paises.map(p => (
                  <button key={p.nombre} onClick={() => setPais(p.nombre)} className={`flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-full border transition-all ${pais === p.nombre ? "bg-orange-500/10 border-orange-500/40 text-orange-500" : "bg-[#080808] border-[#222] text-[#f0ead6]"}`}>
                    <span>{p.flag}</span>{p.nombre}
                  </button>
                ))}
              </div>
            </div>
 
            <div className="mb-3">
              <label className="text-orange-500 text-[10px] font-bold tracking-widest uppercase mb-1.5 block">Tono de comunicación</label>
              <div className="flex flex-wrap gap-1.5">
                {tonos.map(t => (
                  <button key={t.nombre} onClick={() => setTono(t.nombre)} className={`text-[10px] font-medium px-2.5 py-1 rounded-full border transition-all ${tono === t.nombre ? tonoColor[t.color] : "bg-[#080808] border-[#222] text-[#f0ead6]"}`}>
                    {t.nombre}
                  </button>
                ))}
              </div>
            </div>
 
            <div className="mb-4">
              <label className="text-orange-500 text-[10px] font-bold tracking-widest uppercase mb-1.5 block">Categoría</label>
              <select value={categoria} onChange={e => setCategoria(e.target.value)} className="w-full bg-[#f0ead6] border border-[#d4cdb8] text-[#1a1a1a] rounded-lg px-3 py-2 text-xs h-[34px] outline-none">
                {["Salud y bienestar","Hogar","Tecnología","Belleza","Deporte","Cocina","Moda","Mascotas","Otro"].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
 
            <hr className="border-[#111] my-4" />
 
            <div className="mb-4">
              <label className="text-orange-500 text-[10px] font-bold tracking-widest uppercase mb-2 block">Qué generar</label>
              <div className="grid grid-cols-2 gap-1.5">
                {["Landing page","WhatsApp x3","Meta Ads","Redes sociales","Campaña 7 días","Email seguimiento","Objeciones","SEO + extras"].map(item => (
                  <div key={item} onClick={() => setQueGenerar(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item])} className={`flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer border transition-all ${queGenerar.includes(item) ? "bg-orange-500/10 border-orange-500/30" : "bg-[#0d0d0d] border-[#1a1a1a]"}`}>
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${queGenerar.includes(item) ? "bg-orange-500" : "bg-[#333]"}`}></div>
                    <span className={`text-[11px] ${queGenerar.includes(item) ? "text-orange-400" : "text-[#f0ead6]"}`}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={() => {
              ["lc_producto","lc_caracteristicas","lc_problema","lc_beneficio","lc_precioOferta","lc_precioAnterior","lc_clientes","lc_competidor","lc_pais","lc_tono","lc_categoria","lc_imagen","landcopy_resultado"].forEach(k => sessionStorage.removeItem(k));
              setProducto(""); setCaracteristicas(""); setProblema(""); setBeneficio(""); setPrecioOferta(""); setPrecioAnterior(""); setClientes(""); setCompetidor(""); setPais("Colombia"); setTono("Urgente"); setCategoria("Salud y bienestar"); setImagen(null); setResultado(null); setQueGenerar([]);
              if (fileRef.current) fileRef.current.value = "";
            }} className="w-full bg-[#0d0d0d] border border-red-500/30 text-red-400 font-bold py-2 rounded-xl text-xs mb-2 transition-colors flex items-center justify-center gap-2">
              🗑️ Limpiar todo y empezar de nuevo
            </button>
            <button onClick={() => generar(false)} disabled={!producto || loading} className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-black py-3 rounded-xl text-sm mb-2 transition-colors flex items-center justify-center gap-2">
              ⚡ Generar todo ahora
            </button>
            <button onClick={() => generar(true)} disabled={!producto || !imagen || loading} className="w-full bg-[#050505] border border-cyan-400/35 text-cyan-400 font-bold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-40">
              👁️ Generar con análisis de imagen · GPT-4o Vision
            </button>
          </div>
 
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-5">
 
            {toastGuardado && (
              <div className="fixed bottom-6 right-6 bg-green-500 text-white text-sm font-bold px-4 py-3 rounded-xl shadow-lg z-50">
                ✓ Copy guardado
              </div>
            )}
 
            {resultado && (
              <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl px-4 py-3 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-orange-500 text-lg">⚡</span>
                  <div className="text-xs text-zinc-400 leading-5">
                    Generaste en <span className="text-white font-bold">{tiempoReal} segundos</span> lo que un copywriter haría en <span className="text-white font-bold">2-3 días</span><br/>
                    Ahorraste aprox. <span className="text-orange-500 font-bold">$350 USD</span> en servicios de marketing
                  </div>
                </div>
                <div className="flex gap-4 text-right">
                  <div><div className="text-orange-500 text-xl font-black">{tiempoReal}s</div><div className="text-zinc-500 text-[10px]">Tiempo</div></div>
                  <div><div className="text-green-400 text-xl font-black">$350</div><div className="text-zinc-500 text-[10px]">Ahorrado</div></div>
                </div>
              </div>
            )}
 
            {resultado && (
              <div className="grid grid-cols-4 gap-2 mb-4">
                <div className="bg-[#0a0a0a] border border-[#151515] rounded-xl p-3 text-center">
                  <div className="text-orange-500 text-xl font-black">{resultado.palabras || 0}</div>
                  <div className="text-zinc-500 text-[10px]">Palabras</div>
                </div>
                <div className="bg-[#0a0a0a] border border-[#151515] rounded-xl p-3 text-center">
                  <div className="text-cyan-400 text-xl font-black">{resultado.caracteres || 0}</div>
                  <div className="text-zinc-500 text-[10px]">Caracteres</div>
                </div>
                <div className="bg-[#0a0a0a] border border-[#151515] rounded-xl p-3 text-center">
                  <div className="text-green-400 text-xl font-black">{resultado.piezas || 0}</div>
                  <div className="text-zinc-500 text-[10px]">Piezas</div>
                </div>
                <div className="bg-[#0a0a0a] border border-[#151515] rounded-xl p-3 text-center">
                  <div className="text-purple-400 text-xl font-black">{pais.slice(0,3).toUpperCase()}</div>
                  <div className="text-zinc-500 text-[10px]">País</div>
                </div>
              </div>
            )}
 
            <div className="flex gap-1 mb-4 bg-[#070707] border border-[#111] rounded-xl p-1">
              {[
                {id:"landing",label:"Landing",color:"bg-orange-500"},
                {id:"whatsapp",label:"WhatsApp",color:"bg-cyan-400"},
                {id:"campana",label:"Campaña",color:"bg-green-400"},
                {id:"prompts",label:"Prompts IA",color:"bg-purple-500"},
                {id:"metaads",label:"Meta Ads",color:"bg-pink-500"},
                {id:"extras",label:"Extras",color:"bg-zinc-600"},
              ].map(t => (
                <button key={t.id} onClick={() => setTabActivo(t.id)} className={`flex-1 text-center py-1.5 rounded-lg text-[10px] font-bold transition-all ${tabActivo === t.id ? `${t.color} text-white` : "text-zinc-500"}`}>
                  {t.label}
                </button>
              ))}
            </div>
 
            <button onClick={() => resultado && navigator.clipboard.writeText(Object.values(resultado).join("\n\n"))} className="w-full bg-[#0d0d0d] border border-[#1e1e1e] text-[#f0ead6] rounded-lg py-2 text-xs mb-4 flex items-center justify-center gap-2">
              📋 Copiar todo el contenido generado
            </button>
 
            {loading && (
              <div className="bg-[#070707] border border-[#111] rounded-xl p-4 mb-4 relative overflow-hidden" style={{minHeight: "300px"}}>
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {productosLluvia.map((emoji, i) => (
                    <span
                      key={i}
                      className="absolute select-none"
                      style={{
                        left: `${(i * 17 + 3) % 95}%`,
                        top: "-40px",
                        opacity: 0.12,
                        fontSize: `${16 + (i % 4) * 6}px`,
                        animation: `lluviaProd ${2.5 + (i % 5) * 0.7}s linear ${(i * 0.3) % 3}s infinite`,
                      }}
                    >
                      {emoji}
                    </span>
                  ))}
                </div>
                <style>{`
                  @keyframes lluviaProd {
                    0% { transform: translateY(-40px) rotate(0deg); }
                    100% { transform: translateY(400px) rotate(20deg); }
                  }
                  @keyframes fadePhrase {
                    0% { opacity: 0; transform: translateY(8px); }
                    15% { opacity: 1; transform: translateY(0); }
                    85% { opacity: 1; transform: translateY(0); }
                    100% { opacity: 0; transform: translateY(-8px); }
                  }
                `}</style>
                <div className="relative z-10">
                  <div className="text-orange-500 text-[10px] font-bold tracking-widest uppercase mb-3">⚙️ Generando contenido · {progreso}%</div>
                  {[
                    {icon:"🧠",texto:"Analizando producto y mercado",color:"bg-orange-500"},
                    {icon:"🎯",texto:"Identificando puntos de dolor",color:"bg-cyan-400"},
                    {icon:"✍️",texto:"Escribiendo copy persuasivo",color:"bg-purple-500"},
                    {icon:"🚀",texto:"Optimizando campaña de 7 días",color:"bg-green-400"},
                  ].map((p,i) => (
                    <div key={i} className="flex items-center gap-2 mb-2">
                      <span className="text-sm w-5">{p.icon}</span>
                      <span className="text-[#f0ead6] text-[11px] flex-1">{p.texto}</span>
                      <div className="flex-1 h-[3px] bg-[#111] rounded-full">
                        <div className={`h-[3px] rounded-full ${p.color} transition-all duration-500`} style={{width:`${Math.min(100,Math.max(0,(progreso-(i*25))*4))}%`}}></div>
                      </div>
                    </div>
                  ))}
                  <div className="mt-10 flex flex-col items-center gap-3">
                    {frasesGenerando.map((frase, i) => (
                      <p
                        key={i}
                        className="text-[#f0ead6] text-xs font-medium text-center"
                        style={{
                          opacity: 0,
                          animation: `fadePhrase 2s ease-in-out ${i * 2}s infinite`,
                          maxWidth: "340px",
                        }}
                      >
                        {frase}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}
 
            {!loading && !resultado && (
              <div className="flex items-center justify-center h-64 text-zinc-600 text-sm">
                Completa los datos y presiona Generar
              </div>
            )}
 
            {resultado && (
              <div className="space-y-4">
 
                {tabActivo === "landing" && (
                  <>
                    {[
                      {key:"hero",titulo:"Hero — titular"},
                      {key:"problema",titulo:"El problema"},
                      {key:"solucion",titulo:"La solución"},
                      {key:"beneficios",titulo:"Beneficios reales"},
                      {key:"testimonios",titulo:"Testimonios"},
                      {key:"cta",titulo:"CTA final"},
                    ].map(s => resultado[s.key] && (
                      <div key={s.key} className="border border-orange-500 rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-2.5 border-b border-orange-500/20">
                          <span className="text-orange-500 text-[10px] font-bold tracking-widest uppercase">{s.titulo}</span>
                          <div className="flex gap-1.5">
                            <button disabled={seccionCargando !== null} onClick={() => regenerar(s.key)} className="bg-orange-500/10 border border-orange-500/25 text-orange-500 text-[10px] font-bold px-2 py-1 rounded-md disabled:opacity-50">
                              {seccionCargando === `regenerar-${s.key}` ? "⏳ Generando..." : "↻ Regenerar"}
                            </button>
                            <button disabled={seccionCargando !== null} onClick={() => mejorar(s.key)} className="bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-[10px] font-bold px-2 py-1 rounded-md disabled:opacity-50">
                              {seccionCargando === `mejorar-${s.key}` ? "⏳ Mejorando..." : "↑ Mejorar"}
                            </button>
                            <button onClick={() => copiar(resultado[s.key], s.key)} className="bg-[#111] border border-[#1e1e1e] text-zinc-400 text-[10px] font-bold px-2 py-1 rounded-md">{copiado === s.key ? "✓ Copiado" : "Copiar"}</button>
                            <button onClick={() => guardar(resultado[s.key], s.titulo)} className="bg-green-400/10 border border-green-400/20 text-green-400 text-[10px] font-bold px-2 py-1 rounded-md">❤ Guardar</button>
                          </div>
                        </div>
                        <div className="bg-[#070707] px-4 py-3 text-[#f0ead6] text-xs leading-relaxed whitespace-pre-wrap select-text cursor-text">{resultado[s.key]}</div>
                      </div>
                    ))}
                  </>
                )}
 
                {tabActivo === "whatsapp" && resultado.whatsapp && (
                  <div className="border border-cyan-400 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-cyan-400/20">
                      <span className="text-cyan-400 text-[10px] font-bold tracking-widest uppercase">WhatsApp · 3 versiones</span>
                      <div className="flex gap-1.5">
                        <button disabled={seccionCargando !== null} onClick={() => regenerar("whatsapp")} className="bg-orange-500/10 border border-orange-500/25 text-orange-500 text-[10px] font-bold px-2 py-1 rounded-md disabled:opacity-50">
                          {seccionCargando === "regenerar-whatsapp" ? "⏳ Generando..." : "↻ Regenerar"}
                        </button>
                        <button disabled={seccionCargando !== null} onClick={() => mejorar("whatsapp")} className="bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-[10px] font-bold px-2 py-1 rounded-md disabled:opacity-50">
                          {seccionCargando === "mejorar-whatsapp" ? "⏳ Mejorando..." : "↑ Mejorar"}
                        </button>
                        <button onClick={() => copiar(resultado.whatsapp, "whatsapp")} className="bg-[#111] border border-[#1e1e1e] text-zinc-400 text-[10px] font-bold px-2 py-1 rounded-md">{copiado === "whatsapp" ? "✓ Copiado" : "Copiar"}</button>
                        <button onClick={() => guardar(resultado.whatsapp,"WhatsApp x3")} className="bg-green-400/10 border border-green-400/20 text-green-400 text-[10px] font-bold px-2 py-1 rounded-md">❤ Guardar</button>
                      </div>
                    </div>
                    <div className="bg-[#070707] px-4 py-3 text-[#f0ead6] text-xs leading-relaxed whitespace-pre-wrap select-text cursor-text">{resultado.whatsapp}</div>
                  </div>
                )}
 
                {tabActivo === "campana" && resultado.campana && (() => {
                  const parsearDias = (texto: string) => {
                    const dias: { titulo: string; texto: string }[] = [];
                    const partes = texto.split(/\n(?=D[íi]a\s*\d)/i);
                    partes.forEach((parte, i) => {
                      const lineas = parte.trim().split("\n");
                      const primeraLinea = lineas[0]
                        .replace(/^\*\*/g, "").replace(/\*\*$/g, "")
                        .replace(/^D[íi]a\s*\d+[:\-]?\s*/i, "").trim();
                      const resto = lineas.slice(1).join("\n").trim();
                      dias.push({
                        titulo: primeraLinea || `Día ${i + 1}`,
                        texto: resto || primeraLinea
                      });
                    });
                    return dias;
                  };
                  const dias = parsearDias(resultado.campana);
                  return (
                    <div className="space-y-3">
                      {dias.map((dia, i) => (
                        <div key={i} className="border border-green-400 rounded-xl overflow-hidden">
                          <div className="flex items-center justify-between px-4 py-2.5 border-b border-green-400/20">
                            <div className="flex items-center gap-2">
                              <span className="bg-orange-500 text-white text-[10px] font-black px-2.5 py-1 rounded-md">DÍA {i + 1}</span>
                              <span className="text-green-400 text-[11px] font-bold">{dia.titulo}</span>
                            </div>
                            <div className="flex gap-1.5">
                              <button
                                disabled={seccionCargando !== null}
                                onClick={async () => {
                                  setSeccionCargando(`regenerar-campana-dia-${i + 1}`);
                                  const res = await fetch("/api/generate", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ producto, caracteristicas, problema, beneficio, precioOferta, precioAnterior, clientes, pais, tono, categoria, seccion: `campana-dia-${i + 1}` }),
                                  });
                                  const data = await res.json();
                                  if (data.campana_dia) {
                                    const nuevosDias = [...dias];
                                    nuevosDias[i] = data.campana_dia;
                                    const nuevaCampana = nuevosDias.map((d, idx) => `Día ${idx + 1}: ${d.titulo}\n${d.texto}`).join("\n");
                                    setResultado((prev: any) => ({ ...prev, campana: nuevaCampana }));
                                  }
                                  setSeccionCargando(null);
                                }}
                                className="bg-orange-500/10 border border-orange-500/25 text-orange-500 text-[10px] font-bold px-2 py-1 rounded-md disabled:opacity-50"
                              >
                                {seccionCargando === `regenerar-campana-dia-${i + 1}` ? "⏳ Generando..." : "↻ Regenerar"}
                              </button>
                              <button
                                disabled={seccionCargando !== null}
                                onClick={async () => {
                                  setSeccionCargando(`mejorar-campana-dia-${i + 1}`);
                                  const res = await fetch("/api/mejorar", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ texto: `${dia.titulo}\n${dia.texto}`, producto, pais, tono }),
                                  });
                                  const data = await res.json();
                                  if (data.texto) {
                                    const nuevosDias = [...dias];
                                    nuevosDias[i] = { titulo: dia.titulo, texto: data.texto };
                                    const nuevaCampana = nuevosDias.map((d, idx) => `Día ${idx + 1}: ${d.titulo}\n${d.texto}`).join("\n");
                                    setResultado((prev: any) => ({ ...prev, campana: nuevaCampana }));
                                  }
                                  setSeccionCargando(null);
                                }}
                                className="bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-[10px] font-bold px-2 py-1 rounded-md disabled:opacity-50"
                              >
                                {seccionCargando === `mejorar-campana-dia-${i + 1}` ? "⏳ Mejorando..." : "↑ Mejorar"}
                              </button>
                              <button
                                onClick={() => copiar(`${dia.titulo}\n${dia.texto}`, `campana-dia-${i + 1}`)}
                                className="bg-[#111] border border-[#1e1e1e] text-zinc-400 text-[10px] font-bold px-2 py-1 rounded-md"
                              >
                                {copiado === `campana-dia-${i + 1}` ? "✓ Copiado" : "Copiar"}
                              </button>
                              <button
                                onClick={() => guardar(`${dia.titulo}\n${dia.texto}`, `Campaña Día ${i + 1}`)}
                                className="bg-green-400/10 border border-green-400/20 text-green-400 text-[10px] font-bold px-2 py-1 rounded-md"
                              >
                                ❤ Guardar
                              </button>
                            </div>
                          </div>
                          <div className="bg-[#070707] px-4 py-3 text-[#f0ead6] text-xs leading-relaxed whitespace-pre-wrap select-text cursor-text">
                            {dia.texto}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
 
                {tabActivo === "prompts" && (
                  <div className="border border-purple-500 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-purple-500/20">
                      <span className="text-purple-400 text-[10px] font-bold tracking-widest uppercase">Prompts para imágenes IA</span>
                      <div className="flex gap-1.5">
                        <button onClick={() => resultado?.prompts && copiar(resultado.prompts, "prompts")} className="bg-[#111] border border-[#1e1e1e] text-zinc-400 text-[10px] font-bold px-2 py-1 rounded-md">{copiado === "prompts" ? "✓ Copiado" : "Copiar"}</button>
                      </div>
                    </div>
                    <div className="bg-[#070707] px-4 py-3 text-[#f0ead6] text-xs leading-relaxed whitespace-pre-wrap select-text cursor-text">
                      {resultado?.prompts || "Los prompts profesionales se generan junto con el copy. Presiona Generar para obtenerlos."}
                    </div>
                    <div className="px-4 py-3 border-t border-purple-500/20">
                      <button className="w-full bg-cyan-400/10 border border-cyan-400/30 text-cyan-400 rounded-lg py-2 text-xs font-bold">
                        → Ir al módulo de imágenes con este producto
                      </button>
                    </div>
                  </div>
                )}
 
                {tabActivo === "metaads" && resultado.metaads && (
                  <div className="border border-pink-500 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-pink-500/20">
                      <span className="text-pink-500 text-[10px] font-bold tracking-widest uppercase">Meta Ads · 5 anuncios</span>
                      <div className="flex gap-1.5">
                        <button disabled={seccionCargando !== null} onClick={() => regenerar("metaads")} className="bg-orange-500/10 border border-orange-500/25 text-orange-500 text-[10px] font-bold px-2 py-1 rounded-md disabled:opacity-50">
                          {seccionCargando === "regenerar-metaads" ? "⏳ Generando..." : "↻ Regenerar"}
                        </button>
                        <button disabled={seccionCargando !== null} onClick={() => mejorar("metaads")} className="bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-[10px] font-bold px-2 py-1 rounded-md disabled:opacity-50">
                          {seccionCargando === "mejorar-metaads" ? "⏳ Mejorando..." : "↑ Mejorar"}
                        </button>
                        <button onClick={() => copiar(resultado.metaads, "metaads")} className="bg-[#111] border border-[#1e1e1e] text-zinc-400 text-[10px] font-bold px-2 py-1 rounded-md">{copiado === "metaads" ? "✓ Copiado" : "Copiar"}</button>
                        <button onClick={() => guardar(resultado.metaads,"Meta Ads")} className="bg-green-400/10 border border-green-400/20 text-green-400 text-[10px] font-bold px-2 py-1 rounded-md">❤ Guardar</button>
                      </div>
                    </div>
                    <div className="bg-[#070707] px-4 py-3 text-[#f0ead6] text-xs leading-relaxed whitespace-pre-wrap select-text cursor-text">{resultado.metaads}</div>
                  </div>
                )}
 
                {tabActivo === "extras" && (
                  <div className="space-y-4">
                    {resultado.seo && (
                      <div className="border border-zinc-600 rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-600/20">
                          <span className="text-zinc-400 text-[10px] font-bold tracking-widest uppercase">🔍 SEO Keywords</span>
                          <div className="flex gap-1.5">
                            <button disabled={seccionCargando !== null} onClick={() => regenerar("seo")} className="bg-orange-500/10 border border-orange-500/25 text-orange-500 text-[10px] font-bold px-2 py-1 rounded-md disabled:opacity-50">
                              {seccionCargando === "regenerar-seo" ? "⏳ Generando..." : "↻ Regenerar"}
                            </button>
                            <button disabled={seccionCargando !== null} onClick={() => mejorar("seo")} className="bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-[10px] font-bold px-2 py-1 rounded-md disabled:opacity-50">
                              {seccionCargando === "mejorar-seo" ? "⏳ Mejorando..." : "↑ Mejorar"}
                            </button>
                            <button onClick={() => copiar(resultado.seo, "seo")} className="bg-[#111] border border-[#1e1e1e] text-zinc-400 text-[10px] font-bold px-2 py-1 rounded-md">{copiado === "seo" ? "✓ Copiado" : "Copiar"}</button>
                            <button onClick={() => guardar(resultado.seo, "SEO Keywords")} className="bg-green-400/10 border border-green-400/20 text-green-400 text-[10px] font-bold px-2 py-1 rounded-md">❤ Guardar</button>
                          </div>
                        </div>
                        <div className="bg-[#070707] px-4 py-3 text-[#f0ead6] text-xs leading-relaxed select-text cursor-text">{resultado.seo}</div>
                      </div>
                    )}
                    {resultado.objeciones && (
                      <div className="border border-zinc-600 rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-600/20">
                          <span className="text-zinc-400 text-[10px] font-bold tracking-widest uppercase">💬 Objeciones y Respuestas</span>
                          <div className="flex gap-1.5">
                            <button disabled={seccionCargando !== null} onClick={() => regenerar("objeciones")} className="bg-orange-500/10 border border-orange-500/25 text-orange-500 text-[10px] font-bold px-2 py-1 rounded-md disabled:opacity-50">
                              {seccionCargando === "regenerar-objeciones" ? "⏳ Generando..." : "↻ Regenerar"}
                            </button>
                            <button disabled={seccionCargando !== null} onClick={() => mejorar("objeciones")} className="bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-[10px] font-bold px-2 py-1 rounded-md disabled:opacity-50">
                              {seccionCargando === "mejorar-objeciones" ? "⏳ Mejorando..." : "↑ Mejorar"}
                            </button>
                            <button onClick={() => copiar(resultado.objeciones, "objeciones")} className="bg-[#111] border border-[#1e1e1e] text-zinc-400 text-[10px] font-bold px-2 py-1 rounded-md">{copiado === "objeciones" ? "✓ Copiado" : "Copiar"}</button>
                            <button onClick={() => guardar(resultado.objeciones, "Objeciones")} className="bg-green-400/10 border border-green-400/20 text-green-400 text-[10px] font-bold px-2 py-1 rounded-md">❤ Guardar</button>
                          </div>
                        </div>
                        <div className="bg-[#070707] px-4 py-3 text-[#f0ead6] text-xs leading-relaxed whitespace-pre-wrap select-text cursor-text">{resultado.objeciones}</div>
                      </div>
                    )}
                    {resultado.email && (
                      <div className="border border-zinc-600 rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-600/20">
                          <span className="text-zinc-400 text-[10px] font-bold tracking-widest uppercase">📧 Email de seguimiento</span>
                          <div className="flex gap-1.5">
                            <button disabled={seccionCargando !== null} onClick={() => regenerar("email")} className="bg-orange-500/10 border border-orange-500/25 text-orange-500 text-[10px] font-bold px-2 py-1 rounded-md disabled:opacity-50">
                              {seccionCargando === "regenerar-email" ? "⏳ Generando..." : "↻ Regenerar"}
                            </button>
                            <button disabled={seccionCargando !== null} onClick={() => mejorar("email")} className="bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-[10px] font-bold px-2 py-1 rounded-md disabled:opacity-50">
                              {seccionCargando === "mejorar-email" ? "⏳ Mejorando..." : "↑ Mejorar"}
                            </button>
                            <button onClick={() => copiar(resultado.email, "email")} className="bg-[#111] border border-[#1e1e1e] text-zinc-400 text-[10px] font-bold px-2 py-1 rounded-md">{copiado === "email" ? "✓ Copiado" : "Copiar"}</button>
                            <button onClick={() => guardar(resultado.email, "Email")} className="bg-green-400/10 border border-green-400/20 text-green-400 text-[10px] font-bold px-2 py-1 rounded-md">❤ Guardar</button>
                          </div>
                        </div>
                        <div className="bg-[#070707] px-4 py-3 text-[#f0ead6] text-xs leading-relaxed whitespace-pre-wrap select-text cursor-text">{resultado.email}</div>
                      </div>
                    )}
                  </div>
                )}
 
                {guardados.length > 0 && (
                  <div className="border border-orange-500 rounded-xl overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-orange-500/20 flex items-center justify-between">
                      <span className="text-orange-500 text-[10px] font-bold tracking-widest uppercase">❤ Mis copys guardados ({guardados.length})</span>
                      <button onClick={() => setGuardados([])} className="text-red-400 text-[10px] font-bold hover:text-red-300">Borrar todo</button>
                    </div>
                    <div className="bg-[#070707] px-4 py-3">
                      {guardados.map((g, i) => (
                        <div key={i} className="py-3 border-b border-[#111] last:border-none">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-orange-500 text-[10px] font-bold">{g.producto || "Producto"}</span>
                              <span className="text-zinc-600 text-[10px]">·</span>
                              <span className="text-cyan-400 text-[10px] font-bold">{g.tipo}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-zinc-600 text-[10px]">{g.hora}</span>
                              <button onClick={() => copiar(g.texto, `guardado-${i}`)} className="bg-[#111] border border-[#1e1e1e] text-zinc-400 text-[10px] px-2 py-1 rounded-md">
                                {copiado === `guardado-${i}` ? "✓ Copiado" : "Copiar"}
                              </button>
                              <button onClick={async () => { if (g.id) { await fetch("/api/copys", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: g.id }) }); } setGuardados(prev => prev.filter((_, idx) => idx !== i)); }} className="text-red-400 text-[10px] font-bold px-1">✕</button>
                              {g.id && <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/share/${g.id}`); setCopiado(`share-${i}`); setTimeout(() => setCopiado(null), 2000); }} className="bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-bold px-2 py-1 rounded-md">{copiado === `share-${i}` ? "✓ Link copiado" : "🔗 Compartir"}</button>}
                            </div>
                          </div>
                          <p onClick={() => setExpandido(expandido === i ? null : i)} className="text-[#f0ead6] text-xs cursor-pointer hover:text-white transition-colors whitespace-pre-wrap">
                            {expandido === i ? g.texto : `${g.texto.slice(0, 80)}...`}
                            <span className="text-zinc-500 ml-1">{expandido === i ? "▲ ver menos" : "▼ ver más"}</span>
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
 
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}