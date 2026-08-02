"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Efectos de movimiento que la IA de video SÍ hace bien con productos.
// (Nada de cambios de color: salen glitcheados.) El prompt va en ingles porque
// el modelo entiende mejor las instrucciones finas en ese idioma.
// "beneficio" es dinamico: su prompt se arma con el beneficio de la campana (ver generar()).
const MOVIMIENTOS = [
  // Enfocados en el BENEFICIO / el dolor que resuelve el producto
  { id: "beneficio", emoji: "🎯", label: "Demuestra el beneficio", grupo: "beneficio", prompt: "" },
  { id: "agua", emoji: "💧", label: "Repele el agua", grupo: "beneficio", prompt: "water pours and splashes onto the product but slides and bounces right off, the product stays completely dry showing it is waterproof, camera fixed, keep the product identical, seamless loop" },
  { id: "calor", emoji: "♨️", label: "Abriga / calor", grupo: "beneficio", prompt: "a warm cozy golden glow radiates softly from the product with gentle rising warm steam, conveying warmth and comfort, product stays still, keep the product identical, seamless loop" },
  { id: "fresco", emoji: "❄️", label: "Frescura / frío", grupo: "beneficio", prompt: "cool frosty air and light frost shimmer drift around the product conveying freshness and cold, product stays still, keep the product identical, seamless loop" },
  { id: "enciende", emoji: "🔌", label: "Se enciende", grupo: "beneficio", prompt: "the product powers on and lights up with a smooth glowing activation, showing it working, camera fixed, keep the product identical, seamless loop" },
  { id: "resistente", emoji: "💪", label: "Resistente", grupo: "beneficio", prompt: "objects and impacts bounce off the product without leaving a mark, showing it is tough and durable, camera fixed, keep the product identical, seamless loop" },
  { id: "uso", emoji: "🙌", label: "En uso real", grupo: "beneficio", prompt: "a cinematic demonstration of the product being used in a real everyday situation, natural and believable, keep the product identical, seamless loop" },
  // Con personas usando el producto (Lite sí anima gente). Vende porque el cliente se ve usándolo.
  { id: "hombre_usa", emoji: "👨", label: "Hombre lo usa", grupo: "personas", prompt: "a real man naturally picks up and uses the product, showing it in a believable everyday way, smooth realistic motion, keep the product identical, clean look, seamless loop" },
  { id: "mujer_usa", emoji: "👩", label: "Mujer lo usa", grupo: "personas", prompt: "a real woman naturally picks up and uses the product, showing it in a believable everyday way, smooth realistic motion, keep the product identical, clean look, seamless loop" },
  { id: "hombre_toca", emoji: "🤵", label: "Hombre lo sostiene", grupo: "personas", prompt: "a real man holds and shows the product to the camera with natural confident motion, presenting it clearly, keep the product identical, clean look, seamless loop" },
  { id: "mujer_toca", emoji: "💁‍♀️", label: "Mujer lo sostiene", grupo: "personas", prompt: "a real woman holds and shows the product to the camera with natural elegant motion, presenting it clearly, keep the product identical, clean look, seamless loop" },
  { id: "modelo", emoji: "🚶", label: "Modelo lo lleva puesto", grupo: "personas", prompt: "a real person wears or carries the product and moves naturally like a fashion showcase, believable realistic motion, keep the product identical, clean look, seamless loop" },
  // Movimientos limpios (siempre funcionan bien)
  { id: "giro", emoji: "🔄", label: "Giro suave", grupo: "movimiento", prompt: "the product rotates slowly and smoothly side to side like a showroom turntable, camera fixed, clean studio background, keep the product identical, seamless loop" },
  { id: "zoom", emoji: "🔍", label: "Zoom lento", grupo: "movimiento", prompt: "slow gentle cinematic zoom in toward the product, subtle and elegant, keep the product identical, seamless loop" },
  { id: "luces", emoji: "💡", label: "Cambio de luces", grupo: "movimiento", prompt: "soft studio lights sweep across the product creating elegant shifting highlights and reflections, product stays still, keep the product identical, seamless loop" },
  { id: "flotando", emoji: "🎈", label: "Flotando", grupo: "movimiento", prompt: "the product floats and levitates gently up and down in the air with a soft rotation, clean studio background, keep the product identical, seamless loop" },
  { id: "brillo", emoji: "✨", label: "Brillo / destello", grupo: "movimiento", prompt: "a bright glossy shine and sparkle sweeps across the product surface, elegant moving highlight, product stays still, keep the product identical, seamless loop" },
  { id: "viento", emoji: "🌬️", label: "Viento", grupo: "movimiento", prompt: "a gentle breeze moves across the product, fabric and loose parts sway softly in the wind, camera fixed, keep the product identical, seamless loop" },
  { id: "humo", emoji: "💨", label: "Humo / vapor", grupo: "movimiento", prompt: "soft smoke and mist drift slowly around the product creating a dramatic premium atmosphere, product stays still, keep the product identical, seamless loop" },
];

