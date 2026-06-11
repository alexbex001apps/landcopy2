"use client";
import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type Modo = "producto" | "negocio" | "marca";
type NivelId = "normal" | "pro" | "class";

type DiaResultado = {
  diaNumero: number;
  diaTitulo: string;
  diaTemp: string;
  concepto?: string;
  textoImagen?: string;
  caption?: string;
  hashtags?: string;
  cargando?: boolean;
  imagen?: string;
  generandoImg?: boolean;
  editando?: boolean;
  editandoImg?: boolean;
  instruccionImg?: string;
};

const NIVELES = [
  {
    id: "normal" as NivelId, nombre: "Normal", dias: 3, subtitulo: "Semana corta para probar", color: "#22c55e",
    redes: ["instagram"],
    incluye: ["1 red a elegir", "3 imágenes (1 por día)", "Caption + hashtags"],
    noIncluye: ["Carrusel", "Guión de video"], badge: null,
  },
  {
    id: "pro" as NivelId, nombre: "Pro", dias: 7, subtitulo: "Semana completa que vende", color: "#ff5000",
    redes: ["instagram", "facebook", "tiktok"],
    incluye: ["3 redes (IG, FB, TikTok)", "7 días frío → caliente", "Carrusel de 5 slides", "Guión de TikTok por día"],
    noIncluye: ["Variantes A/B"], badge: "MÁS USADO",
  },
  {
    id: "class" as NivelId, nombre: "Class", dias: 14, subtitulo: "El mes entero resuelto", color: "#a855f7",
    redes: ["instagram", "facebook", "tiktok", "whatsapp", "story", "shorts"],
    incluye: ["Todas las redes", "Calendario del mes", "Carruseles + Reels + Stories", "Exportar todo en ZIP"],
    noIncluye: [], badge: "PREMIUM",
  },
];

const REDES_INFO: Record<string, { nombre: string; icon: string }> = {
  instagram: { nombre: "Instagram", icon: "📸" },
  facebook: { nombre: "Facebook", icon: "👥" },
  tiktok: { nombre: "TikTok", icon: "🎵" },
  whatsapp: { nombre: "WhatsApp", icon: "💬" },
  story: { nombre: "Stories", icon: "📱" },
  shorts: { nombre: "YT Shorts", icon: "▶️" },
};

const TEMP = {
  frio: { label: "Frío", color: "#0088cc" },
  tibio: { label: "Tibio", color: "#ff8800" },
  caliente: { label: "Caliente", color: "#cc0000" },
};

const PAISES = ["Colombia", "México", "Venezuela", "Costa Rica", "Ecuador", "General"];
const TONOS = ["Urgente", "Emocional", "Cercano", "Confianza", "Premium", "Divertido"];

const DIAS_PRODUCTO = [
  { titulo: "Presentación — engancha", temp: "frio" },
  { titulo: "El problema — agita el dolor", temp: "frio" },
  { titulo: "La solución — tu producto", temp: "tibio" },
  { titulo: "Prueba social — testimonios", temp: "tibio" },
  { titulo: "Beneficios — demostración", temp: "tibio" },
  { titulo: "Oferta — precio y urgencia", temp: "caliente" },
  { titulo: "Último llamado — cierre", temp: "caliente" },
  { titulo: "Recordatorio — escasez", temp: "caliente" },
  { titulo: "Nuevo ángulo — otro beneficio", temp: "tibio" },
  { titulo: "Comparativa — vs. alternativas", temp: "tibio" },
  { titulo: "Historia de cliente", temp: "tibio" },
  { titulo: "Pregunta frecuente resuelta", temp: "frio" },
  { titulo: "Oferta final — última oportunidad", temp: "caliente" },
  { titulo: "Cierre de campaña", temp: "caliente" },
];

const DIAS_NEGOCIO = [
  { titulo: "Bienvenida + horarios", temp: "frio" },
  { titulo: "Detrás de cámara", temp: "frio" },
  { titulo: "Testimonio de cliente", temp: "tibio" },
  { titulo: "Promo de la semana", temp: "caliente" },
  { titulo: "Conoce al equipo", temp: "frio" },
  { titulo: "Últimos cupos / reserva", temp: "caliente" },
  { titulo: "Frase + gracias a clientes", temp: "frio" },
  { titulo: "Producto/servicio estrella", temp: "tibio" },
  { titulo: "Antes / después", temp: "tibio" },
  { titulo: "Tip útil del rubro", temp: "frio" },
  { titulo: "Oferta relámpago", temp: "caliente" },
  { titulo: "Pregunta frecuente", temp: "frio" },
  { titulo: "Novedad / anuncio", temp: "tibio" },
  { titulo: "Cierre de mes + agradecimiento", temp: "caliente" },
];

const DIAS_MARCA = [
  { titulo: "Enseñanza — aporta valor", temp: "frio" },
  { titulo: "Historia personal — conecta", temp: "frio" },
  { titulo: "Cita poderosa — inspira", temp: "frio" },
  { titulo: "Detrás de cámara — humaniza", temp: "frio" },
  { titulo: "Testimonio de seguidor", temp: "tibio" },
  { titulo: "Pregunta a tu comunidad", temp: "tibio" },
  { titulo: "Lanzamiento — tu libro/música/evento", temp: "caliente" },
  { titulo: "Lección aprendida — tu caída y cambio", temp: "frio" },
  { titulo: "Mini-tutorial / consejo práctico", temp: "tibio" },
  { titulo: "Detrás del proceso creativo", temp: "frio" },
  { titulo: "Invitación al evento / live", temp: "caliente" },
  { titulo: "Responde una duda frecuente", temp: "tibio" },
  { titulo: "Reflexión del día", temp: "frio" },
  { titulo: "Llamado final — únete / adquiere", temp: "caliente" },
];

