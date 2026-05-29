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

Responde UNICAMENTE con JSON valido sin markdown ni texto adicional.
Incluye SOLO los campos que corresponden segun las instrucciones.

{
  ${gl ? `"hero": "titular hero poderoso maximo 2 lineas",
  "problema": "puntos de dolor separados por saltos de linea",
  "solucion": "parrafos cortos de solucion separados por saltos de linea",
  "beneficios": "beneficios separados por saltos de linea",
  "testimonios": "3 testimonios con nombre y ciudad separados por saltos de linea",
  "cta": "CTA final urgente con precio incluido",` : ""}
  ${gw ? `"whatsapp": "Mensaje 1 - Primer contacto frio:\\n[texto del mensaje]\\n\\nMensaje 2 - Seguimiento:\\n[texto del mensaje]\\n\\nMensaje 3 - Cierre de venta:\\n[texto del mensaje]",` : ""}
  ${gm ? `"metaads": "Anuncio 1:\\nTitulo: [maximo 30 caracteres]\\nDescripcion: [maximo 90 caracteres]\\n\\nAnuncio 2:\\nTitulo: [maximo 30 caracteres]\\nDescripcion: [maximo 90 caracteres]\\n\\nAnuncio 3:\\nTitulo: [maximo 30 caracteres]\\nDescripcion: [maximo 90 caracteres]",` : ""}
  ${gc ? `"campana": "Dia 1: [contenido completo]\\nDia 2: [contenido completo]\\nDia 3: [contenido completo]\\nDia 4: [contenido completo]\\nDia 5: [contenido completo]\\nDia 6: [contenido completo]\\nDia 7: [contenido completo]",` : ""}
  "extras": "${ge ? "SEO keywords separadas por comas, principales objeciones y como manejarlas, email de seguimiento completo" : ""}"
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

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: JSON.stringify(errorData) }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "{}";

    let resultado: any = {};
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      resultado = JSON.parse(cleaned);
    } catch {
      resultado = { hero: content };
    }

    const textoTotal = [resultado.hero, resultado.problema, resultado.solucion, resultado.beneficios, resultado.testimonios, resultado.cta, resultado.whatsapp, resultado.metaads, resultado.campana, resultado.extras].filter(Boolean).join(" ");

    resultado.palabras = textoTotal.split(/\s+/).length;
    resultado.caracteres = textoTotal.length;
    resultado.piezas = Object.keys(resultado).filter(k => !["palabras","caracteres","piezas"].includes(k)).length;

    return NextResponse.json(resultado);

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}