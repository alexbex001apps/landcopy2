import { NextRequest, NextResponse } from "next/server";

const TAMANIOS: Record<string, string> = {
  facebook: "1536x1024",
  instagram: "1024x1024",
  stories: "1024x1536",
  tiktok: "1024x1536",
};

async function generarImagenBase64(prompt: string, size: string, apiKey: string, imagen?: string): Promise<string> {
  if (imagen && imagen.startsWith("data:")) {
    const imageBuffer = Buffer.from(imagen.split(",")[1], "base64");
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
    if (!resp.ok) throw new Error(data.error?.message || "Error edición");
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
    if (!resp.ok) throw new Error(data.error?.message || "Error generación");
    const b64 = data.data?.[0]?.b64_json;
    return b64 ? `data:image/png;base64,${b64}` : "";
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { producto, copy, colorFondo, colorTexto, posTexto, formato = "instagram", imagen } = body;

    if (!producto || !copy) {
      return NextResponse.json({ error: "Producto y copy requeridos" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY!;
    const size = TAMANIOS[formato] || "1024x1024";

    const prompt = imagen
      ? `Professional advertising photo. Take the exact product shown in the reference image and place it in a clean commercial scene. Background color: ${colorFondo}. Professional product photography, commercial lighting, no text in the image. The product must be clearly visible and centered.`
      : `Professional advertising product photo of ${producto}. Clean commercial scene, background color ${colorFondo}. Studio lighting, high quality product photography. No text in the image. Centered product, professional ecommerce style.`;

    const imageUrl = await generarImagenBase64(prompt, size, apiKey, imagen);

    return NextResponse.json({ imageUrl, success: true });

  } catch (err: any) {
    console.error("Error en /api/anuncios/generar:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}