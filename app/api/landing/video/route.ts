import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// La generacion de video tarda; le damos aire a la funcion serverless.
// (En Vercel Pro se permite hasta 300s con Fluid Compute.)
export const maxDuration = 300;

// --- Modelos disponibles (el usuario elige por video) ---
// seedance: mas barato (~$0.26/5s). kling: mejor fidelidad del producto (~$0.35/5s).
const RESOLUCION = "720p";
const DURACION_SEG = 5; // default

const MODELOS: Record<string, { endpoint: string; body: (img: string, prompt: string, seg: number) => any }> = {
  seedance: {
    endpoint: "fal-ai/bytedance/seedance/v1.5/pro/image-to-video",
    body: (img, prompt, seg) => ({ image_url: img, prompt, resolution: RESOLUCION, duration: String(seg) }),
  },
  kling: {
    endpoint: "fal-ai/kling-video/v2.5-turbo/pro/image-to-video",
    body: (img, prompt, seg) => ({ image_url: img, prompt, duration: String(seg) }),
  },
};
const PROMPT_DEFECTO = "suave zoom lento sobre el producto, movimiento delicado y elegante, loop perfecto";

// Se agrega a TODOS los prompts: que la IA respete el producto Y SUS PROPORCIONES,
// sin estirarlo, ensancharlo ni deformarlo.
const FIDELIDAD = " CRITICAL: keep the product EXACTLY as in the reference image — same real proportions, dimensions, thickness and scale. Do NOT stretch, squash, widen, elongate, bend, warp or resize the product. Same shape, colors, logos, text and details. Only animate the movement; the product itself must stay rigid and unchanged. If MORE THAN ONE unit of the product appears in the scene, EVERY single unit must be an identical exact copy of the reference product — same model, same design, same colors, same details on all of them; never invent different versions, variations, other models or mismatched units. Do NOT add any logo, brand name, text, letters, symbols or markings that are not already visible in the reference image — no fake logos or invented writing on the product; keep every surface exactly as in the reference.";

// Cuanto esperamos a que fal termine antes de rendirnos
const MAX_INTENTOS = 60;            // 60 intentos
const ESPERA_MS = 4000;            // cada 4s  -> hasta ~4 min

const BUCKET = "biblioteca-images"; // el mismo que ya usa toda la app

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Seedance rechaza imagenes con proporcion muy extrema (ej. 1500x595 = 2.5:1).
// Si la foto se sale de un rango seguro, la acomodamos a cuadrado (con fondo blanco)
// y subimos esa version. Si ya es segura, se usa tal cual.
async function prepararImagen(imageUrl: string): Promise<string> {
  try {
    const resp = await fetch(imageUrl);
    if (!resp.ok) return imageUrl;
    const buf = Buffer.from(await resp.arrayBuffer());
    const sharp = (await import("sharp")).default;
    const meta = await sharp(buf).metadata();
    const w = meta.width || 0;
    const h = meta.height || 0;
    if (!w || !h) return imageUrl;
    const ratio = w / h;
    if (ratio >= 0.65 && ratio <= 1.55) return imageUrl; // ya es segura para seedance

    const lado = 1080;
    const salida = await sharp(buf)
      .resize(lado, lado, { fit: "contain", background: { r: 255, g: 255, b: 255 } })
      .jpeg({ quality: 90 })
      .toBuffer();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const nombre = `landing-videos/fit_${Date.now()}.jpg`;
    const { error } = await supabase.storage.from(BUCKET).upload(nombre, salida, { contentType: "image/jpeg" });
    if (error) return imageUrl; // si falla la subida, seguimos con la original
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(nombre);
    return data.publicUrl || imageUrl;
  } catch {
    return imageUrl; // ante cualquier error, usar la original (no romper el flujo)
  }
}

