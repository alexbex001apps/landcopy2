import { NextRequest, NextResponse } from "next/server";
 
// ─────────────────────────────────────────────────────────────
// MOTOR REDES-CAMPAÑAS · Imágenes (con edición IA)
// Genera la imagen de UN día con gpt-image-2.
// Si viene "imagenPrevia" + "instruccion": edita esa imagen (editar con IA).
// Si no: genera desde la foto del modo + el texto del día.
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
 
// Prompt para generar la imagen normal del día.
function construirPrompt(body: any): string {
  const { modo, diaTitulo, diaTemp, textoImagen, tono } = body;
  const texto = limpiarEtiquetas(textoImagen || diaTitulo || "");
 
  const climaTexto =
    diaTemp === "caliente" ? "High energy, urgency, strong call to action vibe."
    : diaTemp === "tibio" ? "Warm, engaging, building interest."
    : "Calm, inviting, value-first feel.";
 
  let escena = "";
  if (modo === "producto") {
    escena = `Professional ecommerce social media post for the product. The product must be the hero of the image, well lit, premium commercial photography.`;
  } else if (modo === "negocio") {
    escena = `Professional social media post for a local business. Warm, trustworthy, community feel. Use the uploaded photo as the real base of the business.`;
  } else {
    escena = `Professional personal brand social media post. Inspirational and authoritative. Use the uploaded photo of the person as the base. Editorial, aspirational style.`;
  }
 
  return `${escena} Theme of the post: "${diaTitulo}". ${climaTexto} MUST include this exact short bold text overlay on the image (do not add any other text, do not write any labels): "${texto}". Tone: ${tono || "professional"}. Latin American audience. Modern, scroll-stopping, high quality. Square 1024x1024.`;
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
 
// Llama a images/edits con una imagen base + un prompt.
async function editarImagen(imgBuffer: Buffer, prompt: string): Promise<string> {
  const boundary = "----FormBoundary" + Math.random().toString(36).slice(2);
  const parts = [
    `--${boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\ngpt-image-2`,
    `--${boundary}\r\nContent-Disposition: form-data; name="n"\r\n\r\n1`,
    `--${boundary}\r\nContent-Disposition: form-data; name="size"\r\n\r\n1024x1024`,
    `--${boundary}\r\nContent-Disposition: form-data; name="prompt"\r\n\r\n${prompt}`,
  ];
  const textParts = Buffer.from(parts.join("\r\n") + "\r\n");
  const fileHeader = Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="image[]"; filename="base.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`);
  const closing = Buffer.from(`\r\n--${boundary}--\r\n`);
  const bodyBuffer = Buffer.concat([textParts, fileHeader, imgBuffer, closing]);
 
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
  if (!resp.ok) throw new Error(data.error?.message || "Error editando imagen");
  const b64 = data.data?.[0]?.b64_json;
  return b64 ? `data:image/png;base64,${b64}` : "";
}
 
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { foto, imagenPrevia, instruccion } = body;
 
    let imageUrl = "";
 
    // ── CASO 1: EDITAR CON IA (hay imagen previa + instrucción) ──
    if (imagenPrevia && instruccion && instruccion.trim().length > 0) {
      const imgBuffer = await aBuffer(imagenPrevia);
      const promptEdit = `Edit this social media image following this instruction: "${limpiarEtiquetas(instruccion)}". Keep it professional, high quality, square 1024x1024. Do not add any labels or organizational text.`;
      imageUrl = await editarImagen(imgBuffer, promptEdit);
      return NextResponse.json({ imageUrl, diaNumero: body.diaNumero });
    }
 
    // ── CASO 2: GENERAR NORMAL (necesita modo + texto) ──
    if (!body.modo || (!body.textoImagen && !body.diaTitulo)) {
      return NextResponse.json({ error: "Faltan datos (modo o texto del día)" }, { status: 400 });
    }
 
    const prompt = construirPrompt(body);
 
    if (foto && (foto.startsWith("data:") || foto.startsWith("http"))) {
      const imgBuffer = await aBuffer(foto);
      imageUrl = await editarImagen(imgBuffer, prompt);
    } else {
      const resp = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model: "gpt-image-2", prompt, n: 1, size: "1024x1024" }),
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