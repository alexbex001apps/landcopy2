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

function construirPromptMaestro(params: {
  producto: string;
  headline: string;
  urgencia?: string;
  beneficios?: string[];
  badge?: string;
  cta?: string;
  precioOferta?: string;
  precioAnterior?: string;
  colorTexto: string;
  colorFondo: string;
  promptTecnico?: string;
}): string {
  const { producto, headline, urgencia, beneficios, badge, cta, precioOferta, precioAnterior, colorTexto, colorFondo, promptTecnico } = params;

  const beneficiosTexto = beneficios && beneficios.length > 0
    ? beneficios.map(b => `✓ ${b}`).join(", ")
    : "";

  const precioTexto = precioOferta
    ? precioAnterior
      ? `Price: BEFORE ${precioAnterior} NOW ${precioOferta}`
      : `Price: ${precioOferta}`
    : "";

  const base = promptTecnico || `Professional ecommerce advertising image, dark background, cinematic lighting, high contrast, Facebook Ads winner style`;

  return `${base}

You are creating a HIGH-CONVERSION LATIN AMERICAN ECOMMERCE ADVERTISEMENT. This must look like a winning Meta Ads campaign created by a professional agency.

PRODUCT: ${producto}

MANDATORY ADVERTISING BLOCKS - ALL MUST BE PRESENT:

BLOCK 1 - MASSIVE HEADLINE (HIGHEST PRIORITY):
Text: "${headline}"
Position: Top area of image
Size: Very large, occupies 25-35% of canvas height
Style: Bold, aggressive, commercial, high impact
Typography: Uppercase, heavy weight, condensed
Angle: SLIGHT DIAGONAL - tilted approximately -5 to -10 degrees, NOT perfectly horizontal
Color: ${colorTexto}
This must be the FIRST thing the eye sees.

${urgencia ? `BLOCK 2 - URGENCY STRIP:
Text: "${urgencia}"
Position: Immediately below headline
Style: Red banner or red brush stroke
Purpose: Generate urgency and FOMO` : ""}

BLOCK 3 - PRODUCT HERO:
The product ${producto} must DOMINATE the image
Position: Center, large scale
Style: Dramatic cinematic lighting, sharp, premium, valuable
Use: Perspective, depth, reflections, shadows
The product must NOT look like a catalog image

${beneficiosTexto ? `BLOCK 4 - BENEFIT COLUMN:
Position: Left side, vertical stack
Benefits: ${beneficiosTexto}
Style: Commercial, easy to scan, with checkmarks or icons` : ""}

${badge ? `BLOCK 5 - URGENCY BADGE:
Position: Right side, middle area
Text: "${badge}"
Style: Sticker or seal, slight rotation, high contrast, strong visibility` : ""}

${precioTexto ? `PRICING BLOCK:
${precioTexto}
Show crossed-out original price if applicable, highlighted new price` : ""}

${cta ? `BLOCK 6 - CTA BUTTON:
Position: Bottom area
Text: "${cta}"
Style: Large red ecommerce button, 70-90% width, uppercase white bold text
Must feel clickable and be one of the strongest visual elements` : ""}

TYPOGRAPHY RULES:
- Multiple font sizes throughout
- Dynamic hierarchy
- Angled/diagonal headlines
- Layered typography
- Advertising tension

VISUAL EFFECTS:
- Cinematic lighting
- Volumetric lighting  
- High contrast
- Glow effects
- Energy particles or smoke
- Premium commercial rendering

CONVERSION PSYCHOLOGY:
Must communicate: Urgency, Scarcity, Value, Professional quality, Immediate action

STYLE: Facebook Ads Winner, Ecommerce Winner, High CTR Advertisement, Direct Response Advertising
QUALITY: Ultra detailed, Ultra realistic, Commercial advertising quality, Professional marketing design, 4K, Sharp focus, Premium ecommerce style, High conversion layout`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      producto, headline, urgencia, beneficios, badge, cta,
      precioOferta, precioAnterior, colorFondo, colorTexto,
      posTexto, formato = "instagram", imagen, referenciaUrl, promptTecnico
    } = body;

    if (!producto || !headline) {
      return NextResponse.json({ error: "Producto y headline requeridos" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY!;
    const size = TAMANIOS[formato] || "1024x1024";

    const promptFinal = construirPromptMaestro({
      producto, headline, urgencia, beneficios, badge, cta,
      precioOferta, precioAnterior, colorTexto, colorFondo, promptTecnico,
    });

    const imageUrl = await generarImagenBase64(promptFinal, size, apiKey, imagen, referenciaUrl);

    return NextResponse.json({ imageUrl, success: true });

  } catch (err: any) {
    console.error("Error en /api/anuncios/generar:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}