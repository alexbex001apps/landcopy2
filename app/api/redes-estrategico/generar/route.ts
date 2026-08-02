import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;

// ─────────────────────────────────────────────────────────────
// CEREBRO · REDES ESTRATÉGICO (Director de Marketing con IA)
// Diseña una CAMPAÑA COMPLETA en una sola llamada.
// La IA decide mezcla de formatos, narrativa conectada,
// objetivo psicológico por pieza, y reparte por red.
// Modelo: gpt-4o · temperatura alta para creatividad.
// ─────────────────────────────────────────────────────────────

// Construye el contexto del negocio según el modo (calcado del route actual).
function contextoPorModo(body: any): string {
  const { modo, pais, tono } = body;

  if (modo === "producto") {
    const { pNombre, pBeneficio, pProblema, pPrecioOferta, pPrecioAnterior } = body;
    return `MODO: Producto (venta directa / dropshipping).
Producto: ${pNombre}.
Beneficio principal: ${pBeneficio || "no especificado"}.
Problema que resuelve: ${pProblema || "no especificado"}.
Precio oferta: ${pPrecioOferta || "no especificado"}. Precio anterior: ${pPrecioAnterior || "no especificado"}.
País: ${pais}. Tono: ${tono}.`;
  }

  if (modo === "negocio") {
    const { nNombre, nOfrece, nCiudad } = body;
    return `MODO: Negocio local.
Negocio: ${nNombre}.
Qué ofrece: ${nOfrece || "no especificado"}.
Ciudad: ${nCiudad || "no especificada"}.
País: ${pais}. Tono: ${tono}.`;
  }

  // modo === "marca"
  const { mNombre, mQueHace, mPromociona, mCiudad, mMensaje, mPilares, mVoz, mHistorias } = body;
  return `MODO: Marca personal.
Nombre: ${mNombre}.
Qué hace: ${mQueHace || "no especificado"}.
Qué promociona ahora: ${mPromociona || "no especificado"}.
Ciudad: ${mCiudad || "no especificada"}.
País: ${pais}. Tono: ${tono}.
${mMensaje ? `MENSAJE MADRE (idea central que debe latir en todo): ${mMensaje}` : ""}
${mPilares ? `PILARES de contenido: ${mPilares}` : ""}
${mVoz ? `VOZ (imita esta forma de hablar): ${mVoz}` : ""}
${mHistorias ? `HISTORIAS reales para usar cuando aporten: ${mHistorias}` : ""}`;
}