export default function RedesCampanas() {
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) window.location.href = "/login";
    });
    try {
      const e = JSON.parse(sessionStorage.getItem("redescamp_estado") || "{}");
      if (e.modo) setModo(e.modo);
      if (e.nivelId) setNivelId(e.nivelId);
      if (e.pais) setPais(e.pais);
      if (e.tono) setTono(e.tono);
      if (e.pNombre) setPNombre(e.pNombre);
      if (e.pImagen) setPImagen(e.pImagen);
      if (e.pPrecioOferta) setPPrecioOferta(e.pPrecioOferta);
      if (e.pPrecioAnterior) setPPrecioAnterior(e.pPrecioAnterior);
      if (e.pBeneficio) setPBeneficio(e.pBeneficio);
      if (e.pProblema) setPProblema(e.pProblema);
      if (e.nNombre) setNNombre(e.nNombre);
      if (e.nFotos) setNFotos(e.nFotos);
      if (e.nOfrece) setNOfrece(e.nOfrece);
      if (e.nCiudad) setNCiudad(e.nCiudad);
      if (e.mNombre) setMNombre(e.mNombre);
      if (e.mFotos) setMFotos(e.mFotos);
      if (e.mQueHace) setMQueHace(e.mQueHace);
      if (e.mPromociona) setMPromociona(e.mPromociona);
      if (e.mCiudad) setMCiudad(e.mCiudad);
      if (e.mMensaje) setMMensaje(e.mMensaje);
      if (e.mPilares) setMPilares(e.mPilares);
      if (e.mVoz) setMVoz(e.mVoz);
      if (e.mHistorias) setMHistorias(e.mHistorias);
      if (e.resultado) setResultado(e.resultado.map((r: DiaResultado) => ({ ...r, cargando: false, generandoImg: false, editandoImg: false })));
    } catch {}
  }, []);

  const [modo, setModo] = useState<Modo>("producto");
  const [nivelId, setNivelId] = useState<NivelId>("pro");

  const [pNombre, setPNombre] = useState("");
  const [pImagen, setPImagen] = useState<string | null>(null);
  const [pPrecioOferta, setPPrecioOferta] = useState("");
  const [pPrecioAnterior, setPPrecioAnterior] = useState("");
  const [pBeneficio, setPBeneficio] = useState("");
  const [pProblema, setPProblema] = useState("");
  const [pIdentificando, setPIdentificando] = useState(false);

  const [nNombre, setNNombre] = useState("");
  const [nFotos, setNFotos] = useState<string[]>([]);
  const [nOfrece, setNOfrece] = useState("");
  const [nCiudad, setNCiudad] = useState("");
  const [nIdentificando, setNIdentificando] = useState(false);

  const [mNombre, setMNombre] = useState("");
  const [mFotos, setMFotos] = useState<string[]>([]);
  const [mQueHace, setMQueHace] = useState("");
  const [mPromociona, setMPromociona] = useState("");
  const [mCiudad, setMCiudad] = useState("");
  const [mMensaje, setMMensaje] = useState("");
  const [mPilares, setMPilares] = useState("");
  const [mVoz, setMVoz] = useState("");
  const [mHistorias, setMHistorias] = useState("");
  const [mIdentificando, setMIdentificando] = useState(false);

  const [pais, setPais] = useState("Colombia");
  const [tono, setTono] = useState("Urgente");
  const [toast, setToast] = useState("");

  const [generando, setGenerando] = useState(false);
  const [resultado, setResultado] = useState<DiaResultado[]>([]);
  const [guardandoTodo, setGuardandoTodo] = useState(false);

  const pFileRef = useRef<HTMLInputElement>(null);
  const nFileRef = useRef<HTMLInputElement>(null);
  const mFileRef = useRef<HTMLInputElement>(null);

  const nivel = NIVELES.find(n => n.id === nivelId)!;
  const plantilla = modo === "producto" ? DIAS_PRODUCTO : modo === "negocio" ? DIAS_NEGOCIO : DIAS_MARCA;
  const dias = plantilla.slice(0, nivel.dias);
  useEffect(() => {
    try {
      const resultadoLimpio = resultado.map(r => ({
        ...r,
        cargando: false,
        generandoImg: false,
        editandoImg: false,
      }));
        const estado = {
        modo, nivelId, pais, tono,
        pNombre, pImagen, pPrecioOferta, pPrecioAnterior, pBeneficio, pProblema,
        nNombre, nFotos, nOfrece, nCiudad,
        mNombre, mFotos, mQueHace, mPromociona, mCiudad, mMensaje, mPilares, mVoz, mHistorias,
        resultado: resultadoLimpio,
      };
      sessionStorage.setItem("redescamp_estado", JSON.stringify(estado));
    } catch {}
  }, [modo, nivelId, pais, tono, pNombre, pImagen, pPrecioOferta, pPrecioAnterior, pBeneficio, pProblema, nNombre, nFotos, nOfrece, nCiudad, mNombre, mFotos, mQueHace, mPromociona, mCiudad, mMensaje, mPilares, mVoz, mHistorias, resultado]);

  function mostrarToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  function comprimir(file: File): Promise<string> {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const img = new Image();
      img.onload = () => {
        const max = 800;
        let w = img.width, h = img.height;
        if (w > max) { h = (h * max) / w; w = max; }
        if (h > max) { w = (w * max) / h; h = max; }
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.src = URL.createObjectURL(file);
    });
  }

  async function handleImagenProducto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPImagen(await comprimir(file));
  }

  async function handleFotosLista(e: React.ChangeEvent<HTMLInputElement>, lista: string[], setLista: (v: string[]) => void) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const espacio = 5 - lista.length;
    const aProcesar = files.slice(0, espacio);
    const nuevas: string[] = [];
    for (const f of aProcesar) nuevas.push(await comprimir(f));
    setLista([...lista, ...nuevas].slice(0, 5));
  }

  async function identificarProducto() {
    if (!pImagen) return;
    setPIdentificando(true);
    try {
      const resp = await fetch("/api/campaigns/identificar", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imagen: pImagen }),
      });
      const data = await resp.json();
      if (data.nombre) setPNombre(data.nombre);
      if (data.producto && !data.nombre) setPNombre(data.producto);
      if (data.problema) setPProblema(data.problema);
      if (data.beneficio) setPBeneficio(data.beneficio);
      mostrarToast("✓ Producto identificado");
    } catch { mostrarToast("No se pudo identificar"); }
    setPIdentificando(false);
  }

  async function identificarRegistrado(fotos: string[], setNom: (v: string) => void, setQue: (v: string) => void, setLoad: (v: boolean) => void, tipo: string) {
    if (fotos.length === 0) return;
    setLoad(true);
    try {
      const resp = await fetch("/api/campaigns/identificar", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imagen: fotos[0] }),
      });
      const data = await resp.json();
      if (data.nombre) setNom(data.nombre);
      if (data.beneficio) setQue(data.beneficio);
      mostrarToast(`✓ ${tipo} identificado`);
    } catch { mostrarToast("No se pudo identificar"); }
    setLoad(false);
  }

  function datosDelModo() {
    const base = { modo, pais, tono, redes: nivel.redes };
    if (modo === "producto") return { ...base, pNombre, pBeneficio, pProblema, pPrecioOferta, pPrecioAnterior };
    if (modo === "negocio") return { ...base, nNombre, nOfrece, nCiudad };
    return { ...base, mNombre, mQueHace, mPromociona, mCiudad, mMensaje, mPilares, mVoz, mHistorias };
  }

  function fotosBase(): string[] {
    if (modo === "producto") return pImagen ? [pImagen] : [];
    if (modo === "negocio") return nFotos;
    return mFotos;
  }
  function hayFoto(): boolean {
    return fotosBase().length > 0;
  }

  async function generarCampana() {
    if (!listo || generando) return;
    setGenerando(true);
    const base: DiaResultado[] = dias.map((d, i) => ({
      diaNumero: i + 1, diaTitulo: d.titulo, diaTemp: d.temp, cargando: true,
    }));
    setResultado(base);
    const datos = datosDelModo();
    for (let i = 0; i < dias.length; i++) {
      const d = dias[i];
      try {
        const resp = await fetch("/api/redes-campanas/generar", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...datos, diaNumero: i + 1, diaTitulo: d.titulo, diaTemp: d.temp }),
        });
        const data = await resp.json();
        setResultado(prev => prev.map((r, idx) => idx === i ? { ...r, ...data, cargando: false } : r));
      } catch {
        setResultado(prev => prev.map((r, idx) => idx === i ? { ...r, cargando: false, caption: "Error al generar este día" } : r));
      }
    }
    setGenerando(false);
    mostrarToast("✓ Campaña generada");
  }

  async function generarImagenDia(i: number) {
    const dia = resultado[i];
    if (!dia || dia.generandoImg) return;
    setResultado(prev => prev.map((r, idx) => idx === i ? { ...r, generandoImg: true } : r));
    try {
      const resp = await fetch("/api/redes-campanas/imagen", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modo, tono,
          diaNumero: dia.diaNumero,
          diaTitulo: dia.diaTitulo,
          diaTemp: dia.diaTemp,
          textoImagen: dia.textoImagen,
          fotos: fotosBase(),
        }),
      });
      const data = await resp.json();
      if (data.imageUrl) {
        setResultado(prev => prev.map((r, idx) => idx === i ? { ...r, imagen: data.imageUrl, generandoImg: false } : r));
        mostrarToast(`✓ Imagen del día ${dia.diaNumero}`);
      } else {
        setResultado(prev => prev.map((r, idx) => idx === i ? { ...r, generandoImg: false } : r));
        mostrarToast("No se pudo generar la imagen");
      }
    } catch {
      setResultado(prev => prev.map((r, idx) => idx === i ? { ...r, generandoImg: false } : r));
      mostrarToast("Error al generar la imagen");
    }
  }

  function toggleEditar(i: number) {
    setResultado(prev => prev.map((r, idx) => idx === i ? { ...r, editando: !r.editando } : r));
  }
  function cambiarCampo(i: number, campo: "textoImagen" | "caption" | "hashtags", valor: string) {
    setResultado(prev => prev.map((r, idx) => idx === i ? { ...r, [campo]: valor } : r));
  }

  function toggleEditarImg(i: number) {
    setResultado(prev => prev.map((r, idx) => idx === i ? { ...r, editandoImg: !r.editandoImg } : r));
  }
  function cambiarInstruccion(i: number, valor: string) {
    setResultado(prev => prev.map((r, idx) => idx === i ? { ...r, instruccionImg: valor } : r));
  }

  async function editarImagenIA(i: number) {
    const dia = resultado[i];
    if (!dia || !dia.imagen || !dia.instruccionImg || dia.generandoImg) return;
    setResultado(prev => prev.map((r, idx) => idx === i ? { ...r, generandoImg: true } : r));
    try {
      const resp = await fetch("/api/redes-campanas/imagen", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diaNumero: dia.diaNumero,
          imagenPrevia: dia.imagen,
          instruccion: dia.instruccionImg,
        }),
      });
      const data = await resp.json();
      if (data.imageUrl) {
        setResultado(prev => prev.map((r, idx) => idx === i ? { ...r, imagen: data.imageUrl, generandoImg: false, editandoImg: false, instruccionImg: "" } : r));
        mostrarToast(`✓ Imagen editada`);
      } else {
        setResultado(prev => prev.map((r, idx) => idx === i ? { ...r, generandoImg: false } : r));
        mostrarToast("No se pudo editar la imagen");
      }
    } catch {
      setResultado(prev => prev.map((r, idx) => idx === i ? { ...r, generandoImg: false } : r));
      mostrarToast("Error al editar la imagen");
    }
  }

  function quitarImagen(i: number) {
    setResultado(prev => prev.map((r, idx) => idx === i ? { ...r, imagen: undefined, editandoImg: false, instruccionImg: "" } : r));
  }

  function comprimirJPG(dataUrl: string): Promise<string> {
    return new Promise((resolve) => {
      try {
        if (!dataUrl || !dataUrl.startsWith("data:")) { resolve(dataUrl); return; }
        const img = new window.Image();
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = img.width; canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            if (!ctx) { resolve(dataUrl); return; }
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            let calidad = 0.72;
            let out = canvas.toDataURL("image/jpeg", calidad);
            while (out.length > 110 * 1024 * 1.37 && calidad > 0.4) {
              calidad -= 0.1; out = canvas.toDataURL("image/jpeg", calidad);
            }
            if (!out || out.length < 1000) { resolve(dataUrl); return; }
            resolve(out);
          } catch { resolve(dataUrl); }
        };
        img.onerror = () => resolve(dataUrl);
        img.src = dataUrl;
      } catch { resolve(dataUrl); }
    });
  }

  function nombreSujeto(): string {
    if (modo === "producto") return pNombre || "Producto";
    if (modo === "negocio") return nNombre || "Negocio";
    return mNombre || "Marca";
  }

  async function subirImagen(supabase: any, imagen: string, diaNumero: number): Promise<string | null> {
    if (!imagen) return null;
    if (imagen.startsWith("http")) return imagen;
    if (!imagen.startsWith("data:")) return null;
    try {
      const comprimida = await comprimirJPG(imagen);
      const { data: { user } } = await supabase.auth.getUser();
      const blob = await fetch(comprimida).then(r => r.blob());
      const path = `${user?.id}/${Date.now()}_redescamp_dia${diaNumero}.jpg`;
      await supabase.storage.from("biblioteca-images").upload(path, blob, { contentType: "image/jpeg" });
      const { data: urlData } = supabase.storage.from("biblioteca-images").getPublicUrl(path);
      return urlData.publicUrl;
    } catch { return null; }
  }

  async function guardarDiaEnBiblioteca(i: number) {
    const dia = resultado[i];
    if (!dia || !dia.imagen) { mostrarToast("Genera la imagen primero"); return; }
    const supabase = createClient();
    const nombre = `${nombreSujeto()} — Día ${dia.diaNumero}`;
    const imageUrl = await subirImagen(supabase, dia.imagen, dia.diaNumero);
    await fetch("/api/biblioteca", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo: "imagen", modulo: "redes-campanas", nombre, producto: nombreSujeto(),
        contenido: dia.caption || null, imagen_url: imageUrl,
        metadata: { dia: dia.diaNumero, tema: dia.diaTitulo, temperatura: dia.diaTemp, hashtags: dia.hashtags, textoImagen: dia.textoImagen },
      }),
    });
    sessionStorage.removeItem("biblioteca_items");
    mostrarToast(`✓ Día ${dia.diaNumero} guardado`);
  }

  async function guardarTodaLaCampana() {
    const conImagen = resultado.filter(r => r.imagen);
    if (conImagen.length === 0) { mostrarToast("Genera imágenes primero"); return; }
    setGuardandoTodo(true);
    const supabase = createClient();
    let guardados = 0;
    for (const dia of conImagen) {
      try {
        const nombre = `${nombreSujeto()} — Día ${dia.diaNumero}`;
        const imageUrl = await subirImagen(supabase, dia.imagen!, dia.diaNumero);
        await fetch("/api/biblioteca", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tipo: "imagen", modulo: "redes-campanas", nombre, producto: nombreSujeto(),
            contenido: dia.caption || null, imagen_url: imageUrl,
            metadata: { dia: dia.diaNumero, tema: dia.diaTitulo, temperatura: dia.diaTemp, hashtags: dia.hashtags, textoImagen: dia.textoImagen },
          }),
        });
        guardados++;
        mostrarToast(`Guardando... ${guardados}/${conImagen.length}`);
      } catch {}
    }
    sessionStorage.removeItem("biblioteca_items");
    setGuardandoTodo(false);
    mostrarToast(`✓ ${guardados} días guardados en Biblioteca`);
  }

  function copiar(texto: string) {
    navigator.clipboard.writeText(texto || "");
    mostrarToast("✓ Copiado");
  }

  function descargar(url: string, nombre: string) {
    const a = document.createElement("a");
    a.href = url; a.download = nombre; a.click();
  }

  const listoProducto = modo === "producto" && pNombre.trim().length > 0;
  const listoNegocio = modo === "negocio" && nNombre.trim().length > 0;
  const listoMarca = modo === "marca" && mNombre.trim().length > 0;
  const listo = listoProducto || listoNegocio || listoMarca;

  const inputCls = "w-full bg-[#f0ead6] border border-[#d4cdb8] text-[#1a1a1a] rounded-md px-3 py-2 text-xs outline-none placeholder-[#888]";
  const areaCls = "w-full bg-[#f0ead6] border border-[#d4cdb8] text-[#1a1a1a] rounded-md px-3 py-2 text-xs outline-none placeholder-[#888] resize-none";
  const labelCls = "text-[10px] font-bold tracking-widest uppercase text-[#FFF500] mb-1 block";
  const modoColor = modo === "producto" ? "#ff5000" : modo === "negocio" ? "#38bdf8" : "#facc15";

  return (
    <div className="min-h-screen bg-[#050505] text-[#F5F0E8]">

      {toast && (
        <div className="fixed bottom-6 right-6 bg-[#FFF500] text-[#0d0d0d] text-sm font-black px-4 py-3 rounded-lg z-50 shadow-lg">{toast}</div>
      )}

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
            <p className="text-white text-[15px] md:text-[18px] font-bold tracking-[0.10em] uppercase leading-tight">Redes ·<br/>Campañas</p>
          </div>
          <div className="flex-1 text-center">
            <div className="inline-flex items-center gap-2 bg-orange-500 text-white text-[9px] font-bold px-3 py-1 rounded-full mb-2 tracking-widest">
              IA GENERATIVA · CAMPAÑAS DE REDES
            </div>
            <h1 className="text-lg md:text-xl font-black text-white mb-1 px-2">
              Lanza campañas completas que <span style={{color:"#cc0000"}}>venden</span> y <span className="text-green-400">viralizan</span>
            </h1>
            <p className="text-yellow-400 text-[11px] px-2">Elige el modo y el nivel · la IA arma los días completos para cada red</p>
          </div>
          <div className="flex-shrink-0 hidden md:block" style={{width:"99px"}}></div>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-4 md:px-6 pb-20 mt-4 space-y-6">

        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-5">
          <span className="text-xs font-bold tracking-widest uppercase text-[#FFF500] mb-3 block">1 · ¿Qué vas a promocionar?</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button onClick={() => setModo("producto")}
              className={`text-left rounded-xl p-4 border transition-all ${modo === "producto" ? "border-orange-500 bg-[rgba(255,80,0,0.07)]" : "border-[#1e1e1e] bg-[#111] hover:border-[#333]"}`}>
              <div className="text-2xl mb-2">📦</div>
              <div className={`text-sm font-black mb-1 ${modo === "producto" ? "text-orange-400" : "text-white"}`}>Un producto</div>
              <div className="text-[10px] text-[#7A7772] leading-snug">Dropshipping o un producto que vendes. La IA crea imágenes del producto.</div>
            </button>
            <button onClick={() => setModo("negocio")}
              className={`text-left rounded-xl p-4 border transition-all ${modo === "negocio" ? "border-cyan-500 bg-[rgba(56,189,248,0.07)]" : "border-[#1e1e1e] bg-[#111] hover:border-[#333]"}`}>
              <div className="text-2xl mb-2">🏪</div>
              <div className={`text-sm font-black mb-1 ${modo === "negocio" ? "text-cyan-400" : "text-white"}`}>Mi negocio local</div>
              <div className="text-[10px] text-[#7A7772] leading-snug">Peluquería, restaurante, tienda. Subes tus fotos y armas tu mes.</div>
            </button>
            <button onClick={() => setModo("marca")}
              className={`text-left rounded-xl p-4 border transition-all ${modo === "marca" ? "border-yellow-400 bg-[rgba(250,204,21,0.07)]" : "border-[#1e1e1e] bg-[#111] hover:border-[#333]"}`}>
              <div className="text-2xl mb-2">⭐</div>
              <div className={`text-sm font-black mb-1 ${modo === "marca" ? "text-yellow-400" : "text-white"}`}>Marca personal</div>
              <div className="text-[10px] text-[#7A7772] leading-snug">Autor, músico, pastor, coach. Date a conocer por tu mensaje y tu obra.</div>
            </button>
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-5">
          <span className="text-xs font-bold tracking-widest uppercase mb-3 block" style={{ color: modoColor }}>
            2 · {modo === "producto" ? "Tu producto" : modo === "negocio" ? "Tu negocio" : "Tu marca personal"}
          </span>

          {modo === "producto" && (
            <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-4">
              <div>
                <span className={labelCls}>Foto del producto</span>
                <div onClick={() => !pImagen && pFileRef.current?.click()}
                  className="bg-[#1e1e1e] border border-dashed border-[#333] rounded-lg p-3 text-center cursor-pointer hover:border-[#FFF500] transition-colors min-h-[150px] flex items-center justify-center">
                  {pImagen ? (
                    <div className="relative inline-block">
                      <img src={pImagen} className="h-32 mx-auto rounded-md object-contain" alt="producto" />
                      <button onClick={(e) => { e.stopPropagation(); setPImagen(null); }}
                        className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">✕</button>
                    </div>
                  ) : (
                    <div>
                      <div className="text-[#FFF500] text-4xl mb-2">📷</div>
                      <div className="text-[#C8C3B7] text-[10px]">Toca para subir</div>
                      <div className="text-[#FFF500] text-[10px] font-bold mt-0.5">GPT-4o Vision lo analiza</div>
                    </div>
                  )}
                </div>
                <input ref={pFileRef} type="file" accept="image/*" onChange={handleImagenProducto} className="hidden" />
                {pImagen && (
                  <button onClick={identificarProducto} disabled={pIdentificando}
                    className="w-full mt-2 bg-orange-500 text-white text-[11px] font-bold py-2 rounded-lg disabled:opacity-40">
                    {pIdentificando ? "⏳ Identificando..." : "🔍 Identificar producto"}
                  </button>
                )}
              </div>
              <div className="space-y-2">
                <div><span className={labelCls}>Nombre del producto *</span>
                  <input value={pNombre} onChange={e => setPNombre(e.target.value)} placeholder="Ej: Rodillax" className={inputCls} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><span className={labelCls}>Precio oferta</span>
                    <input value={pPrecioOferta} onChange={e => setPPrecioOferta(e.target.value)} placeholder="49.000" className={inputCls} /></div>
                  <div><span className={labelCls}>Precio anterior</span>
                    <input value={pPrecioAnterior} onChange={e => setPPrecioAnterior(e.target.value)} placeholder="89.000" className={inputCls} /></div>
                </div>
                <div><span className={labelCls}>Beneficio principal</span>
                  <input value={pBeneficio} onChange={e => setPBeneficio(e.target.value)} placeholder="Se llena solo con 🔍" className={inputCls} /></div>
                <div><span className={labelCls}>Problema que resuelve</span>
                  <input value={pProblema} onChange={e => setPProblema(e.target.value)} placeholder="Se llena solo con 🔍" className={inputCls} /></div>
              </div>
            </div>
          )}

          {modo === "negocio" && (
            <div className="space-y-4">
              <div>
                <span className={labelCls}>Fotos de tu negocio (hasta 5) — local, equipo, productos</span>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {nFotos.map((f, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-[#2a2a2a]">
                      <img src={f} className="w-full h-full object-cover" alt={`foto ${i + 1}`} />
                      <button onClick={() => setNFotos(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">✕</button>
                    </div>
                  ))}
                  {nFotos.length < 5 && (
                    <button onClick={() => nFileRef.current?.click()}
                      className="aspect-square rounded-lg border-2 border-dashed border-cyan-500/40 hover:border-cyan-500 flex flex-col items-center justify-center bg-[rgba(56,189,248,0.04)] transition-colors">
                      <span className="text-cyan-400 text-2xl">＋</span>
                      <span className="text-cyan-400 text-[8px] font-bold">Agregar</span>
                    </button>
                  )}
                </div>
                <input ref={nFileRef} type="file" accept="image/*" multiple onChange={(e) => handleFotosLista(e, nFotos, setNFotos)} className="hidden" />
                {nFotos.length > 0 && (
                  <button onClick={() => identificarRegistrado(nFotos, setNNombre, setNOfrece, setNIdentificando, "Negocio")} disabled={nIdentificando}
                    className="mt-2 bg-cyan-500 text-black text-[11px] font-bold py-2 px-4 rounded-lg disabled:opacity-40">
                    {nIdentificando ? "⏳ Identificando..." : "🔍 Identificar negocio registrado"}
                  </button>
                )}
                <p className="text-[10px] text-[#7A7772] mt-1.5">💡 Registra tu negocio con sus fotos y datos, y la IA llenará todo para las campañas.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div><span className={labelCls}>Nombre del negocio *</span>
                  <input value={nNombre} onChange={e => setNNombre(e.target.value)} placeholder="Ej: Peluquería Maru" className={inputCls} /></div>
                <div><span className={labelCls}>¿Qué ofreces?</span>
                  <input value={nOfrece} onChange={e => setNOfrece(e.target.value)} placeholder="Cortes, color, peinados" className={inputCls} /></div>
                <div><span className={labelCls}>Ciudad</span>
                  <input value={nCiudad} onChange={e => setNCiudad(e.target.value)} placeholder="Medellín" className={inputCls} /></div>
              </div>
            </div>
          )}

          {modo === "marca" && (
            <div className="space-y-4">
              <div>
                <span className={labelCls}>Tus fotos (hasta 5) — tú, tus libros, predicando, en escena</span>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {mFotos.map((f, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-[#2a2a2a]">
                      <img src={f} className="w-full h-full object-cover" alt={`foto ${i + 1}`} />
                      <button onClick={() => setMFotos(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">✕</button>
                    </div>
                  ))}
                  {mFotos.length < 5 && (
                    <button onClick={() => mFileRef.current?.click()}
                      className="aspect-square rounded-lg border-2 border-dashed border-yellow-400/40 hover:border-yellow-400 flex flex-col items-center justify-center bg-[rgba(250,204,21,0.04)] transition-colors">
                      <span className="text-yellow-400 text-2xl">＋</span>
                      <span className="text-yellow-400 text-[8px] font-bold">Agregar</span>
                    </button>
                  )}
                </div>
                <input ref={mFileRef} type="file" accept="image/*" multiple onChange={(e) => handleFotosLista(e, mFotos, setMFotos)} className="hidden" />
                {mFotos.length > 0 && (
                  <button onClick={() => identificarRegistrado(mFotos, setMNombre, setMQueHace, setMIdentificando, "Marca")} disabled={mIdentificando}
                    className="mt-2 bg-yellow-400 text-black text-[11px] font-bold py-2 px-4 rounded-lg disabled:opacity-40">
                    {mIdentificando ? "⏳ Identificando..." : "🔍 Identificar marca registrada"}
                  </button>
                )}
                <p className="text-[10px] text-[#7A7772] mt-1.5">💡 Registra tu marca con tus fotos y datos, y la IA llenará todo para las campañas.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div><span className={labelCls}>Tu nombre / nombre artístico *</span>
                  <input value={mNombre} onChange={e => setMNombre(e.target.value)} placeholder="Ej: Alejandro Bec" className={inputCls} /></div>
                <div><span className={labelCls}>¿Qué haces?</span>
                  <input value={mQueHace} onChange={e => setMQueHace(e.target.value)} placeholder="Autor de libros de fe y finanzas" className={inputCls} /></div>
                <div><span className={labelCls}>¿Qué promocionas ahora?</span>
                  <input value={mPromociona} onChange={e => setMPromociona(e.target.value)} placeholder="Mi libro 'Raíces de Iniquidad'" className={inputCls} /></div>
                <div><span className={labelCls}>Ciudad</span>
                  <input value={mCiudad} onChange={e => setMCiudad(e.target.value)} placeholder="Medellín" className={inputCls} /></div>
              </div>
              <div className="bg-[#0d0d0d] border border-[rgba(250,204,21,0.2)] rounded-xl p-3 space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-400">ADN de tu marca <span className="text-[#7A7772] normal-case font-normal">(opcional — entre más llenes, mejores campañas)</span></p>
                <div><span className={labelCls}>💎 Mensaje madre — tu gran idea</span>
                  <textarea value={mMensaje} onChange={e => setMMensaje(e.target.value)} rows={2} placeholder="La idea central que repites de mil formas. Ej: del ruido al propósito." className={areaCls} /></div>
                <div><span className={labelCls}>🎯 Pilares — tus 3-4 temas</span>
                  <input value={mPilares} onChange={e => setMPilares(e.target.value)} placeholder="Fe · Familia · Finanzas · Propósito" className={inputCls} /></div>
                <div><span className={labelCls}>🗣️ Tu voz — cómo hablas</span>
                  <textarea value={mVoz} onChange={e => setMVoz(e.target.value)} rows={2} placeholder="Frases típicas, tu tono, palabras que usas. Ej: cercano, directo, con humor." className={areaCls} /></div>
                <div><span className={labelCls}>📖 Tus historias — testimonios reales</span>
                  <textarea value={mHistorias} onChange={e => setMHistorias(e.target.value)} rows={2} placeholder="Momentos tuyos que conectan: cómo empezaste, tu caída, tu cambio." className={areaCls} /></div>
              </div>
            </div>
          )}

          <div className="border-t border-[#1e1e1e] my-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className={labelCls}>País</span>
              <div className="flex flex-wrap gap-1">
                {PAISES.map(p => (
                  <button key={p} onClick={() => setPais(p)}
                    className={`text-[10px] font-bold px-2 py-1 rounded-sm border transition-all ${pais === p ? "bg-[rgba(255,215,0,0.1)] border-[rgba(255,215,0,0.4)] text-[#FFF500]" : "bg-[#1e1e1e] border-[#2a2a2a] text-[#EDE8DC]"}`}>{p}</button>
                ))}
              </div>
            </div>
            <div>
              <span className={labelCls}>Tono</span>
              <div className="flex flex-wrap gap-1">
                {TONOS.map(t => (
                  <button key={t} onClick={() => setTono(t)}
                    className={`text-[10px] font-bold px-2 py-1 rounded-sm border transition-all ${tono === t ? "bg-[rgba(255,215,0,0.1)] border-[rgba(255,215,0,0.4)] text-[#FFF500]" : "bg-[#1e1e1e] border-[#2a2a2a] text-[#EDE8DC]"}`}>{t}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-5">
          <span className="text-xs font-bold tracking-widest uppercase text-[#FFF500] mb-3 block">3 · ¿Cuánto contenido quieres?</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {NIVELES.map(n => {
              const activo = nivelId === n.id;
              return (
                <button key={n.id} onClick={() => setNivelId(n.id)}
                  className={`text-left rounded-xl p-4 border transition-all relative ${activo ? "bg-[#111]" : "border-[#1e1e1e] bg-[#0d0d0d] hover:border-[#333]"}`}
                  style={activo ? { borderColor: n.color } : {}}>
                  {n.badge && (<span className="absolute top-3 right-3 text-[8px] font-black px-2 py-0.5 rounded-full text-white" style={{ background: n.color }}>{n.badge}</span>)}
                  <div className="text-base font-black mb-0.5" style={{ color: activo ? n.color : "#fff" }}>{n.nombre}</div>
                  <div className="text-[10px] text-[#7A7772] mb-3">{n.dias} días · {n.subtitulo}</div>
                  <ul className="space-y-1">
                    {n.incluye.map((x, i) => (<li key={i} className="text-[10px] text-[#C8C3B7] flex gap-1.5"><span style={{ color: n.color }}>✓</span>{x}</li>))}
                    {n.noIncluye.map((x, i) => (<li key={i} className="text-[10px] text-[#555] flex gap-1.5"><span>—</span>{x}</li>))}
                  </ul>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-5">
          <span className="text-xs font-bold tracking-widest uppercase text-[#FFF500] mb-3 block">4 · Redes incluidas en {nivel.nombre}</span>
          <div className="flex flex-wrap gap-2">
            {nivel.redes.map(r => (
              <div key={r} className="flex items-center gap-1.5 bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-2">
                <span className="text-sm">{REDES_INFO[r]?.icon}</span>
                <span className="text-[11px] font-bold text-[#EDE8DC]">{REDES_INFO[r]?.nombre}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <span className="text-xs font-bold tracking-widest uppercase text-[#FFF500]">
              5 · Tu campaña de {nivel.dias} días {modo === "negocio" ? "(negocio)" : modo === "marca" ? "(marca personal)" : "(producto)"}
            </span>
            <div className="flex gap-3">
              {Object.values(TEMP).map(t => (
                <span key={t.label} className="text-[10px] flex items-center gap-1.5 text-[#C8C3B7]">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: t.color }}></span>{t.label}
                </span>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
            {dias.map((d, i) => {
              const temp = TEMP[d.temp as keyof typeof TEMP];
              return (
                <div key={i} className="bg-[#111] border border-[#1e1e1e] rounded-xl p-2.5 min-h-[110px] flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-black text-[#7A7772]">DÍA {i + 1}</span>
                    <span className="w-3.5 h-3.5 rounded" style={{ background: temp.color }}></span>
                  </div>
                  <div className="text-[10px] font-bold text-white leading-tight mb-2">{d.titulo}</div>
                  <div className="flex flex-wrap gap-1 mt-auto">
                    {nivel.redes.slice(0, 4).map(r => (
                      <span key={r} className="w-4 h-4 rounded flex items-center justify-center text-[8px] bg-[#1a1a1a] border border-[#2a2a2a]">{REDES_INFO[r]?.icon}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-5">
            <button onClick={generarCampana} disabled={!listo || generando}
              className={`w-full rounded-lg py-3 text-sm font-black flex items-center justify-center gap-2 transition-all ${listo && !generando ? "bg-[#FFF500] text-[#0d0d0d] cursor-pointer hover:brightness-110" : "bg-[#FFF500] text-[#0d0d0d] opacity-30 cursor-not-allowed"}`}>
              {generando ? "⚙️ Generando campaña..." : "⚡ Generar campaña completa"}
            </button>
            {!listo && (
              <p className="text-center text-[10px] text-[#555] mt-2">
                {modo === "producto" ? "Agrega el nombre del producto para continuar"
                : modo === "negocio" ? "Agrega el nombre del negocio para continuar"
                : "Agrega tu nombre para continuar"}
              </p>
            )}
          </div>
        </div>

        {resultado.length > 0 && (
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-5">
            <span className="text-xs font-bold tracking-widest uppercase text-[#FFF500] mb-4 block">
              ✨ Tu campaña generada · {resultado.filter(r => !r.cargando).length}/{resultado.length} días
            </span>
            <div className="space-y-3">
              {resultado.map((r, i) => {
                const temp = TEMP[r.diaTemp as keyof typeof TEMP];
                return (
                  <div key={i} className="bg-[#111] border border-[#1e1e1e] rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-3 h-3 rounded" style={{ background: temp?.color }}></span>
                      <span className="text-[11px] font-black text-white">DÍA {r.diaNumero}</span>
                      <span className="text-[10px] text-[#7A7772]">· {r.diaTitulo}</span>
                      {!r.cargando && (
                        <button onClick={() => toggleEditar(i)} className="ml-auto text-[10px] text-yellow-400 border border-[rgba(255,215,0,0.3)] px-2 py-0.5 rounded">
                          {r.editando ? "✓ Listo" : "✎ Editar texto"}
                        </button>
                      )}
                    </div>

                    {r.cargando ? (
                      <div className="flex items-center gap-2 py-3">
                        <div className="w-4 h-4 border-2 border-[#FFF500] border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-[11px] text-[#7A7772]">Generando contenido...</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-3">
                        <div>
                          {r.generandoImg ? (
                            <div className="aspect-square rounded-lg bg-[#0d0d0d] border border-[#2a2a2a] flex flex-col items-center justify-center gap-2">
                              <div className="w-6 h-6 border-2 border-[#FFF500] border-t-transparent rounded-full animate-spin"></div>
                              <span className="text-[9px] text-[#7A7772]">Creando imagen...</span>
                            </div>
                          ) : r.imagen ? (
                            <div className="relative">
                              <img src={r.imagen} className="w-full rounded-lg border border-[#2a2a2a]" alt={`día ${r.diaNumero}`} />
                              <div className="grid grid-cols-2 gap-1 mt-1.5">
                                <button onClick={() => generarImagenDia(i)} className="text-[9px] font-bold py-1.5 rounded bg-[rgba(255,215,0,0.15)] border border-[rgba(255,215,0,0.3)] text-[#FFF500]">↻ Otra</button>
                                <button onClick={() => descargar(r.imagen!, `dia-${r.diaNumero}.png`)} className="text-[9px] font-bold py-1.5 rounded bg-[#FFF500] text-black">↓ Bajar</button>
                                <button onClick={() => toggleEditarImg(i)} className="text-[9px] font-bold py-1.5 rounded bg-[rgba(168,85,247,0.15)] border border-[rgba(168,85,247,0.4)] text-purple-300">🖌️ Editar IA</button>
                                <button onClick={() => quitarImagen(i)} className="text-[9px] font-bold py-1.5 rounded bg-[rgba(255,80,80,0.1)] border border-[rgba(255,80,80,0.3)] text-red-300">🗑️ Quitar</button>
                              </div>
                              <button onClick={() => guardarDiaEnBiblioteca(i)} className="w-full mt-1 text-[9px] font-bold py-1.5 rounded bg-[rgba(168,85,247,0.1)] border border-[rgba(168,85,247,0.4)] text-purple-300">📚 Guardar en Biblioteca</button>
                              {r.editandoImg && (
                                <div className="mt-2 bg-[#0d0d0d] border border-[rgba(168,85,247,0.3)] rounded-lg p-2">
                                  <input value={r.instruccionImg || ""} onChange={e => cambiarInstruccion(i, e.target.value)}
                                    placeholder="Ej: ponle más luz, fondo más oscuro..."
                                    className="w-full bg-[#1a1a1a] border border-[#333] text-white text-[10px] px-2 py-1.5 rounded outline-none mb-1.5" />
                                  <button onClick={() => editarImagenIA(i)} disabled={!r.instruccionImg}
                                    className="w-full text-[10px] font-bold py-1.5 rounded bg-purple-500 text-white disabled:opacity-40">
                                    🖌️ Aplicar cambio
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <button onClick={() => generarImagenDia(i)} disabled={!hayFoto()}
                              className="w-full aspect-square rounded-lg border-2 border-dashed border-[rgba(255,215,0,0.3)] hover:border-[#FFF500] flex flex-col items-center justify-center gap-2 bg-[rgba(255,215,0,0.03)] disabled:opacity-40 transition-colors">
                              <span className="text-2xl">🎨</span>
                              <span className="text-[10px] font-bold text-[#FFF500]">Generar imagen</span>
                              {!hayFoto() && <span className="text-[8px] text-[#7A7772] px-2 text-center">Sube una foto arriba primero</span>}
                            </button>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg p-2.5">
                            <span className="text-[8px] font-bold uppercase tracking-widest text-orange-400">Texto para la imagen</span>
                            {r.editando ? (
                              <input value={r.textoImagen || ""} onChange={e => cambiarCampo(i, "textoImagen", e.target.value)}
                                className="w-full mt-1 bg-[#1a1a1a] border border-[#333] text-white text-[12px] font-bold px-2 py-1 rounded outline-none" />
                            ) : (
                              <p className="text-[12px] text-white font-bold mt-0.5">{r.textoImagen}</p>
                            )}
                          </div>
                          <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg p-2.5">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-[8px] font-bold uppercase tracking-widest text-cyan-400">Caption</span>
                              {!r.editando && <button onClick={() => copiar(r.caption!)} className="text-[9px] text-[#7A7772] hover:text-white">⎘ copiar</button>}
                            </div>
                            {r.editando ? (
                              <textarea value={r.caption || ""} onChange={e => cambiarCampo(i, "caption", e.target.value)} rows={3}
                                className="w-full bg-[#1a1a1a] border border-[#333] text-[#EDE8DC] text-[11px] px-2 py-1 rounded outline-none resize-none" />
                            ) : (
                              <p className="text-[11px] text-[#EDE8DC] leading-relaxed whitespace-pre-wrap">{r.caption}</p>
                            )}
                          </div>
                          <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg p-2.5">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-[8px] font-bold uppercase tracking-widest text-[#86EFAC]">Hashtags</span>
                              {!r.editando && <button onClick={() => copiar(r.hashtags!)} className="text-[9px] text-[#7A7772] hover:text-white">⎘ copiar</button>}
                            </div>
                            {r.editando ? (
                              <textarea value={r.hashtags || ""} onChange={e => cambiarCampo(i, "hashtags", e.target.value)} rows={2}
                                className="w-full bg-[#1a1a1a] border border-[#333] text-[#86EFAC] text-[10px] px-2 py-1 rounded outline-none resize-none" />
                            ) : (
                              <p className="text-[10px] text-[#86EFAC] leading-relaxed">{r.hashtags}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {resultado.some(r => r.imagen) && (
              <button onClick={guardarTodaLaCampana} disabled={guardandoTodo}
                className="w-full mt-4 rounded-lg py-3 text-sm font-black bg-purple-500 text-white hover:brightness-110 disabled:opacity-40 transition-all">
                {guardandoTodo ? "⟳ Guardando campaña..." : "📚 Guardar toda la campaña en Biblioteca"}
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}