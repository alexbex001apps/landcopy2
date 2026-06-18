"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { FONDOS_DISPONIBLES } from "@/app/api/landing/imagen/route";
import SinCampana from "@/components/SinCampana";
 
 
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
}
 
const SECCIONES_INDIVIDUAL = [
  { id: "hero", nombre: "Hero", sub: "Titular + foto + CTA" },
  { id: "problema", nombre: "El problema", sub: "Dolor amplificado" },
  { id: "solucion", nombre: "La solución", sub: "Producto como respuesta" },
  { id: "beneficios", nombre: "Beneficios", sub: "3 íconos + texto" },
  { id: "como_funciona", nombre: "Cómo funciona", sub: "3 pasos simples" },
  { id: "testimonios", nombre: "Testimonios", sub: "Prueba social" },
  { id: "oferta", nombre: "Oferta", sub: "Precio + urgencia" },
  { id: "cta_final", nombre: "CTA final", sub: "Cierre de venta" },
];
 
const SECCIONES_COMBO = [
  { id: "hero", nombre: "Hero", sub: "3 fotos + titular" },
  { id: "problema", nombre: "El problema", sub: "Dolor amplificado" },
  { id: "kit", nombre: "Qué incluye el kit", sub: "Card por producto" },
  { id: "solucion", nombre: "La solución", sub: "El kit como respuesta" },
  { id: "beneficios", nombre: "Beneficios", sub: "3 íconos + texto" },
  { id: "como_funciona", nombre: "Cómo funciona", sub: "3 pasos simples" },
  { id: "testimonios", nombre: "Testimonios", sub: "Prueba social" },
  { id: "oferta", nombre: "Oferta combo", sub: "Precio del kit" },
  { id: "cta_final", nombre: "CTA final", sub: "Cierre de venta" },
];
 
// Comprime una imagen (data:base64) a JPG liviano (~100-150KB) en el navegador.
// JPG funciona en TODOS los navegadores. Si algo falla, devuelve la imagen original sin romper.
function comprimirJPG(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    try {
      if (!dataUrl || !dataUrl.startsWith("data:")) { resolve(dataUrl); return; }
      const img = new window.Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) { resolve(dataUrl); return; }
          // Fondo blanco (JPG no tiene transparencia)
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          let calidad = 0.72;
          let out = canvas.toDataURL("image/jpeg", calidad);
          // baja calidad hasta acercarse a ~110KB (base64 abulta ~37%), sin pasar de 0.4
          while (out.length > 110 * 1024 * 1.37 && calidad > 0.4) {
            calidad -= 0.1;
            out = canvas.toDataURL("image/jpeg", calidad);
          }
          // si por lo que sea salió vacío o raro, usa la original
          if (!out || out.length < 1000) { resolve(dataUrl); return; }
          resolve(out);
        } catch {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    } catch {
      resolve(dataUrl);
    }
  });
}
 
