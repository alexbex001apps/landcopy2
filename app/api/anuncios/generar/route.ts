import { NextRequest, NextResponse } from "next/server";

const TAMANIOS: Record<string, string> = {
  facebook: "1536x1024",
  instagram: "1024x1024",
  stories: "1024x1536",
  tiktok: "1024x1536",
};

const PROMPT_MAESTRO_ANALIZADOR = `You are a Senior Creative Director, Ecommerce Designer, Facebook Ads Expert, and Conversion Specialist.

Your job is to analyze a reference advertising image and extract its complete ADVERTISING DNA to build a prompt capable of reproducing the same sales structure with a different product.

Analyze the image and return ONLY a valid JSON with this exact structure:
{
  "template_name": "short_id like industrial_v1 or beauty_v2",
  "industry": "industry category",
  "conversion_style": "aggressive_ecommerce | premium | urgency | testimonial | authority",
  "psychological_triggers": ["urgency", "scarcity", "authority", "desire"],
  "visual_hierarchy": {
    "first_element": "what the eye sees first",
    "second_element": "what the eye sees second", 
    "third_element": "what the eye sees third"
  },
  "layout": {
    "product_position": "center | left | right | bottom-right",
    "product_scale": "dominant | medium | small",
    "product_perspective": "frontal | angled | floating",
    "headline_position": "top | bottom | left | right | diagonal-top-left",
    "headline_rotation": "horizontal | tilted-left | tilted-right | vertical",
    "headline_angle_degrees": 0
  },
  "typography": {
    "headline_style": "bold condensed | italic bold | outlined | shadow",
    "text_composition": "single block | multiple sizes | layered | asymmetric",
    "has_diagonal_text": true,
    "has_multiple_text_sizes": true
  },
  "colors": {
    "dominant": "#hex",
    "secondary": "#hex",
    "accent": "#hex",
    "text_primary": "#hex"
  },
  "effects": {
    "lighting": "dramatic | soft | neon | cinematic",
    "special_effects": ["glow", "particles", "energy", "smoke"]
  },
  "conversion_elements": {
    "has_urgency_badge": true,
    "has_price": false,
    "has_guarantee": false,
    "has_social_proof": false
  },
  "image_generation_prompt": "ULTRA DETAILED prompt here - must include exact layout, typography hierarchy with angles, product position, lighting effects, conversion elements, and advertising style. Write as if briefing a world-class ad agency. Include: diagonal/angled text instructions, multiple typography sizes, dynamic composition, cinematic lighting, Facebook Ads winner style, ultra detailed, 4K, commercial advertising quality, high conversion layout"
}

IMPORTANT: The image_generation_prompt must be extremely detailed and professional. It must replicate the ADVERTISING ARCHITECTURE not just the visual style. Include specific text angles, hierarchy, and conversion psychology.`;

async function analizarReferencia(referenciaUrl: string, apiKey: string): Promise<string> {
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      max_tokens: 1500,
      messages: [{
        role: "user",
        content: [
          { type: "image_url", image_url: { url: referenciaUrl } },
          { type: "text", text: PROMPT_MAESTRO_ANALIZADOR }
        ]
      }]
    }),
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data.error?.message || "Error analizando referencia");
  const content = data.choices?.[0]?.message?.content || "{}";
  const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  try {
    const json = JSON.parse(cleaned);
    return json.image_generation_prompt || "";
  } catch {
    return "";
  }
}

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
    const { producto, copy, colorFondo, colorTexto, posTexto, formato = "instagram", imagen, referenciaUrl, promptTecnico } = body;

    if (!producto || !copy) {
      return NextResponse.json({ error: "Producto y copy requeridos" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY!;
    const size = TAMANIOS[formato] || "1024x1024";
    const posicionTexto = posTexto === "top" ? "at the top" : posTexto === "bottom" ? "at the bottom" : "in the center";

    let promptFinal: string;

    if (imagen) {
      promptFinal = `Professional advertising image. Use the exact product from the reference photo. Place it in a clean commercial scene. Add this advertising text ${posicionTexto} in large bold typography: "${copy}". Text color: ${colorTexto}. Background: ${colorFondo}. Professional ad design, studio lighting. Ultra detailed, 4K, commercial advertising quality.`;
    } else if (referenciaUrl) {
      let adnPrompt = promptTecnico || "";
      if (!adnPrompt) {
        adnPrompt = await analizarReferencia(referenciaUrl, apiKey);
      }
      promptFinal = `${adnPrompt}

PRODUCT: ${producto}
ADVERTISING TEXT TO INCLUDE: "${copy}"
TEXT COLOR: ${colorTexto}

Apply the exact layout, typography hierarchy, angles, and conversion elements from the advertising DNA above. Replace any product in the reference with ${producto}. The text "${copy}" must appear exactly as described in the typography section. Ultra detailed, 4K, Facebook Ads winner, high conversion layout, commercial advertising quality.`;
    } else {
      promptFinal = `Professional advertising image. Product: ${producto}. Clean commercial background color: ${colorFondo}. Add this advertising text ${posicionTexto} in large bold typography: "${copy}". Text color: ${colorTexto}. Studio lighting, high quality. Ultra detailed, 4K, commercial advertising quality.`;
    }

    const imageUrl = await generarImagenBase64(promptFinal, size, apiKey, imagen, referenciaUrl);

    return NextResponse.json({ imageUrl, success: true });

  } catch (err: any) {
    console.error("Error en /api/anuncios/generar:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}