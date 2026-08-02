import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// La generacion de video tarda; le damos aire a la funcion serverless.
// (En Vercel Pro se permite hasta 300s con Fluid Compute.)
export const maxDuration = 300;

// --- Config del modelo (todo lo ajustable, en un solo lugar) ---
// Seedance Lite v1.0: mas barato (~$0.18 por clip 5s/720p) y moderacion menos
// agresiva que la 2.0, que daba falsos positivos ("personas") con fotos de producto.
const MODELO = "fal-ai/bytedance/seedance/v1/lite/image-to-video";
const RESOLUCION = "720p";          // 720p en Lite = ~$0.036/seg
const DURACION_SEG = 5;             // clip corto; ~$0.18 por generacion
const PROMPT_DEFECTO = "the jacket rotates slowly side to side like a showroom turntable, while its color smoothly transitions from white to solid black and back, holding steady on each color. Keep the exact same jacket shape and design, only the color changes. Camera fixed, clean studio, seamless loop.";

// Cuanto esperamos a que fal termine antes de rendirnos
const MAX_INTENTOS = 60;            // 60 intentos
const ESPERA_MS = 4000;            // cada 4s  -> hasta ~4 min

const BUCKET = "biblioteca-images"; // el mismo que ya usa toda la app

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(req: NextRequest) {
  try {
    const FAL_KEY = process.env.FAL_API_KEY;
    if (!FAL_KEY) {
      return NextResponse.json({ error: "Falta configurar FAL_API_KEY en el servidor." }, { status: 500 });
    }

    const { imageUrl, motionPrompt, userId, seccion } = await req.json();

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

    // 1. Encolar la generacion
    const submit = await fetch(`https://queue.fal.run/${MODELO}`, {
      method: "POST",
      headers: headersFal,
      body: JSON.stringify({
        image_url: imageUrl,
        prompt: motionPrompt?.trim() || PROMPT_DEFECTO,
        resolution: RESOLUCION,
        duration: String(DURACION_SEG),
      }),
    });

    const submitData = await submit.json().catch(() => ({}));
    if (!submit.ok) {
      throw new Error(`fal (encolar): ${JSON.stringify(submitData).slice(0, 300)}`);
    }

    const requestId = submitData.request_id;
    const statusUrl = submitData.status_url || `https://queue.fal.run/${MODELO}/requests/${requestId}/status`;
    const responseUrl = submitData.response_url || `https://queue.fal.run/${MODELO}/requests/${requestId}`;
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
      throw new Error(`No se pudo generar el video: ${crudo.slice(0, 200)}`);
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
      durationSeconds: DURACION_SEG,
    });
  } catch (err: any) {
    console.error("Error generando video:", err);
    return NextResponse.json({ error: err.message || "Error al generar el video" }, { status: 500 });
  }
}
