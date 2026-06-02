import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

const TAMANIOS: Record<string, string> = {
  facebook: "1536x1024",
  instagram: "1024x1024",
  stories: "1024x1536",
  tiktok: "1024x1536",
};

const SHARP_TAMANIOS: Record<string, { width: number; height: number }> = {
  facebook: { width: 1536, height: 1024 },
  instagram: { width: 1024, height: 1024 },
  stories: { width: 1024, height: 1536 },
  tiktok: { width: 1024, height: 1536 },
};

async function generarImagenBase64(prompt: string, size: string, apiKey: string, imagen?: string, referenciaUrl?: string): Promise<string> {
  const imagenParaEditar = imagen || (referenciaUrl ? await fetchImagenComoBase64(referenciaUrl) : null);

  if (imagenParaEditar && imagenParaEditar.startsWith("data:")) {
    const imageBuffer = Buffer.from(imagenParaEditar.split(",")[1], "base64");
    const boundary = "----FormBoundary" + Math.random().toString(36).slice(2);
    const parts = [
      `--${boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\ngpt-image-2`,
      `--${boundary}\r\nContent-Disposition: form-data; name="n"\r\n\r\n1`,
      `--${boundary}\r\nContent-Disposition: form-data; name="size"\r\n\r\n${size}`,
      `--${boundary}\r\nContent-Disposition: form-data; name="prompt"\r\n\r\n${prompt}`,
    ];
    const textParts = Buffer.from(parts.join("\r\n") + "\r\n");
    const fileHeader = Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="image[]"; filename="product.png"\r\nContent-Type: image/jpeg\r\n\r\n`);
    const closing = Buffer.from(`\r\n--${boundary}--\r\n`);
    const body = Buffer.concat([textParts, fileHeader, imageBuffer, closing]);

    const resp = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "Content-Length": String(body.length),
      },
      body,
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error?.message || "Error edicion");
    const b64 = data.data?.[0]?.b64_json;
    return b64 ? `data:image/png;base64,${b64}` : "";
  } else {
    const resp = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: "gpt-image-2", prompt, n: 1, size }),
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error?.message || "Error generacion");
    const b64 = data.data?.[0]?.b64_json;
    return b64 ? `data:image/png;base64,${b64}` : "";
  }
}

async function fetchImagenComoBase64(url: string): Promise<string> {
  const resp = await fetch(url);
  const buffer = await resp.arrayBuffer();
  const b64 = Buffer.from(buffer).toString("base64");
  return `data:image/jpeg;base64,${b64}`;
}

async function dibujarTextoConSharp(
  imageBase64: string,
  texto: string,
  posTexto: string,
  colorTexto: string,
  tamanio: { width: number; height: number }
): Promise<string> {
  const imageBuffer = Buffer.from(imageBase64.split(",")[1], "base64");
  
  const fontSize = Math.floor(tamanio.width * 0.042);
  const charsPorLinea = Math.floor((tamanio.width - 100) / (fontSize * 0.6));
  const palabras = texto.split(" ");
  const lineas: string[] = [];
  let lineaActual = "";

  for (const palabra of palabras) {
    if ((lineaActual + " " + palabra).trim().length > charsPorLinea) {
      if (lineaActual) lineas.push(lineaActual.trim());
      lineaActual = palabra;
    } else {
      lineaActual = (lineaActual + " " + palabra).trim();
    }
  }
  if (lineaActual) lineas.push(lineaActual.trim());

  const lineHeight = fontSize * 1.5;
  const totalTextHeight = lineas.length * lineHeight + 40;
  let yInicio: number;

  if (posTexto === "top") yInicio = 20;
  else if (posTexto === "bottom") yInicio = tamanio.height - totalTextHeight - 20;
  else yInicio = (tamanio.height - totalTextHeight) / 2;

  // Fondo semitransparente detrás del texto
  const rectAltura = totalTextHeight + 20;
  const rectY = Math.max(0, yInicio - 10);

  const svgLineas = lineas.map((linea, i) => {
    const y = yInicio + i * lineHeight + fontSize;
    // Convertir caracteres no-ASCII a entidades numéricas
    const lineaEscapada = Array.from(linea).map(c => {
      const code = c.charCodeAt(0);
      return code > 127 ? `&#${code};` : c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c;
    }).join('');
    
    return `
      <text x="${tamanio.width / 2}" y="${y + 2}"
        font-size="${fontSize}" font-weight="bold" font-style="normal"
        text-anchor="middle" fill="rgba(0,0,0,0.6)">${lineaEscapada}</text>
      <text x="${tamanio.width / 2}" y="${y}"
        font-size="${fontSize}" font-weight="bold"
        text-anchor="middle" fill="${colorTexto}">${lineaEscapada}</text>
    `;
  }).join("");

  const svg = `<svg width="${tamanio.width}" height="${tamanio.height}" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="${rectY}" width="${tamanio.width}" height="${rectAltura}" fill="rgba(0,0,0,0.25)" rx="0"/>
    ${svgLineas}
  </svg>`;

  const resultado = await sharp(imageBuffer)
    .resize(tamanio.width, tamanio.height)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .png()
    .toBuffer();

  return `data:image/png;base64,${resultado.toString("base64")}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { producto, copy, colorFondo, colorTexto, posTexto, formato = "instagram", imagen, referenciaUrl } = body;

    if (!producto || !copy) {
      return NextResponse.json({ error: "Producto y copy requeridos" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY!;
    const size = TAMANIOS[formato] || "1024x1024";
    const tamanio = SHARP_TAMANIOS[formato] || { width: 1024, height: 1024 };

    const prompt = imagen
      ? `Professional advertising photo. Take the exact product shown in the reference image and place it in a clean commercial scene with background color ${colorFondo}. Professional product photography, commercial lighting, NO TEXT in the image. Product clearly visible and centered.`
      : referenciaUrl
      ? `Professional advertising product photo of ${producto}. Replicate the visual style, composition and color palette of the reference image. Studio lighting, high quality. NO TEXT in the image. Centered product.`
      : `Professional advertising product photo of ${producto}. Clean commercial scene, background color ${colorFondo}. Studio lighting, high quality. NO TEXT in the image. Centered product.`;

    let imageUrl = await generarImagenBase64(prompt, size, apiKey, imagen, referenciaUrl);

    if (imageUrl && copy) {
      imageUrl = await dibujarTextoConSharp(imageUrl, copy, posTexto || "top", colorTexto || "#ffffff", tamanio);
    }

    return NextResponse.json({ imageUrl, success: true });

  } catch (err: any) {
    console.error("Error en /api/anuncios/generar:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}