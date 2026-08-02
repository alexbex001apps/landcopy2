import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { producto, caracteristicas, problema, beneficio, precioOferta, precioAnterior, clientes, competidor, pais, tono, categoria, imagen, queGenerar, seccion } = body;

    if (!producto) {
      return NextResponse.json({ error: "Producto requerido" }, { status: 400 });
    }

    // ── NUEVO: regenerar un día específico de la campaña ──────────────────
    if (seccion && seccion.startsWith("campana-dia-")) {
      const numeroDia = seccion.replace("campana-dia-", "");
      const promptDia = `Eres un experto en copywriting para negocios latinoamericanos.

Genera ÚNICAMENTE el contenido del Día ${numeroDia} de una campaña de lanzamiento de 7 días para este producto:
- Producto: ${producto}
- País: ${pais || "Colombia"}
- Tono: ${tono || "Urgente"}
- Categoría: ${categoria || "Salud y bienestar"}
- Características: ${caracteristicas || "ninguna"}
- Problema que resuelve: ${problema || "ninguno"}
- Beneficio principal: ${beneficio || "ninguno"}
- Precio oferta: ${precioOferta || "no especificado"}
- Clientes actuales: ${clientes || "no especificado"}

INSTRUCCIONES DE TONO:
- Urgente: escasez, tiempo limitado, pérdida si no actúa ya, números concretos.
- Emocional: historia, dolor profundo, transformación, lágrimas a sonrisas.
- Racional: datos, comparaciones, lógica, ROI, evidencia.
- Casual: amigo hablando, relajado, sin presión, conversacional.
- Confianza: autoridad, trayectoria, garantías, testimonios verificables.
- Premium: exclusividad, lujo, selecto, no para todos.

Responde ÚNICAMENTE con JSON válido sin markdown ni texto adicional:
{
  "titulo": "título corto del día ${numeroDia} (máximo 10 palabras)",
  "texto": "contenido completo del día ${numeroDia} (2-3 párrafos persuasivos)"
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
            { role: "user", content: promptDia }
          ],
          max_tokens: 800,
          temperature: 0.7,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        return NextResponse.json({ error: JSON.stringify(data) }, { status: 500 });
      }

      const content = data.choices?.[0]?.message?.content || "{}";
      let resultado: any = {};
      try {
        const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        resultado = JSON.parse(cleaned);
      } catch {
        resultado = { titulo: `Día ${numeroDia}`, texto: content };
      }

      return NextResponse.json({ campana_dia: resultado });
    }
    // ── FIN NUEVO ─────────────────────────────────────────────────────────

    const gl = !queGenerar || queGenerar.includes("Landing page");
    const gw = !queGenerar || queGenerar.includes("WhatsApp x3");
    const gm = !queGenerar || queGenerar.includes("Meta Ads");
    const gc = !queGenerar || queGenerar.includes("Campaña 7 días");
    const ge = !queGenerar || queGenerar.includes("SEO + extras") || queGenerar.includes("Objeciones") || queGenerar.includes("Email seguimiento");

    const prompt = `Eres un experto en copywriting para negocios latinoamericanos.

Genera copy de ventas para este producto:
- Producto: ${producto}
- Pais: ${pais || "Colombia"}
- Tono: ${tono || "Urgente"}
- Categoria: ${categoria || "Salud y bienestar"}
- Caracteristicas: ${caracteristicas || "ninguna"}
- Problema que resuelve: ${problema || "ninguno"}
- Beneficio principal: ${beneficio || "ninguno"}
- Precio oferta: ${precioOferta || "no especificado"}
- Precio anterior: ${precioAnterior || "no especificado"}
- Clientes actuales: ${clientes || "no especificado"}
${competidor ? `- Superar a este competidor: ${competidor}` : ""}

INSTRUCCIONES DE PAÍS Y JERGA:
- Si el país es Colombia: usa expresiones como "parce", "bacano", "qué nota", "chévere", precios en pesos colombianos, referencias culturales colombianas.
- Si el país es México: usa expresiones como "órale", "chido", "qué onda", "cuate", precios en pesos mexicanos, referencias culturales mexicanas.
- Si el país es Venezuela: usa expresiones como "chamo", "pana", "chevere", "arrecho", referencias culturales venezolanas.
- Si el país es Costa Rica: usa expresiones como "mae", "tuanis", "qué chiva", referencias ticas.
- Si el país es Ecuador: usa expresiones como "bacán", "chiro", referencias ecuatorianas.
- Si el país es General: usa español neutro latinoamericano sin regionalismos.

INSTRUCCIONES DE TONO:
- Urgente: escasez, tiempo limitado, pérdida si no actúa ya, números concretos.
- Emocional: historia, dolor profundo, transformación, lágrimas a sonrisas.
- Racional: datos, comparaciones, lógica, ROI, evidencia.
- Casual: amigo hablando, relajado, sin presión, conversacional.
- Confianza: autoridad, trayectoria, garantías, testimonios verificables.
- Premium: exclusividad, lujo, selecto, no para todos.

Responde UNICAMENTE con JSON valido sin markdown ni texto adicional.

{
  ${gl ? `"hero": "titular hero poderoso maximo 2 lineas",
  "problema": "puntos de dolor separados por saltos de linea",
  "solucion": "parrafos cortos de solucion separados por saltos de linea",
  "beneficios": "beneficios separados por saltos de linea",
  "testimonios": "3 testimonios con nombre y ciudad separados por saltos de linea",
  "cta": "CTA final urgente con precio incluido",` : ""}
  ${gw ? `"whatsapp": "Mensaje 1 - Primer contacto frio:\\n[texto]\\n\\nMensaje 2 - Seguimiento:\\n[texto]\\n\\nMensaje 3 - Cierre:\\n[texto]",` : ""}
  ${gm ? `"metaads": "Anuncio 1:\\nTitulo: [max 30 chars]\\nDescripcion: [max 90 chars]\\n\\nAnuncio 2:\\nTitulo: [max 30 chars]\\nDescripcion: [max 90 chars]",` : ""}
  ${gc ? `"headlines": ["headline de anuncio 1 maximo 10 palabras", "headline 2", "headline 3", "headline 4", "headline 5", "headline 6"],
  "campana": "Dia 1: [título corto]\\n[2 párrafos persuasivos del día 1]\\nDia 2: [título corto]\\n[2 párrafos persuasivos del día 2]\\nDia 3: [título corto]\\n[2 párrafos persuasivos del día 3]\\nDia 4: [título corto]\\n[2 párrafos persuasivos del día 4]\\nDia 5: [título corto]\\n[2 párrafos persuasivos del día 5]\\nDia 6: [título corto]\\n[2 párrafos persuasivos del día 6]\\nDia 7: [título corto]\\n[2 párrafos persuasivos del día 7]",` : ""}
 ${ge ? `"seo": "5 keywords SEO separadas por comas para posicionar este producto",
  "objeciones": "Objecion 1: [objecion]\\nRespuesta: [respuesta]\\n\\nObjecion 2: [objecion]\\nRespuesta: [respuesta]\\n\\nObjecion 3: [objecion]\\nRespuesta: [respuesta]",
  "email": "Asunto: [asunto del email]\\n\\nCuerpo: [cuerpo completo del email de seguimiento]",` : ""}
}`;

    const messages: any[] = [];
    if (imagen) {
      messages.push({
        role: "user",
        content: [
          { type: "image_url", image_url: { url: imagen } },
          { type: "text", text: `Analiza esta imagen del producto y genera el copy. ${prompt}` }
        ]
      });
    } else {
      messages.push({
        role: "system",
        content: "Eres un experto en copywriting. Responde SIEMPRE con JSON valido unicamente, sin markdown ni texto adicional."
      });
      messages.push({ role: "user", content: prompt });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: imagen ? "gpt-4o" : "gpt-4o-mini",
        messages,
        max_tokens: 4000,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    console.log("OpenAI status:", response.status);
    console.log("OpenAI response:", JSON.stringify(data).slice(0, 500));

    if (!response.ok) {
      console.error("OpenAI error:", JSON.stringify(data));
      return NextResponse.json({ error: JSON.stringify(data) }, { status: 500 });
    }

    const content = data.choices?.[0]?.message?.content || "{}";
    console.log("Content received:", content.slice(0, 200));

    let resultado: any = {};
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      resultado = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("JSON parse error:", parseErr);
      resultado = { hero: content };
    }

    const textoTotal = [resultado.hero, resultado.problema, resultado.solucion, resultado.beneficios, resultado.testimonios, resultado.cta, resultado.whatsapp, resultado.metaads, resultado.campana, resultado.extras, (resultado.headlines || []).join(" ")].filter(Boolean).join(" ");

    resultado.palabras = textoTotal.split(/\s+/).length;
    resultado.caracteres = textoTotal.length;
    resultado.piezas = Object.keys(resultado).filter(k => !["palabras","caracteres","piezas"].includes(k)).length;

    return NextResponse.json(resultado);

  } catch (err: any) {
    console.error("API error:", err.message, err.stack);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