export default function Landing() {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [sinCampaña, setSinCampaña] = useState(false);
  const [paso, setPaso] = useState(1);
  const [seccionesSeleccionadas, setSeccionesSeleccionadas] = useState<string[]>([]);
  const [vistaMovil, setVistaMovil] = useState(false);
  const [seccionActiva, setSeccionActiva] = useState("hero");
  const [contenido, setContenido] = useState<Record<string, string>>({});
  const [generando, setGenerando] = useState(false);
  const [seccionGenerando, setSeccionGenerando] = useState<string | null>(null);
  const [imagenes, setImagenes] = useState<Record<string, string>>({});
  const [imagenGenerando, setImagenGenerando] = useState<string[]>([]);
  const [seccionesParaImagen, setSeccionesParaImagen] = useState<string[]>([]);
  const [fondoSeleccionado, setFondoSeleccionado] = useState<string | null>(null);
  const [mostrarFondos, setMostrarFondos] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [guardandoSeccion, setGuardandoSeccion] = useState(false);
  const [fNombre, setFNombre] = useState("");
  const [fProducto, setFProducto] = useState("");
  const [fProblema, setFProblema] = useState("");
  const [fBeneficio, setFBeneficio] = useState("");
  const [fPrecioOferta, setFPrecioOferta] = useState("");
  const [fPrecioAnterior, setFPrecioAnterior] = useState("");
  const [fPais, setFPais] = useState("Colombia");
  const [fTono, setFTono] = useState("Urgente");
  const [fImagen1, setFImagen1] = useState<string | null>(null);
  const [fImagen2, setFImagen2] = useState<string | null>(null);
  const [fImagen3, setFImagen3] = useState<string | null>(null);
  const [fIdentificando, setFIdentificando] = useState(false);
  const [editandoTexto, setEditandoTexto] = useState(false);
  const [textoEditado, setTextoEditado] = useState("");
  const [editandoImagen, setEditandoImagen] = useState(false);
  const [instruccionImagen, setInstruccionImagen] = useState("");
  const [aplicandoEdicion, setAplicandoEdicion] = useState(false);
 
  
  const supabase = createClient();
 
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) window.location.href = "/login";
    });
    const c = sessionStorage.getItem("campaign_activa");
    if (c) setCampaign(JSON.parse(c));
    const savedImagenes = sessionStorage.getItem("landing_imagenes");
    if (savedImagenes) setImagenes(JSON.parse(savedImagenes));
    const savedContenido = sessionStorage.getItem("landing_contenido");
    if (savedContenido) { setContenido(JSON.parse(savedContenido)); setPaso(3); }
    const generandoRaw = sessionStorage.getItem("landing_generando");
    if (generandoRaw) {
      let lista: string[] = [];
      try { lista = JSON.parse(generandoRaw); } catch { lista = [generandoRaw]; }
      if (!Array.isArray(lista)) lista = [String(lista)];
      if (lista.length > 0) {
        setImagenGenerando(lista);
        setPaso(3);
        const intervalo = setInterval(() => {
          const raw = sessionStorage.getItem("landing_generando");
          let actual: string[] = [];
          try { actual = raw ? JSON.parse(raw) : []; } catch { actual = raw ? [raw] : []; }
          if (!Array.isArray(actual)) actual = [String(actual)];
          const imgs = sessionStorage.getItem("landing_imagenes");
          if (imgs) setImagenes(JSON.parse(imgs));
          setImagenGenerando(actual);
          if (actual.length === 0) clearInterval(intervalo);
        }, 1000);
      }
    }
  }, []);
 
  const [ordenSecciones, setOrdenSecciones] = useState<typeof SECCIONES_INDIVIDUAL>([]);

  useEffect(() => {
    const base = campaign?.es_combo ? SECCIONES_COMBO : SECCIONES_INDIVIDUAL;
    const guardado = sessionStorage.getItem("landing_orden");
    if (guardado) {
      try {
        const orden = JSON.parse(guardado);
        const valido = orden.length === base.length && base.every(b => orden.some((o: { id: string }) => o.id === b.id));
        setOrdenSecciones(valido ? orden : base);
      } catch { setOrdenSecciones(base); }
    } else {
      setOrdenSecciones(base);
    }
  }, [campaign]);

  const secciones = ordenSecciones.length > 0 ? ordenSecciones : (campaign?.es_combo ? SECCIONES_COMBO : SECCIONES_INDIVIDUAL);
 
  const COLORES_LANDING = [
    { id: "negro", hex: "#111111", texto: "#ffffff" },
    { id: "marino", hex: "#0a3a52", texto: "#ffffff" },
    { id: "celeste", hex: "#7ec8e3", texto: "#0a2530" },
    { id: "naranja", hex: "#ff5000", texto: "#ffffff" },
    { id: "rojo", hex: "#c0392b", texto: "#ffffff" },
    { id: "rosa", hex: "#e8b4c4", texto: "#4a2730" },
    { id: "lavanda", hex: "#b9abd9", texto: "#2e2640" },
    { id: "verde", hex: "#0f6e56", texto: "#ffffff" },
    { id: "morado", hex: "#7a1f5c", texto: "#ffffff" },
    { id: "beige", hex: "#d9c8a9", texto: "#403828" },
    { id: "gris", hex: "#1a1a1a", texto: "#ffffff" },
    { id: "hueso", hex: "#f4f1ea", texto: "#2a2620" },
  ];

  const FUENTES_LANDING = [
    { id: "sistema", nombre: "Sistema", css: "system-ui, -apple-system, sans-serif" },
    { id: "poppins", nombre: "Poppins", css: "'Poppins', sans-serif" },
    { id: "montserrat", nombre: "Montserrat", css: "'Montserrat', sans-serif" },
    { id: "playfair", nombre: "Playfair Display", css: "'Playfair Display', serif" },
    { id: "lobster", nombre: "Lobster", css: "'Lobster', cursive" },
    { id: "oswald", nombre: "Oswald", css: "'Oswald', sans-serif" },
    { id: "bebas", nombre: "Bebas Neue", css: "'Bebas Neue', sans-serif" },
    { id: "pacifico", nombre: "Pacifico", css: "'Pacifico', cursive" },
    { id: "anton", nombre: "Anton", css: "'Anton', sans-serif" },
    { id: "dancing", nombre: "Dancing Script", css: "'Dancing Script', cursive" },
    { id: "caveat", nombre: "Caveat", css: "'Caveat', cursive" },
    { id: "righteous", nombre: "Righteous", css: "'Righteous', sans-serif" },
    { id: "archivo", nombre: "Archivo Black", css: "'Archivo Black', sans-serif" },
    { id: "fredoka", nombre: "Fredoka", css: "'Fredoka', sans-serif" },
    { id: "baloo", nombre: "Baloo 2", css: "'Baloo 2', sans-serif" },
    { id: "sora", nombre: "Sora", css: "'Sora', sans-serif" },
    { id: "outfit", nombre: "Outfit", css: "'Outfit', sans-serif" },
    { id: "bricolage", nombre: "Bricolage Grotesque", css: "'Bricolage Grotesque', sans-serif" },
  ];

  const [fuenteLanding, setFuenteLanding] = useState("sistema");

  useEffect(() => {
    const guardada = sessionStorage.getItem("landing_fuente");
    if (guardada) setFuenteLanding(guardada);
  }, []);

  const elegirFuente = (id: string) => {
    setFuenteLanding(id);
    try { sessionStorage.setItem("landing_fuente", id); } catch {}
  };

  const [whatsappNum, setWhatsappNum] = useState("");

  useEffect(() => {
    const guardado = sessionStorage.getItem("landing_whatsapp");
    if (guardado) setWhatsappNum(guardado);
  }, []);

  const cambiarWhatsapp = (v: string) => {
    setWhatsappNum(v);
    try { sessionStorage.setItem("landing_whatsapp", v); } catch {}
  };

  const TAMANOS_LANDING = [
    { id: "chico", nombre: "Chico", px: 14 },
    { id: "normal", nombre: "Normal", px: 16 },
    { id: "grande", nombre: "Grande", px: 20 },
    { id: "xl", nombre: "XL", px: 24 },
  ];

  const [tamanoLanding, setTamanoLanding] = useState("normal");

  useEffect(() => {
    const guardado = sessionStorage.getItem("landing_tamano");
    if (guardado) setTamanoLanding(guardado);
  }, []);

  const elegirTamano = (id: string) => {
    setTamanoLanding(id);
    try { sessionStorage.setItem("landing_tamano", id); } catch {}
  };

  const [colorLanding, setColorLanding] = useState("negro");

  useEffect(() => {
    const guardado = sessionStorage.getItem("landing_color");
    if (guardado) setColorLanding(guardado);
  }, []);

  const elegirColor = (id: string) => {
    setColorLanding(id);
    try { sessionStorage.setItem("landing_color", id); } catch {}
  };

  const [arrastrando, setArrastrando] = useState<number | null>(null);

  const soltarEn = (destino: number) => {
    if (arrastrando === null || arrastrando === destino) { setArrastrando(null); return; }
    setOrdenSecciones(prev => {
      const copia = [...prev];
      const [movida] = copia.splice(arrastrando, 1);
      copia.splice(destino, 0, movida);
      try { sessionStorage.setItem("landing_orden", JSON.stringify(copia)); } catch {}
      return copia;
    });
    setArrastrando(null);
  };

  const toggleSeccion = (id: string) => {
    setSeccionesSeleccionadas(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };
 
  const toggleSeccionParaImagen = (id: string) => {
    setSeccionesParaImagen(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };
 
  const generarImagenesSeleccionadas = () => {
    const lista = [...seccionesParaImagen];
    setSeccionesParaImagen([]);
    lista.forEach(id => { generarImagen(id); });
  };
 
  const handleImagen = (e: React.ChangeEvent<HTMLInputElement>, slot: 1 | 2 | 3) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const b = reader.result as string;
      if (slot === 1) setFImagen1(b);
      if (slot === 2) setFImagen2(b);
      if (slot === 3) setFImagen3(b);
    };
    reader.readAsDataURL(file);
  };
 
  const identificarProducto = async () => {
    if (!fImagen1) return;
    setFIdentificando(true);
    try {
      const resp = await fetch("/api/campaigns/identificar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imagen: fImagen1 }),
      });
      const data = await resp.json();
      if (data.nombre) setFNombre(data.nombre);
      if (data.producto) setFProducto(data.producto);
      if (data.problema) setFProblema(data.problema);
      if (data.beneficio) setFBeneficio(data.beneficio);
    } catch {}
    setFIdentificando(false);
  };
 
  const datosActivos = campaign ? {
    nombre: campaign.nombre,
    producto: campaign.producto,
    problema: campaign.problema,
    beneficio: campaign.beneficio,
    precioOferta: campaign.precio_oferta,
    precioAnterior: campaign.precio_anterior,
    pais: campaign.pais,
    tono: campaign.tono,
    headline: campaign.headline,
    imagen_url: campaign.imagen_url,
    imagen_url_2: campaign.imagen_url_2,
    imagen_url_3: campaign.imagen_url_3,
    es_combo: campaign.es_combo,
  } : {
    nombre: fNombre,
    producto: fProducto,
    problema: fProblema,
    beneficio: fBeneficio,
    precioOferta: fPrecioOferta,
    precioAnterior: fPrecioAnterior,
    pais: fPais,
    tono: fTono,
    headline: "",
    imagen_url: fImagen1,
    imagen_url_2: fImagen2,
    imagen_url_3: fImagen3,
    es_combo: !!(fImagen2 || fImagen3),
  };
 
  const generarLanding = async () => {
    setGenerando(true);
    setPaso(2);
    const todasSecciones = campaign?.es_combo ? SECCIONES_COMBO : SECCIONES_INDIVIDUAL;
    const seccionesAGenerar = seccionesSeleccionadas.length > 0
      ? todasSecciones.filter(s => seccionesSeleccionadas.includes(s.id))
      : todasSecciones;
    for (const s of seccionesAGenerar) {
      setSeccionGenerando(s.id);
      try {
        const resp = await fetch("/api/landing/generar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ seccion: s.id, ...datosActivos }),
        });
        const data = await resp.json();
        if (data.texto) setContenido(prev => ({ ...prev, [s.id]: data.texto }));
      } catch {}
    }
    setSeccionGenerando(null);
    setGenerando(false);
    setPaso(3);
  };
 
  const marcarGenerando = (seccionId: string) => {
    try {
      const raw = sessionStorage.getItem("landing_generando");
      let lista: string[] = [];
      try { lista = raw ? JSON.parse(raw) : []; } catch { lista = raw ? [raw] : []; }
      if (!Array.isArray(lista)) lista = [String(lista)];
      if (!lista.includes(seccionId)) lista.push(seccionId);
      sessionStorage.setItem("landing_generando", JSON.stringify(lista));
    } catch {}
  };
 
  const desmarcarGenerando = (seccionId: string) => {
    try {
      const raw = sessionStorage.getItem("landing_generando");
      let lista: string[] = [];
      try { lista = raw ? JSON.parse(raw) : []; } catch { lista = raw ? [raw] : []; }
      if (!Array.isArray(lista)) lista = [String(lista)];
      lista = lista.filter(x => x !== seccionId);
      if (lista.length > 0) sessionStorage.setItem("landing_generando", JSON.stringify(lista));
      else sessionStorage.removeItem("landing_generando");
    } catch {}
  };
 
  const generarImagen = async (seccionId: string, soloTitulos = false) => {
    setImagenGenerando(prev => prev.includes(seccionId) ? prev : [...prev, seccionId]);
    marcarGenerando(seccionId);
    try {
      const resp = await fetch("/api/landing/imagen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seccion: seccionId, ...datosActivos, fondoId: fondoSeleccionado, soloTitulos, textoEditado: contenido[seccionId] || "" }),
      });
      const data = await resp.json();
      if (data.imageUrl) {
        let urlFinal = data.imageUrl;
        if (data.imageUrl.startsWith("data:")) {
          // Comprimir a JPG liviano antes de subir (carga rápida en móvil)
          const comprimida = await comprimirJPG(data.imageUrl);
          try {
            const { data: { user } } = await supabase.auth.getUser();
            const blob = await fetch(comprimida).then(r => r.blob());
            const path = `${user?.id}/${Date.now()}_${seccionId}.jpg`;
            await supabase.storage.from("biblioteca-images").upload(path, blob, { contentType: "image/jpeg" });
            const { data: urlData } = supabase.storage.from("biblioteca-images").getPublicUrl(path);
            urlFinal = urlData.publicUrl;
          } catch { urlFinal = comprimida; }
        }
        try {
          const guardadas = JSON.parse(sessionStorage.getItem("landing_imagenes") || "{}");
          guardadas[seccionId] = urlFinal;
          sessionStorage.setItem("landing_imagenes", JSON.stringify(guardadas));
        } catch {}
        setImagenes(prev => ({ ...prev, [seccionId]: urlFinal }));
      }
    } catch {}
    desmarcarGenerando(seccionId);
    setImagenGenerando(prev => prev.filter(x => x !== seccionId));
  };
 
  const generarHTML = () => {
    const col = COLORES_LANDING.find(c => c.id === colorLanding) || COLORES_LANDING[0];
    const fnt = FUENTES_LANDING.find(f => f.id === fuenteLanding) || FUENTES_LANDING[0];
    const tam = TAMANOS_LANDING.find(t => t.id === tamanoLanding) || TAMANOS_LANDING[1];
    const linkFuente = fnt.id === "sistema" ? "" : `<link href="https://fonts.googleapis.com/css2?family=${fnt.nombre.replace(/ /g, "+")}:wght@400;700&display=swap" rel="stylesheet">`;
    const conContenido = secciones.filter(s => contenido[s.id] || imagenes[s.id]);
    const posBtn = [0, Math.floor(conContenido.length / 2), conContenido.length - 1];
    const bloques = conContenido
      .map((s, i) => {
        const img = imagenes[s.id] ? `<img class="lc-img" src="${imagenes[s.id]}" alt="${s.nombre}">` : "";
        const limpio = (contenido[s.id] || "").replace(/\*\*/g, "").replace(/^\s*(TITULAR|SUBTITULO|SUBTÍTULO|CTA|FRASE|PASO\s*\d+|BENEFICIO\s*\d+|TESTIMONIO\s*\d+|HERO|PROBLEMA|SOLUCION|SOLUCIÓN|CIERRE|GARANTIA|GARANTÍA|CÓMO FUNCIONA|COMO FUNCIONA|OFERTA)\s*:?\s*/gim, "").replace(/\n{2,}/g, "\n").trim();
        const conPipes = limpio.replace(/^(.+?)\s*\|\s*(.+)$/gim, "<strong>$1</strong><br>$2");
        const txt = contenido[s.id] ? `<div class="lc-txt"><p>${conPipes.replace(/\n/g, "<br>")}</p></div>` : "";
        const msg = encodeURIComponent(`Hola, quiero comprar ${datosActivos.nombre || datosActivos.producto || "el producto"}`);
        const btn = (whatsappNum && posBtn.includes(i)) ? `<div class="lc-cta"><a class="lc-btn" href="https://wa.me/${whatsappNum.replace(/[^0-9]/g, "")}?text=${msg}">Comprar ahora</a><div class="lc-sello">🚚 PAGO CONTRA ENTREGA</div></div>` : "";
        return `  <section class="lc-sec">${img}${txt}${btn}</section>`;
      })
      .join("\n");
    const msgMenu = encodeURIComponent(`Hola, quiero comprar ${datosActivos.nombre || datosActivos.producto || "el producto"}`);
    const menu = `  <header class="lc-menu"><span class="lc-marca">${datosActivos.nombre || datosActivos.producto || "Mi producto"}</span>${whatsappNum ? `<a class="lc-menu-btn" href="https://wa.me/${whatsappNum.replace(/[^0-9]/g, "")}?text=${msgMenu}">Comprar</a>` : ""}</header>`;
    return `<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">${linkFuente}<div class="lc-landing">${menu}
  <style>
    .lc-landing{max-width:560px;margin:0 auto;font-family:${fnt.css};color:${col.texto};line-height:1.5;background:${col.hex}}
    .lc-landing *{box-sizing:border-box;margin:0}
    .lc-menu{display:flex;align-items:center;justify-content:space-between;padding:14px 20px;background:${col.hex};position:sticky;top:0;z-index:999}
    .lc-marca{font-size:18px;font-weight:600;letter-spacing:0.02em}
    .lc-menu-btn{background:#25d366;color:#fff;font-size:13px;font-weight:600;padding:8px 18px;border-radius:20px;text-decoration:none}
    .lc-sec{display:block}
    .lc-img{width:100%;display:block}
    .lc-txt{background:${col.hex};padding:16px 20px;text-align:center}
    .lc-txt p{font-size:${tam.px}px;color:${col.texto};font-weight:500}
    .lc-cta{text-align:center;padding:0 20px 22px;background:${col.hex}}
    .lc-btn{display:inline-block;background:#25d366;color:#fff;font-size:15px;font-weight:700;padding:11px 32px;border-radius:12px;text-decoration:none;box-shadow:0 4px 0 #1ba34d;font-family:system-ui,-apple-system,sans-serif}
    .lc-menu-btn,.lc-sello{font-family:system-ui,-apple-system,sans-serif}
    .lc-sello{display:block;margin-top:12px;color:${col.texto};opacity:0.85;font-size:12px;font-weight:600;letter-spacing:0.06em}
    .lc-footer{background:rgba(0,0,0,0.35);padding:40px 24px 32px;text-align:center}
    .lc-foot-marca{font-size:22px;font-weight:600;margin-bottom:8px;letter-spacing:0.02em}
    .lc-foot-sub{font-size:13px;opacity:0.6;margin-bottom:22px;max-width:300px;margin-left:auto;margin-right:auto}
    .lc-foot-sello{display:inline-block;font-size:12px;color:#fff;font-weight:600;margin-bottom:12px;background:#25d366;padding:7px 16px;border-radius:20px}
    .lc-foot-copy{font-size:10px;opacity:0.5}
    @media(max-width:480px){.lc-txt{padding:13px 16px}.lc-txt p{font-size:14px}}
  </style>
${bloques}
  <footer class="lc-footer">
    <p class="lc-foot-marca">${datosActivos.nombre || datosActivos.producto || "Mi producto"}</p>
    ${datosActivos.beneficio ? `<p class="lc-foot-sub">${datosActivos.beneficio}</p>` : ""}
    <p class="lc-foot-sello"><span>Envío gratis</span> · <span>Pago contra entrega</span></p>
    <p class="lc-foot-copy">© 2026 ${datosActivos.nombre || datosActivos.producto || "Mi producto"}</p>
  </footer>
</div></body></html>`;
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };
 
  const guardarSeccionEnBiblioteca = async (seccionId: string) => {
    const imagenBase64 = imagenes[seccionId];
    const textoSeccion = contenido[seccionId];
    if (!imagenBase64 && !textoSeccion) return;
    setGuardandoSeccion(true);
    const producto = datosActivos.producto || "Producto";
    const seccionNombre = secciones.find(s => s.id === seccionId)?.nombre || seccionId;
    const nombre = `${producto} — ${seccionNombre}`;
    const { data: { user } } = await supabase.auth.getUser();
    let imageUrl: string | null = null;
    if (imagenBase64 && imagenBase64.startsWith("http")) {
      imageUrl = imagenBase64;
    } else if (imagenBase64 && imagenBase64.startsWith("data:")) {
      try {
        const blob = await fetch(imagenBase64).then(r => r.blob());
        const path = `${user?.id}/${Date.now()}_${seccionId}.png`;
        await supabase.storage.from("biblioteca-images").upload(path, blob, { contentType: "image/png" });
        const { data: urlData } = supabase.storage.from("biblioteca-images").getPublicUrl(path);
        imageUrl = urlData.publicUrl;
      } catch {}
    }
    await fetch("/api/biblioteca", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo: "imagen",
        modulo: "landing",
        nombre,
        producto,
        contenido: textoSeccion || null,
        imagen_url: imageUrl,
        metadata: { seccion: seccionId, fondo: fondoSeleccionado },
      }),
    });
    setGuardandoSeccion(false);
    sessionStorage.removeItem("biblioteca_items");
    showToast(`✓ ${seccionNombre} guardada en Biblioteca`);
  };
 
  
  const [linkPublicado, setLinkPublicado] = useState("");
  const [publicando, setPublicando] = useState(false);

  const publicarLanding = async () => {
    setPublicando(true);
    try {
      const html = generarHTML();
      const { data: { user } } = await supabase.auth.getUser();
      const resp = await fetch("/api/publicar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: datosActivos.nombre || datosActivos.producto, html, userId: user?.id }),
      });
      const data = await resp.json();
      if (data.id) {
        setLinkPublicado(`${window.location.origin}/v/${data.id}`);
      }
    } catch {}
    setPublicando(false);
  };

  const guardarEnBiblioteca = async () => {
    const seccionesConContenido = secciones.filter(s => contenido[s.id] || imagenes[s.id]);
    if (seccionesConContenido.length === 0) return;
    const producto = datosActivos.producto || "Producto";
    const nombre = `${producto} — Landing completa`;
    const { data: { user } } = await supabase.auth.getUser();
    let heroUrl: string | null = null;
    if (imagenes["hero"] && imagenes["hero"].startsWith("data:")) {
      try {
        const blob = await fetch(imagenes["hero"]).then(r => r.blob());
        const path = `${user?.id}/${Date.now()}_hero.png`;
        await supabase.storage.from("biblioteca-images").upload(path, blob, { contentType: "image/png" });
        const { data: urlData } = supabase.storage.from("biblioteca-images").getPublicUrl(path);
        heroUrl = urlData.publicUrl;
      } catch {}
    } else {
      heroUrl = imagenes["hero"] || null;
    }
    await fetch("/api/biblioteca", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo: "landing", modulo: "landing", nombre, producto,
        contenido: JSON.stringify({ secciones: contenido }),
        imagen_url: heroUrl,
        metadata: { secciones: Object.keys(contenido) },
      }),
    });
    sessionStorage.removeItem("biblioteca_items");
    showToast("✓ Landing guardada en Biblioteca");
  };
 
  useEffect(() => {
    if (Object.keys(imagenes).length > 0) {
      sessionStorage.setItem("landing_imagenes", JSON.stringify(imagenes));
    }
  }, [imagenes]);
 
  useEffect(() => {
    if (Object.keys(contenido).length > 0) {
      sessionStorage.setItem("landing_contenido", JSON.stringify(contenido));
    }
  }, [contenido]);
  const guardarTextoEditado = () => {
    setContenido(prev => ({ ...prev, [seccionActiva]: textoEditado }));
    setEditandoTexto(false);
    showToast("✓ Texto actualizado");
  };

  const editarImagenIA = async () => {
    if (!instruccionImagen.trim() || !imagenes[seccionActiva]) return;
    setAplicandoEdicion(true);
    marcarGenerando(seccionActiva);
    setImagenGenerando(prev => prev.includes(seccionActiva) ? prev : [...prev, seccionActiva]);
    try {
      const resp = await fetch("/api/landing/imagen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seccion: seccionActiva, ...datosActivos, fondoId: fondoSeleccionado, imagenPrevia: imagenes[seccionActiva], promptPropio: instruccionImagen }),
      });
      const data = await resp.json();
      if (data.imageUrl) {
        let urlFinal = data.imageUrl;
        if (data.imageUrl.startsWith("data:")) {
          const comprimida = await comprimirJPG(data.imageUrl);
          try {
            const { data: { user } } = await supabase.auth.getUser();
            const blob = await fetch(comprimida).then(r => r.blob());
            const path = `${user?.id}/${Date.now()}_${seccionActiva}_edit.jpg`;
            await supabase.storage.from("biblioteca-images").upload(path, blob, { contentType: "image/jpeg" });
            const { data: urlData } = supabase.storage.from("biblioteca-images").getPublicUrl(path);
            urlFinal = urlData.publicUrl;
          } catch { urlFinal = comprimida; }
        }
        try {
          const guardadas = JSON.parse(sessionStorage.getItem("landing_imagenes") || "{}");
          guardadas[seccionActiva] = urlFinal;
          sessionStorage.setItem("landing_imagenes", JSON.stringify(guardadas));
        } catch {}
        setImagenes(prev => ({ ...prev, [seccionActiva]: urlFinal }));
        setInstruccionImagen("");
        setEditandoImagen(false);
        showToast("✓ Imagen actualizada");
      }
    } catch {}
    desmarcarGenerando(seccionActiva);
    setImagenGenerando(prev => prev.filter(x => x !== seccionActiva));
    setAplicandoEdicion(false);
  };
  const regenerarSeccion = async (seccionId: string) => {
    setSeccionGenerando(seccionId);
    try {
      const resp = await fetch("/api/landing/generar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seccion: seccionId, ...datosActivos }),
      });
      const data = await resp.json();
      if (data.texto) setContenido(prev => ({ ...prev, [seccionId]: data.texto }));
    } catch {}
    setSeccionGenerando(null);
  };
 
  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <style>{`@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } } @keyframes shimmerBtn { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
 
      {toast && (
        <div className="fixed bottom-6 right-6 bg-green-500 text-white text-sm font-bold px-4 py-3 rounded-xl shadow-lg z-50">
          {toast}
        </div>
      )}
 
      <div className="max-w-[1400px] mx-auto px-4 pt-16 pb-0">
        <div className="flex flex-col md:flex-row items-center mb-0">
          <div className="flex items-center justify-center gap-2 flex-shrink-0 mb-3 md:mb-0 md:w-[160px]">
            <div className="w-[56px] h-[56px] md:w-[72px] md:h-[72px] rounded-full bg-[#001a0a] border border-[#2a2a2a] flex items-center justify-center flex-shrink-0">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="md:w-[38px] md:h-[38px]">
                <rect x="4" y="6" width="24" height="18" rx="2" stroke="white" strokeWidth="1.5" fill="white" fillOpacity="0.1"/>
                <rect x="4" y="6" width="24" height="5" rx="2" fill="white" fillOpacity="0.4"/>
                <circle cx="8" cy="8.5" r="1" fill="white"/>
                <circle cx="11" cy="8.5" r="1" fill="white"/>
                <rect x="8" y="14" width="8" height="5" rx="1" fill="white" fillOpacity="0.5"/>
                <line x1="18" y1="14" x2="24" y2="14" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="18" y1="17" x2="24" y2="17" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="text-white text-[14px] font-bold tracking-[0.12em] uppercase">Landing</p>
            {datosActivos.imagen_url && (
              <img src={datosActivos.imagen_url} className="w-16 h-16 md:w-20 md:h-20 object-contain rounded-lg bg-[#111] border border-[#1a1a1a] ml-2" />
            )}
          </div>
          <div className="flex-1 text-center md:px-5">
            <div className="inline-flex items-center gap-2 bg-orange-500 text-white text-[9px] font-bold px-3 py-1 rounded-full mb-2 tracking-widest">
              IA GENERATIVA · LANDING DE VENTAS
            </div>
            <h1 className="text-lg md:text-xl font-black text-white mb-1 px-2">
              Crea páginas que <span style={{color:"#f97316"}}>venden</span> y <span style={{color:"#22c55e"}}>convierten</span>
            </h1>
            <p className="text-yellow-400 text-[11px] px-2">Producto · sección · fondo · la IA genera la landing completa lista para publicar</p>
          </div>
          <div className="flex-shrink-0 hidden md:block" style={{width:"160px"}}></div>
        </div>
      </div>
 
      <div className="flex bg-[#1a1a1a] border-t border-b border-[#2a2a2a] mt-4">
        {[
          { n: 1, label: "Paso 1 — Tu producto", sub: "Datos o campaña" },
          { n: 2, label: "Paso 2 — Generando", sub: "Secciones con IA" },
          { n: 3, label: "Paso 3 — Resultado", sub: "Descarga o comparte" },
        ].map((s) => (
          <div key={s.n} onClick={() => { if (s.n < paso || (s.n === 3 && Object.keys(contenido).length > 0) || (s.n === 2 && (seccionesSeleccionadas.length > 0 || Object.keys(contenido).length > 0))) setPaso(s.n); }} className={`flex-1 flex items-center justify-center gap-1 md:gap-2 px-1 md:px-4 py-3 border-r border-[#2a2a2a] last:border-r-0 relative ${s.n < paso || (s.n === 3 && Object.keys(contenido).length > 0) || (s.n === 2 && (seccionesSeleccionadas.length > 0 || Object.keys(contenido).length > 0)) ? "cursor-pointer hover:bg-[#1a1a1a]" : ""}`}>
            <div className={`w-[22px] h-[22px] rounded flex items-center justify-center text-[11px] font-black flex-shrink-0 ${paso === s.n ? "bg-orange-500 text-white" : paso > s.n ? "bg-green-500 text-white" : "bg-[#2a2a2a] text-[#555]"}`}>
              {paso > s.n ? "✓" : s.n}
            </div>
            <div>
              <div className={`text-[9px] md:text-[10px] font-bold tracking-widest uppercase ${paso === s.n ? "text-orange-500" : paso > s.n ? "text-green-400" : "text-yellow-400"}`}>{s.label}</div>
              <div className="text-[8px] md:text-[9px] text-yellow-400 mt-0.5 hidden sm:block">{s.sub}</div>
            </div>
            {paso === s.n && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-orange-500" />}
          </div>
        ))}
      </div>
 
      <div className="max-w-[1400px] mx-auto px-4 pb-12 mt-6">
 
       {paso === 1 && !campaign && !sinCampaña && (
          <SinCampana />
        )}
 
        {paso === 1 && campaign && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-[#0d1a0a] border border-[#22c55e30] rounded-xl p-4 flex flex-col sm:flex-row items-center gap-3 mb-6">
              <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0 hidden sm:block"></div>
              <div className="flex gap-2">
                {campaign.imagen_url && <img src={campaign.imagen_url} className="w-16 h-16 object-contain rounded-lg bg-[#111]" />}
                {campaign.imagen_url_2 && <img src={campaign.imagen_url_2} className="w-8 h-8 object-contain rounded-lg bg-[#111]" />}
                {campaign.imagen_url_3 && <img src={campaign.imagen_url_3} className="w-8 h-8 object-contain rounded-lg bg-[#111]" />}
              </div>
              <div className="flex-1 text-center sm:text-left">
                <p className="text-[9px] text-green-400 uppercase tracking-widest mb-0.5">Campaña activa {campaign.es_combo && <span className="bg-orange-500/20 text-orange-400 px-1 rounded ml-1">COMBO</span>}</p>
                <p className="text-white text-base font-bold">{campaign.nombre}</p>
                <p className="text-zinc-500 text-[10px]">{campaign.precio_oferta && `$${campaign.precio_oferta}`} · {campaign.pais} · {campaign.tono}</p>
                {campaign.beneficio && <p className="text-yellow-400 text-[11px] mt-1 leading-snug">✓ {campaign.beneficio}</p>}
                {campaign.problema && <p className="text-zinc-400 text-[10px] mt-0.5 leading-snug">Resuelve: {campaign.problema}</p>}
                {campaign.precio_anterior && <p className="text-zinc-500 text-[10px] mt-0.5">Antes: <s>${campaign.precio_anterior}</s>{campaign.precio_oferta && ` → Ahora: $${campaign.precio_oferta}`}</p>}
              </div>
              <div className="flex flex-wrap justify-center gap-2 items-center">
                {Object.keys(contenido).length > 0 && <button onClick={() => setPaso(3)} className="text-[9px] bg-green-500 text-black font-bold px-3 py-1.5 rounded-lg">→ Ver resultado</button>}
                <a href="/campaigns" className="text-[9px] text-zinc-500 border border-[#333] px-3 py-1.5 rounded-lg hover:border-[#555]">Cambiar</a>
                <button onClick={() => { sessionStorage.removeItem("campaign_activa"); sessionStorage.removeItem("landing_contenido"); sessionStorage.removeItem("landing_imagenes"); sessionStorage.removeItem("landing_generando"); window.location.reload(); }} className="text-[9px] text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg hover:border-red-500">✕ Quitar campaña</button>
              </div>
            </div>
 
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-4 md:p-6 mb-6">
              <p className="text-yellow-400 text-[9px] font-bold uppercase tracking-wider mb-3">Selecciona las secciones a generar</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                {secciones.map(s => (
                  <div key={s.id} onClick={() => toggleSeccion(s.id)} className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${seccionesSeleccionadas.includes(s.id) ? "border-green-500 bg-green-500/10" : "border-[#1a1a1a] hover:border-[#333]"}`}>
                    <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${seccionesSeleccionadas.includes(s.id) ? "bg-green-500 border-green-500" : "border-[#444]"}`}>
                      {seccionesSeleccionadas.includes(s.id) && <span className="text-black text-[9px] font-black">✓</span>}
                    </div>
                    <div>
                      <p className="text-[10px] text-[#f0ead6] font-bold">{s.nombre}</p>
                      <p className="text-[10px] text-yellow-400">{s.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={generarLanding} disabled={seccionesSeleccionadas.length === 0} className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed text-black font-black py-3 rounded-xl text-sm transition-colors">
                ⚡ Generar {seccionesSeleccionadas.length} sección{seccionesSeleccionadas.length !== 1 ? "es" : ""} seleccionada{seccionesSeleccionadas.length !== 1 ? "s" : ""}
              </button>
            </div>
          </div>
        )}
 
        {paso === 1 && sinCampaña && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-4 md:p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-orange-500 text-[10px] font-bold tracking-widest uppercase">Datos del producto</p>
                <p className="text-zinc-600 text-[9px]">Al terminar puedes guardar como campaña</p>
              </div>
              <p className="text-yellow-400 text-[9px] font-bold uppercase tracking-wider mb-2">Foto del producto</p>
              <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6">
                {[1,2,3].map(slot => (
                  <div key={slot} className="relative">
                    <label className={`flex flex-col items-center justify-center w-full h-[90px] border-2 border-dashed rounded-xl cursor-pointer transition-colors ${slot === 1 ? "border-orange-500/50 hover:border-orange-500" : "border-[#222] hover:border-[#444]"}`}>
                      {(slot === 1 ? fImagen1 : slot === 2 ? fImagen2 : fImagen3) ? (
                        <img src={slot === 1 ? fImagen1! : slot === 2 ? fImagen2! : fImagen3!} className="w-full h-full object-contain rounded-xl" />
                      ) : (
                        <>
                          <span className="text-xl mb-1">📷</span>
                          <span className="text-[8px] text-zinc-500 text-center px-1">{slot === 1 ? "Principal *" : `Combo ${slot}`}</span>
                        </>
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={e => handleImagen(e, slot as 1|2|3)} />
                    </label>
                    {slot === 1 && fImagen1 && (
                      <button onClick={identificarProducto} disabled={fIdentificando} className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[8px] font-bold px-3 py-1 rounded-full whitespace-nowrap">
                        {fIdentificando ? "⏳..." : "🔍 Identificar"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-yellow-400 text-[9px] font-bold uppercase tracking-wider">Nombre del producto *</label>
                  <input value={fNombre} onChange={e => setFNombre(e.target.value)} className="w-full mt-1 bg-[#f0ead6] text-black text-sm px-3 py-2 rounded-lg outline-none" placeholder="Ej: Rodillax" />
                </div>
                <div>
                  <label className="text-yellow-400 text-[9px] font-bold uppercase tracking-wider">Beneficio principal</label>
                  <input value={fBeneficio} onChange={e => setFBeneficio(e.target.value)} className="w-full mt-1 bg-[#f0ead6] text-black text-sm px-3 py-2 rounded-lg outline-none" placeholder="Se llena solo con 🔍" />
                </div>
                <div>
                  <label className="text-yellow-400 text-[9px] font-bold uppercase tracking-wider">Problema que resuelve</label>
                  <input value={fProblema} onChange={e => setFProblema(e.target.value)} className="w-full mt-1 bg-[#f0ead6] text-black text-sm px-3 py-2 rounded-lg outline-none" placeholder="Se llena solo con 🔍" />
                </div>
                <div>
                  <label className="text-yellow-400 text-[9px] font-bold uppercase tracking-wider">Precio oferta</label>
                  <input value={fPrecioOferta} onChange={e => setFPrecioOferta(e.target.value)} className="w-full mt-1 bg-[#f0ead6] text-black text-sm px-3 py-2 rounded-lg outline-none" placeholder="49.000" />
                </div>
                <div>
                  <label className="text-yellow-400 text-[9px] font-bold uppercase tracking-wider">Precio anterior</label>
                  <input value={fPrecioAnterior} onChange={e => setFPrecioAnterior(e.target.value)} className="w-full mt-1 bg-[#f0ead6] text-black text-sm px-3 py-2 rounded-lg outline-none" placeholder="89.000" />
                </div>
                <div>
                  <label className="text-yellow-400 text-[9px] font-bold uppercase tracking-wider">País</label>
                  <select value={fPais} onChange={e => setFPais(e.target.value)} className="w-full mt-1 bg-[#f0ead6] text-black text-sm px-3 py-2 rounded-lg outline-none">
                    {["Colombia","México","Venezuela","Ecuador","Costa Rica","General"].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                <button onClick={generarLanding} disabled={!fNombre.trim()} className="flex-1 bg-green-500 hover:bg-green-600 disabled:opacity-40 text-black font-black py-3 rounded-xl text-sm transition-colors">
                  ⚡ Generar landing ahora
                </button>
                <button className="border border-orange-500/40 text-orange-400 font-bold px-4 py-3 rounded-xl text-sm hover:border-orange-500 transition-colors">
                  💾 Guardar como campaña
                </button>
              </div>
            </div>
          </div>
        )}
 
        {paso === 2 && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-4 md:p-6">
              <p className="text-green-400 text-[10px] font-bold tracking-widest uppercase mb-4">Generando landing...</p>
              <div className="space-y-2">
                {secciones.map(s => (
                  <div key={s.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${contenido[s.id] ? "border-green-500/30 bg-green-500/5" : seccionGenerando === s.id ? "border-orange-500/30 bg-orange-500/5" : "border-[#1a1a1a]"}`}>
                    <div className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${contenido[s.id] ? "bg-green-500 text-white" : seccionGenerando === s.id ? "bg-orange-500 text-white" : "bg-[#1a1a1a] text-zinc-600"}`}>
                      {contenido[s.id] ? "✓" : seccionGenerando === s.id ? "⟳" : "·"}
                    </div>
                    <div>
                      <p className="text-white text-[11px] font-bold">{s.nombre}</p>
                      <p className="text-yellow-400 text-[9px] font-bold">{s.sub}</p>
                    </div>
                    {contenido[s.id] && <span className="ml-auto text-green-400 text-[9px] font-bold">Listo</span>}
                    {seccionGenerando === s.id && <span className="ml-auto text-orange-400 text-[9px] font-bold">Generando...</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
 
        {paso === 3 && (
          <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_200px] gap-4">
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-3">
              <div className="flex items-center justify-between mb-3">
                <p className="text-orange-500 text-[9px] font-bold tracking-widest uppercase">{secciones.length} Secciones</p>
                <p className="text-zinc-600 text-[8px]">🖼 marca para imagen</p>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-1">
                {secciones.map((s, idx) => (
                  <div key={s.id} draggable onDragStart={() => setArrastrando(idx)} onDragOver={(e) => e.preventDefault()} onDrop={() => soltarEn(idx)} onClick={() => setSeccionActiva(s.id)} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${arrastrando === idx ? "opacity-40" : ""} ${seccionActiva === s.id ? "border-orange-500/40 bg-orange-500/5" : "border-transparent hover:border-[#1a1a1a]"}`}>
                    <div className="text-zinc-600 cursor-grab active:cursor-grabbing flex-shrink-0 text-[12px] leading-none select-none" title="Arrastra para reordenar">⠿</div>
                    <div onClick={(e) => { e.stopPropagation(); toggleSeccionParaImagen(s.id); }} className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all ${seccionesParaImagen.includes(s.id) ? "bg-orange-500 border-orange-500" : "border-[#333] hover:border-orange-500/60"}`}>
                      {seccionesParaImagen.includes(s.id) && <span className="text-white text-[9px] font-black">✓</span>}
                    </div>
                    <div className={`w-4 h-4 rounded text-[8px] font-bold flex items-center justify-center flex-shrink-0 ${contenido[s.id] ? "bg-green-500 text-white" : "bg-[#1a1a1a] text-zinc-600"}`}>
                      {contenido[s.id] ? "✓" : "·"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-[10px] font-bold truncate">{s.nombre}</p>
                      <p className="text-yellow-400 text-[10px] font-bold truncate">{s.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 space-y-1.5">
                {seccionesParaImagen.length > 0 && (
                  <button onClick={generarImagenesSeleccionadas} className="w-full bg-orange-500 hover:bg-orange-600 text-white text-[12px] font-black py-2.5 rounded-lg active:scale-95 transition-transform">
                    ⚡ Generar imágenes ({seccionesParaImagen.length})
                  </button>
                )}
                <button onClick={() => generarLanding()} className="w-full bg-[#111] border border-[#1a1a1a] text-yellow-400 text-[12px] font-bold py-2.5 rounded-lg active:scale-95 transition-transform">↻ Regenerar todo</button>
                <button onClick={() => { setContenido({}); setSeccionesSeleccionadas([]); setPaso(1); }} className="w-full border border-red-500/20 text-red-400 text-[12px] font-bold py-2.5 rounded-lg active:scale-95 transition-transform">🗑️ Borrar todo</button>
              </div>
            </div>
 
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-[#1a1a1a]">
                <div className="flex gap-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                </div>
                <div className="flex-1 bg-[#111] border border-[#1a1a1a] rounded px-2 py-1 text-[9px] text-yellow-400 truncate">
                  landcopy2.vercel.app/p/{datosActivos.producto?.toLowerCase().replace(/\s+/g, '-') || 'landing'}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setVistaMovil(false)} className={`text-[8px] font-bold px-2 py-1 rounded transition-colors ${!vistaMovil ? "bg-orange-500 text-white" : "text-zinc-500 border border-[#1a1a1a]"}`}>Desktop</button>
                  <button onClick={() => setVistaMovil(true)} className={`text-[8px] font-bold px-2 py-1 rounded transition-colors ${vistaMovil ? "bg-orange-500 text-white" : "text-zinc-500 border border-[#1a1a1a]"}`}>Móvil</button>
                </div>
              </div>
              <div className="p-4 overflow-y-auto max-h-screen">
                {secciones.map(s => (
                  <div key={s.id} onClick={() => setSeccionActiva(s.id)} className={`mb-3 p-3 rounded-xl border cursor-pointer transition-all ${seccionActiva === s.id ? "border-orange-500" : "border-[#1a1a1a] hover:border-[#333]"}`}>
                    <p className="text-[10px] text-green-400 font-bold uppercase tracking-widest mb-1">{s.nombre}</p>
                    {imagenGenerando.includes(s.id) ? (
                      <div className="w-full h-48 rounded-lg mb-2 overflow-hidden relative">
                        <div className="absolute inset-0 bg-[#1a1a1a]"></div>
                        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-[#ffffff08] to-transparent" style={{backgroundSize:"200% 100%", animation:"shimmer 1.5s infinite"}}></div>
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                          <p className="text-orange-400 text-[9px] font-bold">Creando imagen con IA...</p>
                        </div>
                      </div>
                    ) : imagenes[s.id] ? (
                      <img src={imagenes[s.id]} className="w-full rounded-lg mb-2 max-h-96 object-contain" />
                    ) : null}
                    {contenido[s.id] ? (
                      <p className="text-[#f0ead6] text-[10px] leading-relaxed line-clamp-3">{contenido[s.id]}</p>
                    ) : (
                      <p className="text-yellow-400 text-[10px] italic font-bold">Sin generar</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
 
            <div className="space-y-3 lg:max-h-[calc(100vh-100px)] lg:overflow-y-auto lg:sticky lg:top-4 pr-1">
              <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-3">
                <p className="text-orange-500 text-[9px] font-bold tracking-widest uppercase mb-2">{secciones.find(s => s.id === seccionActiva)?.nombre}</p>
                <div className="space-y-1.5">
                  <button onClick={() => regenerarSeccion(seccionActiva)} disabled={seccionGenerando === seccionActiva} className="w-full bg-[#111] border border-[#1a1a1a] text-yellow-400 text-[12px] font-bold py-2.5 rounded-lg disabled:opacity-40 active:scale-95 transition-transform">
                    {seccionGenerando === seccionActiva ? "⟳ Generando..." : "↻ Regenerar sección"}
                  </button>
                  <button onClick={() => { if (editandoTexto) { setEditandoTexto(false); } else { setTextoEditado(contenido[seccionActiva] || ""); setEditandoTexto(true); } }} className="w-full bg-[#111] border border-[#1a1a1a] text-yellow-400 text-[12px] font-bold py-2.5 rounded-lg active:scale-95 transition-transform">✎ Editar texto</button>
                  {editandoTexto && (
                    <div className="bg-[#0d0d0d] border border-yellow-500/30 rounded-lg p-2 space-y-2">
                      <textarea value={textoEditado} onChange={e => setTextoEditado(e.target.value)} rows={5} className="w-full bg-[#111] border border-[#1a1a1a] text-[#f0ead6] text-[11px] px-2 py-2 rounded-lg outline-none resize-none" placeholder="Edita el texto de esta sección..." />
                      <div className="flex gap-1.5">
                        <button onClick={() => setEditandoTexto(false)} className="flex-1 border border-[#1a1a1a] text-zinc-500 text-[11px] font-bold py-2 rounded-lg">Cancelar</button>
                        <button onClick={guardarTextoEditado} className="flex-1 bg-yellow-500 text-black text-[11px] font-bold py-2 rounded-lg">Guardar texto</button>
                      </div>
                    </div>
                  )}
                  <button onClick={() => generarImagen(seccionActiva)} disabled={imagenGenerando.includes(seccionActiva)} className="w-full bg-[#111] border border-[#1a1a1a] text-yellow-400 text-[12px] font-bold py-2.5 rounded-lg disabled:opacity-40 active:scale-95 relative overflow-hidden" style={{backgroundImage: !imagenGenerando.includes(seccionActiva) ? "linear-gradient(90deg, transparent 0%, rgba(255,200,0,0.15) 50%, transparent 100%)" : "none", backgroundSize:"200% 100%", animation: !imagenGenerando.includes(seccionActiva) ? "shimmerBtn 2.5s infinite" : "none"}}>
                    {imagenGenerando.includes(seccionActiva) ? "⟳ Generando imagen..." : "🖼️ Generar imagen"}
                  </button>
                  <button onClick={() => generarImagen(seccionActiva, true)} disabled={imagenGenerando.includes(seccionActiva)} className="w-full bg-[#0d0d0d] border border-orange-500/30 text-orange-400 text-[12px] font-bold py-2.5 rounded-lg disabled:opacity-40 active:scale-95 transition-transform">
                    🏷️ Generar solo títulos
                  </button>
                  <button onClick={() => guardarSeccionEnBiblioteca(seccionActiva)} disabled={guardandoSeccion || (!imagenes[seccionActiva] && !contenido[seccionActiva])} className="w-full bg-[#111] border border-[#1a1a1a] text-yellow-400 text-[12px] font-bold py-2.5 rounded-lg active:scale-95 transition-transform disabled:opacity-40">
                    {guardandoSeccion ? "⟳ Guardando..." : "💾 Guardar sección"}
                  </button>
                  {imagenes[seccionActiva] && (
                    <button onClick={() => setEditandoImagen(!editandoImagen)} className="w-full bg-[#111] border border-cyan-500/30 text-cyan-400 text-[12px] font-bold py-2.5 rounded-lg active:scale-95 transition-transform">🖌️ Editar con IA</button>
                  )}
                  {editandoImagen && imagenes[seccionActiva] && (
                    <div className="bg-[#0d0d0d] border border-cyan-500/30 rounded-lg p-2 space-y-2">
                      <textarea value={instruccionImagen} onChange={e => setInstruccionImagen(e.target.value)} rows={3} className="w-full bg-[#111] border border-[#1a1a1a] text-[#f0ead6] text-[11px] px-2 py-2 rounded-lg outline-none resize-none" placeholder="Dile a la IA qué cambiar: 'título en amarillo' · 'precio más grande' · 'más luz al producto'" />
                      <div className="flex gap-1.5">
                        <button onClick={() => setEditandoImagen(false)} className="flex-1 border border-[#1a1a1a] text-zinc-500 text-[11px] font-bold py-2 rounded-lg">Cancelar</button>
                        <button onClick={editarImagenIA} disabled={aplicandoEdicion || !instruccionImagen.trim()} className="flex-1 bg-cyan-500 text-black text-[11px] font-bold py-2 rounded-lg disabled:opacity-40">{aplicandoEdicion ? "⟳ Aplicando..." : "Aplicar"}</button>
                      </div>
                    </div>
                  )}
                  {imagenes[seccionActiva] && (
                    <button onClick={() => { setImagenes(prev => { const n = {...prev}; delete n[seccionActiva]; sessionStorage.setItem("landing_imagenes", JSON.stringify(n)); return n; }); }} className="w-full bg-[#111] border border-red-500/20 text-red-400 text-[12px] font-bold py-2.5 rounded-lg active:scale-95 transition-transform">🗑️ Quitar imagen</button>
                  )}
                  <button className="w-full bg-[#111] border border-[#1a1a1a] text-zinc-600 text-[12px] font-bold py-2.5 rounded-lg active:scale-95 transition-transform">👁️ Ocultar</button>
                </div>
              </div>
 
              <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-3">
                <p className="text-yellow-400 text-[9px] font-bold uppercase tracking-wider mb-2">Fondo de imagen</p>
                <button onClick={() => setMostrarFondos(!mostrarFondos)} className="w-full flex items-center justify-between bg-[#111] border border-[#1a1a1a] px-3 py-2 rounded-lg mb-2">
                  <div className="flex items-center gap-2">
                    {fondoSeleccionado && <div className="w-4 h-4 rounded flex-shrink-0" style={{ background: FONDOS_DISPONIBLES.find(f => f.id === fondoSeleccionado)?.color }}></div>}
                    <span className="text-[10px] text-white">{fondoSeleccionado ? FONDOS_DISPONIBLES.find(f => f.id === fondoSeleccionado)?.nombre : "Sin fondo específico"}</span>
                  </div>
                  <span className="text-yellow-400 text-[10px]">{mostrarFondos ? "▲" : "▼"}</span>
                </button>
                {mostrarFondos && (
                  <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                    <div onClick={() => { setFondoSeleccionado(null); setMostrarFondos(false); }} className="flex items-center gap-2 px-3 py-2 hover:bg-[#1a1a1a] cursor-pointer border-b border-[#1a1a1a]">
                      <div className="w-5 h-5 rounded border border-[#333] flex-shrink-0"></div>
                      <span className="text-[10px] text-zinc-500">Sin fondo específico</span>
                    </div>
                   {["Universal","Belleza","Tecnología","Hogar","Deporte","Infantil","Decorativo","Lifestyle","Ocasiones"].map(cat => (
                      <div key={cat}>
                        <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest px-3 py-1 bg-[#080808]">{cat}</p>
                        {FONDOS_DISPONIBLES.filter(f => f.categoria === cat).map(f => (
                          <div key={f.id} onClick={() => { setFondoSeleccionado(f.id); setMostrarFondos(false); }} className={`flex items-center gap-2 px-3 py-2 hover:bg-[#1a1a1a] cursor-pointer ${fondoSeleccionado === f.id ? "bg-[#1a1a1a]" : ""}`}>
                            <div className="w-5 h-5 rounded flex-shrink-0" style={{ background: f.color }}></div>
                            <span className="text-[10px] text-[#f0ead6]">{f.nombre}</span>
                            {fondoSeleccionado === f.id && <span className="ml-auto text-yellow-400 text-[9px]">✓</span>}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
 
              <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-3">
                <p className="text-orange-500 text-[9px] font-bold tracking-widest uppercase mb-2">Publicar</p>
                <div className="mb-3">
                  <p className="text-yellow-400 text-[9px] font-bold uppercase tracking-wider mb-2">WhatsApp para vender</p>
                  <input value={whatsappNum} onChange={e => cambiarWhatsapp(e.target.value)} placeholder="57 300 123 4567" className="w-full bg-[#f0ead6] text-black text-[12px] px-2.5 py-2 rounded-lg outline-none" />
                  <p className="text-zinc-600 text-[9px] mt-1">Con código de país, sin + ni espacios</p>
                </div>
                <div className="mb-3">
                  <p className="text-yellow-400 text-[9px] font-bold uppercase tracking-wider mb-2">Color de la landing</p>
                  <div className="flex flex-wrap gap-1.5">
                    {COLORES_LANDING.map(c => (
                      <button key={c.id} onClick={() => elegirColor(c.id)} title={c.id} className={`w-6 h-6 rounded-md transition-all ${colorLanding === c.id ? "ring-2 ring-yellow-400 ring-offset-1 ring-offset-[#0a0a0a]" : "border border-[#333] hover:scale-110"}`} style={{ background: c.hex }}></button>
                    ))}
                  </div>
                </div>
                <div className="mb-3">
                  <p className="text-yellow-400 text-[9px] font-bold uppercase tracking-wider mb-2">Tamaño del texto</p>
                  <div className="flex gap-1.5">
                    {TAMANOS_LANDING.map(t => (
                      <button key={t.id} onClick={() => elegirTamano(t.id)} className={`flex-1 py-1.5 rounded-lg border transition-all ${tamanoLanding === t.id ? "border-yellow-400 bg-yellow-400/10 text-yellow-400" : "border-[#1a1a1a] text-zinc-400 hover:border-[#333]"}`} style={{ fontSize: `${Math.min(t.px - 3, 15)}px` }}>{t.nombre}</button>
                    ))}
                  </div>
                </div>
                <div className="mb-3">
                  <p className="text-yellow-400 text-[9px] font-bold uppercase tracking-wider mb-2">Tipo de letra</p>
                  <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                    {FUENTES_LANDING.map(f => (
                      <button key={f.id} onClick={() => elegirFuente(f.id)} className={`w-full text-left px-2.5 py-1.5 rounded-lg border transition-all ${fuenteLanding === f.id ? "border-yellow-400 bg-yellow-400/10" : "border-[#1a1a1a] hover:border-[#333]"}`} style={{ fontFamily: f.css }}>
                        <span className="text-[13px] text-[#f0ead6]">{f.nombre}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <button onClick={() => { navigator.clipboard.writeText(generarHTML()); showToast("✓ HTML copiado — pégalo en Shopify"); }} className="w-full bg-yellow-400 hover:bg-yellow-500 text-black text-[12px] font-black py-2.5 rounded-lg transition-all active:scale-95">📋 Copiar HTML</button>
                  <button onClick={() => { const html = generarHTML(); const blob = new Blob([html], { type: "text/html" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `${(datosActivos.producto || "landing").toLowerCase().replace(/\s+/g, "-")}.html`; a.click(); URL.revokeObjectURL(url); showToast("✓ HTML descargado"); }} className="w-full bg-green-500 hover:bg-green-600 text-black text-[12px] font-bold py-2.5 rounded-lg transition-all active:scale-95">⬇ Descargar HTML</button>
                  <button onClick={() => guardarEnBiblioteca()} className="w-full border border-purple-500/40 text-purple-400 text-[12px] font-bold py-2.5 rounded-lg active:scale-95 transition-transform">💾 Guardar en Biblioteca</button>
                <button onClick={publicarLanding} disabled={publicando} className="w-full bg-[#25d366] text-white text-[12px] font-bold py-2.5 rounded-lg active:scale-95 transition-transform disabled:opacity-50 mt-2">{publicando ? "⟳ Publicando..." : "🔗 Publicar y obtener link"}</button>
                {linkPublicado && (
                  <div className="mt-2 bg-[#0e0e0e] border border-[#25d366] rounded-lg p-2.5">
                    <p className="text-zinc-500 text-[9px] mb-1">Tu link:</p>
                    <p className="text-[#25d366] text-[11px] break-all mb-2">{linkPublicado}</p>
                    <button onClick={() => { navigator.clipboard.writeText(linkPublicado); showToast("✓ Link copiado"); }} className="w-full bg-yellow-400 text-black text-[11px] font-bold py-2 rounded-lg">📋 Copiar link</button>
                  </div>
                )}
                  <button onClick={() => { setContenido({}); setSeccionesSeleccionadas([]); setPaso(1); }} className="w-full border border-red-500/20 text-red-400 text-[12px] font-bold py-2.5 rounded-lg active:scale-95 transition-transform">🗑️ Borrar todo</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}