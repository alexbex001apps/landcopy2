import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;
 
// ─────────────────────────────────────────────────────────────
// MOTOR REDES-CAMPAÑAS · Imágenes (fidelidad fuerte + varias fotos)
// Genera la imagen de UN día con gpt-image-2.
// Usa TODAS las fotos del modo como referencia (no solo la primera).
// Si viene "imagenPrevia" + "instruccion": edita esa imagen (editar con IA).
// ─────────────────────────────────────────────────────────────
 
function limpiarEtiquetas(texto: string): string {
  if (!texto) return "";
  return texto
    .replace(/\b(TITULAR|TITTULAR|SUBTITULO|SUBTÍTULO|FRASE|CTA|CIERRE|GARANTIA|GARANTÍA|BENEFICIO|PASO|TESTIMONIO|CONCEPTO|CAPTION)\s*\d*\s*:/gi, "")
    .replace(/\s*\|\s*/g, " — ")
    .replace(/\n+/g, " · ")
    .replace(/\s{2,}/g, " ")
    .trim();
}
 
// Prompt para generar la imagen del día — CON FIDELIDAD FUERTE.
function construirPrompt(body: any): string {
  const { modo, diaTitulo, diaTemp, textoImagen, tono } = body;
  const texto = limpiarEtiquetas(textoImagen || diaTitulo || "");
 
  const climaTexto =
    diaTemp === "caliente" ? "High energy, urgency, strong call to action vibe."
    : diaTemp === "tibio" ? "Warm, engaging, building interest."
    : "Calm, inviting, value-first feel.";
 
  // Instrucción de fidelidad fuerte según el modo.
  let fidelidad = "";
  let escena = "";
  if (modo === "producto") {
    fidelidad = `CRITICAL: Keep EXACTLY the same product shown in the reference photos: same shape, same color, same brand, same details and proportions. Do NOT invent a different product. Do NOT alter the product. The product in the output MUST be identical to the reference.`;
    escena = `Professional ecommerce social media post. The product is the hero, well lit, premium commercial photography.`;
  } else if (modo === "negocio") {
    fidelidad = `CRITICAL: Use faithfully the real place, products and elements shown in the reference photos. Do NOT invent a different business. Keep the real look of this specific business.`;
    escena = `Professional social media post for a local business. Warm, trustworthy, community feel.`;
  } else {
    fidelidad = `CRITICAL: Keep EXACTLY the same person shown in the reference photos: same face, same facial features, same skin tone, same hair, same identity. Do NOT invent a new person. Do NOT create different people. The person in the output MUST be clearly recognizable as the same individual from the reference photos.`;
    escena = `Professional personal brand social media post. Inspirational and authoritative.`;
  }
 
  return `${escena} ${fidelidad} Theme of the post: "${diaTitulo}". ${climaTexto} MUST include this exact short bold text overlay on the image (do not add any other text, do not write any labels): "${texto}". Tone: ${tono || "professional"}. Latin American audience. Modern, scroll-stopping, high quality. Square 1024x1024.`;
}
 
// Convierte una imagen (data:base64 o http) a Buffer.
async function aBuffer(img: string): Promise<Buffer> {
  if (img.startsWith("http")) {
    const r = await fetch(img);
    const b = await r.blob();
    return Buffer.from(await b.arrayBuffer());
  }
  const base64 = img.split(",")[1];
  return Buffer.from(base64, "base64");
}
 
// Llama a images/edits con UNA O VARIAS imágenes base + un prompt.
async function editarImagenes(buffers: Buffer[], prompt: string): Promise<string> {
  const boundary = "----FormBoundary" + Math.random().toString(36).slice(2);
  const parts = [
    `--${boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\ngpt-image-2`,
    `--${boundary}\r\nContent-Disposition: form-data; name="n"\r\n\r\n1`,
    `--${boundary}\r\nContent-Disposition: form-data; name="size"\r\n\r\n1024x1024`,
    `--${boundary}\r\ncontent-disposition: form-data; name="quality"\r\n\r\nmedium`,
    `--${boundary}\r\nContent-Disposition: form-data; name="prompt"\r\n\r\n${prompt}`,
  ];
  const textParts = Buffer.from(parts.join("\r\n") + "\r\n");
 
  // Agregar cada imagen como image[] (gpt-image-2 acepta varias)
  const imgParts: Buffer[] = [];
  buffers.forEach((buf, i) => {
    const header = Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="image[]"; filename="ref${i}.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`);
    imgParts.push(header, buf, Buffer.from("\r\n"));
  });
 
  const closing = Buffer.from(`--${boundary}--\r\n`);
  const bodyBuffer = Buffer.concat([textParts, ...imgParts, closing]);
 
  const resp = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
      "Content-Length": String(bodyBuffer.length),
    },
    body: bodyBuffer,
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data.error?.message || "Error con la imagen");
  const b64 = data.data?.[0]?.b64_json;
  return b64 ? `data:image/png;base64,${b64}` : "";
}
 
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fotos, imagenPrevia, instruccion } = body;
 
    let imageUrl = "";
 
    // ── CASO 1: EDITAR CON IA (hay imagen previa + instrucción) ──
    if (imagenPrevia && instruccion && instruccion.trim().length > 0) {
      const imgBuffer = await aBuffer(imagenPrevia);
      const promptEdit = `Edit this social media image following this instruction: "${limpiarEtiquetas(instruccion)}". Keep the same person/product identity, do not change who or what is shown unless asked. Keep it professional, high quality, square 1024x1024. Do not add any labels or organizational text.`;
      imageUrl = await editarImagenes([imgBuffer], promptEdit);
      return NextResponse.json({ imageUrl, diaNumero: body.diaNumero });
    }
 
    // ── CASO 2: GENERAR NORMAL (necesita modo + texto) ──
    if (!body.modo || (!body.textoImagen && !body.diaTitulo)) {
      return NextResponse.json({ error: "Faltan datos (modo o texto del día)" }, { status: 400 });
    }
 
    const prompt = construirPrompt(body);
 
    // fotos puede venir como array (varias) o como string (una). Normalizamos.
    let listaFotos: string[] = [];
    if (Array.isArray(fotos)) listaFotos = fotos.filter(Boolean);
    else if (typeof fotos === "string" && fotos.length > 0) listaFotos = [fotos];
 
    // Filtrar solo las válidas (data:base64 o http) y limitar a 5 por seguridad.
    listaFotos = listaFotos.filter(f => f.startsWith("data:") || f.startsWith("http")).slice(0, 5);
 
    if (listaFotos.length > 0) {
      const buffers: Buffer[] = [];
      for (const f of listaFotos) buffers.push(await aBuffer(f));
      imageUrl = await editarImagenes(buffers, prompt);
    } else {
      // Sin fotos: generar desde cero
      const resp = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model: "gpt-image-2", prompt, n: 1, size: "1024x1024", quality: "medium" }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error?.message || "Error generando imagen");
      const b64 = data.data?.[0]?.b64_json;
      imageUrl = b64 ? `data:image/png;base64,${b64}` : "";
    }
 
    return NextResponse.json({ imageUrl, diaNumero: body.diaNumero });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
