import { NextRequest, NextResponse } from "next/server";

const TAMANIOS: Record<string, string> = {
  facebook: "1536x1024",
  instagram: "1024x1024",
  stories: "1024x1536",
  tiktok: "1024x1536",
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { producto, copy, colorFondo, colorTexto, posTexto, formato = "instagram", imagen, referenciaUrl } = body;

    if (!producto || !copy) {
      return NextResponse.json({ error: "Producto y copy requeridos" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY!;
    const size = TAMANIOS[formato] || "1024x1024";

    const posicionTexto = posTexto === "top" ? "at the top" : posTexto === "bottom" ? "at the bottom" : "in the center";

    const prompt = imagen
      ? `Professional advertising image. Use the product from the reference photo. Place it in a clean commercial scene. Add this advertising text ${posicionTexto} of the image in large bold typography: "${copy}". Text color: ${colorTexto}. Background: ${colorFondo}. Professional ad design, studio lighting.`
      : referenciaUrl
      ? `Professional advertising image inspired by the reference style. Product: ${producto}. Add this advertising text ${posicionTexto} in large bold typography: "${copy}". Text color: ${colorTexto}. Replicate the visual style and color palette of the reference. Studio lighting, high quality ad design.`
      : `Professional advertising image. Product: ${producto}. Clean commercial background color: ${colorFondo}. Add this advertising text ${posicionTexto} in large bold typography: "${copy}". Text color: ${colorTexto}. Studio lighting, high quality.`;

    const imageUrl = await generarImagenBase64(prompt, size, apiKey, imagen, referenciaUrl);

    return NextResponse.json({ imageUrl, success: true });

  } catch (err: any) {
    console.error("Error en /api/anuncios/generar:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}