// Mismas secciones que usa la landing (para elegir donde va el video)
const SECCIONES_INDIVIDUAL = [
  { id: "hero", nombre: "Hero" },
  { id: "problema", nombre: "El problema" },
  { id: "solucion", nombre: "La solución" },
  { id: "beneficios", nombre: "Beneficios" },
  { id: "como_funciona", nombre: "Cómo funciona" },
  { id: "testimonios", nombre: "Testimonios" },
  { id: "oferta", nombre: "Oferta" },
  { id: "cta_final", nombre: "CTA final" },
];
const SECCIONES_COMBO = [
  { id: "hero", nombre: "Hero" },
  { id: "problema", nombre: "El problema" },
  { id: "kit", nombre: "Qué incluye el kit" },
  { id: "solucion", nombre: "La solución" },
  { id: "beneficios", nombre: "Beneficios" },
  { id: "como_funciona", nombre: "Cómo funciona" },
  { id: "testimonios", nombre: "Testimonios" },
  { id: "oferta", nombre: "Oferta combo" },
  { id: "cta_final", nombre: "CTA final" },
];

export default function VideoProducto() {
  const supabase = createClient();
  const [producto, setProducto] = useState<{ nombre: string; imagen_url: string; beneficio: string; problema: string } | null>(null);
  const [cargando, setCargando] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [movSel, setMovSel] = useState("beneficio");
  const [esCombo, setEsCombo] = useState(false);
  const [seccionSel, setSeccionSel] = useState("hero");
  const [guardadoEn, setGuardadoEn] = useState<string | null>(null);

  // Lee la campaña activa (misma fuente que usa toda la app)
  useEffect(() => {
    try {
      const c = sessionStorage.getItem("campaign_activa");
      if (c) {
        const camp = JSON.parse(c);
        setProducto({
          nombre: camp.producto || camp.nombre || "Producto",
          imagen_url: camp.imagen_url || "",
          beneficio: camp.beneficio || "",
          problema: camp.problema || "",
        });
        setEsCombo(!!camp.es_combo);
      }
    } catch {}
  }, []);

  const secciones = esCombo ? SECCIONES_COMBO : SECCIONES_INDIVIDUAL;

  // Asigna el video a una seccion de la landing (via sessionStorage, que es como
  // la landing comparte su estado). La landing lo lee al volver y lo usa en el export.
  const ponerEnSeccion = () => {
    if (!videoUrl) return;
    try {
      const raw = sessionStorage.getItem("landing_videos");
      const actual = raw ? JSON.parse(raw) : {};
      actual[seccionSel] = videoUrl;
      sessionStorage.setItem("landing_videos", JSON.stringify(actual));
      const nombre = secciones.find((s) => s.id === seccionSel)?.nombre || seccionSel;
      setGuardadoEn(nombre);
    } catch {}
  };

  // Descarga real: baja el archivo en vez de abrir el video en otra pestaña
  // (el atributo download no funciona con archivos de otro dominio como Supabase).
  const descargar = async () => {
    if (!videoUrl) return;
    try {
      const blob = await fetch(videoUrl).then((r) => r.blob());
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${producto?.nombre || "producto"}-video.mp4`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      // si falla la descarga, al menos abrimos el video
      window.open(videoUrl, "_blank");
    }
  };

  const generar = async () => {
    if (!producto?.imagen_url?.startsWith("http")) {
      setError("La foto del producto necesita un enlace público. Actívala desde una campaña con foto.");
      return;
    }
    setError(null);
    setCargando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let movimiento = MOVIMIENTOS.find((m) => m.id === movSel)?.prompt;
      // "Demuestra el beneficio" se arma con el beneficio/problema de la campana
      if (movSel === "beneficio") {
        const b = producto.beneficio?.trim();
        const p = producto.problema?.trim();
        if (b || p) {
          movimiento = `cinematic product video that visually dramatizes this benefit: "${b || p}". Show the product delivering that benefit in a clear, believable way. Keep the product identical, clean and premium look, seamless loop.`;
        } else {
          movimiento = MOVIMIENTOS.find((m) => m.id === "giro")?.prompt;
        }
      }
      const resp = await fetch("/api/landing/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: producto.imagen_url, userId: user?.id, seccion: "producto", motionPrompt: movimiento }),
      });
      const data = await resp.json();
      if (data.videoUrl) setVideoUrl(data.videoUrl);
      else setError(data.error || "No se pudo generar el video.");
    } catch {
      setError("Error de conexión al generar el video.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <a href="/landing" className="text-yellow-400 text-sm font-bold hover:text-orange-500 transition-colors">← Volver a Landing</a>

      <div className="mt-4 bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-5 md:p-7">
        <div className="text-center mb-5">
          <div className="text-4xl mb-2">🎬</div>
          <h1 className="text-2xl font-black text-white">Video del producto</h1>
          <p className="text-yellow-400 text-sm mt-1">Anima la foto de tu producto en un clip corto</p>
        </div>

        {!producto || !producto.imagen_url ? (
          <div className="text-center py-8">
            <p className="text-zinc-400 text-sm leading-relaxed mb-5">Necesito la foto de un producto para animarla. Activa una campaña con foto y vuelve aquí.</p>
            <a href="/campaigns" className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-black px-6 py-3 rounded-xl text-sm transition-colors">➕ Ir a Campañas</a>
          </div>
        ) : (
          <>
            <p className="text-zinc-500 text-xs leading-relaxed mb-4 text-center">
              Producto: <span className="text-white font-bold">{producto.nombre}</span>.
              Funciona mejor con fotos <span className="text-purple-300 font-bold">sin personas</span> (fal no anima caras de gente real).
            </p>

            <div className="rounded-xl overflow-hidden border border-[#1a1a1a] bg-black mb-4">
              {videoUrl ? (
                <video src={videoUrl} autoPlay loop muted playsInline controls className="w-full max-h-[55vh] object-contain bg-black" />
              ) : (
                <img src={producto.imagen_url} className="w-full max-h-[55vh] object-contain bg-black" />
              )}
            </div>

            {/* Selector de efecto: primero los enfocados en el beneficio, luego movimiento */}
            <p className="text-yellow-400 text-[10px] font-bold uppercase tracking-widest mb-2">🎯 Vende el beneficio</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              {MOVIMIENTOS.filter((m) => m.grupo === "beneficio").map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMovSel(m.id)}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-lg border text-[11px] font-bold transition-colors ${
                    movSel === m.id
                      ? "bg-purple-500/20 border-purple-500 text-purple-200"
                      : "bg-[#111] border-[#1a1a1a] text-zinc-400 hover:border-[#333]"
                  }`}
                >
                  <span className="text-lg leading-none">{m.emoji}</span>
                  {m.label}
                </button>
              ))}
            </div>

            <p className="text-yellow-400 text-[10px] font-bold uppercase tracking-widest mb-2">👥 Con personas</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              {MOVIMIENTOS.filter((m) => m.grupo === "personas").map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMovSel(m.id)}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-lg border text-[11px] font-bold transition-colors ${
                    movSel === m.id
                      ? "bg-purple-500/20 border-purple-500 text-purple-200"
                      : "bg-[#111] border-[#1a1a1a] text-zinc-400 hover:border-[#333]"
                  }`}
                >
                  <span className="text-lg leading-none">{m.emoji}</span>
                  {m.label}
                </button>
              ))}
            </div>

            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-2">Movimiento simple</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              {MOVIMIENTOS.filter((m) => m.grupo === "movimiento").map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMovSel(m.id)}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-lg border text-[11px] font-bold transition-colors ${
                    movSel === m.id
                      ? "bg-purple-500/20 border-purple-500 text-purple-200"
                      : "bg-[#111] border-[#1a1a1a] text-zinc-400 hover:border-[#333]"
                  }`}
                >
                  <span className="text-lg leading-none">{m.emoji}</span>
                  {m.label}
                </button>
              ))}
            </div>

            {error && <p className="text-red-400 text-xs leading-snug mb-4 text-center">{error}</p>}

            {cargando ? (
              <div className="w-full bg-[#111] border border-purple-500/30 text-purple-300 text-sm font-bold py-4 rounded-xl text-center">
                ⟳ Generando video... (hasta 1 minuto, no cierres esta página)
              </div>
            ) : videoUrl ? (
              <div className="space-y-3">
                {/* Poner el video en una seccion de la landing */}
                <div className="bg-[#0d0d0d] border border-purple-500/30 rounded-xl p-3">
                  <p className="text-purple-300 text-[11px] font-bold uppercase tracking-widest mb-2">Ponlo en tu landing</p>
                  <select value={seccionSel} onChange={(e) => { setSeccionSel(e.target.value); setGuardadoEn(null); }} className="w-full bg-[#111] border border-[#1a1a1a] text-white text-sm px-3 py-2.5 rounded-lg outline-none mb-2">
                    {secciones.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                  </select>
                  {guardadoEn ? (
                    <div className="w-full bg-green-500/15 border border-green-500/40 text-green-400 text-sm font-bold py-2.5 rounded-lg text-center">✓ Puesto en "{guardadoEn}". Vuelve a Landing para verlo.</div>
                  ) : (
                    <button onClick={ponerEnSeccion} className="w-full bg-purple-500 hover:bg-purple-600 text-white text-sm font-bold py-2.5 rounded-lg transition-colors">✅ Poner en esta sección</button>
                  )}
                </div>

                <button onClick={descargar} className="w-full bg-[#111] border border-purple-500/30 text-purple-300 text-sm font-bold py-3 rounded-xl active:scale-95 transition-transform">⬇ Descargar video</button>
                <button onClick={generar} className="w-full bg-[#111] border border-[#1a1a1a] text-zinc-400 text-sm font-bold py-3 rounded-xl active:scale-95 transition-transform">↻ Generar otro</button>
              </div>
            ) : (
              <button onClick={generar} className="w-full bg-purple-500 hover:bg-purple-600 text-white text-sm font-bold py-4 rounded-xl transition-colors">🎬 Generar video</button>
            )}

            <p className="text-zinc-600 text-[10px] leading-snug mt-4 text-center">El clip se guarda en tu almacenamiento y lo puedes descargar. Cada generación tiene un costo pequeño.</p>

            <a href="/landing" className="block w-full text-center mt-3 bg-[#111] border border-[#1a1a1a] text-yellow-400 text-sm font-bold py-3 rounded-xl hover:border-[#333] transition-colors">← Volver a Landing</a>
          </>
        )}
      </div>
    </div>
  );
}
