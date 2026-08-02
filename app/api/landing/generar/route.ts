import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;
 
const PROMPTS_SECCION: Record<string, (p: any) => string> = {
  hero: (p) => `Eres un experto en copywriting de ventas latinoamericano. Genera el texto del HERO de una landing page para el producto "${p.producto}". País: ${p.pais}. Tono: ${p.tono}. Problema que resuelve: ${p.problema}. Beneficio: ${p.beneficio}. Precio: ${p.precioOferta}. Genera: 1 titular impactante (máximo 8 palabras), 1 subtítulo (máximo 12 palabras), 1 CTA poderoso (máximo 4 palabras). Sé breve y directo. Formato: TITULAR: ...\nSUBTITULO: ...\nCTA: ...`,
 
  problema: (p) => `Eres un experto en copywriting. Genera la sección EL PROBLEMA de una landing page para "${p.producto}". País: ${p.pais}. Tono: ${p.tono}. El problema es: ${p.problema}. Amplifica el dolor en pocas palabras impactantes. Genera: 1 titular (máximo 8 palabras) + 1 frase corta (máximo 15 palabras). Sé breve. Máximo 25 palabras en total. Formato: TITULAR: ...\nFRASE: ...`,
 
  solucion: (p) => `Eres un experto en copywriting. Genera la sección LA SOLUCIÓN de una landing page para "${p.producto}". País: ${p.pais}. Tono: ${p.tono}. Beneficio principal: ${p.beneficio}. Genera: 1 titular esperanzador (máximo 8 palabras) + 1 frase corta (máximo 15 palabras). Sé breve. Máximo 25 palabras en total. Formato: TITULAR: ...\nFRASE: ...`,
 
  kit: (p) => `Eres un experto en copywriting. Genera la sección QUÉ INCLUYE EL KIT para el combo "${p.producto}". País: ${p.pais}. Genera: 1 título de sección (máximo 6 palabras) + 1 línea corta por producto (máximo 8 palabras cada una). Sé breve. Máximo 45 palabras en total.`,
 
  beneficios: (p) => `Eres un experto en copywriting. Genera la sección BENEFICIOS para "${p.producto}". País: ${p.pais}. Tono: ${p.tono}. Beneficio principal: ${p.beneficio}. Genera exactamente 3 beneficios, cada uno con título corto (máximo 4 palabras) y descripción corta (máximo 7 palabras). Formato: BENEFICIO 1: título | descripción\nBENEFICIO 2: título | descripción\nBENEFICIO 3: título | descripción`,
 
  como_funciona: (p) => `Eres un experto en copywriting. Genera la sección CÓMO FUNCIONA para "${p.producto}". País: ${p.pais}. Genera exactamente 3 pasos simples. Cada paso máximo 7 palabras. Formato: PASO 1: ...\nPASO 2: ...\nPASO 3: ...`,
 
  testimonios: (p) => `Eres un experto en copywriting. Genera 3 testimonios cortos y creíbles de clientes latinoamericanos para "${p.producto}". País: ${p.pais}. Cada testimonio: nombre latinoamericano + resultado específico. Máximo 18 palabras por testimonio. Formato: TESTIMONIO 1: "..." — Nombre\nTESTIMONIO 2: ...\nTESTIMONIO 3: ...`,
 
  oferta: (p) => `Eres un experto en copywriting. Genera la sección OFERTA para "${p.producto}". País: ${p.pais}. Tono: ${p.tono}. Precio oferta: ${p.precioOferta}. Precio anterior: ${p.precioAnterior}. Genera: 1 titular de urgencia (máximo 6 palabras) + 1 frase de ahorro o garantía (máximo 12 palabras) + 1 CTA (máximo 4 palabras). Sé breve. Máximo 30 palabras en total. Formato: TITULAR: ...\nFRASE: ...\nCTA: ...`,
 
  cta_final: (p) => `Eres un experto en copywriting. Genera el CTA FINAL para "${p.producto}". País: ${p.pais}. Tono: ${p.tono}. Precio: ${p.precioOferta}. Genera: 1 frase de cierre emocional (máximo 10 palabras) + 1 CTA (máximo 4 palabras) + 1 frase de garantía (máximo 6 palabras). Sé breve. Máximo 25 palabras en total. Formato: CIERRE: ...\nCTA: ...\nGARANTIA: ...`,
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
        max_tokens: 200,
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
