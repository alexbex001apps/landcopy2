import { NextRequest, NextResponse } from "next/server";

const PROMPTS_IMAGEN: Record<string, (p: any) => string> = {
  hero: (p) => `Professional ecommerce hero banner for Latin American market. MUST include large bold text overlay on the image. Product: ${p.producto}. Bold headline text: "${p.headline || p.producto}". Subheadline text: "${p.beneficio}". CTA button with text: "¡Comprar ahora!". Dramatic cinematic product shot. Dark premium background with orange accent lighting. Bold white typography. Commercial advertising quality. 4K ultra detailed.`,

  problema: (p) => `Emotional marketing image showing the PROBLEM before using ${p.producto}. MUST include bold text overlay on the image. Main text: "${p.problema}". Secondary text: "¿Te ha pasado esto?". Split before/after style. Person looking frustrated or in pain. Latin American context. Dark moody lighting on left side. Bold white typography over image. Commercial photography quality.`,

  solucion: (p) => `Transformation marketing image for ${p.producto}. MUST include bold text overlay. Before side text: "Antes" with sad person. After side text: "Después" with happy person using the product. Center headline: "${p.beneficio}". Warm hopeful lighting on right side. Bold white and orange typography. Latin American lifestyle. Commercial photography quality.`,

  kit: (p) => `Professional product kit flat lay for ${p.producto}. MUST include bold text overlay. Headline text: "Todo lo que incluye tu kit". All products visible and well arranged. Clean white or gradient background. Orange accent colors. Premium commercial photography with text labels for each product.`,

  beneficios: (p) => `Marketing infographic for ${p.producto}. MUST include bold text overlay. Large headline: "3 Beneficios que cambian todo". Three benefit sections with icons and bold text descriptions related to: ${p.beneficio}. Orange and white color scheme. Modern flat design. Professional marketing material quality.`,

  como_funciona: (p) => `Step-by-step marketing infographic for ${p.producto}. MUST include bold text overlay. Large headline: "¿Cómo funciona?". Three numbered steps (1, 2, 3) with icons and short bold text instructions. Orange numbered circles. Clean white background. Bold typography. Professional infographic quality.`,

  testimonios: (p) => `Social proof marketing image for ${p.producto}. MUST include bold text overlay. Large headline: "Lo que dicen nuestros clientes". Three customer review cards with 5 orange stars each, photos of happy Latin American customers, and short bold quote text. Trust badges at bottom: "Garantía 30 días", "Envío rápido", "Pago seguro". Orange accent colors. Professional marketing design.`,

  oferta: (p) => `Urgency sales image for ${p.producto}. MUST include large bold text overlay. Main price text: "${p.precioOferta || "Precio especial"}". Crossed out old price: "${p.precioAnterior || ""}". Bold text: "¡OFERTA LIMITADA!". Countdown or urgency badge. Red and orange accent colors. Dark dramatic background. High contrast commercial advertising typography.`,

  cta_final: (p) => `Closing sales banner for ${p.producto}. MUST include bold text overlay. Large headline: "¿Listo para transformar tu vida?". Subheadline: "${p.beneficio}". Bold CTA button text: "¡Quiero el mío ahora!". Guarantee text: "Garantía de satisfacción". Premium product shot centered. Aspirational lifestyle background. Orange and white bold typography. High end commercial quality.`,
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { seccion, producto, problema, beneficio, precioOferta, precioAnterior, imagen_url } = body;

    if (!seccion || !producto) {
      return NextResponse.json({ error: "Sección y producto requeridos" }, { status: 400 });
    }

    const promptFn = PROMPTS_IMAGEN[seccion];
    if (!promptFn) {
      return NextResponse.json({ error: `Sección "${seccion}" no reconocida` }, { status: 400 });
    }

    const prompt = promptFn({ producto, problema, beneficio, precioOferta, precioAnterior });

    let imageUrl = "";

    if (imagen_url && imagen_url.startsWith("http")) {
      const imgResp = await fetch(imagen_url);
      const imgBlob = await imgResp.blob();
      const imgBuffer = Buffer.from(await imgBlob.arrayBuffer());

      const boundary = "----FormBoundary" + Math.random().toString(36).slice(2);
      const parts = [
        `--${boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\ngpt-image-2`,
        `--${boundary}\r\nContent-Disposition: form-data; name="n"\r\n\r\n1`,
        `--${boundary}\r\nContent-Disposition: form-data; name="size"\r\n\r\n1024x1024`,
        `--${boundary}\r\nContent-Disposition: form-data; name="prompt"\r\n\r\n${prompt}`,
      ];
      const textParts = Buffer.from(parts.join("\r\n") + "\r\n");
      const fileHeader = Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="image[]"; filename="product.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`);
      const closing = Buffer.from(`\r\n--${boundary}--\r\n`);
      const bodyBuffer = Buffer.concat([textParts, fileHeader, imgBuffer, closing]);

      const resp = await fetch("https://api.openai.com/v1/images/edits", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": `multipart/form-data; boundary=${boundary}`,
          "Content-Length": String(bodyBuffer.length),
        },
        body: bodyBuffer,
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error?.message || "Error generando imagen");
      const b64 = data.data?.[0]?.b64_json;
      imageUrl = b64 ? `data:image/png;base64,${b64}` : "";
    } else {
      const resp = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model: "gpt-image-2", prompt, n: 1, size: "1024x1024" }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error?.message || "Error generando imagen");
      const b64 = data.data?.[0]?.b64_json;
      imageUrl = b64 ? `data:image/png;base64,${b64}` : "";
    }

    return NextResponse.json({ imageUrl, seccion });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}