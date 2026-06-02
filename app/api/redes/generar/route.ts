import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function urlToBase64(url: string): Promise<string> {
  try {
    const res = await fetch(url);
    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const contentType = res.headers.get('content-type') || 'image/png';
    return `data:${contentType};base64,${base64}`;
  } catch {
    return '';
  }
}



const TAMANIOS: Record<string, { width: number; height: number; size: string }> = {
  feed45:   { width: 1080, height: 1350, size: "1024x1536" },
  feed11:   { width: 1080, height: 1080, size: "1024x1024" },
  story916: { width: 1080, height: 1920, size: "1024x1536" },
  reels:    { width: 1080, height: 1920, size: "1024x1536" },
  carrusel: { width: 1080, height: 1350, size: "1024x1536" },
  tiktok:   { width: 1080, height: 1920, size: "1024x1536" },
  facebook: { width: 1080, height: 1080, size: "1024x1024" },
  whatsapp: { width: 800,  height: 800,  size: "1024x1024" },
  story:    { width: 1080, height: 1920, size: "1024x1536" },
};

function buildPrompt(params: {
  producto: string;
  beneficio: string;
  problema: string;
  pais: string;
  tono: string;
  tipo: string;
  destino: string;
  formatoIg: string;
  textoEncima: boolean;
  precioOferta: string;
  precioAnterior: string;
  variante: number;
  promptCustom?: string;
  mejorar?: boolean;
  promptBase?: string;
}): { prompt: string; desc: string } {
  const { producto, beneficio, problema, pais, tono, tipo, variante, precioOferta, precioAnterior, promptCustom, mejorar, promptBase } = params;

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      producto, beneficio = "", problema = "", pais = "Colombia",
      tono = "Urgente", tipo = "escena", destino = "instagram",
      formatoIg = "feed45", textoEncima = false,
      precioOferta = "", precioAnterior = "",
      promptCustom = "", soloUna, mejorar = false, promptBase = "",
    } = body;

    if (!producto) {
      return NextResponse.json({ error: "Producto requerido" }, { status: 400 });
    }

    const claveFormato = destino === "instagram" ? formatoIg : destino;
    const tamano = TAMANIOS[claveFormato] || TAMANIOS.feed11;

    // Si es soloUna — regenerar una idea específica
    if (soloUna) {
      const variante = Math.floor(Math.random() * 4);
      const { prompt, desc } = buildPrompt({
        producto, beneficio, problema, pais, tono, tipo,
        destino, formatoIg, textoEncima, precioOferta, precioAnterior,
        variante, promptCustom, mejorar, promptBase,
      });

      try {
        const response = await openai.images.generate({
          model: "gpt-image-2",
          prompt,
          n: 1,
          size: tamano.size as "1024x1024" | "1024x1536" | "1536x1024",
          quality: "standard",
        });

        const rawUrl = response.data?.[0]?.url || "";
        const imageUrl = rawUrl ? await urlToBase64(rawUrl) : "";
        return NextResponse.json({
          idea: {
            id: soloUna,
            desc,
            modo: promptCustom ? "prompt" : mejorar ? "manual" : "auto",
            imageUrl,
            favorita: false,
          }
        });
      } catch (imgErr) {
        console.error("Error generando imagen:", imgErr);
        return NextResponse.json({
          idea: {
            id: soloUna,
            desc,
            modo: "auto",
            imageUrl: "",
            favorita: false,
          }
        });
      }
    }

    // Generar 4 ideas en paralelo
    const variantes = [0, 1, 2, 3];
    const promesas = variantes.map(async (v) => {
      const { prompt, desc } = buildPrompt({
        producto, beneficio, problema, pais, tono, tipo,
        destino, formatoIg, textoEncima, precioOferta, precioAnterior,
        variante: v, promptCustom: v === 0 ? promptCustom : "",
      });

      try {
        const response = await openai.images.generate({
          model: "gpt-image-2",
          prompt,
          n: 1,
          size: tamano.size as "1024x1024" | "1024x1536" | "1536x1024",
          quality: "standard",
        });

        return {
          id: `idea-${v}`,
          desc,
          modo: (v === 0 && promptCustom ? "prompt" : v < 2 ? "auto" : "manual") as "auto" | "manual" | "prompt",
          imageUrl: response.data?.[0]?.url ? await urlToBase64(response.data[0].url) : "",
          favorita: false,
        };
      } catch (err) {
        console.error(`Error en variante ${v}:`, err);
        return {
          id: `idea-${v}`,
          desc,
          modo: "auto" as const,
          imageUrl: "",
          favorita: false,
        };
      }
    });

    const ideas = await Promise.all(promesas);
    return NextResponse.json({ ideas });

  } catch (err) {
    console.error("Error en /api/redes/generar:", err);
    return NextResponse.json({ error: "Error generando imágenes" }, { status: 500 });
  }
}
