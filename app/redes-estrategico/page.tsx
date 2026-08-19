"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { categoriaEstiloDeTipo } from "@/lib/bibliotecaEstilo/categorias";

const CLAVE_ESTADO = "redesestrat_estado";
const CLAVE_GENERANDO = "redesestrat_generando";
const CLAVE_IMAGENES = "redesestrat_imagenes";

// Todo lo que la app deja guardado en el navegador. Se borra al cerrar sesion
// y cuando entra un usuario distinto: si no, el siguiente que use ese
// computador hereda las fotos y la campaña del anterior.
const CLAVES_LOCALES = [
  CLAVE_ESTADO,
  CLAVE_GENERANDO,
  CLAVE_IMAGENES,
  "postunico_estado",
  "socialred_splash_visto",
];

function limpiarEstadoLocal() {
  try {
    CLAVES_LOCALES.forEach((k) => sessionStorage.removeItem(k));
  } catch {}
}

type Modo = "producto" | "negocio" | "marca";

const DURACIONES = [3, 7, 15, 30];
const OBJETIVOS = ["más ventas", "más seguidores", "más engagement", "más leads", "branding"];
const PAISES = ["Colombia", "México", "Venezuela", "Costa Rica", "Ecuador", "General"];
const TONOS = ["Urgente", "Emocional", "Cercano", "Confianza", "Premium", "Divertido"];

