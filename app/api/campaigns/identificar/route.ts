import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { imagen } = await req.json();
    if (!imagen) return NextResponse.json({ error: "Imagen requerida" }, { status: 400 });

    const base64 = imagen.split(",")[1];
    const mediaType = imagen.split(";")[0].split(":")[1];

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: `data:${mediaType};base64,${base64}` },
              },
              {
                type: "text",
                text: `Analiza esta imagen de producto y responde SOLO con JSON sin markdown:
{
  "nombre": "nombre comercial corto del producto",
  "producto": "descripción de características en máximo 10 palabras",
  "problema": "problema principal que resuelve en máximo 6 palabras",
  "beneficio": "beneficio principal en máximo 6 palabras",
  "categoria": "categoría del producto"
}`,
              },
            ],
          },
        ],
      }),
    });

    const data = await resp.json();
    const text = data.choices?.[0]?.message?.content || "{}";
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json(parsed);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}