import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const JERGA: Record<string, string> = {
  Colombia: "Usa jerga colombiana natural: 'parcero', 'bacano', 'chimba', 'man', 'parcera'. Precios en pesos colombianos. Emojis de bandera 🇨🇴.",
  México: "Usa jerga mexicana natural: 'chido', 'güey', 'órale', 'chamba'. Precios en pesos mexicanos. Emojis de bandera 🇲🇽.",
  Venezuela: "Usa jerga venezolana natural: 'chamo', 'pana', 'chevere', 'verga'. Precios en dólares o bolívares. Emojis de bandera 🇻🇪.",
  "Costa Rica": "Usa jerga costarricense: 'mae', 'tuanis', 'pura vida'. Precios en colones. Emojis de bandera 🇨🇷.",
  Ecuador: "Usa jerga ecuatoriana: 'causa', 'bacán', 'chévere'. Precios en dólares. Emojis de bandera 🇪🇨.",
  General: "Español neutro latinoamericano. Accesible para toda LATAM.",
};

const TONOS: Record<string, string> = {
  Urgente: "Tono urgente y directo. Crea escasez y necesidad inmediata. Frases cortas. Mucha energía.",
  Emocional: "Tono emocional y empático. Conecta con el dolor del cliente. Historia personal. Genera confianza.",
  Racional: "Tono racional y basado en datos. Beneficios específicos, números, resultados comprobados.",
  Casual: "Tono casual y conversacional. Como si hablaras con un amigo. Relajado pero persuasivo.",
  Confianza: "Tono de autoridad y confianza. Testimonios, prueba social, garantías. Muy profesional.",
  Premium: "Tono premium y exclusivo. Producto de alta calidad para personas que merecen lo mejor.",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      producto, precioOferta = "", precioAnterior = "",
      beneficio = "", problema = "", pais = "Colombia",
      tono = "Urgente", red = "instagram",
      mejorar = false, campo = "", textoActual = null,
    } = body;

    if (!producto) {
      return NextResponse.json({ error: "Producto requerido" }, { status: 400 });
    }

    const jerga = JERGA[pais] || JERGA.General;
    const tonoInstruccion = TONOS[tono] || TONOS.Urgente;
    const precioTexto = precioOferta ? `Precio: ${precioOferta}${precioAnterior ? ` (antes ${precioAnterior})` : ""}` : "";

    // Mejorar texto existente
    if (mejorar && textoActual) {
      const campoTexto = campo === "caption" ? textoActual.caption :
                         campo === "hashtags" ? textoActual.hashtags :
                         campo === "guion" ? textoActual.guion : "";

      const prompt = campo === "guion"
        ? `Mejora este guión de TikTok haciéndolo más viral. El hook debe ser más fuerte y directo. Mantén la estructura de 4 partes pero hazlo más impactante:

${campoTexto}

Producto: ${producto}. ${precioTexto}. País: ${pais}. ${tonoInstruccion}

Devuelve SOLO el guión mejorado con las 4 secciones claramente marcadas:
0-3s HOOK:
3-12s PROBLEMA:
12-22s SOLUCIÓN:
22-30s CTA:`
        : `Mejora este ${campo} haciéndolo más persuasivo y con mayor tasa de conversión:

${campoTexto}

Producto: ${producto}. ${precioTexto}. Beneficio: ${beneficio}. País: ${pais}. ${jerga} ${tonoInstruccion}

Devuelve SOLO el ${campo} mejorado, sin explicaciones.`;

      const res = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 600,
        temperature: 0.8,
      });

      const texto = res.choices[0]?.message?.content?.trim() || "";
      return NextResponse.json({ [campo]: texto });
    }

    // Generar texto nuevo según la red
    if (red === "tiktok") {
      const prompt = `Eres un experto en TikTok viral para LATAM. Genera para el producto "${producto}":

Datos: ${precioTexto}. Beneficio principal: ${beneficio}. Problema que resuelve: ${problema}. País: ${pais}.
${jerga} ${tonoInstruccion}

Genera DOS cosas:

1. CAPTION (máximo 150 caracteres, directo, con 1-2 emojis, sin hashtags):
El caption debe ser corto e impactante para TikTok.

2. HASHTAGS (5-8 hashtags virales de TikTok, sin espacios entre #):
Mix de hashtags del producto, problema y tendencias TikTok LATAM.

3. GUIÓN (script de 30 segundos con esta estructura exacta):
0-3s HOOK: [frase que para el scroll, pregunta o afirmación impactante]
3-12s PROBLEMA: [descripción del dolor del cliente en 2-3 frases]
12-22s SOLUCIÓN: [cómo ${producto} resuelve el problema, con prueba social si aplica]
22-30s CTA: [precio + dónde comprar + urgencia]

Responde en formato JSON exacto:
{
  "caption": "...",
  "hashtags": "#hashtag1 #hashtag2 #hashtag3 #hashtag4 #hashtag5",
  "guion": "0-3s HOOK: ...\n3-12s PROBLEMA: ...\n12-22s SOLUCIÓN: ...\n22-30s CTA: ..."
}`;

      const res = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 800,
        temperature: 0.85,
        response_format: { type: "json_object" },
      });

      const data = JSON.parse(res.choices[0]?.message?.content || "{}");
      return NextResponse.json({
        caption: data.caption || "",
        hashtags: data.hashtags || "",
        guion: data.guion || "",
      });
    }

    if (red === "instagram") {
      const prompt = `Eres un experto en copywriting para Instagram en LATAM. Genera para "${producto}":

Datos: ${precioTexto}. Beneficio: ${beneficio}. Problema: ${problema}. País: ${pais}.
${jerga} ${tonoInstruccion}

Genera DOS cosas:

1. CAPTION de Instagram (150-300 caracteres):
- Empieza con una pregunta o hook emocional
- Menciona el beneficio principal
- Incluye prueba social si hay precio disponible
- Termina con CTA claro (link en bio, envío hoy, etc.)
- 2-4 emojis estratégicos

2. HASHTAGS (25-30 hashtags en una sola línea):
- Mix de: hashtags del producto + del problema + del país + de salud/bienestar
- Populares pero no saturados

Responde en JSON exacto:
{
  "caption": "...",
  "hashtags": "#hash1 #hash2 ..."
}`;

      const res = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 700,
        temperature: 0.85,
        response_format: { type: "json_object" },
      });

      const data = JSON.parse(res.choices[0]?.message?.content || "{}");
      return NextResponse.json({
        caption: data.caption || "",
        hashtags: data.hashtags || "",
      });
    }

    if (red === "facebook") {
      const prompt = `Experto en Facebook Ads y posts para LATAM. Genera para "${producto}":

Datos: ${precioTexto}. Beneficio: ${beneficio}. Problema: ${problema}. País: ${pais}.
${jerga} ${tonoInstruccion}

CAPTION de Facebook (200-400 caracteres):
- Más largo que Instagram, más conversacional
- Empieza con el problema del cliente
- Desarrolla la solución
- CTA directo con precio si aplica
- Sin hashtags (no funcionan bien en Facebook)
- 2-3 emojis

Responde en JSON:
{
  "caption": "...",
  "hashtags": ""
}`;

      const res = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 500,
        temperature: 0.8,
        response_format: { type: "json_object" },
      });

      const data = JSON.parse(res.choices[0]?.message?.content || "{}");
      return NextResponse.json({
        caption: data.caption || "",
        hashtags: "",
      });
    }

    if (red === "whatsapp") {
      const prompt = `Experto en mensajes de ventas por WhatsApp para LATAM. Genera para "${producto}":

Datos: ${precioTexto}. Beneficio: ${beneficio}. Problema: ${problema}. País: ${pais}.
${jerga} ${tonoInstruccion}

MENSAJE de WhatsApp (100-180 caracteres):
- Muy directo y personal
- Como si lo enviara un amigo
- Precio visible si hay
- Emoji de bandera del país al final
- CTA de acción inmediata

Responde en JSON:
{
  "caption": "...",
  "hashtags": ""
}`;

      const res = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 400,
        temperature: 0.8,
        response_format: { type: "json_object" },
      });

      const data = JSON.parse(res.choices[0]?.message?.content || "{}");
      return NextResponse.json({
        caption: data.caption || "",
        hashtags: "",
      });
    }

    return NextResponse.json({ caption: "", hashtags: "" });

  } catch (err) {
    console.error("Error en /api/redes/texto:", err);
    return NextResponse.json({ error: "Error generando texto" }, { status: 500 });
  }
}
