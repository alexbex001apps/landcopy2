import { NextRequest, NextResponse } from "next/server";

const TAMANIOS: Record<string, string> = {
  feed45:   "1024x1536",
  feed11:   "1024x1024",
  story916: "1024x1536",
  reels:    "1024x1536",
  carrusel: "1024x1536",
  tiktok:   "1024x1536",
  facebook: "1024x1024",
  whatsapp: "1024x1024",
  story:    "1024x1536",
};

function buildPrompt(params: {
  producto: string;
  beneficio: string;
  problema: string;
  pais: string;
  tipo: string;
  variante: number;
  promptCustom?: string;
  mejorar?: boolean;
  promptBase?: string;
}): { prompt: string; desc: string } {
  const { producto, beneficio, problema, pais, tipo, variante, promptCustom, mejorar, promptBase } = params;

  if (promptCustom && promptCustom.trim()) {
    return { prompt: promptCustom, desc: promptCustom.slice(0, 80) };
  }

  if (mejorar && promptBase) {
    return {
      prompt: `${promptBase}. Improve the composition: better lighting, more professional staging, higher visual impact. Keep the same product but make the scene more compelling and realistic.`,
      desc: `Versión mejorada: ${promptBase.slice(0, 60)}`
    };
  }

  const contextos: Record<string, string[]> = {
    escena: [
      `Product photography of ${producto} placed on a warm wooden table in a cozy Colombian living room. Natural side lighting. A ${problema.toLowerCase()} sufferer's home environment. Photorealistic, commercial photography style.`,
      `Studio product shot of ${producto} on a clean white marble surface surrounded by natural green plants. Soft diffused lighting. Professional ecommerce photography.`,
      `${producto} displayed in a modern medical consultation room on a white desk. Doctor's office background slightly blurred. Clinical and trustworthy atmosphere.`,
      `${producto} in an outdoor garden setting during golden hour. Warm sunlight, flowers in background, rustic wooden surface. Lifestyle product photography.`,
    ],
    ugc: [
      `A 60-year-old Latin American woman sitting in her living room holding ${producto} and smiling with relief. Natural home lighting. Authentic user-generated content style.`,
      `A middle-aged Latin American man using ${producto} while sitting comfortably at home. Casual clothing, natural expression of relief. Authentic lifestyle photography.`,
      `A grandmother from ${pais} showing ${producto} to her family in a kitchen setting. Warm family atmosphere, genuine emotions. UGC style photography.`,
      `A person from ${pais} discovering ${producto} for the first time, looking satisfied and relieved. Authentic reaction, home setting. UGC content style.`,
    ],
    texto: [
      `Clean minimalist graphic design with dark background. Bold yellow text reads: "${beneficio}". Product name "${producto}" in large typography. Professional advertising design.`,
      `Modern advertising poster with gradient dark background. Large white headline text: "¿${problema}?" with ${producto} solution below. Clean typography, advertising style.`,
      `Minimalist product advertisement. Black background, bold white and yellow typography. Promotional price display with strikethrough original price. Modern graphic design.`,
      `Bold typographic advertising poster. Dark background, high contrast. "${beneficio}" as main headline. Clean modern advertising design for social media.`,
    ],
    antesdespues: [
      `Split panel image. Left side labeled "ANTES" shows a person with ${problema.toLowerCase()} looking uncomfortable. Right side labeled "DESPUÉS" shows the same person happy and active after using ${producto}. Clean dividing line. Photorealistic.`,
      `Before and after comparison image. Left panel: person suffering from ${problema.toLowerCase()}, gray tones. Right panel: same person happy using ${producto}, warm bright tones. Professional comparison photography.`,
      `Two-panel comparison photo. Left: dark moody image showing ${problema.toLowerCase()} problem. Right: bright cheerful image with ${producto} and person smiling. High contrast before/after style.`,
      `Side by side comparison. Before: person limited by ${problema.toLowerCase()}. After: active happy person with ${producto}. Bold "ANTES" and "DESPUÉS" labels. Advertising photography style.`,
    ],
  };

  const prompts = contextos[tipo] || contextos.escena;
  const prompt = prompts[variante % prompts.length];
  const desc = prompt.slice(0, 100) + "...";

  return { prompt, desc };
}

