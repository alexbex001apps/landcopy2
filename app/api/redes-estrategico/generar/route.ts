import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { CATEGORIAS_ESTILO, LABEL_CATEGORIA_ESTILO, CategoriaEstilo } from "@/lib/bibliotecaEstilo/categorias";

export const maxDuration = 300;

export type ReferenciaEstiloUsada = { id: string; titulo: string | null; imagenesUrls: string[] };

// ─────────────────────────────────────────────────────────────
// CEREBRO · REDES ESTRATÉGICO (Director de Marketing con IA)
// Diseña una CAMPAÑA COMPLETA en una sola llamada.
// La IA decide mezcla de formatos, narrativa conectada,
// objetivo psicológico por pieza, y reparte por red.
// Modelo: gpt-4o · temperatura alta para creatividad.
// ─────────────────────────────────────────────────────────────

// Trae UNA referencia activa al azar de cada categoria del banco global de
// Biblioteca de Estilo (una sola, no varias, para que una misma campaña no
// mezcle el estilo de dos referencias distintas de la misma categoria y
// pierda cohesion visual entre sus piezas). Se inyectan como PRINCIPIO
// OBLIGATORIO, exigiendo que cada campo de la ficha (tono, paleta de
// colores, tipografia, iconos) se refleje en la pieza correspondiente,
// con prioridad sobre el tono generico de venta.
async function obtenerBancoDeEstilo(): Promise<{
  promptTexto: string;
  referenciasUsadas: Partial<Record<CategoriaEstilo, ReferenciaEstiloUsada>>;
}> {
  const vacio = { promptTexto: "", referenciasUsadas: {} };
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("biblioteca_estilo")
      .select("id, categoria, titulo, texto_plano, imagenes_urls")
      .eq("activa", true);

    if (!data || data.length === 0) return vacio;

    const bloques: string[] = [];
    const referenciasUsadas: Partial<Record<CategoriaEstilo, ReferenciaEstiloUsada>> = {};
    for (const categoria of CATEGORIAS_ESTILO) {
      const delCategoria = data.filter((r) => r.categoria === categoria && r.texto_plano);
      if (delCategoria.length === 0) continue;
      const elegida = delCategoria[Math.floor(Math.random() * delCategoria.length)];
      bloques.push(`--- Ficha de referencia: ${LABEL_CATEGORIA_ESTILO[categoria]} — "${elegida.titulo || "Sin titulo"}" ---\n${elegida.texto_plano}`);
      referenciasUsadas[categoria] = {
        id: elegida.id,
        titulo: elegida.titulo,
        imagenesUrls: elegida.imagenes_urls || [],
      };
    }

    if (bloques.length === 0) return vacio;

    const categoriasConFicha = Object.keys(referenciasUsadas)
      .map((c) => LABEL_CATEGORIA_ESTILO[c as CategoriaEstilo])
      .join(", ");
    const categoriasSinFicha = CATEGORIAS_ESTILO
      .filter((c) => !referenciasUsadas[c])
      .map((c) => LABEL_CATEGORIA_ESTILO[c])
      .join(", ");

    const promptTexto = `

PRINCIPIO #6 — RESPETA EL BANCO DE ESTILO (OBLIGATORIO, no es una simple inspiracion)
Estas son fichas de referencias REALES ya validadas por el equipo humano de esta marca. Solo hay ficha para: ${categoriasConFicha}. Cada ficha es EXCLUSIVA de su categoria — usala UNICAMENTE en piezas cuyo tipo sea exactamente esa categoria.${categoriasSinFicha ? ` Para el resto de tipos de pieza (${categoriasSinFicha}, y cualquier otro que no sea ${categoriasConFicha}) NO existe ficha — esas piezas NO deben tomar NADA de las fichas de abajo (ni su tono, ni su paleta de colores, ni su tipografia, ni nada): usa tu criterio normal de Director de Marketing, con el tono/pais/objetivo generales de la campaña.` : ""}
En una pieza cuyo tipo SI coincide con una ficha, es OBLIGATORIO aplicar sus campos — no son sugerencias sueltas que puedas ignorar:
- El campo "Tono del copy" de la ficha tiene PRIORIDAD sobre el tono generico de venta/urgencia de los principios anteriores. Si la ficha dice "cercano y conversacional", el copy de esa pieza suena cercano y conversacional — NO publicitario ni agresivo — incluso si el objetivo comercial es vender.
- El campo "Paleta de colores" DEBE aparecer explicitamente, traducido al ingles, dentro del promptVisual de esa pieza (ej. si la ficha dice "neutros y oscuros con acentos en blanco y burdeos", el promptVisual debe incluir literalmente algo como "dark neutral tones with white and burgundy accents").
- Los campos "Estilo tipografico" y "Uso de iconos o emojis" tambien deben quedar reflejados en el promptVisual o el copy, segun aplique.
- "Gancho de apertura" y "Cierre o llamado a la accion" son referencia de ESTILO y ESTRUCTURA (que tipo de gancho es: pregunta, dato curioso, dolor directo, etc.) para el hook/cta de esa pieza — jamas un texto para copiar.

PROHIBIDO TERMINANTE: nunca repitas frases, titulares, hooks, cierres o cualquier wording literal de las fichas. Todo el copy, hook, titulo y texto de laminas que escribas debe ser 100% nuevo, redactado especificamente para ESTA campaña. Las fichas son referencia de ESTILO (tono, estructura, paleta, tipografia) — NUNCA de contenido a repetir palabra por palabra. Si una ficha dice "La ropa incomoda no es la solucion", tu gancho debe ser una frase completamente distinta que transmita el MISMO tipo de gancho (ej. dolor directo), no esas palabras.
Adapta cada campo al contexto especifico de esta campaña — pero NUNCA los ignores ni los diluyas en algo generico. Aplica la MISMA ficha de forma consistente a TODAS las piezas de esa categoria dentro de esta campaña (ej. todos los carruseles de esta campaña deben compartir la misma paleta de colores y tono) — nunca mezcles el estilo con otra referencia a mitad de campaña.

${bloques.join("\n\n")}`;

    return { promptTexto, referenciasUsadas };
  } catch {
    return vacio;
  }
}

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
    const { nNombre, nOfrece, nCiudad, nDiferenciador, nPublico } = body;
    return `MODO: Negocio local.
Negocio: ${nNombre}.
Qué ofrece: ${nOfrece || "no especificado"}.
Ciudad: ${nCiudad || "no especificada"}.
Diferenciador frente a la competencia: ${nDiferenciador || "no especificado"}.
Publico objetivo: ${nPublico || "no especificado"}.
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
function systemPrompt(bancoEstilo: string): string {
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
${bancoEstilo}

FORMATOS QUE PUEDES ELEGIR:
imagen · carrusel · reel · video corto · historia de cliente · testimonio · educativo · comparativo · autoridad · entretenimiento · oferta · detrás de cámaras · mitos y verdades · preguntas frecuentes · caso de éxito

POR CADA PIEZA entrega: objetivoPsicologico (atención/curiosidad/confianza/autoridad/deseo/conversión/fidelización), tipo, red, titulo, copy (texto completo persuasivo en español latino), cta, promptVisual (en inglés, optimizado para Flux).
SI es REEL o VIDEO, además: hook (primeros 3 seg), guion (escena por escena), escenas (lista de tomas), textoEnPantalla.
SI es CARRUSEL, además: laminas (5 a 7, cada una con texto y promptVisual).
IMPORTANTE con las láminas — CANTIDAD DE TEXTO SEGÚN EL ESTILO: el campo "texto" es lo que va escrito en esa lámina, tal como lo va a leer el cliente. La CANTIDAD de texto debe imitar la de las referencias del banco de estilo. Cuando el estilo usa listas de beneficios (lo más común en carruseles de venta), el "texto" debe ser un TITULAR corto seguido de 2 a 4 BENEFICIOS muy cortos (3 a 6 palabras cada uno), cada uno en su propia línea, separados con saltos de línea reales (\n). Ejemplo de un buen "texto": "Con Truly Fresa\nAroma femenino irresistible\nHidrata en profundidad\nCalma la irritación\nPreviene vellos encarnados". Si la lámina es un gancho o pregunta (no una lista), deja solo esa frase corta. NUNCA numeres ni etiquetes las líneas: nada de "Lámina 1:", "1.", "•", "Beneficio 2", "Slide" ni similares — solo el texto limpio, una idea por línea. Ese texto se imprime tal cual sobre la imagen.

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

// La IA a veces numera las laminas ("Lamina 1 - ...") aunque se le pida que no.
// Ese prefijo es nomenclatura interna: quedaba impreso sobre la imagen y en el
// copy que el usuario copia y pega. Se limpia aqui, en el origen.
const RE_PREFIJO_LAMINA = /^\s*(l[áa]mina|slide|diapositiva|imagen|pieza)\s*(n[°º]?\s*)?\d+\s*[-–—:.)]\s*/i;

function limpiarPrefijosDeLaminas(plan: any) {
  if (!Array.isArray(plan?.piezas)) return plan;
  for (const pieza of plan.piezas) {
    if (!Array.isArray(pieza?.laminas)) continue;
    for (const lamina of pieza.laminas) {
      if (typeof lamina?.texto === "string") {
        lamina.texto = lamina.texto.replace(RE_PREFIJO_LAMINA, "").trim();
      }
    }
  }
  return plan;
}

export async function POST(req: NextRequest) {
  try {
    // Genera con gpt-4o: sin sesion, cualquiera podria consumir la cuenta de
    // OpenAI llamando este endpoint desde fuera de la app.
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const body = await req.json();
    const { modo, dias, objetivo, redes } = body;

    if (!modo || !dias) {
      return NextResponse.json({ error: "Faltan datos (modo o días)" }, { status: 400 });
    }

    const contexto = contextoPorModo(body);
    const listaRedes = Array.isArray(redes) && redes.length > 0 ? redes.join(", ") : "instagram, facebook, tiktok";
    const { promptTexto: bancoEstilo, referenciasUsadas } = await obtenerBancoDeEstilo();

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
          { role: "system", content: systemPrompt(bancoEstilo) },
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
      plan = limpiarPrefijosDeLaminas(JSON.parse(texto));
    } catch {
      return NextResponse.json({ error: "La IA no devolvió un JSON válido", crudo: texto.slice(0, 500) }, { status: 502 });
    }

    return NextResponse.json({
      modo,
      dias,
      objetivo: objetivo || "más ventas",
      redes: listaRedes,
      referenciasEstilo: referenciasUsadas,
      ...plan,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
