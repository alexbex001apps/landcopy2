import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { url, producto, pais, tono } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL requerida" }, { status: 400 });
    }

    // 1. Leer la página del competidor
    let textoPagina = "";
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml",
          "Accept-Language": "es-ES,es;q=0.9",
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const html = await res.text();

      // Extraer texto limpio del HTML
      textoPagina = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 4000);

    } catch (err) {
      return NextResponse.json({ error: "No pudimos leer esa página. Puede estar caída, bloqueada o la URL no es válida." }, { status: 422 });
    }

    if (textoPagina.length < 100) {
      return NextResponse.json({ error: "La página no tiene suficiente texto de ventas para analizar." }, { status: 422 });
    }

    // 2. Analizar con GPT
    const prompt = `Eres un experto en copywriting y análisis competitivo para negocios latinoamericanos.

Analiza el copy de este competidor y genera una versión superior para nuestro producto.

PRODUCTO NUESTRO: ${producto || "producto similar"}
PAÍS: ${pais || "Colombia"}
TONO: ${tono || "Urgente"}

COPY DEL COMPETIDOR (extraído de su página):
${textoPagina}

Analiza 4 puntos clave y para cada uno muestra qué dice el competidor y cómo lo superamos nosotros.

Responde ÚNICAMENTE con JSON válido sin markdown:
{
  "score_ellos": 65,
  "score_nuestro": 88,
  "url_analizada": "${url}",
  "puntos": [
    {
      "categoria": "TITULAR",
      "ellos": "lo que dice el competidor en su titular (máx 15 palabras)",
      "nosotros": "cómo lo superamos nosotros (máx 15 palabras)"
    },
    {
      "categoria": "PROPUESTA DE VALOR",
      "ellos": "descripción de su propuesta (máx 20 palabras)",
      "nosotros": "cómo la superamos (máx 20 palabras)"
    },
    {
      "categoria": "PRUEBA SOCIAL",
      "ellos": "qué prueba social tienen o no tienen (máx 15 palabras)",
      "nosotros": "cómo la superamos (máx 15 palabras)"
    },
    {
      "categoria": "URGENCIA Y CTA",
      "ellos": "qué urgencia tienen o no tienen (máx 15 palabras)",
      "nosotros": "cómo la superamos (máx 15 palabras)"
    }
  ]
}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Eres un experto en copywriting. Responde SIEMPRE con JSON válido únicamente, sin markdown ni texto adicional." },
          { role: "user", content: prompt }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: "Error al analizar" }, { status: 500 });
    }

    const content = data.choices?.[0]?.message?.content || "{}";
    let resultado: any = {};
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      resultado = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: "No pudimos procesar el análisis." }, { status: 500 });
    }

    return NextResponse.json(resultado);

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}