export async function POST(req: NextRequest) {
  try {
    // Limpia espacios/saltos de linea que se cuelan al pegar la key en Vercel
    // (un enter invisible rompe la cabecera con "invalid header value").
    const FAL_KEY = process.env.FAL_API_KEY?.replace(/\s/g, "");
    if (!FAL_KEY) {
      return NextResponse.json({ error: "Falta configurar FAL_API_KEY en el servidor." }, { status: 500 });
    }

    const { imageUrl, motionPrompt, userId, seccion, duracion, modelo } = await req.json();
    // Solo 5 o 10 segundos; cualquier otra cosa cae al default
    const segundos = duracion === 10 ? 10 : DURACION_SEG;
    // Modelo elegido (default seedance)
    const cfg = MODELOS[modelo] || MODELOS.seedance;

    // fal necesita una imagen PUBLICA (http). Las imagenes recien generadas son
    // data: URLs y no sirven: hay que guardarlas primero.
    if (!imageUrl || typeof imageUrl !== "string" || !imageUrl.startsWith("http")) {
      return NextResponse.json(
        { error: "Guarda la imagen primero (necesita una URL publica para animarla)." },
        { status: 400 }
      );
    }

    const headersFal = {
      "Authorization": `Key ${FAL_KEY}`,
      "Content-Type": "application/json",
    };

    // Acomoda la foto si su proporcion es muy extrema (seedance la rechazaria)
    const imagenParaFal = await prepararImagen(imageUrl);

    // 1. Encolar la generacion (con el modelo elegido)
    const promptFinal = `${motionPrompt?.trim() || PROMPT_DEFECTO}${FIDELIDAD}`;
    const submit = await fetch(`https://queue.fal.run/${cfg.endpoint}`, {
      method: "POST",
      headers: headersFal,
      body: JSON.stringify(cfg.body(imagenParaFal, promptFinal, segundos)),
    });

    const submitData = await submit.json().catch(() => ({}));
    if (!submit.ok) {
      throw new Error(`fal (encolar): ${JSON.stringify(submitData).slice(0, 300)}`);
    }

    const requestId = submitData.request_id;
    const statusUrl = submitData.status_url || `https://queue.fal.run/${cfg.endpoint}/requests/${requestId}/status`;
    const responseUrl = submitData.response_url || `https://queue.fal.run/${cfg.endpoint}/requests/${requestId}`;
    if (!requestId) throw new Error("fal no devolvio request_id");

    // 2. Esperar (polling) hasta que termine
    let completado = false;
    for (let i = 0; i < MAX_INTENTOS; i++) {
      await sleep(ESPERA_MS);
      const st = await fetch(statusUrl, { headers: headersFal }).then((r) => r.json()).catch(() => null);
      const estado = st?.status;
      if (estado === "COMPLETED") { completado = true; break; }
      if (estado === "FAILED" || estado === "ERROR") {
        throw new Error(`fal reporto fallo: ${JSON.stringify(st).slice(0, 200)}`);
      }
      // IN_QUEUE / IN_PROGRESS -> seguir esperando
    }
    if (!completado) throw new Error("La generacion tardo demasiado. Intenta de nuevo.");

    // 3. Recoger el resultado
    const resultado = await fetch(responseUrl, { headers: headersFal }).then((r) => r.json());
    const videoUrlFal = resultado?.video?.url || resultado?.output?.video?.url;
    if (!videoUrlFal) {
      // Caso comun: fal rechaza imagenes con personas reales (proteccion anti-deepfake)
      const crudo = JSON.stringify(resultado);
      if (crudo.includes("likenesses of real people") || crudo.includes("content_policy")) {
        throw new Error("Esta imagen tiene personas y no se puede animar (política de fal). Usa una imagen solo del producto, sin gente.");
      }
      if (crudo.includes("file_download_error")) {
        throw new Error("No se pudo leer la imagen. Guárdala de nuevo e intenta otra vez.");
      }
      if (crudo.includes("invalid_request")) {
        throw new Error("La foto tiene un formato que la IA no acepta. Prueba con otra imagen del producto.");
      }
      throw new Error("No se pudo generar el video. Intenta de nuevo o con otra imagen.");
    }

    // 4. Descargar el mp4 y guardarlo en nuestro Storage (que no dependa de fal a futuro)
    const videoResp = await fetch(videoUrlFal);
    if (!videoResp.ok) throw new Error("No se pudo descargar el video generado.");
    const videoBuffer = Buffer.from(await videoResp.arrayBuffer());

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const carpeta = userId || "landing-videos";
    const nombreArchivo = `${carpeta}/${Date.now()}_${seccion || "video"}.mp4`;

    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(nombreArchivo, videoBuffer, { contentType: "video/mp4", upsert: false });
    if (upErr) throw new Error(`Error subiendo el video: ${upErr.message}`);

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(nombreArchivo);

    return NextResponse.json({
      videoUrl: urlData.publicUrl,
      durationSeconds: segundos,
    });
  } catch (err: any) {
    console.error("Error generando video:", err);
    return NextResponse.json({ error: err.message || "Error al generar el video" }, { status: 500 });
  }
}
