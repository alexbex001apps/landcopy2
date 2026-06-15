"use client";
import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const CLAVE_ESTADO = "redesestrat_estado";
const CLAVE_GENERANDO = "redesestrat_generando";
const CLAVE_IMAGENES = "redesestrat_imagenes";

type Modo = "producto" | "negocio" | "marca";

const DURACIONES = [3, 7, 15, 30];
const OBJETIVOS = ["más ventas", "más seguidores", "más engagement", "más leads", "branding"];
const PAISES = ["Colombia", "México", "Venezuela", "Costa Rica", "Ecuador", "General"];
const TONOS = ["Urgente", "Emocional", "Cercano", "Confianza", "Premium", "Divertido"];

export default function RedesEstrategico() {
  const [modo, setModo] = useState<Modo>("producto");
  const [dias, setDias] = useState(7);
  const [objetivo, setObjetivo] = useState("más ventas");
  const [pais, setPais] = useState("Colombia");
  const [tono, setTono] = useState("Cercano");

  // Producto
  const [pNombre, setPNombre] = useState("");
  const [pImagen, setPImagen] = useState<string | null>(null);
  const [pBeneficio, setPBeneficio] = useState("");
  const [pProblema, setPProblema] = useState("");
  const pFileRef = useRef<HTMLInputElement>(null);

  const [pIdentificando, setPIdentificando] = useState(false);
  const [toast, setToast] = useState("");

  function mostrarToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
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

  async function handleFotosLista(e: React.ChangeEvent<HTMLInputElement>, lista: string[], setLista: (v: string[]) => void) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const espacio = 5 - lista.length;
    const aProcesar = files.slice(0, espacio);
    const nuevas: string[] = [];
    for (const f of aProcesar) nuevas.push(await comprimir(f));
    setLista([...lista, ...nuevas].slice(0, 5));
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

  // Negocio
  const [nNombre, setNNombre] = useState("");
  const [nOfrece, setNOfrece] = useState("");
  const [nCiudad, setNCiudad] = useState("");
  const [nFotos, setNFotos] = useState<string[]>([]);
  const [nIdentificando, setNIdentificando] = useState(false);
  const nFileRef = useRef<HTMLInputElement>(null);

  // Marca
  const [mNombre, setMNombre] = useState("");
  const [mQueHace, setMQueHace] = useState("");
  const [mPromociona, setMPromociona] = useState("");
  const [mCiudad, setMCiudad] = useState("");
  const [mFotos, setMFotos] = useState<string[]>([]);
  const [mMensaje, setMMensaje] = useState("");
  const [mPilares, setMPilares] = useState("");
  const [mVoz, setMVoz] = useState("");
  const [mHistorias, setMHistorias] = useState("");
  const [mIdentificando, setMIdentificando] = useState(false);
  const mFileRef = useRef<HTMLInputElement>(null);

  const [generando, setGenerando] = useState(false);
  const [plan, setPlan] = useState<any>(null);
  const [error, setError] = useState("");
  const [hidratado, setHidratado] = useState(false);

  // Al abrir: recuperar lo guardado (datos + plan)
  useEffect(() => {
    try {
      const e = JSON.parse(sessionStorage.getItem(CLAVE_ESTADO) || "{}");
      if (e.modo) setModo(e.modo);
      if (e.dias) setDias(e.dias);
      if (e.objetivo) setObjetivo(e.objetivo);
      if (e.pais) setPais(e.pais);
      if (e.tono) setTono(e.tono);
      if (e.pNombre) setPNombre(e.pNombre);
      if (e.pImagen) setPImagen(e.pImagen);
      if (e.pBeneficio) setPBeneficio(e.pBeneficio);
      if (e.pProblema) setPProblema(e.pProblema);
      if (e.nNombre) setNNombre(e.nNombre);
      if (e.nOfrece) setNOfrece(e.nOfrece);
      if (e.nCiudad) setNCiudad(e.nCiudad);
      if (e.mNombre) setMNombre(e.mNombre);
      if (e.mQueHace) setMQueHace(e.mQueHace);
      if (e.mPromociona) setMPromociona(e.mPromociona);
      if (e.plan) {
        // Limpiar spinners fantasma: apagar generandoImg que NO esté en la caja del vigilante
        let activos: string[] = [];
        try { activos = JSON.parse(sessionStorage.getItem(CLAVE_GENERANDO) || "[]"); } catch {}
        if (!Array.isArray(activos)) activos = [];
        const planLimpio = { ...e.plan };
        if (Array.isArray(planLimpio.piezas)) {
          planLimpio.piezas = planLimpio.piezas.map((pz: any, pi: number) => {
            const nuevaPz = { ...pz, generandoImg: activos.includes(`p${pi}`) };
            if (Array.isArray(pz.laminas)) {
              nuevaPz.laminas = pz.laminas.map((lm: any, li: number) => ({
                ...lm, generandoImg: activos.includes(`p${pi}_l${li}`),
              }));
            }
            return nuevaPz;
          });
        }
        setPlan(planLimpio);
      }
    } catch {}
    // VIGILANTE: si quedaron imágenes generándose, arrancar el guardián
    try {
      const gen = JSON.parse(sessionStorage.getItem(CLAVE_GENERANDO) || "[]");
      if (Array.isArray(gen) && gen.length > 0) {
        const intervalo = setInterval(() => {
          let activos: string[] = [];
          let imgs: Record<string, string> = {};
          try { activos = JSON.parse(sessionStorage.getItem(CLAVE_GENERANDO) || "[]"); } catch {}
          try { imgs = JSON.parse(sessionStorage.getItem(CLAVE_IMAGENES) || "{}"); } catch {}
          if (!Array.isArray(activos)) activos = [];
          setPlan((prev: any) => {
            if (!prev?.piezas) return prev;
            const piezas = prev.piezas.map((pz: any, pi: number) => {
              const nuevaPz = { ...pz };
              const idP = `p${pi}`;
              if (imgs[idP]) nuevaPz.imagen = imgs[idP];
              nuevaPz.generandoImg = activos.includes(idP);
              if (Array.isArray(pz.laminas)) {
                nuevaPz.laminas = pz.laminas.map((lm: any, li: number) => {
                  const nuevaLm = { ...lm };
                  const idL = `p${pi}_l${li}`;
                  if (imgs[idL]) nuevaLm.imagen = imgs[idL];
                  nuevaLm.generandoImg = activos.includes(idL);
                  return nuevaLm;
                });
              }
              return nuevaPz;
            });
            return { ...prev, piezas };
          });
          if (activos.length === 0) clearInterval(intervalo);
        }, 1000);
      }
    } catch {}
    setHidratado(true);
  }, []);

  // Guardar cada vez que algo cambia (datos + plan)
  useEffect(() => {
    if (!hidratado) return;
    try {
      const estado = {
        modo, dias, objetivo, pais, tono,
        pNombre, pImagen, pBeneficio, pProblema,
        nNombre, nOfrece, nCiudad,
        mNombre, mQueHace, mPromociona,
        plan,
      };
      sessionStorage.setItem(CLAVE_ESTADO, JSON.stringify(estado));
    } catch {}
  }, [hidratado, modo, dias, objetivo, pais, tono, pNombre, pImagen, pBeneficio, pProblema, nNombre, nOfrece, nCiudad, mNombre, mQueHace, mPromociona, plan]);

  // === VIGILANTE: marcar/desmarcar qué se está generando (sobrevive al salir) ===
  function marcarGenerando(id: string) {
    try {
      const raw = sessionStorage.getItem(CLAVE_GENERANDO);
      let lista: string[] = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(lista)) lista = [];
      if (!lista.includes(id)) lista.push(id);
      sessionStorage.setItem(CLAVE_GENERANDO, JSON.stringify(lista));
    } catch {}
  }
  function desmarcarGenerando(id: string) {
    try {
      const raw = sessionStorage.getItem(CLAVE_GENERANDO);
      let lista: string[] = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(lista)) lista = [];
      lista = lista.filter(x => x !== id);
      if (lista.length > 0) sessionStorage.setItem(CLAVE_GENERANDO, JSON.stringify(lista));
      else sessionStorage.removeItem(CLAVE_GENERANDO);
    } catch {}
  }
  function guardarImagenCaja(id: string, url: string) {
    try {
      const raw = sessionStorage.getItem(CLAVE_IMAGENES);
      const imgs = raw ? JSON.parse(raw) : {};
      imgs[id] = url;
      sessionStorage.setItem(CLAVE_IMAGENES, JSON.stringify(imgs));
    } catch {}
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
  async function handleImagen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPImagen(await comprimir(file));
  }

  const listo =
    (modo === "producto" && pNombre.trim()) ||
    (modo === "negocio" && nNombre.trim()) ||
    (modo === "marca" && mNombre.trim());

  function datosDelModo() {
    const base: any = { modo, dias, objetivo, pais, tono, redes: ["instagram", "facebook", "tiktok"] };
    if (modo === "producto") return { ...base, pNombre, pBeneficio, pProblema };
    if (modo === "negocio") return { ...base, nNombre, nOfrece, nCiudad };
    return { ...base, mNombre, mQueHace, mPromociona };
  }

  async function generar() {
    if (!listo || generando) return;
    setGenerando(true);
    setPlan(null);
    setError("");
    try {
      const resp = await fetch("/api/redes-estrategico/generar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datosDelModo()),
      });
      const data = await resp.json();
      if (!resp.ok) setError(data.error || "Error al diseñar la campaña");
      else setPlan(data);
    } catch (e: any) {
      setError(e.message);
    }
    setGenerando(false);
  }

  const modoColor = modo === "producto" ? "#ff5000" : modo === "negocio" ? "#38bdf8" : "#facc15";

  function fotosBase(): string[] {
    if (modo === "producto") return pImagen ? [pImagen] : [];
    if (modo === "negocio") return nFotos;
    return mFotos;
  } 

  async function subirImagen(supabase: any, imagen: string, idx: number): Promise<string | null> {
    if (!imagen) return null;
    if (imagen.startsWith("http")) return imagen;
    if (!imagen.startsWith("data:")) return null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const blob = await fetch(imagen).then(r => r.blob());
      const path = `${user?.id}/${Date.now()}_redesestrat_${idx}.jpg`;
      await supabase.storage.from("biblioteca-images").upload(path, blob, { contentType: "image/jpeg" });
      const { data: urlData } = supabase.storage.from("biblioteca-images").getPublicUrl(path);
      return urlData.publicUrl;
    } catch { return null; }
  }

  async function generarImagenPieza(i: number) {
    const pieza = plan?.piezas?.[i];
    if (!pieza || pieza.generandoImg) return;
    const idGen = `p${i}`;
    marcarGenerando(idGen);
    setPlan((prev: any) => {
      const piezas = [...prev.piezas];
      piezas[i] = { ...piezas[i], generandoImg: true };
      return { ...prev, piezas };
    });
    try {
      const resp = await fetch("/api/redes-campanas/imagen", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modo, tono,
          diaNumero: pieza.dia,
          diaTitulo: pieza.promptVisual || pieza.titulo,
          textoImagen: pieza.titulo,
          fotos: fotosBase(),
        }),
      });
      const data = await resp.json();
      if (data.imageUrl) {
        const supabase = createClient();
        const urlGuardada = await subirImagen(supabase, data.imageUrl, i);
        const imagenFinal = urlGuardada || data.imageUrl;
        guardarImagenCaja(idGen, imagenFinal);
        desmarcarGenerando(idGen);
        setPlan((prev: any) => {
          const piezas = [...prev.piezas];
          piezas[i] = { ...piezas[i], imagen: imagenFinal, generandoImg: false };
          return { ...prev, piezas };
        });
        mostrarToast(`✓ Imagen del día ${pieza.dia}`);
      } else {
        setPlan((prev: any) => {
          const piezas = [...prev.piezas];
          piezas[i] = { ...piezas[i], generandoImg: false };
          return { ...prev, piezas };
        });
        desmarcarGenerando(idGen);
        mostrarToast("No se pudo generar la imagen");
      }
    } catch {
      desmarcarGenerando(idGen);
      setPlan((prev: any) => {
        const piezas = [...prev.piezas];
        piezas[i] = { ...piezas[i], generandoImg: false };
        return { ...prev, piezas };
      });
      mostrarToast("Error al generar la imagen");
    }
  }

  async function generarImagenLamina(i: number, j: number) {
    const pieza = plan?.piezas?.[i];
    const lamina = pieza?.laminas?.[j];
    if (!lamina || lamina.generandoImg) return;
    const idGen = `p${i}_l${j}`;
    marcarGenerando(idGen);
    setPlan((prev: any) => {
      const piezas = [...prev.piezas];
      const laminas = [...piezas[i].laminas];
      laminas[j] = { ...laminas[j], generandoImg: true };
      piezas[i] = { ...piezas[i], laminas };
      return { ...prev, piezas };
    });
    try {
      const resp = await fetch("/api/redes-campanas/imagen", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modo, tono,
          diaNumero: pieza.dia,
          diaTitulo: lamina.promptVisual || lamina.texto,
          textoImagen: lamina.texto,
          fotos: fotosBase(),
        }),
      });
      const data = await resp.json();
      if (data.imageUrl) {
        const supabase = createClient();
        const urlGuardada = await subirImagen(supabase, data.imageUrl, i * 100 + j);
        const imagenFinal = urlGuardada || data.imageUrl;
        guardarImagenCaja(idGen, imagenFinal);
        desmarcarGenerando(idGen);
        setPlan((prev: any) => {
          const piezas = [...prev.piezas];
          const laminas = [...piezas[i].laminas];
          laminas[j] = { ...laminas[j], imagen: imagenFinal, generandoImg: false };
          piezas[i] = { ...piezas[i], laminas };
          return { ...prev, piezas };
        });
        mostrarToast(`✓ Lámina ${j + 1} lista`);
      } else {
        setPlan((prev: any) => {
          const piezas = [...prev.piezas];
          const laminas = [...piezas[i].laminas];
          laminas[j] = { ...laminas[j], generandoImg: false };
          piezas[i] = { ...piezas[i], laminas };
          return { ...prev, piezas };
        });
        desmarcarGenerando(idGen);
        mostrarToast("No se pudo generar la imagen");
      }
    } catch {
      desmarcarGenerando(idGen);
      setPlan((prev: any) => {
        const piezas = [...prev.piezas];
        const laminas = [...piezas[i].laminas];
        laminas[j] = { ...laminas[j], generandoImg: false };
        piezas[i] = { ...piezas[i], laminas };
        return { ...prev, piezas };
      });
      mostrarToast("Error al generar la imagen");
    }
  }
 const inputCls = "w-full bg-[#f0ead6] border border-[#d4cdb8] text-[#1a1a1a] rounded-md px-3 py-2 text-xs outline-none placeholder-[#888]";
  const areaCls = "w-full bg-[#f0ead6] border border-[#d4cdb8] text-[#1a1a1a] rounded-md px-3 py-2 text-xs outline-none placeholder-[#888] resize-none";
  const labelCls = "text-[10px] font-bold tracking-widest uppercase text-[#FFF500] mb-1 block";

  return (
    <div className="min-h-screen bg-[#050505] text-[#F5F0E8]">

      {generando && (
        <div className="fixed inset-0 z-[9999] bg-[#050505] flex items-center justify-center px-6">
          <div className="text-center max-w-md w-full">
            <div className="relative w-28 h-28 mx-auto mb-7 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-[#FFF500]/15"></div>
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#FFF500] animate-spin"></div>
              <div className="absolute inset-2 rounded-full border border-transparent border-b-[#ff5000] animate-spin" style={{ animationDuration: "2.2s", animationDirection: "reverse" }}></div>
              <span className="text-4xl">🧠</span>
            </div>
            <p className="text-[11px] tracking-[3px] text-[#ff7a3c] font-bold mb-4 font-mono">R.IA · PROCESANDO</p>
            <p className="text-2xl text-white font-bold mb-1">Generando tu campaña</p>
            {(modo === "producto" ? pNombre : modo === "negocio" ? nNombre : mNombre) && (
              <p className="text-xl font-bold mb-2" style={{ color: modo === "marca" ? "#facc15" : "#38bdf8" }}>
                {modo === "producto" ? pNombre : modo === "negocio" ? nNombre : mNombre}
              </p>
            )}
            <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 mb-3 border" style={{ borderColor: modo === "marca" ? "#facc1555" : "#38bdf855", background: modo === "marca" ? "#facc1518" : "#38bdf818" }}>
              <span className="text-xs font-semibold" style={{ color: modo === "marca" ? "#facc15" : "#7cc6f0" }}>
                Campaña de {modo}
              </span>
            </div>
            <p className="text-sm text-[#9a9a9a] mb-6 font-mono">el cerebro está diseñando tu plan<span className="animate-pulse">_</span></p>
            <div className="bg-[#ff5000]/10 border border-[#ff5000]/40 rounded-lg px-5 py-3 mb-5 flex items-center gap-2 justify-center">
              <span className="text-xl">🔒</span>
              <span className="text-sm text-[#ffb38a] font-semibold">No salgas — el proceso se cancela si cierras</span>
            </div>
            <div className="h-[3px] bg-[#FFF500]/10 rounded-full overflow-hidden">
              <div className="h-full w-2/5 bg-[#FFF500] rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-[#FFF500] text-[#0d0d0d] text-sm font-black px-4 py-3 rounded-lg z-50 shadow-lg">{toast}</div>
      )}

      {/* HEADER */}
      <div className="max-w-[1100px] mx-auto px-4 md:px-6 pt-8 text-center">
        <div className="inline-flex items-center gap-2 text-white text-[9px] font-bold px-4 py-1.5 rounded-full mb-3 tracking-widest uppercase"
          style={{ background: "linear-gradient(90deg,#ff5000,#a855f7)" }}>
          ★ Powered by IA · Estrategia automática
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-white mb-2 leading-tight">
          Tu <span className="text-[#FFF500]">Director de Marketing</span> con IA
        </h1>
        <p className="text-[13px] text-[#C8C3B7] max-w-[560px] mx-auto">
          No genera publicaciones sueltas. Diseña una <b className="text-white">campaña completa y coherente</b>: decide formatos, narrativa y objetivos día a día.
        </p>
      </div>

      <div className="max-w-[1100px] mx-auto px-4 md:px-6 pb-20 mt-6 space-y-6">

        {/* PASO 1 — MODO */}
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-5">
          <span className="text-xs font-bold tracking-widest uppercase text-[#FFF500] mb-3 block">1 · ¿Qué vas a promocionar?</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button onClick={() => setModo("producto")}
              className={`text-left rounded-xl p-4 border transition-all ${modo === "producto" ? "border-orange-500 bg-[rgba(255,80,0,0.07)]" : "border-[#1e1e1e] bg-[#111] hover:border-[#333]"}`}>
              <div className="text-2xl mb-2">📦</div>
              <div className={`text-sm font-black mb-1 ${modo === "producto" ? "text-orange-400" : "text-white"}`}>Un producto</div>
              <div className="text-[10px] text-[#7A7772] leading-snug">Dropshipping o un producto que vendes.</div>
            </button>
            <button onClick={() => setModo("negocio")}
              className={`text-left rounded-xl p-4 border transition-all ${modo === "negocio" ? "border-cyan-500 bg-[rgba(56,189,248,0.07)]" : "border-[#1e1e1e] bg-[#111] hover:border-[#333]"}`}>
              <div className="text-2xl mb-2">🏪</div>
              <div className={`text-sm font-black mb-1 ${modo === "negocio" ? "text-cyan-400" : "text-white"}`}>Mi negocio local</div>
              <div className="text-[10px] text-[#7A7772] leading-snug">Peluquería, restaurante, tienda.</div>
            </button>
            <button onClick={() => setModo("marca")}
              className={`text-left rounded-xl p-4 border transition-all ${modo === "marca" ? "border-yellow-400 bg-[rgba(250,204,21,0.07)]" : "border-[#1e1e1e] bg-[#111] hover:border-[#333]"}`}>
              <div className="text-2xl mb-2">⭐</div>
              <div className={`text-sm font-black mb-1 ${modo === "marca" ? "text-yellow-400" : "text-white"}`}>Marca personal</div>
              <div className="text-[10px] text-[#7A7772] leading-snug">Autor, músico, pastor, coach.</div>
            </button>
          </div>
        </div>

        {/* PASO 2 — DATOS DEL MODO */}
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-5">
          <span className="text-xs font-bold tracking-widest uppercase mb-3 block" style={{ color: modoColor }}>
            2 · {modo === "producto" ? "Tu producto" : modo === "negocio" ? "Tu negocio" : "Tu marca personal"}
          </span>

          {modo === "producto" && (
            <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-4">
              <div>
                <span className={labelCls}>Foto del producto</span>
                <div onClick={() => !pImagen && pFileRef.current?.click()}
                  className="bg-[#1e1e1e] border border-dashed border-[#333] rounded-lg p-3 text-center cursor-pointer hover:border-[#FFF500] transition-colors min-h-[130px] flex items-center justify-center">
                  {pImagen ? (
                    <div className="relative inline-block">
                      <img src={pImagen} className="h-28 mx-auto rounded-md object-contain" alt="producto" />
                      <button onClick={(e) => { e.stopPropagation(); setPImagen(null); }}
                        className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">✕</button>
                    </div>
                  ) : (
                    <div>
                      <div className="text-[#FFF500] text-3xl mb-1">📷</div>
                      <div className="text-[#C8C3B7] text-[10px]">Toca para subir</div>
                    </div>
                  )}
                </div>
                <input ref={pFileRef} type="file" accept="image/*" onChange={handleImagen} className="hidden" />
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
                <div><span className={labelCls}>Beneficio principal</span>
                  <input value={pBeneficio} onChange={e => setPBeneficio(e.target.value)} placeholder="Ej: Alivia el dolor sin pastillas" className={inputCls} /></div>
                <div><span className={labelCls}>Problema que resuelve</span>
                  <input value={pProblema} onChange={e => setPProblema(e.target.value)} placeholder="Ej: Dolor de rodilla al caminar" className={inputCls} /></div>
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
                <div><span className={labelCls}>Tu nombre / artístico *</span>
                  <input value={mNombre} onChange={e => setMNombre(e.target.value)} placeholder="Ej: Alejandro Bec" className={inputCls} /></div>
                <div><span className={labelCls}>¿Qué haces?</span>
                  <input value={mQueHace} onChange={e => setMQueHace(e.target.value)} placeholder="Autor de libros de fe y finanzas" className={inputCls} /></div>
                <div><span className={labelCls}>¿Qué promocionas ahora?</span>
                  <input value={mPromociona} onChange={e => setMPromociona(e.target.value)} placeholder="Mi libro 'Raíces de Iniquidad'" className={inputCls} /></div>
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

        {/* PASO 3 — DURACIÓN + OBJETIVO */}
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-5">
          <span className="text-xs font-bold tracking-widest uppercase text-[#FFF500] mb-3 block">3 · Diseña tu campaña</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <span className={labelCls}>¿Cuántos días?</span>
              <div className="flex flex-wrap gap-2">
                {DURACIONES.map(d => (
                  <button key={d} onClick={() => setDias(d)}
                    className={`text-xs font-bold px-4 py-2 rounded-lg border transition-all ${dias === d ? "bg-[rgba(255,245,0,0.1)] border-[rgba(255,245,0,0.4)] text-[#FFF500]" : "bg-[#1e1e1e] border-[#2a2a2a] text-[#EDE8DC]"}`}>{d} días</button>
                ))}
              </div>
            </div>
            <div>
              <span className={labelCls}>¿Cuál es tu objetivo?</span>
              <div className="flex flex-wrap gap-2">
                {OBJETIVOS.map(o => (
                  <button key={o} onClick={() => setObjetivo(o)}
                    className={`text-xs font-bold px-3 py-2 rounded-lg border transition-all ${objetivo === o ? "bg-[rgba(255,80,0,0.12)] border-orange-500 text-orange-400" : "bg-[#1e1e1e] border-[#2a2a2a] text-[#EDE8DC]"}`}>{o}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* BOTÓN GENERAR */}
        <div className="bg-[#0a0a0a] border border-[rgba(255,245,0,0.25)] rounded-2xl p-5">
          <button onClick={generar} disabled={!listo || generando}
            className={`w-full rounded-xl py-4 text-base font-black transition-all ${listo && !generando ? "text-[#0d0d0d] cursor-pointer hover:brightness-110" : "text-[#0d0d0d] opacity-40 cursor-not-allowed"}`}
            style={{ background: "linear-gradient(90deg,#FFF500,#ffcc00)" }}>
            {generando ? "⚙️ La IA está diseñando tu campaña... (20-40 seg)" : "⚡ Diseñar mi campaña estratégica"}
          </button>
          {!listo && (
            <p className="text-center text-[10px] text-[#555] mt-2">
              {modo === "producto" ? "Agrega el nombre del producto para continuar"
              : modo === "negocio" ? "Agrega el nombre del negocio para continuar"
              : "Agrega tu nombre para continuar"}
            </p>
          )}
        </div>

        {/* ANIMACIÓN MIENTRAS GENERA */}
        

        {/* ERROR */}
        {error && (
          <div className="bg-[#2a0a0a] border border-[#500] rounded-xl p-4 text-[#f88] text-sm">
            ❌ {error}
          </div>
        )}

        {/* PLAN COMPLETO */}
        {plan && (
          <>
            {/* Resumen estrategia */}
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-5">
              <span className="text-xs font-bold tracking-widest uppercase text-[#FFF500] mb-3 block">✨ Tu campaña estratégica</span>
              <div className="text-[14px] text-white font-bold mb-2">💎 {plan.promesaPrincipal}</div>
              {Array.isArray(plan.arcoNarrativo) && (
                <div className="flex flex-wrap gap-1.5 items-center mb-3">
                  {plan.arcoNarrativo.map((a: string, i: number) => (
                    <span key={i} className="text-[10px] text-[#EDE8DC] bg-[#1a1a1a] border border-[#2a2a2a] px-2 py-1 rounded">{a}{i < plan.arcoNarrativo.length - 1 ? " →" : ""}</span>
                  ))}
                </div>
              )}
              {plan.balanceMarca && (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(plan.balanceMarca).map(([k, v]: any) => (
                    <span key={k} className="text-[9px] font-bold uppercase tracking-wide text-[#C8C3B7] bg-[#111] border border-[#222] px-2 py-1 rounded-full">● {k} {v}%</span>
                  ))}
                </div>
              )}
            </div>

            {/* Calendario visual */}
            {Array.isArray(plan.piezas) && (
              <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-5">
                <span className="text-xs font-bold tracking-widest uppercase text-[#FFF500] mb-3 block">📅 Calendario visual</span>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#1e1e1e]">
                        <th className="text-left text-[9px] font-bold uppercase tracking-wide text-[#7A7772] py-2 px-2">Día</th>
                        <th className="text-left text-[9px] font-bold uppercase tracking-wide text-[#7A7772] py-2 px-2">Tipo</th>
                        <th className="text-left text-[9px] font-bold uppercase tracking-wide text-[#7A7772] py-2 px-2">Objetivo</th>
                        <th className="text-left text-[9px] font-bold uppercase tracking-wide text-[#7A7772] py-2 px-2">Tema</th>
                      </tr>
                    </thead>
                    <tbody>
                      {plan.piezas.map((p: any, i: number) => (
                        <tr key={i} className="border-b border-[#141414]">
                          <td className="text-[11px] font-black text-[#7A7772] py-2 px-2 whitespace-nowrap">DÍA {p.dia}</td>
                          <td className="py-2 px-2"><span className="text-[10px] font-bold text-[#FFF500] bg-[rgba(255,245,0,0.08)] px-2 py-0.5 rounded whitespace-nowrap">{p.tipo}</span></td>
                          <td className="text-[11px] text-cyan-300 py-2 px-2 whitespace-nowrap">{p.objetivoPsicologico}</td>
                          <td className="text-[11px] text-[#EDE8DC] py-2 px-2">{p.titulo}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Las piezas con su cara por formato */}
            {Array.isArray(plan.piezas) && plan.piezas.map((p: any, i: number) => (
              <div key={i} className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className="text-[11px] font-black text-white">DÍA {p.dia}</span>
                  <span className="text-[10px] font-bold text-[#FFF500] bg-[rgba(255,245,0,0.1)] px-2 py-0.5 rounded uppercase">{p.tipo}</span>
                  <span className="text-[10px] font-bold text-purple-300 bg-[rgba(168,85,247,0.15)] px-2 py-0.5 rounded">🎯 {p.objetivoPsicologico}</span>
                  {Array.isArray(p.red) && <span className="text-[10px] text-[#7A7772]">· {p.red.join(", ")}</span>}
                </div>

                <div className="text-[14px] font-bold text-white mb-1">{p.titulo}</div>
                {p.copy && <p className="text-[12px] text-[#EDE8DC] leading-relaxed mb-2 whitespace-pre-wrap">{p.copy}</p>}
                {p.cta && <div className="text-[12px] text-[#86EFAC] font-bold mb-2">📣 {p.cta}</div>}

                {/* IMAGEN REAL */}
                <div className="my-3">
                  {p.generandoImg ? (
                    <div className="w-full max-w-[260px] aspect-square rounded-lg bg-[#0d0d0d] border border-[#2a2a2a] flex flex-col items-center justify-center gap-2">
                      <div className="w-7 h-7 border-2 border-[#FFF500] border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-[10px] text-[#7A7772]">Creando imagen...</span>
                    </div>
                  ) : p.imagen ? (
                    <div className="max-w-[260px]">
                      <img src={p.imagen} className="w-full rounded-lg border border-[#2a2a2a]" alt={`día ${p.dia}`} />
                      <button onClick={() => generarImagenPieza(i)} className="w-full mt-1.5 text-[10px] font-bold py-2 rounded-lg bg-[rgba(255,245,0,0.12)] border border-[rgba(255,245,0,0.3)] text-[#FFF500]">↻ Generar otra</button>
                    </div>
                  ) : (
                    <button onClick={() => generarImagenPieza(i)} disabled={modo === "producto" && !pImagen}
                      className="text-[11px] font-bold py-2.5 px-4 rounded-lg bg-[rgba(255,80,0,0.12)] border border-orange-500 text-orange-400 disabled:opacity-40 transition-all">
                      🎨 Generar imagen real
                      {modo === "producto" && !pImagen && <span className="block text-[8px] text-[#7A7772] font-normal mt-0.5">Sube una foto del producto arriba primero</span>}
                    </button>
                  )}
                </div>

                {/* Cara REEL */}
                {p.hook && (
                  <div className="bg-[#0d0d0d] border border-[rgba(168,85,247,0.25)] rounded-lg p-3 mt-2 space-y-2">
                    <div><span className="text-[9px] font-bold uppercase tracking-wide text-purple-300">🎣 Hook</span><p className="text-[12px] text-white font-bold mt-0.5">{p.hook}</p></div>
                    {p.guion && <div><span className="text-[9px] font-bold uppercase tracking-wide text-cyan-300">🎞️ Guion</span><p className="text-[11px] text-[#EDE8DC] mt-0.5 whitespace-pre-wrap">{p.guion}</p></div>}
                    {Array.isArray(p.escenas) && p.escenas.length > 0 && <div><span className="text-[9px] font-bold uppercase tracking-wide text-orange-300">🎬 Escenas</span><ul className="mt-0.5">{p.escenas.map((e: string, j: number) => <li key={j} className="text-[11px] text-[#C8C3B7]">• {e}</li>)}</ul></div>}
                    {p.textoEnPantalla && <div><span className="text-[9px] font-bold uppercase tracking-wide text-[#86EFAC]">💬 Texto en pantalla</span><p className="text-[11px] text-[#EDE8DC] mt-0.5">{p.textoEnPantalla}</p></div>}
                  </div>
                )}

                {/* Cara CARRUSEL */}
                {Array.isArray(p.laminas) && p.laminas.length > 0 && (
                  <div className="mt-2">
                    <span className="text-[9px] font-bold uppercase tracking-wide text-cyan-300 mb-1.5 block">🖼️ {p.laminas.length} láminas</span>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {p.laminas.map((l: any, j: number) => (
                        <div key={j} className="min-w-[140px] bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg p-2.5">
                          <div className="text-[9px] font-black text-[#7A7772]">LÁMINA {j + 1}</div>
                          <div className="text-[11px] text-white font-bold mt-1">{l.texto}</div>
                          {l.promptVisual && <div className="text-[9px] text-[#666] mt-1.5">🎨 {l.promptVisual}</div>}
                          {l.generandoImg ? (
                            <div className="w-full aspect-square rounded-lg bg-[#0d0d0d] border border-[#2a2a2a] flex flex-col items-center justify-center gap-1.5 mt-2">
                              <div className="w-5 h-5 border-2 border-[#FFF500] border-t-transparent rounded-full animate-spin"></div>
                              <span className="text-[8px] text-[#7A7772]">Creando...</span>
                            </div>
                          ) : l.imagen ? (
                            <div className="mt-2">
                              <img src={l.imagen} className="w-full rounded-lg border border-[#2a2a2a]" alt={`lámina ${j + 1}`} />
                              <button onClick={() => generarImagenLamina(i, j)} className="w-full mt-1 text-[8px] font-bold py-1.5 rounded bg-[rgba(255,245,0,0.12)] border border-[rgba(255,245,0,0.3)] text-[#FFF500]">↻ Otra</button>
                            </div>
                          ) : (
                            <button onClick={() => generarImagenLamina(i, j)} disabled={modo === "producto" && !pImagen}
                              className="w-full mt-2 text-[9px] font-bold py-2 rounded-lg bg-[rgba(255,80,0,0.12)] border border-orange-500 text-orange-400 disabled:opacity-40">
                              🎨 Generar imagen
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Prompt visual (para todas) */}
                {p.promptVisual && !p.hook && (
                  <div className="text-[10px] text-[#666] mt-2 bg-[#111] rounded p-2">🎨 {p.promptVisual}</div>
                )}
              </div>
            ))}
          </>
        )}

      </div>
    </div>
  );
}