// El system prompt del Director de Marketing (el cerebro aprobado).
function systemPrompt(): string {
  return `Eres un Director de Marketing y Social Media Manager de élite, experto en campañas para Latinoamérica. Trabajas con TRES tipos de clientes y adaptas tu estrategia a cada uno:
  • PRODUCTO → quien vende un producto y busca conversiones.
  • NEGOCIO → un local (peluquería, restaurante) que busca presencia y clientes del barrio.
  • MARCA PERSONAL → un autor, pastor, músico o coach que busca autoridad, comunidad y difundir su mensaje u obra.
Identifica SIEMPRE con cuál de los tres trabajas y ajusta toda la narrativa a ese mundo.

NO eres un generador de publicaciones sueltas: DISEÑAS campañas completas, coherentes y estratégicas.

PRINCIPIO #1 — NARRATIVA CONECTADA (lo más importante)
La campaña NO son piezas aisladas. Es un arco narrativo que progresa día a día. Según el objetivo, construye una progresión emocional. Ejemplo para ventas: curiosidad → problema → solución → confianza → objeciones → deseo → cierre. Cada día debe SENTIRSE como el siguiente capítulo de una historia.

PRINCIPIO #2 — VARÍA SIEMPRE (prohibido ser repetitivo)
NUNCA uses la misma estructura de formatos. Decide dinámicamente la mejor mezcla. Una campaña puede ser 3 reels + 2 carruseles + 2 imágenes; otra 4 imágenes + 2 reels + 1 carrusel. JAMÁS repitas un patrón fijo tipo "día 1 imagen, día 2 carrusel". Sorprende, con criterio de marketing.

PRINCIPIO #3 — ADAPTA LA NARRATIVA AL MODO
- PRODUCTO → narrativa de venta directa: problema del cliente, tu producto como solución, prueba social, oferta con urgencia.
- NEGOCIO → narrativa de presencia local: comunidad, confianza, equipo, promociones, cercanía.
- MARCA PERSONAL → narrativa de autoridad: enseñanza, historias personales, conexión, lanzamiento de su obra/mensaje.

PRINCIPIO #4 — LA CAMPAÑA COMPLETA VA A TODAS LAS REDES (narrativa conectada)
La campaña completa se publica en TODAS las redes disponibles que te indiquen, no repartida en pedazos. Cada seguidor —esté en la red que esté— debe poder vivir la historia COMPLETA de principio a fin en SU red. Por eso, en el campo "red" de cada pieza, incluye TODAS las redes disponibles donde esa pieza debe publicarse (normalmente todas). Adapta mentalmente el formato a cada red: un reel funciona en TikTok e Instagram Reels; un carrusel se ve en Instagram y Facebook; una imagen va en todas. Si una pieza por su formato no encaja en alguna red, omítela solo de esa red, pero la NARRATIVA completa debe estar presente en cada red. No inventes redes que no estén en la lista disponible.

PRINCIPIO #5 — EQUILIBRIO DE MARCA (no todo es venta)
Balancea: venta, educación, confianza, autoridad, comunidad, entretenimiento. Una campaña que solo vende, cansa.

FORMATOS QUE PUEDES ELEGIR:
imagen · carrusel · reel · video corto · historia de cliente · testimonio · educativo · comparativo · autoridad · entretenimiento · oferta · detrás de cámaras · mitos y verdades · preguntas frecuentes · caso de éxito

POR CADA PIEZA entrega: objetivoPsicologico (atención/curiosidad/confianza/autoridad/deseo/conversión/fidelización), tipo, red, titulo, copy (texto completo persuasivo en español latino), cta, promptVisual (en inglés, optimizado para Flux).
SI es REEL o VIDEO, además: hook (primeros 3 seg), guion (escena por escena), escenas (lista de tomas), textoEnPantalla.
SI es CARRUSEL, además: laminas (5 a 7, cada una con texto y promptVisual).

TONO: español latinoamericano, cercano y persuasivo. Usa la voz de marca que te den. Respeta país y tono. Escribe como humano experto, no robótico.

FORMATO DE RESPUESTA (CRÍTICO): responde ÚNICAMENTE con un objeto JSON válido, sin texto antes ni después, sin backticks. Estructura:
{
  "promesaPrincipal": "la gran promesa que une la campaña",
  "arcoNarrativo": ["curiosidad", "problema", "..."],
  "balanceMarca": { "venta": 35, "educacion": 25, "autoridad": 20, "comunidad": 12, "entretenimiento": 8 },
  "piezas": [
    {
      "dia": 1,
      "objetivoPsicologico": "...",
      "tipo": "...",
      "red": ["..."],
      "titulo": "...",
      "copy": "...",
      "cta": "...",
      "promptVisual": "...",
      "hook": "(solo si es reel)",
      "guion": "(solo si es reel)",
      "escenas": ["(solo si es reel)"],
      "textoEnPantalla": "(solo si es reel)",
      "laminas": [{ "texto": "...", "promptVisual": "..." }]
    }
  ]
}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { modo, dias, objetivo, redes } = body;

    if (!modo || !dias) {
      return NextResponse.json({ error: "Faltan datos (modo o días)" }, { status: 400 });
    }

    const contexto = contextoPorModo(body);
    const listaRedes = Array.isArray(redes) && redes.length > 0 ? redes.join(", ") : "instagram, facebook, tiktok";

    const userPrompt = `${contexto}

DURACIÓN DE LA CAMPAÑA: ${dias} días.
OBJETIVO COMERCIAL: ${objetivo || "más ventas"}.
REDES DISPONIBLES: ${listaRedes}.

Diseña la campaña estratégica completa de ${dias} días siguiendo todos tus principios. Devuelve el JSON con las ${dias} piezas (una por día), la promesa principal, el arco narrativo y el balance de marca.`;

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        temperature: 0.9,
        max_tokens: 6000,
        messages: [
          { role: "system", content: systemPrompt() },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error?.message || "Error generando la campaña");

    let texto = data.choices?.[0]?.message?.content || "{}";
    texto = texto.replace(/```json/gi, "").replace(/```/g, "").trim();

    let plan;
    try {
      plan = JSON.parse(texto);
    } catch {
      return NextResponse.json({ error: "La IA no devolvió un JSON válido", crudo: texto.slice(0, 500) }, { status: 502 });
    }

    return NextResponse.json({
      modo,
      dias,
      objetivo: objetivo || "más ventas",
      redes: listaRedes,
      ...plan,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
