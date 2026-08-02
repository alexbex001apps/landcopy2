import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;
 
// ─────────────────────────────────────────────────────────────
// MOTOR REDES-CAMPAÑAS · Parte 1 (el cerebro)
// Genera el contenido de UN día de campaña según el modo.
// Se llama una vez por día (día por día, como Landing).
// Modelo: gpt-4o-mini.
// ─────────────────────────────────────────────────────────────
 
// Construye el bloque de contexto según el modo elegido.
function contextoPorModo(body: any): string {
  const { modo, pais, tono } = body;
 
  if (modo === "producto") {
    const { pNombre, pBeneficio, pProblema, pPrecioOferta, pPrecioAnterior } = body;
    return `MODO: Producto (venta directa / dropshipping).
Producto: ${pNombre}.
Beneficio principal: ${pBeneficio || "no especificado"}.
Problema que resuelve: ${pProblema || "no especificado"}.
Precio oferta: ${pPrecioOferta || "no especificado"}. Precio anterior: ${pPrecioAnterior || "no especificado"}.
País: ${pais}. Tono: ${tono}.
Objetivo: persuadir y vender el producto. Lenguaje comercial latinoamericano.`;
  }
 
  if (modo === "negocio") {
    const { nNombre, nOfrece, nCiudad } = body;
    return `MODO: Negocio local.
Negocio: ${nNombre}.
Qué ofrece: ${nOfrece || "no especificado"}.
Ciudad: ${nCiudad || "no especificada"}.
País: ${pais}. Tono: ${tono}.
Objetivo: construir cercanía con la comunidad local, mostrar el negocio y atraer clientes. NO es venta agresiva de un solo producto, es presencia de marca de un negocio real.`;
  }
 
  // modo === "marca"
  const { mNombre, mQueHace, mPromociona, mCiudad, mMensaje, mPilares, mVoz, mHistorias } = body;
  return `MODO: Marca personal.
Nombre: ${mNombre}.
Qué hace: ${mQueHace || "no especificado"}.
Qué promociona ahora: ${mPromociona || "no especificado"}.
Ciudad: ${mCiudad || "no especificada"}.
País: ${pais}. Tono: ${tono}.
${mMensaje ? `MENSAJE MADRE (la idea central que debe latir en todo el contenido): ${mMensaje}` : ""}
${mPilares ? `PILARES de contenido: ${mPilares}` : ""}
${mVoz ? `VOZ (imita esta forma de hablar, es la voz de la persona): ${mVoz}` : ""}
${mHistorias ? `HISTORIAS reales para usar cuando aporten: ${mHistorias}` : ""}
Objetivo: construir autoridad y conexión personal. Dar valor antes de pedir. El contenido debe sonar a la voz de la persona, no genérico. La mayoría de días enseña/inspira; solo los días "caliente" promueven directamente.`;
}
 
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { diaTitulo, diaTemp, diaNumero, redes } = body;
 
    if (!body.modo || !diaTitulo) {
      return NextResponse.json({ error: "Faltan datos (modo o día)" }, { status: 400 });
    }
 
    const contexto = contextoPorModo(body);
    const listaRedes = Array.isArray(redes) && redes.length > 0 ? redes.join(", ") : "instagram";
 
    const tempGuia =
      diaTemp === "frio" ? "Día FRÍO: engancha y aporta valor, NO vendas todavía. Genera curiosidad o enseña."
      : diaTemp === "tibio" ? "Día TIBIO: conecta el valor con lo que ofreces, muestra beneficios o prueba."
      : "Día CALIENTE: llama a la acción directa, urgencia, oferta o invitación clara a actuar.";
 
    const prompt = `Eres un experto en marketing de contenidos para redes sociales en Latinoamérica.
 
${contexto}
 
Estás creando el contenido del DÍA ${diaNumero} de una campaña.
Tema del día: "${diaTitulo}".
${tempGuia}
 
Genera el contenido para este día, listo para publicar. Responde SOLO con un JSON válido (sin texto antes ni después, sin backticks) con esta estructura exacta:
{
  "concepto": "una frase corta que resume la idea visual/mensaje del día",
  "textoImagen": "el texto corto que iría EN la imagen (titular impactante, máximo 12 palabras, sin etiquetas)",
  "caption": "el texto para acompañar la publicación, 2 a 4 frases, con la voz adecuada al modo",
  "hashtags": "8 a 12 hashtags relevantes separados por espacio, todos empezando con #"
}`;
 
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 500,
        messages: [{ role: "user", content: prompt }],
      }),
    });
 
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error?.message || "Error generando contenido");
 
    let texto = data.choices?.[0]?.message?.content || "{}";
    // Limpiar posibles backticks o "json" que a veces mete el modelo
    texto = texto.replace(/```json/gi, "").replace(/```/g, "").trim();
 
    let contenido;
    try {
      contenido = JSON.parse(texto);
    } catch {
      // Si no vino JSON válido, devolvemos algo usable para no romper la UI
      contenido = {
        concepto: diaTitulo,
        textoImagen: diaTitulo,
        caption: texto.slice(0, 300),
        hashtags: "",
      };
    }
 
    return NextResponse.json({
      diaNumero,
      diaTitulo,
      diaTemp,
      redes: listaRedes,
      ...contenido,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
