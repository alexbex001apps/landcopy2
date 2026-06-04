import { NextRequest, NextResponse } from "next/server";

const TAMANIOS: Record<string, string> = {
  facebook: "1536x1024",
  instagram: "1024x1024",
  stories: "1024x1536",
  tiktok: "1024x1536",
};

async function generarImagenBase64(prompt: string, size: string, apiKey: string, imagen?: string): Promise<string> {
  if (imagen && imagen.startsWith("data:")) {
    const imageBuffer = Buffer.from(imagen.split(",")[1], "base64");
    const boundary = "----FormBoundary" + Math.random().toString(36).slice(2);
    const parts = [
      `--${boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\ngpt-image-2`,
      `--${boundary}\r\nContent-Disposition: form-data; name="n"\r\n\r\n1`,
      `--${boundary}\r\nContent-Disposition: form-data; name="size"\r\n\r\n${size}`,
      `--${boundary}\r\nContent-Disposition: form-data; name="prompt"\r\n\r\n${prompt}`,
    ];
    const textParts = Buffer.from(parts.join("\r\n") + "\r\n");
    const fileHeader = Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="image[]"; filename="product.png"\r\nContent-Type: image/jpeg\r\n\r\n`);
    const closing = Buffer.from(`\r\n--${boundary}--\r\n`);
    const body = Buffer.concat([textParts, fileHeader, imageBuffer, closing]);
    const resp = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "Content-Length": String(body.length),
      },
      body,
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error?.message || "Error edicion");
    const b64 = data.data?.[0]?.b64_json;
    return b64 ? `data:image/png;base64,${b64}` : "";
  } else {
    const resp = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "gpt-image-2", prompt, n: 1, size }),
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error?.message || "Error generacion");
    const b64 = data.data?.[0]?.b64_json;
    return b64 ? `data:image/png;base64,${b64}` : "";
  }
}

const PROMPTS_MAESTROS = {
  hot: (params: any) => `You are creating a HIGH-CONVERSION LATIN AMERICAN ECOMMERCE ADVERTISEMENT optimized for HOT TRAFFIC — customers ready to buy RIGHT NOW.

PRODUCT: ${params.producto}
FORMAT: Professional Meta Ads / Facebook Ads winning advertisement

MANDATORY BLOCKS — ALL MUST APPEAR:

BLOCK 1 - MASSIVE HEADLINE:
"${params.headline}"
Position: Top area. Size: Very large, 25-35% canvas height. Style: Bold italic condensed uppercase. Angle: SLIGHT DIAGONAL -5 to -10 degrees. Color: White or bright yellow. FIRST thing the eye sees.

BLOCK 2 - URGENCY STRIP:
${params.frasesUrgencia.length > 0 ? `Text: "${params.frasesUrgencia.join(" · ")}"` : 'Text: "¡ÚLTIMAS UNIDADES! HOY SOLAMENTE"'}
Style: Red banner or red brush stroke immediately below headline.

BLOCK 3 - PRODUCT HERO:
${params.producto} must DOMINATE the center. Large, dramatic cinematic lighting, sharp, premium. NOT a catalog image.

${params.dolorSel.length > 0 ? `BLOCK 4 - PAIN POINTS (left column):
IMPORTANT: Each pain point must appear as TWO lines — the title in bold and immediately below it a short explanatory phrase of 4-6 words in smaller text. Example: "Dolor constante" title, below it "que no te deja vivir". Render each as a stacked two-line item with checkmark or icon.
${params.dolorSel.map((d: string) => `• ${d}`).join("\n")}
Style: Left side vertical stack with checkmarks or icons. Each item has title + subtitle.` : ""}

${params.frasesConfianza.length > 0 ? `BLOCK 5 - TRUST BADGES:
${params.frasesConfianza.join(" · ")}
Style: Right side badge or seal, slight rotation.` : ""}

${params.precioOferta ? `PRICING BLOCK:
${params.precioAnterior ? `BEFORE: ${params.precioAnterior} crossed out` : ""} NOW: ${params.precioOferta} highlighted
Style: Bold price display, prominent.` : ""}

${params.frasesAccion.length > 0 ? `BLOCK 6 - CTA BUTTON:
Text: "${params.frasesAccion[0]}"
Style: Large red ecommerce button, bottom area, 70-90% width, white bold uppercase text with shopping cart icon.` : `BLOCK 6 - CTA BUTTON:
Text: "COMPRAR AHORA"
Style: Large red ecommerce button, bottom area, 70-90% width, white bold uppercase text with shopping cart icon.`}

VISUAL STYLE:
Dark background, dramatic cinematic lighting, volumetric light, energy particles, sparks, smoke effects, glow on product. High contrast. Colors: dark background with red, white, yellow accents.

TYPOGRAPHY: Multiple sizes, diagonal headline, layered text, advertising tension, asymmetric layout.

CONVERSION PSYCHOLOGY: Maximum urgency, scarcity, value, immediate action. Must feel like a Facebook Ads WINNER.

QUALITY: Ultra detailed, 4K, commercial advertising quality, professional marketing design, high conversion layout, Direct Response Advertising style.`,

  warm: (params: any) => `You are creating a LATIN AMERICAN ECOMMERCE ADVERTISEMENT optimized for WARM TRAFFIC — customers who know their problem and are evaluating solutions.

PRODUCT: ${params.producto}
FORMAT: Professional Meta Ads / Facebook Ads — trust and benefits focused

MANDATORY BLOCKS:

BLOCK 1 - BENEFIT HEADLINE:
"${params.headline}"
Position: Top area. Style: Bold friendly typography, warm colors. Less aggressive than hot traffic. Conversational and trustworthy tone.

BLOCK 2 - SOCIAL PROOF STRIP:
${params.frasesConfianza.length > 0 ? `"${params.frasesConfianza.join(" · ")}"` : '"MILES LO HAN COMPROBADO · GARANTIZADO"'}
Style: Warm colored banner — orange, green or blue. Testimonial style.

BLOCK 3 - PRODUCT HERO:
${params.producto} centered, clean professional photography, warm lighting, trustworthy atmosphere.

${params.dolorSel.length > 0 ? `BLOCK 4 - BENEFITS / PAIN POINTS (left column):
IMPORTANT: Each item must appear as TWO lines — the title in bold and immediately below it a short explanatory phrase of 4-6 words in smaller text. Example: "Dolor constante" title, below it "que ya tiene solución". Render each as a stacked two-line item with green checkmark.
${params.dolorSel.map((d: string) => `✓ ${d}`).join("\n")}
Style: Left side benefit column, green checkmarks, clean and scannable. Each item has title + subtitle.` : ""}

${params.precioOferta ? `PRICING BLOCK:
Value presentation: ${params.precioAnterior ? `BEFORE ${params.precioAnterior}` : ""} NOW ${params.precioOferta}
Style: Fair price display, not aggressive.` : ""}

${params.frasesAccion.length > 0 ? `CTA:
"${params.frasesAccion[0]}"
Style: Warm colored button — green or orange, friendly and inviting.` : `CTA:
"QUIERO SABER MÁS"
Style: Warm colored button — green or orange, friendly and inviting.`}

VISUAL STYLE:
Warm clean background — cream, light blue, soft green or white. Professional soft lighting. Trustworthy atmosphere. No aggressive red. Colors communicate reliability and quality.

TYPOGRAPHY: Clear hierarchy, readable, professional but approachable.

CONVERSION PSYCHOLOGY: Trust, social proof, benefits, value. Customer feels informed and confident to decide.

QUALITY: Ultra detailed, 4K, commercial advertising quality, professional ecommerce design.`,

  cold: (params: any) => `You are creating a LATIN AMERICAN ECOMMERCE ADVERTISEMENT optimized for COLD TRAFFIC — customers who don't know the product yet.

PRODUCT: ${params.producto}
FORMAT: Professional Meta Ads / Facebook Ads — curiosity and discovery focused

MANDATORY BLOCKS:

BLOCK 1 - CURIOSITY HEADLINE:
"${params.headline}"
Position: Top area. Style: Bold intriguing typography. Creates curiosity and stops the scroll. Question format or surprising statement.

BLOCK 2 - HOOK STRIP:
${params.frasesDescubrimiento.length > 0 ? `"${params.frasesDescubrimiento.join(" · ")}"` : '"¿SABÍAS QUE EXISTE UNA SOLUCIÓN?"'}
Style: Soft colored banner — blue or purple. Informative and inviting.

BLOCK 3 - PRODUCT HERO:
${params.producto} presented beautifully, lifestyle context, aspirational environment. Shows the transformation.

${params.dolorSel.length > 0 ? `BLOCK 4 - PAIN IDENTIFICATION:
IMPORTANT: Each item must appear as TWO lines — the title in bold and immediately below it a short empathetic phrase of 4-6 words in smaller text. Example: "Dolor constante" title, below it "¿te suena familiar?". Render each as a stacked two-line item with bullet or icon.
${params.dolorSel.map((d: string) => `• ${d}`).join("\n")}
Style: Empathetic presentation, identifies with the reader's situation. Each item has title + subtitle.` : ""}

CTA:
${params.frasesAccion.length > 0 ? `"${params.frasesAccion[0]}"` : '"DESCUBRE CÓMO"'}
Style: Soft inviting button — blue or purple. No pressure. Exploratory.

NO PRICE: Cold traffic doesn't show price. Discovery first.

VISUAL STYLE:
Clean neutral background — white, light gray or soft gradient. Natural lifestyle lighting. Aspirational and relatable. No urgency elements. Colors communicate discovery and possibility.

TYPOGRAPHY: Friendly, approachable, story-like hierarchy.

CONVERSION PSYCHOLOGY: Curiosity, identification with problem, aspiration, gentle invitation. No pressure.

QUALITY: Ultra detailed, 4K, commercial advertising quality, lifestyle photography style.`,
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { producto, headline, temperatura = "hot", frasesSeleccionadas = [], dolorSel = [], precioOferta, precioAnterior, formato = "instagram", imagen, promptPropio } = body;

    if (!producto || !headline) {
      return NextResponse.json({ error: "Producto y headline requeridos" }, { status: 400 });
    }

    const size = TAMANIOS[formato] || "1024x1024";

    const frasesHot = ["¡ÚLTIMAS UNIDADES!", "HOY SOLAMENTE", "STOCK LIMITADO", "OFERTA TERMINA HOY", "PRECIO ESPECIAL", "OFERTA FLASH", "¡NO TE QUEDES SIN EL TUYO!", "COMPRAR AHORA", "PEDIR AHORA", "QUIERO EL MÍO"];
    const frasesWarm = ["RESULTADOS REALES", "GARANTIZADO", "MILES LO USAN", "100% COMPROBADO", "ENVÍO GRATIS", "PAGO CONTRA ENTREGA", "100% NATURAL", "SIN EFECTOS SECUNDARIOS", "QUIERO SABER MÁS", "VER RESULTADOS"];
    const frasesCold = ["¿SABÍAS QUE...?", "DESCUBRE CÓMO", "EL SECRETO QUE NADIE TE DIJO", "¿TE HA PASADO ESTO?", "CONOCE LA SOLUCIÓN", "APRENDE MÁS", "DESCUBRIR", "LA VERDAD SOBRE...", "LO QUE NO TE CUENTAN"];

    const frasesUrgencia = frasesSeleccionadas.filter((f: string) => frasesHot.includes(f) && !["COMPRAR AHORA", "PEDIR AHORA", "QUIERO EL MÍO"].includes(f));
    const frasesConfianza = frasesSeleccionadas.filter((f: string) => frasesWarm.includes(f) && !["QUIERO SABER MÁS", "VER RESULTADOS"].includes(f));
    const frasesDescubrimiento = frasesSeleccionadas.filter((f: string) => frasesCold.includes(f) && !["DESCUBRIR", "APRENDE MÁS"].includes(f));
    const frasesAccion = frasesSeleccionadas.filter((f: string) => ["COMPRAR AHORA", "PEDIR AHORA", "QUIERO EL MÍO", "QUIERO SABER MÁS", "VER RESULTADOS", "DESCUBRIR", "APRENDE MÁS"].includes(f));

    const params = { producto, headline, frasesUrgencia, frasesConfianza, frasesDescubrimiento, frasesAccion, dolorSel, precioOferta, precioAnterior };

    const promptFinal = promptPropio?.trim()
      ? `${promptPropio}\n\nPRODUCT: ${producto}\nHEADLINE: "${headline}"\n${precioOferta ? `PRICE: ${precioAnterior ? `BEFORE ${precioAnterior}` : ""} NOW ${precioOferta}` : ""}\nFRASES: ${frasesSeleccionadas.join(", ")}\nQUALITY: Ultra detailed, 4K, commercial advertising quality, high conversion layout.`
      : PROMPTS_MAESTROS[temperatura as keyof typeof PROMPTS_MAESTROS](params);

    const imageUrl = await generarImagenBase64(promptFinal, size, process.env.OPENAI_API_KEY!, imagen);

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      await fetch(`${supabaseUrl}/rest/v1/anuncios_adn`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          temperatura,
          pais: "latam",
          frases_usadas: frasesSeleccionadas,
          headline_length: headline?.length || 0,
          tiene_precio: !!precioOferta,
          tiene_foto_producto: !!imagen,
          formato,
        }),
      });
    } catch (e) {
      console.log("ADN save error (non-critical):", e);
    }

    return NextResponse.json({ imageUrl, success: true });

  } catch (err: any) {
    console.error("Error en /api/anuncios/generar:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}