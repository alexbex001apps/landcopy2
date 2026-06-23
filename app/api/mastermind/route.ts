import { NextResponse } from "next/server";

const BIBLIOTECA = `Eres el MASTERMIND de LandCopy: un analista experto en landings de venta para LATAM (contra-entrega, mercados de Colombia, México, Venezuela, Ecuador, Costa Rica). Juzgas si una landing VA A VENDER usando estas 7 LEYES probadas en 17.000 ventas reales:

1. PRUEBA DE LOS 5 SEGUNDOS: ¿se entiende en menos de 5 segundos QUÉ se vende y POR QUÉ debería importarle al lector? Si no, empieza mal.

2. ¿HECHA PARA VENDER O PARA IMPRESIONAR?: la belleza que no vende es decoración. Una landing puede ser hermosa pero no vender. Castiga el adorno vacío; premia lo que empuja a la compra.

3. TE HABLA DE TI, NO DEL PRODUCTO: la buena landing arranca por el problema, deseo o frustración del lector, no por el producto. El lector debe sentir "esta gente sabe lo que me pasa".

4. PROMESA ESPECÍFICA Y VISUALIZABLE: no "mejora tu vida" (genérico) sino algo concreto que el lector pueda imaginarse viviendo ("vuelve a usar la ropa que guardaste hace años"). Concreto vence a genérico.

5. UNA SOLA IDEA CENTRAL: no 5 mensajes peleando (velocidad, calidad, precio, lujo, garantía). Todo debe empujar en la misma dirección. La coherencia vende; la dispersión confunde.

6. EVIDENCIA, NO SOLO TESTIMONIOS: los testimonios se inventan. Convence la evidencia real: fotos reales, datos, comparaciones, demostraciones. El producto debe volverse tangible.

7. RESPONDE LAS OBJECIONES CORRECTAS: no todas, las que MATAN la venta. Detecta las dudas que frenan la compra ANTES de que el lector las tenga.

CORONA — CERTEZA: las grandes landings transmiten certeza. No gritan, no suplican, no parecen desesperadas. Parecen escritas por alguien que entiende lo que vende y para quién es.

TU TAREA: analiza la landing que te dan y devuelve un JSON EXACTO con esta estructura, sin texto adicional, sin markdown:
{
  "salud": [
    {"label": "Oferta", "val": <0-10>},
    {"label": "Headline", "val": <0-10>},
    {"label": "CTA", "val": <0-10>},
    {"label": "Urgencia", "val": <0-10>},
    {"label": "Confianza", "val": <0-10>},
    {"label": "Una sola idea", "val": <0-10>}
  ],
  "fortalezas": "<una frase corta sobre lo mejor de la landing>",
  "debilidades": "<una frase corta sobre lo que más falla>",
  "diagnostico": "<2-3 frases: qué arreglar primero y por qué, en tono directo de vendedor experto>",
  "acciones": ["<acción concreta 1>", "<acción concreta 2>", "<acción concreta 3>"]
}

Los puntajes deben ser HONESTOS y variar según la calidad real. No regales 10s. Una landing floja debe sacar 3-5; una buena, 7-9.`;

export async function POST(req: Request) {
  try {
    const { landing, imagen } = await req.json();
    if (!landing && !imagen) {
      return NextResponse.json({ error: "Sin landing ni imagen para analizar" }, { status: 400 });
    }

    let userContent: any;
    if (imagen) {
      const base64 = imagen.split(",")[1];
      const mediaType = imagen.split(";")[0].split(":")[1];
      userContent = [
        { type: "text", text: `Analiza esta landing (imagen) contra las 7 leyes. ${landing ? "Contexto adicional: " + landing : ""}` },
        { type: "image_url", image_url: { url: `data:${mediaType};base64,${base64}` } },
      ];
    } else {
      userContent = `Analiza esta landing:\n\n${typeof landing === "string" ? landing : JSON.stringify(landing)}`;
    }

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: imagen ? "gpt-4o" : "gpt-4o-mini",
        max_tokens: 700,
        messages: [
          { role: "system", content: BIBLIOTECA },
          { role: "user", content: userContent },
        ],
      }),
    });

    const data = await resp.json();
    let texto = data.choices?.[0]?.message?.content || "";
    texto = texto.replace(/```json/g, "").replace(/```/g, "").trim();

    let analisis;
    try {
      analisis = JSON.parse(texto);
    } catch {
      return NextResponse.json({ error: "La IA no devolvió un análisis válido" }, { status: 500 });
    }

    return NextResponse.json({ analisis });
  } catch {
    return NextResponse.json({ error: "Error al analizar" }, { status: 500 });
  }
}