export default function RedesEstrategico() {
  const router = useRouter();
  const [verificando, setVerificando] = useState(true);
  const [haySesion, setHaySesion] = useState(false);
  const [usuarioId, setUsuarioId] = useState<string | null>(null);
  const [esAdminEstilo, setEsAdminEstilo] = useState(false);
  const [saldo, setSaldo] = useState<number | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      // Sin sesion mostramos la pagina publica, no el formulario de login:
      // quien llega desde un anuncio necesita entender que es esto primero.
      setHaySesion(!!user);
      setUsuarioId(user?.id || null);
      setVerificando(false);
      if (user) {
        fetch("/api/biblioteca-estilo/estado")
          .then((r) => r.json())
          .then((d) => setEsAdminEstilo(!!d.esAdmin))
          .catch(() => {});
        refrescarSaldo();
      }
    });
  }, []);

  // Cuantas imagenes le quedan. Sin esto el usuario no sabe con cuantas cuenta
  // y se topa con el muro sin verlo venir.
  async function refrescarSaldo() {
    try {
      const r = await fetch("/api/billing/estado");
      if (!r.ok) return;
      const d = await r.json();
      if (typeof d.saldo === "number") setSaldo(d.saldo);
    } catch {}
  }
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
  // Ficha completa del producto elegido de la biblioteca (Fase 3). No se edita
  // en pantalla: viaja al motor para que la campaña use TODO lo que el usuario
  // ya cargo (beneficios, precios, promocion, variantes) y no solo 4 campos.
  const [pFicha, setPFicha] = useState<any>(null);
  const pFileRef = useRef<HTMLInputElement>(null);

  // Selector de la biblioteca de productos (Fase 2)
  const [libProductos, setLibProductos] = useState<any[]>([]);
  const [pickerAbierto, setPickerAbierto] = useState(false);
  const [libCargando, setLibCargando] = useState(false);

  async function abrirPicker() {
    setPickerAbierto(true);
    setLibCargando(true);
    try {
      const r = await fetch("/api/productos").then((x) => x.json());
      setLibProductos(r.productos || []);
    } catch {}
    setLibCargando(false);
  }

  function elegirDeBiblioteca(p: any) {
    setPNombre(p.nombre || "");
    setPBeneficio(p.beneficio || (Array.isArray(p.beneficios) ? p.beneficios.join(", ") : ""));
    setPProblema(p.problema || "");
    const primera = Array.isArray(p.imagenes) && p.imagenes[0]?.url ? p.imagenes[0].url : null;
    if (primera) setPImagen(primera);

    // Guardar el resto de la ficha para mandarla al motor. Antes esto se perdia:
    // el usuario cargaba beneficios, precios, promocion y varias imagenes con su
    // descripcion, y la IA nunca los veia.
    const descripcionesImagenes = Array.isArray(p.imagenes)
      ? p.imagenes.map((i: any) => i?.descripcion).filter(Boolean)
      : [];
    setPFicha({
      descripcion: p.descripcion || "",
      detalle: p.detalle || "",
      beneficios: Array.isArray(p.beneficios) ? p.beneficios.filter(Boolean) : [],
      publico: p.publico_objetivo || "",
      precio: p.precio || "",
      precioOferta: p.precio_oferta || "",
      precioAnterior: p.precio_anterior || "",
      promocion: p.promocion || "",
      imagenesDesc: descripcionesImagenes,
      nombre: p.nombre || "",
    });
    setPickerAbierto(false);
    mostrarToast("✓ Producto cargado con toda su ficha");
  }

  const [pIdentificando, setPIdentificando] = useState(false);
  const [toast, setToast] = useState("");
  const [sinCreditos, setSinCreditos] = useState(false);
  const [mostrarOferta, setMostrarOferta] = useState(true);

  function mostrarToast(msg: string, ms = 2500) {
    setToast(msg);
    setTimeout(() => setToast(""), ms);
  }

  // Lee la respuesta del servidor sin reventar si no devolvio JSON (por ejemplo
  // una pagina de error de Vercel ante un timeout).
  async function leerRespuesta(resp: Response): Promise<any> {
    try {
      return await resp.json();
    } catch {
      return {};
    }
  }

  // Muestra el motivo REAL que manda el servidor en vez de esconderlo tras un
  // mensaje generico. Si lo que pasa es que se acabaron las imagenes, ademas
  // deja un aviso fijo en pantalla: el toast se va solo y es facil no verlo.
  function avisarErrorImagen(resp: Response, data: any, accion: "generar" | "editar") {
    if (resp.status === 402) {
      setSinCreditos(true);
      mostrarToast("No tienes imagenes disponibles", 5000);
      return;
    }
    mostrarToast(data?.error || `No se pudo ${accion} la imagen (error ${resp.status})`, 5000);
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
  const [nDiferenciador, setNDiferenciador] = useState("");
  const [nPublico, setNPublico] = useState("");
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
  const [campanaId, setCampanaId] = useState<string | null>(null);
  const [plan, setPlan] = useState<any>(null);
  const [error, setError] = useState("");
  const [hidratado, setHidratado] = useState(false);

  // Al abrir: recuperar lo guardado (datos + plan). Espera a saber quien entro:
  // si lo guardado es de otro usuario se descarta, para que nadie herede las
  // fotos ni la campaña del que uso antes ese computador.
  useEffect(() => {
    if (!usuarioId) return;
    try {
      const e = JSON.parse(sessionStorage.getItem(CLAVE_ESTADO) || "{}");
      if (e.userId !== usuarioId) {
        limpiarEstadoLocal();
        setHidratado(true);
        return;
      }
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
      if (e.nDiferenciador) setNDiferenciador(e.nDiferenciador);
      if (e.nPublico) setNPublico(e.nPublico);
      if (e.mNombre) setMNombre(e.mNombre);
      if (e.mQueHace) setMQueHace(e.mQueHace);
      if (e.mPromociona) setMPromociona(e.mPromociona);
      if (Array.isArray(e.nFotos)) setNFotos(e.nFotos);
      if (Array.isArray(e.mFotos)) setMFotos(e.mFotos);
      if (e.campanaId) setCampanaId(e.campanaId);
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
  }, [usuarioId]);

  // Guardar cada vez que algo cambia (datos + plan)
  useEffect(() => {
    if (!hidratado || !usuarioId) return;
    try {
      const estado = {
        userId: usuarioId, // marca de dueño: sin esto, otro usuario hereda esto
        modo, dias, objetivo, pais, tono,
        pNombre, pImagen, pBeneficio, pProblema,
        nNombre, nOfrece, nCiudad, nDiferenciador, nPublico,
        mNombre, mQueHace, mPromociona,
        nFotos, mFotos,
        plan,
        campanaId,
      };
      sessionStorage.setItem(CLAVE_ESTADO, JSON.stringify(estado));
    } catch {}
  }, [hidratado, usuarioId, modo, dias, objetivo, pais, tono, pNombre, pImagen, pBeneficio, pProblema, nNombre, nOfrece, nCiudad, nDiferenciador, nPublico, mNombre, mQueHace, mPromociona,nFotos, mFotos, plan, campanaId]);

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
    if (modo === "producto") {
      const datos: any = { ...base, pNombre, pBeneficio, pProblema };
      // Adjuntar la ficha completa SOLO si el producto salio de la biblioteca y
      // sigue siendo el mismo que hay en pantalla (el usuario pudo cambiar el
      // nombre a mano despues de elegirlo, y ahi la ficha ya no corresponde).
      if (pFicha && pFicha.nombre === pNombre) {
        datos.pDescripcion = pFicha.descripcion || "";
        datos.pDetalle = pFicha.detalle || "";
        datos.pBeneficios = pFicha.beneficios || [];
        datos.pPublico = pFicha.publico || "";
        datos.pPrecio = pFicha.precio || "";
        datos.pPrecioOferta = pFicha.precioOferta || "";
        datos.pPrecioAnterior = pFicha.precioAnterior || "";
        datos.pPromocion = pFicha.promocion || "";
        datos.pImagenesDesc = pFicha.imagenesDesc || [];
      }
      return datos;
    }
    if (modo === "negocio") return { ...base, nNombre, nOfrece, nCiudad, nDiferenciador, nPublico };
    return { ...base, mNombre, mQueHace, mPromociona };
  }

  async function generar() {
    if (!listo || generando) return;
    setGenerando(true);
    setPlan(null);
    setError("");
    // Limpiar la caja/vigilante de imagenes de la campaña anterior: sin esto, imagenes
    // generadas en una campaña previa se podian "colar" en la campaña nueva por
    // coincidir la misma posicion (p0, p1, p2_l0...).
    try {
      sessionStorage.removeItem(CLAVE_IMAGENES);
      sessionStorage.removeItem(CLAVE_GENERANDO);
    } catch {}
    try {
      const resp = await fetch("/api/redes-estrategico/generar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datosDelModo()),
      });
      const data = await resp.json();
      if (!resp.ok) setError(data.error || "Error al diseñar la campaña");
      else {
        setPlan(data);
        guardarEnBiblioteca(data);
      }
    } catch (e: any) {
      setError(e.message);
    }
    setGenerando(false);
  }


  // Cada vez que el plan cambia (imagen nueva, editada o quitada), sincroniza con la Biblioteca
  useEffect(() => {
    if (!campanaId || !plan) return;
    const timeout = setTimeout(async () => {
      try {
        const supabase = createClient();
        await supabase
          .from("biblioteca_campanas")
          .update({ plan })
          .eq("id", campanaId);
      } catch {}
    }, 1500);
    return () => clearTimeout(timeout);
  }, [plan, campanaId]);

  async function guardarEnBiblioteca(planGenerado: any) {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const nombre = modo === "producto" ? pNombre : modo === "negocio" ? nNombre : mNombre;
      const beneficioOOfrece = modo === "producto" ? pBeneficio : modo === "negocio" ? nOfrece : mQueHace;
      const problemaOCiudadOPromociona = modo === "producto" ? pProblema : modo === "negocio" ? nCiudad : mPromociona;

      const { data: fila, error } = await supabase
        .from("biblioteca_campanas")
        .insert({
          user_id: user.id,
          tipo: modo,
          pais,
          tono,
          dias,
          objetivo,
          nombre: nombre || null,
          beneficio_o_ofrece: beneficioOOfrece || null,
          problema_o_ciudad_o_promociona: problemaOCiudadOPromociona || null,
          plan: planGenerado,
          imagenes: [],
          metricas: {},
        })
        .select("id")
        .single();

      if (!error && fila) setCampanaId(fila.id);
    } catch {}
  }

  const modoColor = modo === "producto" ? "#ff5000" : modo === "negocio" ? "#38bdf8" : "#facc15";

  const NOMBRE_MODO: Record<string, string> = {
    producto: "Un producto",
    negocio: "Mi negocio local",
    marca: "Marca personal",
  };

  // La campaña pertenece al modo con el que se genero: solo se muestra ahi.
  // Si un plan viejo no trae "modo", se muestra igual (no lo escondemos y
  // dejamos al usuario pensando que se perdio su campaña).
  // Los botones de generar deben ofrecer el plan tanto si un intento ya fallo
  // como si el saldo ya venia en cero al abrir: asi no se pierde el clic.
  const sinImagenes = sinCreditos || saldo === 0;

  const planEsDeEsteModo = !!plan && (!plan.modo || plan.modo === modo);
  const planEsDeOtroModo = !!plan && !!plan.modo && plan.modo !== modo;

  // Cuantas imagenes estan generandose ahora mismo en la campaña abierta.
  function contarImagenesGenerando(): number {
    if (!plan?.piezas) return 0;
    let n = 0;
    for (const p of plan.piezas) {
      if (p.generandoImg) n++;
      if (Array.isArray(p.laminas)) {
        for (const l of p.laminas) if (l.generandoImg) n++;
      }
    }
    return n;
  }

  // Cierra la campaña del editor para poder empezar otra. NO la borra de la
  // Biblioteca: ahi sigue guardada con todo lo que se le haya generado.
  function cancelarCampana() {
    const enVuelo = contarImagenesGenerando();
    if (enVuelo > 0) {
      const ok = confirm(
        `Hay ${enVuelo} ${enVuelo === 1 ? "imagen generandose" : "imagenes generandose"}. Si cierras la campaña ahora, ${enVuelo === 1 ? "esa imagen se pierde" : "esas imagenes se pierden"} y los creditos ya gastados no se recuperan.\n\n¿Seguro que quieres cerrarla?`
      );
      if (!ok) return;
    }
    setPlan(null);
    setCampanaId(null);
    try {
      sessionStorage.removeItem(CLAVE_IMAGENES);
      sessionStorage.removeItem(CLAVE_GENERANDO);
    } catch {}
    mostrarToast("Campaña cerrada · sigue guardada en tu Biblioteca");
  }

  function fotosBase(): string[] {
    if (modo === "producto") return pImagen ? [pImagen] : [];
    if (modo === "negocio") return nFotos;
    return mFotos;
  }

  // Fotos reales de la referencia de estilo (Biblioteca de Estilo) que le
  // toco a esta pieza segun su tipo, para que la IA de imagenes las use como
  // anclaje visual real (no solo una descripcion en texto).
  function fotosReferenciaEstilo(tipo: string): string[] {
    const categoria = categoriaEstiloDeTipo(tipo);
    const referencia = plan?.referenciasEstilo?.[categoria];
    return (referencia?.imagenesUrls || []).slice(0, 2);
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
          tipo: pieza.tipo,
          diaNumero: pieza.dia,
          diaTitulo: pieza.promptVisual || pieza.titulo,
          textoImagen: pieza.titulo,
          fotos: fotosBase(),
          referenciaFotos: fotosReferenciaEstilo(pieza.tipo),
        }),
      });
      const data = await leerRespuesta(resp);
      if (data.imageUrl) {
        const supabase = createClient();
        const urlGuardada = await subirImagen(supabase, data.imageUrl, i);
        const imagenFinal = urlGuardada || data.imageUrl;
        guardarImagenCaja(idGen, imagenFinal);
        desmarcarGenerando(idGen);
        setSinCreditos(false);
        setSaldo((s) => (s !== null && s > 0 ? s - 1 : s));
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
        avisarErrorImagen(resp, data, "generar");
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
          tipo: pieza.tipo,
          diaNumero: pieza.dia,
          diaTitulo: lamina.promptVisual || lamina.texto,
          textoImagen: lamina.texto,
          fotos: fotosBase(),
          referenciaFotos: fotosReferenciaEstilo(pieza.tipo),
        }),
      });
      const data = await leerRespuesta(resp);
      if (data.imageUrl) {
        const supabase = createClient();
        const urlGuardada = await subirImagen(supabase, data.imageUrl, i * 100 + j);
        const imagenFinal = urlGuardada || data.imageUrl;
        guardarImagenCaja(idGen, imagenFinal);
        desmarcarGenerando(idGen);
        setSinCreditos(false);
        setSaldo((s) => (s !== null && s > 0 ? s - 1 : s));
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
        avisarErrorImagen(resp, data, "generar");
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
 // ===== BOTONES POR IMAGEN (descargar, quitar, guardar, editar IA) =====
  function descargarImg(url: string, nombre: string) {
    const a = document.createElement("a");
    a.href = url;
    a.download = nombre;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function quitarImgPieza(i: number) {
    setPlan((prev: any) => {
      const piezas = [...prev.piezas];
      piezas[i] = { ...piezas[i], imagen: null };
      return { ...prev, piezas };
    });
    desmarcarGenerando(`p${i}`);
    mostrarToast("Imagen quitada");
  }

  function quitarImgLamina(i: number, j: number) {
    setPlan((prev: any) => {
      const piezas = [...prev.piezas];
      const laminas = [...piezas[i].laminas];
      laminas[j] = { ...laminas[j], imagen: null };
      piezas[i] = { ...piezas[i], laminas };
      return { ...prev, piezas };
    });
    desmarcarGenerando(`p${i}_l${j}`);
    mostrarToast("Imagen quitada");
  }

  function nombreSujeto() {
    if (modo === "producto") return pNombre || "producto";
    if (modo === "negocio") return nNombre || "negocio";
    return mNombre || "marca";
  }

  const [guardandoCampana, setGuardandoCampana] = useState(false);

  async function guardarCampanaPrincipales() {
    if (!plan?.piezas || guardandoCampana) return;
    setGuardandoCampana(true);
    let n = 0;
    for (let i = 0; i < plan.piezas.length; i++) {
      const p = plan.piezas[i];
      if (p.imagen) {
        await guardarImgBiblioteca(p.imagen, `Día ${p.dia}`, { dia: p.dia, tema: p.titulo, copy: [p.titulo, p.copy, p.cta].filter(Boolean).join("\n\n") });
        n++;
        await new Promise(r => setTimeout(r, 400));
      }
    }
    setGuardandoCampana(false);
    mostrarToast(n > 0 ? `✓ ${n} imágenes guardadas` : "No hay imágenes para guardar");
  }

  async function guardarCampanaTodo() {
    if (!plan?.piezas || guardandoCampana) return;
    setGuardandoCampana(true);
    let n = 0;
    for (let i = 0; i < plan.piezas.length; i++) {
      const p = plan.piezas[i];
      if (p.imagen) {
        await guardarImgBiblioteca(p.imagen, `Día ${p.dia}`, { dia: p.dia, tema: p.titulo });
        n++;
        await new Promise(r => setTimeout(r, 400));
      }
      if (Array.isArray(p.laminas)) {
        for (let j = 0; j < p.laminas.length; j++) {
          const l = p.laminas[j];
          if (l.imagen) {
             await guardarImgBiblioteca(l.imagen, `Día ${p.dia} · Lámina ${j + 1}`, { dia: p.dia, lamina: j + 1, tema: l.texto, copy: l.texto });
            n++;
            await new Promise(r => setTimeout(r, 400));
          }
        }
      }
    }
    setGuardandoCampana(false);
    mostrarToast(n > 0 ? `✓ ${n} imágenes guardadas` : "No hay imágenes para guardar");
  }
  async function guardarImgBiblioteca(imagen: string, titulo: string, extra: any) {
    if (!imagen) { mostrarToast("Genera la imagen primero"); return; }
    const supabase = createClient();
    const imageUrl = await subirImagen(supabase, imagen, Date.now());
    await fetch("/api/biblioteca", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo: "imagen", modulo: "redes-estrategico",
        nombre: `${nombreSujeto()} — ${titulo}`, producto: nombreSujeto(),
        contenido: extra?.copy || null, imagen_url: imageUrl,
        metadata: { modo, objetivo, pais, tono, ...extra },
      }),
    });
    sessionStorage.removeItem("biblioteca_items");
    mostrarToast("✓ Guardado en Biblioteca");
  }

  function toggleEditarPieza(i: number) {
    setPlan((prev: any) => {
      const piezas = [...prev.piezas];
      piezas[i] = { ...piezas[i], editandoImg: !piezas[i].editandoImg };
      return { ...prev, piezas };
    });
  }

  function cambiarInstruccionPieza(i: number, v: string) {
    setPlan((prev: any) => {
      const piezas = [...prev.piezas];
      piezas[i] = { ...piezas[i], instruccionImg: v };
      return { ...prev, piezas };
    });
  }

  function toggleEditarLamina(i: number, j: number) {
    setPlan((prev: any) => {
      const piezas = [...prev.piezas];
      const laminas = [...piezas[i].laminas];
      laminas[j] = { ...laminas[j], editandoImg: !laminas[j].editandoImg };
      piezas[i] = { ...piezas[i], laminas };
      return { ...prev, piezas };
    });
  }

  async function editarImgPieza(i: number) {
    const pieza = plan?.piezas?.[i];
    if (!pieza || !pieza.imagen || !pieza.instruccionImg || pieza.generandoImg) return;
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
        body: JSON.stringify({ diaNumero: pieza.dia, tipo: pieza.tipo, imagenPrevia: pieza.imagen, instruccion: pieza.instruccionImg }),
      });
      const data = await leerRespuesta(resp);
      if (data.imageUrl) {
        const supabase = createClient();
        const urlGuardada = await subirImagen(supabase, data.imageUrl, i);
        const imagenFinal = urlGuardada || data.imageUrl;
        guardarImagenCaja(idGen, imagenFinal);
        desmarcarGenerando(idGen);
        setSinCreditos(false);
        setSaldo((s) => (s !== null && s > 0 ? s - 1 : s));
        setPlan((prev: any) => {
          const piezas = [...prev.piezas];
          piezas[i] = { ...piezas[i], imagen: imagenFinal, generandoImg: false, editandoImg: false, instruccionImg: "" };
          return { ...prev, piezas };
        });
        mostrarToast("✓ Imagen editada");
      } else {
        desmarcarGenerando(idGen);
        setPlan((prev: any) => {
          const piezas = [...prev.piezas];
          piezas[i] = { ...piezas[i], generandoImg: false };
          return { ...prev, piezas };
        });
        avisarErrorImagen(resp, data, "editar");
      }
    } catch {
      desmarcarGenerando(idGen);
      setPlan((prev: any) => {
        const piezas = [...prev.piezas];
        piezas[i] = { ...piezas[i], generandoImg: false };
        return { ...prev, piezas };
      });
      mostrarToast("Error al editar");
    }
  }

  async function editarImgLamina(i: number, j: number) {
    const pieza = plan?.piezas?.[i];
    const lamina = pieza?.laminas?.[j];
    if (!lamina || !lamina.imagen || !lamina.instruccionImg || lamina.generandoImg) return;
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
        body: JSON.stringify({ diaNumero: pieza.dia, tipo: pieza.tipo, imagenPrevia: lamina.imagen, instruccion: lamina.instruccionImg }),
      });
      const data = await leerRespuesta(resp);
      if (data.imageUrl) {
        const supabase = createClient();
        const urlGuardada = await subirImagen(supabase, data.imageUrl, i * 100 + j);
        const imagenFinal = urlGuardada || data.imageUrl;
        guardarImagenCaja(idGen, imagenFinal);
        desmarcarGenerando(idGen);
        setSinCreditos(false);
        setSaldo((s) => (s !== null && s > 0 ? s - 1 : s));
        setPlan((prev: any) => {
          const piezas = [...prev.piezas];
          const laminas = [...piezas[i].laminas];
          laminas[j] = { ...laminas[j], imagen: imagenFinal, generandoImg: false, editandoImg: false, instruccionImg: "" };
          piezas[i] = { ...piezas[i], laminas };
          return { ...prev, piezas };
        });
        mostrarToast("✓ Lámina editada");
      } else {
        desmarcarGenerando(idGen);
        setPlan((prev: any) => {
          const piezas = [...prev.piezas];
          const laminas = [...piezas[i].laminas];
          laminas[j] = { ...laminas[j], generandoImg: false };
          piezas[i] = { ...piezas[i], laminas };
          return { ...prev, piezas };
        });
        avisarErrorImagen(resp, data, "editar");
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
      mostrarToast("Error al editar");
    }
  }
  function cambiarInstruccionLamina(i: number, j: number, v: string) {
    setPlan((prev: any) => {
      const piezas = [...prev.piezas];
      const laminas = [...piezas[i].laminas];
      laminas[j] = { ...laminas[j], instruccionImg: v };
      piezas[i] = { ...piezas[i], laminas };
      return { ...prev, piezas };
    });
  }
  const inputCls = "w-full bg-[#f0ead6] border border-[#d4cdb8] text-[#1a1a1a] rounded-md px-3 py-2 text-xs outline-none placeholder-[#888]";
  const areaCls = "w-full bg-[#f0ead6] border border-[#d4cdb8] text-[#1a1a1a] rounded-md px-3 py-2 text-xs outline-none placeholder-[#888] resize-none";
  const labelCls = "text-[10px] font-bold tracking-widest uppercase text-[#FFF500] mb-1 block";

  if (verificando) {
    return (
      <div style={{ minHeight: "100vh", background: "#050505", display: "flex", alignItems: "center", justifyContent: "center", color: "#7A7772" }}>
        Cargando...
      </div>
    );
  }

  // En LandCopy el Guardian ya protege la ruta; si no hay sesion, al login.
  if (!haySesion) { if (typeof window !== "undefined") window.location.href = "/login"; return null; }

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

      {/* Selector de la biblioteca de productos (Fase 2) */}
      {pickerAbierto && (
        <div onClick={() => setPickerAbierto(false)} className="fixed inset-0 z-[9998] bg-black/80 flex items-center justify-center p-4">
          <div onClick={(e) => e.stopPropagation()} className="bg-[#0a0a0a] border border-orange-500/40 rounded-2xl p-5 w-full max-w-lg max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <p className="text-white text-base font-bold">📦 Elige un producto</p>
              <button onClick={() => setPickerAbierto(false)} className="text-zinc-500 text-xl leading-none px-2">×</button>
            </div>
            {libCargando ? (
              <p className="text-zinc-500 text-sm py-6 text-center">Cargando...</p>
            ) : libProductos.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">📦</div>
                <p className="text-white text-sm font-bold mb-1">No tienes productos aún</p>
                <p className="text-zinc-500 text-xs mb-4">Créalos en tu biblioteca y aparecerán aquí.</p>
                <a href="/productos" className="inline-block bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl">Ir a mi biblioteca</a>
              </div>
            ) : (
              <div className="space-y-2">
                {libProductos.map((p) => (
                  <button key={p.id} onClick={() => elegirDeBiblioteca(p)} className="w-full flex items-center gap-3 bg-[#111] border border-[#1a1a1a] hover:border-orange-500 rounded-xl p-2.5 text-left transition-colors">
                    {p.imagenes?.[0]?.url
                      ? <img src={p.imagenes[0].url} className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
                      : <div className="w-12 h-12 bg-[#1a1a1a] rounded-lg flex items-center justify-center flex-shrink-0">📦</div>}
                    <div className="min-w-0">
                      <p className="text-white text-sm font-bold truncate">{p.nombre}</p>
                      <p className="text-zinc-500 text-[11px] truncate">{p.beneficio || p.descripcion || ""}</p>
                    </div>
                  </button>
                ))}
                <a href="/productos" className="block text-center text-orange-400 text-xs font-bold py-2 hover:text-orange-300">+ Administrar mi biblioteca</a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Oferta flotante: aparece cuando se acaban las imagenes teniendo una
          campaña abierta, y acompaña al usuario mientras baja por sus piezas.
          Va a la izquierda para no chocar con Leonel, que vive a la derecha. */}
      {sinImagenes && plan && mostrarOferta && (
        <div className="oferta fixed bottom-5 left-5 right-5 sm:right-auto sm:w-[330px] z-[55] rounded-2xl overflow-hidden border border-[rgba(255,245,0,0.4)] bg-[#12100a]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-16 -left-10 w-56 h-40 opacity-30 blur-[60px]"
            style={{ background: "radial-gradient(ellipse at center, #FFF500 0%, #ff5000 60%, transparent 78%)" }}
          />
          <button
            onClick={() => setMostrarOferta(false)}
            className="absolute top-2.5 right-3 text-white/30 hover:text-white text-lg leading-none z-10"
            aria-label="Cerrar oferta"
          >
            ×
          </button>

          <div className="relative p-5">
            <div className="text-[10px] font-black tracking-[0.15em] uppercase text-[#FFF500]/70 mb-2">
              Tu campaña está lista
            </div>
            <p className="font-black text-[17px] leading-snug mb-2">
              Suscríbete y termina de darle imagen a cada pieza
            </p>
            <p className="text-white/55 text-[13px] leading-relaxed mb-4">
              Desde <strong className="text-white">$9 al mes</strong> por 25 imágenes. Cancela
              cuando quieras.
            </p>
            <button
              onClick={() => router.push("/precios")}
              className="w-full text-sm font-black text-[#0d0d0d] rounded-xl py-3 hover:brightness-110 transition-all"
              style={{ background: "linear-gradient(90deg,#FFF500,#ffcc00)" }}
            >
              Ver planes →
            </button>
          </div>

          <style jsx>{`
            .oferta {
              box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6), 0 0 34px rgba(255, 245, 0, 0.14);
              animation: aparecer 0.45s ease-out both, latir 3.6s ease-in-out 0.45s infinite;
            }
            @keyframes aparecer {
              from {
                opacity: 0;
                transform: translateY(22px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            @keyframes latir {
              0%,
              100% {
                box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6), 0 0 28px rgba(255, 245, 0, 0.11);
              }
              50% {
                box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6), 0 0 56px rgba(255, 245, 0, 0.26);
              }
            }
            @media (prefers-reduced-motion: reduce) {
              .oferta {
                animation: none;
              }
            }
          `}</style>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-[#FFF500] text-[#0d0d0d] text-sm font-black px-4 py-3 rounded-lg z-50 shadow-lg">{toast}</div>
      )}

      {/* Botones superiores: Biblioteca y Cerrar sesion */}
      <div className="fixed top-4 right-4 z-40 flex items-center gap-2">
        {saldo !== null && (
          <button
            onClick={() => router.push("/precios")}
            title="Imágenes que te quedan · toca para ver planes"
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold border transition-colors ${
              saldo === 0
                ? "bg-[rgba(255,80,0,0.12)] border-[rgba(255,80,0,0.4)] text-orange-300 hover:bg-[rgba(255,80,0,0.2)]"
                : "bg-[rgba(255,245,0,0.08)] border-[rgba(255,245,0,0.25)] text-[#FFF500] hover:bg-[rgba(255,245,0,0.15)]"
            }`}
          >
            <span>🖼</span>
            <span>{saldo}</span>
            <span className="hidden sm:inline font-medium opacity-70">
              {saldo === 1 ? "imagen" : "imágenes"}
            </span>
          </button>
        )}
        <button
          onClick={() => router.push("/post")}
          title="Una sola publicación, para hoy"
          className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-4 py-2 text-xs font-bold text-white/80 transition-colors"
        >
          Post de hoy
        </button>
        <button
          onClick={() => router.push("/biblioteca")}
          className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-4 py-2 text-xs font-bold text-white/80 transition-colors"
        >
          Biblioteca
        </button>
        {esAdminEstilo && (
          <button
            onClick={() => router.push("/biblioteca-estilo")}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-4 py-2 text-xs font-bold text-white/80 transition-colors"
          >
            Biblioteca de Estilo
          </button>
        )}
        <button
          onClick={async () => {
            const supabase = createClient();
            await supabase.auth.signOut();
            limpiarEstadoLocal();
            window.location.href = "/login";
          }}
          className="flex items-center gap-2 bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 rounded-full px-4 py-2 text-xs font-bold text-white/60 hover:text-red-300 transition-colors"
        >
          Cerrar sesion
        </button>
      </div>

      {/* HEADER — icono a la izquierda, mismo patron que los demas modulos */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 pt-16 pb-0">
        <div className="flex flex-col md:flex-row items-center mb-0">
          <div className="flex items-center justify-center gap-2 flex-shrink-0 mb-3 md:mb-0 md:w-[160px]">
            <div className="w-[56px] h-[56px] md:w-[72px] md:h-[72px] rounded-full bg-[#0d001a] border border-[#2a2a2a] flex items-center justify-center flex-shrink-0">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="md:w-[38px] md:h-[38px]">
                <rect x="5" y="7" width="22" height="20" rx="3" stroke="white" strokeWidth="1.6"/>
                <path d="M5 12h22" stroke="white" strokeWidth="1.6"/>
                <path d="M11 4v5M21 4v5" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
                <path d="M16 16l1.4 3.1 3.4.3-2.6 2.2.8 3.3-3-1.8-3 1.8.8-3.3-2.6-2.2 3.4-.3z" fill="white"/>
              </svg>
            </div>
            <p className="text-white text-[14px] font-bold tracking-[0.12em] uppercase leading-tight">Social Planner</p>
          </div>
          <div className="flex-1 text-center md:px-5">
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
          <div className="flex-shrink-0 hidden md:block" style={{width:"160px"}}></div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 md:px-6 pb-20 mt-6 space-y-6">

        {/* Acceso a la biblioteca de productos */}
        <a href="/productos" className="flex items-center justify-between bg-[#0a0a0a] border border-orange-500/40 rounded-2xl px-4 py-3 hover:border-orange-500 transition-colors">
          <div>
            <div className="text-white text-sm font-bold">📦 Mi biblioteca de productos</div>
            <div className="text-[#7A7772] text-[11px]">Crea tus productos una vez y elígelos al armar campañas</div>
          </div>
          <span className="text-orange-400 text-lg">→</span>
        </a>

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
            <div>
            <button onClick={abrirPicker} className="w-full mb-2 bg-[#0d0d0d] border border-orange-500/50 text-orange-300 text-sm font-bold py-2.5 rounded-xl hover:bg-orange-500/10 transition-colors">
              📦 Elegir de mi biblioteca de productos
            </button>

            {/* Aviso de que la campaña va a usar TODA la ficha, no solo lo que
                se ve en el formulario. Sin esto el usuario no sabe que su
                trabajo cargado en la biblioteca si se esta aprovechando. */}
            {pFicha && pFicha.nombre === pNombre && (() => {
              const usados = [
                pFicha.beneficios?.length ? `${pFicha.beneficios.length} beneficios` : "",
                pFicha.promocion ? "promoción" : "",
                (pFicha.precioOferta || pFicha.precio) ? "precios" : "",
                pFicha.publico ? "público" : "",
                pFicha.imagenesDesc?.length ? `${pFicha.imagenesDesc.length} variantes` : "",
              ].filter(Boolean);
              if (!usados.length) return null;
              return (
                <div className="mb-4 bg-green-500/5 border border-green-500/25 rounded-xl px-3 py-2">
                  <p className="text-green-400 text-[11px] font-bold">✓ Ficha completa cargada</p>
                  <p className="text-zinc-400 text-[10px] leading-snug mt-0.5">
                    La campaña va a usar además: {usados.join(" · ")}.
                  </p>
                </div>
              );
            })()}
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
                <div><span className={labelCls}>Que te diferencia de la competencia?</span>
                  <input value={nDiferenciador} onChange={e => setNDiferenciador(e.target.value)} placeholder="Unico que abre domingos, especialistas en..." className={inputCls} /></div>
                <div><span className={labelCls}>A quien le hablas?</span>
                  <input value={nPublico} onChange={e => setNPublico(e.target.value)} placeholder="Mujeres 25-45, jovenes universitarios..." className={inputCls} /></div>
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
          <button onClick={generar} disabled={!listo || generando || !!plan}
            className={`w-full rounded-xl py-4 text-base font-black transition-all ${listo && !generando && !plan ? "text-[#0d0d0d] cursor-pointer hover:brightness-110" : "text-[#0d0d0d] opacity-40 cursor-not-allowed"}`}
            style={{ background: "linear-gradient(90deg,#FFF500,#ffcc00)" }}>
            {generando ? "⚙️ La IA está diseñando tu campaña... (20-40 seg)" : "⚡ Diseñar mi campaña estratégica"}
          </button>
          {plan && (
            <p className="text-center text-[11px] text-[#7A7772] mt-2">
              {planEsDeEsteModo
                ? "Ya tienes esta campaña abierta. Ciérrala abajo para empezar otra."
                : `Tienes una campaña abierta en ${NOMBRE_MODO[plan.modo] || plan.modo}. Ciérrala para empezar otra.`}
            </p>
          )}
          {!plan && !listo && (
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


        {/* Aviso: hay una campaña viva, pero en otro modo */}
        {planEsDeOtroModo && (
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-[#7A7772]">
              Tienes una campaña abierta en <strong className="text-white">{NOMBRE_MODO[plan.modo] || plan.modo}</strong>. Para empezar una aquí, ciérrala primero.
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setModo(plan.modo)}
                className="text-xs font-bold border border-[#333] hover:border-[#555] rounded-full px-4 py-2 text-white"
              >
                Ver esa campaña
              </button>
              <button
                onClick={cancelarCampana}
                className="text-xs font-bold border border-[rgba(255,80,80,0.3)] hover:border-[rgba(255,80,80,0.6)] rounded-full px-4 py-2 text-red-300"
              >
                Cerrar campaña
              </button>
            </div>
          </div>
        )}

        {/* PLAN COMPLETO */}
        {planEsDeEsteModo && (
          <>
            {/* Resumen estrategia */}
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <span className="text-xs font-bold tracking-widest uppercase text-[#FFF500]">✨ Tu campaña estratégica</span>
                <button
                  onClick={cancelarCampana}
                  title="Cierra esta campaña para poder empezar otra. Sigue guardada en tu Biblioteca."
                  className="shrink-0 text-[11px] font-bold border border-[rgba(255,80,80,0.3)] hover:border-[rgba(255,80,80,0.6)] rounded-full px-3 py-1.5 text-red-300"
                >
                  Cancelar esta campaña
                </button>
              </div>
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
                      <div className="grid grid-cols-2 gap-1 mt-1.5">
                        <button onClick={() => generarImagenPieza(i)} className="text-[9px] font-bold py-1.5 rounded bg-[rgba(255,245,0,0.12)] border border-[rgba(255,245,0,0.3)] text-[#FFF500]">↻ Otra</button>
                        <button onClick={() => descargarImg(p.imagen, `dia-${p.dia}.png`)} className="text-[9px] font-bold py-1.5 rounded bg-[#FFF500] text-black">↓ Bajar</button>
                        <button onClick={() => toggleEditarPieza(i)} className="text-[9px] font-bold py-1.5 rounded bg-[rgba(168,85,247,0.15)] border border-[rgba(168,85,247,0.4)] text-purple-300">🖌️ Editar IA</button>
                        <button onClick={() => quitarImgPieza(i)} className="text-[9px] font-bold py-1.5 rounded bg-[rgba(255,80,80,0.1)] border border-[rgba(255,80,80,0.3)] text-red-300">🗑️ Quitar</button>
                      </div>
                      <button onClick={() => guardarImgBiblioteca(p.imagen, `Día ${p.dia}`, { dia: p.dia, tema: p.titulo, copy: [p.titulo, p.copy, p.cta].filter(Boolean).join("\n\n") })} className="w-full mt-1 text-[9px] font-bold py-1.5 rounded bg-[rgba(168,85,247,0.1)] border border-[rgba(168,85,247,0.4)] text-purple-300">📚 Guardar en Galería</button>
                      {p.editandoImg && (
                        <div className="mt-2 bg-[#0d0d0d] border border-[rgba(168,85,247,0.3)] rounded-lg p-2">
                          <input value={p.instruccionImg || ""} onChange={e => cambiarInstruccionPieza(i, e.target.value)}
                            placeholder="Ej: ponle más luz, fondo más oscuro..."
                            className="w-full bg-[#1a1a1a] border border-[#333] text-white text-[10px] px-2 py-1.5 rounded outline-none mb-1.5" />
                          <button onClick={() => editarImgPieza(i)} disabled={!p.instruccionImg}
                            className="w-full text-[10px] font-bold py-1.5 rounded bg-purple-500 text-white disabled:opacity-40">
                            🖌️ Aplicar cambio
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    sinImagenes ? (
                      <button onClick={() => router.push("/precios")}
                        className="text-[11px] font-black py-2.5 px-4 rounded-lg text-[#0d0d0d]"
                        style={{ background: "linear-gradient(90deg,#FFF500,#ffcc00)" }}>
                        Sin imágenes · Ver planes
                      </button>
                    ) : (
                      <button onClick={() => generarImagenPieza(i)} disabled={modo === "producto" && !pImagen}
                        className="text-[11px] font-bold py-2.5 px-4 rounded-lg bg-[rgba(255,80,0,0.12)] border border-orange-500 text-orange-400 disabled:opacity-40 transition-all">
                        🎨 Generar imagen real
                        {modo === "producto" && !pImagen && <span className="block text-[8px] text-[#7A7772] font-normal mt-0.5">Sube una foto del producto arriba primero</span>}
                      </button>
                    )
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
                              <div className="grid grid-cols-2 gap-1 mt-1">
                                <button onClick={() => generarImagenLamina(i, j)} className="text-[8px] font-bold py-1 rounded bg-[rgba(255,245,0,0.12)] border border-[rgba(255,245,0,0.3)] text-[#FFF500]">↻ Otra</button>
                                <button onClick={() => descargarImg(l.imagen, `dia-${p.dia}-lamina-${j + 1}.png`)} className="text-[8px] font-bold py-1 rounded bg-[#FFF500] text-black">↓ Bajar</button>
                                <button onClick={() => toggleEditarLamina(i, j)} className="text-[8px] font-bold py-1 rounded bg-[rgba(168,85,247,0.15)] border border-[rgba(168,85,247,0.4)] text-purple-300">🖌️ Editar</button>
                                <button onClick={() => quitarImgLamina(i, j)} className="text-[8px] font-bold py-1 rounded bg-[rgba(255,80,80,0.1)] border border-[rgba(255,80,80,0.3)] text-red-300">🗑️ Quitar</button>
                              </div>
                              <button onClick={() => guardarImgBiblioteca(l.imagen, `Día ${p.dia} · Lámina ${j + 1}`, { dia: p.dia, lamina: j + 1, tema: l.texto, copy: l.texto })} className="w-full mt-1 text-[8px] font-bold py-1 rounded bg-[rgba(168,85,247,0.1)] border border-[rgba(168,85,247,0.4)] text-purple-300">📚 Galería</button>
                              {l.editandoImg && (
                                <div className="mt-1.5 bg-[#0d0d0d] border border-[rgba(168,85,247,0.3)] rounded-lg p-1.5">
                                  <input value={l.instruccionImg || ""} onChange={e => cambiarInstruccionLamina(i, j, e.target.value)}
                                    placeholder="Ej: más luz, fondo oscuro..."
                                    className="w-full bg-[#1a1a1a] border border-[#333] text-white text-[9px] px-2 py-1 rounded outline-none mb-1" />
                                  <button onClick={() => editarImgLamina(i, j)} disabled={!l.instruccionImg}
                                    className="w-full text-[9px] font-bold py-1 rounded bg-purple-500 text-white disabled:opacity-40">
                                    🖌️ Aplicar
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            sinImagenes ? (
                              <button onClick={() => router.push("/precios")}
                                className="w-full mt-2 text-[9px] font-black py-2 rounded-lg text-[#0d0d0d]"
                                style={{ background: "linear-gradient(90deg,#FFF500,#ffcc00)" }}>
                                Sin imágenes · Ver planes
                              </button>
                            ) : (
                              <button onClick={() => generarImagenLamina(i, j)} disabled={modo === "producto" && !pImagen}
                                className="w-full mt-2 text-[9px] font-bold py-2 rounded-lg bg-[rgba(255,80,0,0.12)] border border-orange-500 text-orange-400 disabled:opacity-40">
                                🎨 Generar imagen
                              </button>
                            )
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
          {Array.isArray(plan.piezas) && plan.piezas.some((p: any) => p.imagen || (Array.isArray(p.laminas) && p.laminas.some((l: any) => l.imagen))) && (
              <div className="bg-[#0a0a0a] border border-[rgba(168,85,247,0.3)] rounded-2xl p-5">
                <span className="text-xs font-bold tracking-widest uppercase text-purple-300 mb-3 block">📚 Guardar toda la campaña en Biblioteca</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button onClick={guardarCampanaPrincipales} disabled={guardandoCampana}
                    className="text-[11px] font-bold py-2.5 rounded-lg bg-[rgba(168,85,247,0.15)] border border-[rgba(168,85,247,0.4)] text-purple-300 disabled:opacity-40">
                    {guardandoCampana ? "⏳ Guardando..." : "📚 Guardar imágenes principales"}
                  </button>
                  <button onClick={guardarCampanaTodo} disabled={guardandoCampana}
                    className="text-[11px] font-bold py-2.5 rounded-lg bg-purple-500 text-white disabled:opacity-40">
                    {guardandoCampana ? "⏳ Guardando..." : "📚 Guardar todo (incluye carruseles)"}
                  </button>
                </div>
                <p className="text-[10px] text-[#7A7772] mt-2">💡 "Principales" guarda la imagen de cada día. "Todo" incluye también las láminas de los carruseles.</p>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}