async function generarImagenBase64(prompt: string, size: string, apiKey: string, imagen?: string): Promise<string> {
  if (imagen && (imagen.startsWith("data:") || imagen.startsWith("http"))) {
    // Con imagen de referencia — usar edits endpoint (acepta base64 Y url http como Landing)
    let imageBuffer: Buffer;
    if (imagen.startsWith("http")) {
      const imgResp = await fetch(imagen);
      const imgBlob = await imgResp.blob();
      imageBuffer = Buffer.from(await imgBlob.arrayBuffer());
    } else {
      imageBuffer = Buffer.from(imagen.split(",")[1], "base64");
    }
    const boundary = "----FormBoundary" + Math.random().toString(36).slice(2);
    const parts = [
      `--${boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\ngpt-image-2`,
      `--${boundary}\r\nContent-Disposition: form-data; name="n"\r\n\r\n1`,
      `--${boundary}\r\nContent-Disposition: form-data; name="size"\r\n\r\n${size}`,
      `--${boundary}\r\nContent-Disposition: form-data; name="prompt"\r\n\r\nCRITICAL: Use the EXACT product from the reference image — do NOT redraw, redesign or imagine a different product. Keep its exact colors, shape, logo, label and design pixel-faithful. Only change the scene/background around it. Scene: ${prompt}`,
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
    // Sin imagen — generación directa con b64_json
    const resp = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-image-2",
        prompt,
        n: 1,
        size,
      }),
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
    const {
      producto, beneficio = "", problema = "", pais = "Colombia",
      tono = "Urgente", tipo = "escena", destino = "instagram",
      formatoIg = "feed45", imagen,
      promptCustom = "", soloUna, mejorar = false, promptBase = "",
    } = body;

    if (!producto) {
      return NextResponse.json({ error: "Producto requerido" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY!;
    const claveFormato = destino === "instagram" ? formatoIg : destino;
    const size = TAMANIOS[claveFormato] || "1024x1024";

    if (soloUna) {
      const variante = Math.floor(Math.random() * 4);
      const { prompt, desc } = buildPrompt({
        producto, beneficio, problema, pais, tipo,
        variante, promptCustom, mejorar, promptBase,
      });

      try {
        const imageUrl = await generarImagenBase64(prompt, size, apiKey, imagen);
        return NextResponse.json({
          idea: {
            id: soloUna,
            desc,
            modo: promptCustom ? "prompt" : mejorar ? "manual" : "auto",
            imageUrl,
            favorita: false,
          }
        });
      } catch (err) {
        console.error("Error generando imagen:", err);
        return NextResponse.json({
          idea: { id: soloUna, desc, modo: "auto", imageUrl: "", favorita: false }
        });
      }
    }

    // Generar 4 ideas en paralelo
    const promesas = [0, 1, 2, 3].map(async (v) => {
      const { prompt, desc } = buildPrompt({
        producto, beneficio, problema, pais, tipo,
        variante: v, promptCustom: v === 0 ? promptCustom : "",
      });

      try {
        const imageUrl = await generarImagenBase64(prompt, size, apiKey, imagen);
        return {
          id: `idea-${v}`,
          desc,
          modo: (v === 0 && promptCustom ? "prompt" : v < 2 ? "auto" : "manual") as "auto" | "manual" | "prompt",
          imageUrl,
          favorita: false,
        };
      } catch (err) {
        console.error(`Error en variante ${v}:`, err);
        return { id: `idea-${v}`, desc, modo: "auto" as const, imageUrl: "", favorita: false };
      }
    });

    const ideas = await Promise.all(promesas);
    return NextResponse.json({ ideas });

  } catch (err) {
    console.error("Error en /api/redes/generar:", err);
    return NextResponse.json({ error: "Error generando imágenes" }, { status: 500 });
  }
}
