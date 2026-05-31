import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { producto, caracteristicas, problema, beneficio, precioOferta, precioAnterior, clientes, competidor, pais, tono, categoria, imagen, queGenerar } = body;

    if (!producto) {
      return NextResponse.json({ error: "Producto requerido" }, { status: 400 });
    }

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
  ${gc ? `"campana": "Dia 1: [contenido]\\nDia 2: [contenido]\\nDia 3: [contenido]\\nDia 4: [contenido]\\nDia 5: [contenido]\\nDia 6: [contenido]\\nDia 7: [contenido]",` : ""}
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

    const textoTotal = [resultado.hero, resultado.problema, resultado.solucion, resultado.beneficios, resultado.testimonios, resultado.cta, resultado.whatsapp, resultado.metaads, resultado.campana, resultado.extras].filter(Boolean).join(" ");

    resultado.palabras = textoTotal.split(/\s+/).length;
    resultado.caracteres = textoTotal.length;
    resultado.piezas = Object.keys(resultado).filter(k => !["palabras","caracteres","piezas"].includes(k)).length;

    return NextResponse.json(resultado);

  } catch (err: any) {
    console.error("API error:", err.message, err.stack);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}