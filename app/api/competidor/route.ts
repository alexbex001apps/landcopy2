import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;

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

INSTRUCCIONES DE SCORING — APLICA ESTOS CRITERIOS CON RIGOR, SIN FAVORECER A NADIE:

Evalúa al competidor Y a nosotros usando exactamente estos 4 criterios (25 puntos cada uno, total 100):

CRITERIO 1 — TITULAR (25 pts):
- ¿Tiene un beneficio claro en menos de 10 palabras? (0-10 pts)
- ¿Genera curiosidad o urgencia inmediata? (0-8 pts)
- ¿Habla del cliente, no del producto? (0-7 pts)

CRITERIO 2 — PROPUESTA DE VALOR (25 pts):
- ¿Diferencia real vs competencia? (0-10 pts)
- ¿Conecta emocionalmente con un dolor específico? (0-8 pts)
- ¿Es creíble y verificable? (0-7 pts)

CRITERIO 3 — PRUEBA SOCIAL (25 pts):
- ¿Tiene testimonios con nombre y ciudad real? (0-10 pts)
- ¿Tiene número concreto de clientes o ventas? (0-8 pts)
- ¿Los testimonios mencionan resultados específicos? (0-7 pts)

CRITERIO 4 — URGENCIA Y CTA (25 pts):
- ¿Tiene escasez real (stock, tiempo)? (0-10 pts)
- ¿El CTA dice exactamente qué hacer y qué pasa después? (0-8 pts)
- ¿Hay una razón concreta para actuar HOY? (0-7 pts)

IMPORTANTE: Si el competidor es una marca grande con prueba social masiva (millones de usuarios, premios, certificaciones), su score de prueba social debe ser alto. Sé honesto. Nuestro score solo puede ser mayor si realmente tenemos ventaja en ese criterio para el mercado latinoamericano específico de ${pais || "Colombia"}.

Responde ÚNICAMENTE con JSON válido sin markdown:
{
  "score_ellos": 0,
  "score_nuestro": 0,
  "desglose_ellos": {
    "titular": 0,
    "propuesta": 0,
    "prueba_social": 0,
    "urgencia": 0
  },
  "desglose_nuestro": {
    "titular": 0,
    "propuesta": 0,
    "prueba_social": 0,
    "urgencia": 0
  },
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
        max_tokens: 1200,
        temperature: 0.3,
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
