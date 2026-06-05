import { NextRequest, NextResponse } from "next/server";

const PROMPTS_SECCION: Record<string, (p: any) => string> = {
  hero: (p) => `Eres un experto en copywriting de ventas latinoamericano. Genera el texto del HERO de una landing page para el producto "${p.producto}". País: ${p.pais}. Tono: ${p.tono}. Problema que resuelve: ${p.problema}. Beneficio: ${p.beneficio}. Precio: ${p.precioOferta}. Genera: 1 titular impactante (máximo 10 palabras), 1 subtítulo (máximo 15 palabras), 1 CTA poderoso (máximo 4 palabras). Formato: TITULAR: ...\nSUBTITULO: ...\nCTA: ...`,

  problema: (p) => `Eres un experto en copywriting. Genera la sección EL PROBLEMA de una landing page para "${p.producto}". País: ${p.pais}. Tono: ${p.tono}. El problema es: ${p.problema}. Amplifica el dolor emocionalmente. Máximo 80 palabras. Habla directamente al cliente.`,

  solucion: (p) => `Eres un experto en copywriting. Genera la sección LA SOLUCIÓN de una landing page para "${p.producto}". País: ${p.pais}. Tono: ${p.tono}. Beneficio principal: ${p.beneficio}. Muestra cómo el producto resuelve el problema. Máximo 80 palabras. Tono esperanzador.`,

  kit: (p) => `Eres un experto en copywriting. Genera la sección QUÉ INCLUYE EL KIT de una landing page para el combo "${p.producto}". País: ${p.pais}. Genera: título de sección + descripción de 2 líneas por cada producto del combo. Máximo 100 palabras.`,

  beneficios: (p) => `Eres un experto en copywriting. Genera la sección BENEFICIOS de una landing page para "${p.producto}". País: ${p.pais}. Tono: ${p.tono}. Beneficio principal: ${p.beneficio}. Genera exactamente 3 beneficios con su título y descripción corta (máximo 10 palabras cada descripción). Formato: BENEFICIO 1: título | descripción\nBENEFICIO 2: título | descripción\nBENEFICIO 3: título | descripción`,

  como_funciona: (p) => `Eres un experto en copywriting. Genera la sección CÓMO FUNCIONA de una landing page para "${p.producto}". País: ${p.pais}. Genera exactamente 3 pasos simples y claros. Cada paso máximo 10 palabras. Formato: PASO 1: ...\nPASO 2: ...\nPASO 3: ...`,

  testimonios: (p) => `Eres un experto en copywriting. Genera 3 testimonios realistas y creíbles de clientes latinoamericanos para el producto "${p.producto}". País: ${p.pais}. Cada testimonio: nombre latinoamericano, edad, resultado específico. Máximo 30 palabras por testimonio. Formato: TESTIMONIO 1: "..." — Nombre, edad\nTESTIMONIO 2: ...\nTESTIMONIO 3: ...`,

  oferta: (p) => `Eres un experto en copywriting. Genera la sección OFERTA de una landing page para "${p.producto}". País: ${p.pais}. Tono: ${p.tono}. Precio oferta: ${p.precioOferta}. Precio anterior: ${p.precioAnterior}. Genera: título de urgencia, descripción del ahorro, garantía y CTA final. Máximo 80 palabras.`,

  cta_final: (p) => `Eres un experto en copywriting. Genera el CTA FINAL de una landing page para "${p.producto}". País: ${p.pais}. Tono: ${p.tono}. Precio: ${p.precioOferta}. Genera: 1 frase de cierre emocional poderosa + 1 CTA + 1 frase de garantía o seguridad. Máximo 50 palabras.`,
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { seccion, producto, problema, beneficio, precioOferta, precioAnterior, pais, tono, es_combo } = body;

    if (!seccion || !producto) {
      return NextResponse.json({ error: "Sección y producto requeridos" }, { status: 400 });
    }

    const promptFn = PROMPTS_SECCION[seccion];
    if (!promptFn) {
      return NextResponse.json({ error: `Sección "${seccion}" no reconocida` }, { status: 400 });
    }

    const prompt = promptFn({ producto, problema, beneficio, precioOferta, precioAnterior, pais, tono, es_combo });

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await resp.json();
    const texto = data.choices?.[0]?.message?.content || "";

    return NextResponse.json({ texto, seccion });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}