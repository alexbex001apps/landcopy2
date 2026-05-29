import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { texto, producto, pais, tono } = await req.json();

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
            content: "Eres un experto en copywriting para negocios latinoamericanos. Mejora el texto dado haciéndolo más persuasivo, emocional y orientado a ventas. Mantén el mismo tema pero hazlo más poderoso. Responde SOLO con el texto mejorado, sin explicaciones."
          },
          {
            role: "user",
            content: `Mejora este copy para el producto "${producto}" en ${pais} con tono ${tono}:\n\n${texto}`
          }
        ],
        max_tokens: 1000,
        temperature: 0.8,
      }),
    });

    const data = await response.json();
    const textoMejorado = data.choices?.[0]?.message?.content || texto;
    return NextResponse.json({ texto: textoMejorado });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}