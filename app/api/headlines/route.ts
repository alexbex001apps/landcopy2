import { NextRequest, NextResponse } from "next/server";

// Endpoint compartido: da 3 opciones de headline para el producto que se este
// armando. Lo usan Campanas y Anuncios (y sirve para cualquier modulo nuevo que
// pida un headline). Es texto, asi que NO gasta creditos.
export const maxDuration = 300;

const SISTEMA = `Eres un copywriter experto en ventas directas para Latinoamerica (dropshipping, e-commerce, negocios locales).

Tu tarea: escribir 3 headlines para el producto que te den. Cada uno con un ANGULO DISTINTO:
1. DOLOR — pregunta o afirmacion que toca el problema que sufre el cliente.
2. BENEFICIO — la transformacion o resultado que consigue, en positivo.
3. URGENCIA/CURIOSIDAD — algo que obliga a seguir leyendo (novedad, oferta, sorpresa).

Reglas:
- Espanol latino natural, como habla la gente, sin palabras rebuscadas.
- Maximo 10 palabras cada uno. Cortos pegan mas.
- Nada de comillas, numeracion, emojis ni explicaciones.
- Concretos: mencionan el producto o su resultado real, no frases genericas de relleno.
- Los 3 tienen que ser claramente diferentes entre si, no la misma idea reescrita.

Responde SOLO con un JSON valido asi, sin texto alrededor:
{"headlines": ["...", "...", "..."]}`;

export async function POST(req: NextRequest) {
  try {
    const { producto, problema, beneficio, pais, tono, publico } = await req.json();

    if (!producto || !String(producto).trim()) {
      return NextResponse.json({ error: "Escribe primero el nombre del producto." }, { status: 400 });
    }

    // Solo se manda lo que el usuario ya lleno; el resto no estorba el prompt.
    const datos = [
      `Producto: ${producto}`,
      problema ? `Problema que resuelve: ${problema}` : "",
      beneficio ? `Beneficio principal: ${beneficio}` : "",
      publico ? `Publico objetivo: ${publico}` : "",
      pais ? `Pais: ${pais}` : "",
      tono ? `Tono de la marca: ${tono}` : "",
    ].filter(Boolean).join("\n");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SISTEMA },
          { role: "user", content: `Dame 3 headlines para:\n${datos}` },
        ],
        max_tokens: 300,
        temperature: 0.9, // alta: queremos variedad entre los 3
        response_format: { type: "json_object" },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Error de OpenAI generando headlines:", data);
      return NextResponse.json({ error: "No se pudieron generar los headlines. Intenta de nuevo." }, { status: 500 });
    }

    const crudo = data.choices?.[0]?.message?.content || "{}";
    let headlines: string[] = [];
    try {
      const json = JSON.parse(crudo);
      headlines = Array.isArray(json.headlines) ? json.headlines : [];
    } catch {
      // Si la IA no devolvio JSON limpio, rescatamos las lineas con texto.
      headlines = crudo.split("\n").map((l: string) => l.replace(/^[-*\d.\s"]+/, "").trim()).filter(Boolean);
    }

    headlines = headlines
      .map((h) => String(h).replace(/^["'\s]+|["'\s]+$/g, ""))
      .filter(Boolean)
      .slice(0, 3);

    if (headlines.length === 0) {
      return NextResponse.json({ error: "No se pudieron generar los headlines. Intenta de nuevo." }, { status: 500 });
    }

    return NextResponse.json({ headlines });
  } catch (err: any) {
    console.error("Error generando headlines:", err);
    return NextResponse.json({ error: err.message || "Error al generar los headlines" }, { status: 500 });
  }
}
