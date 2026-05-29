import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { producto, caracteristicas, problema, beneficio, precioOferta, precioAnterior, clientes, competidor, pais, tono, categoria } = body;

    if (!producto) {
      return NextResponse.json({ error: "Producto requerido" }, { status: 400 });
    }

    const prompt = `Eres un experto en copywriting para negocios latinoamericanos.

Genera copy de ventas para este producto:
- Producto: ${producto}
- País: ${pais || "Colombia"}
- Tono: ${tono || "Urgente"}
- Categoría: ${categoria || "Salud y bienestar"}
- Características: ${caracteristicas || ""}
- Problema que resuelve: ${problema || ""}
- Beneficio principal: ${beneficio || ""}
- Precio oferta: ${precioOferta || ""}
- Precio anterior: ${precioAnterior || ""}
- Clientes actuales: ${clientes || ""}
${competidor ? `- Superar a este competidor: ${competidor}` : ""}

Responde SOLO con JSON válido, sin markdown, sin explicaciones. Usa este formato exacto:

{"hero":"texto aquí","problema":"texto aquí","solucion":"texto aquí","beneficios":"texto aquí","testimonios":"texto aquí","cta":"texto aquí","whatsapp":"Mensaje 1 - Primer contacto:\\ntexto\\n\\nMensaje 2 - Seguimiento:\\ntexto\\n\\nMensaje 3 - Cierre:\\ntexto","metaads":"texto aquí","campana":"Día 1: texto\\nDía 2: texto\\nDía 3: texto\\nDía 4: texto\\nDía 5: texto\\nDía 6: texto\\nDía 7: texto","extras":"texto aquí"}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Eres un experto en copywriting. Responde SIEMPRE con JSON válido únicamente, sin markdown ni texto adicional."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 3000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenAI error:", errorData);
      return NextResponse.json({ error: "Error de OpenAI: " + JSON.stringify(errorData) }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    console.log("Respuesta OpenAI:", content.substring(0, 200));

    let resultado: any = {};
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      resultado = JSON.parse(cleaned);
    } catch (parseError) {
      console.error("Error parseando JSON:", parseError);
      resultado = { hero: content, error_parse: "true" };
    }

    const textoTotal = [resultado.hero, resultado.problema, resultado.solucion, resultado.beneficios, resultado.testimonios, resultado.cta, resultado.whatsapp, resultado.metaads, resultado.campana, resultado.extras].filter(Boolean).join(" ");

    resultado.palabras = textoTotal.split(/\s+/).length;
    resultado.caracteres = textoTotal.length;
    resultado.piezas = 10;

    return NextResponse.json(resultado);

  } catch (err: any) {
    console.error("Error general:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}