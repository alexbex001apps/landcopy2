import { NextRequest, NextResponse } from "next/server";

const PROMPTS_IMAGEN: Record<string, (p: any) => string> = {
  hero: (p) => `Professional ecommerce hero banner for Latin American market. Product: ${p.producto}. Large bold headline text overlaid: "${p.headline || p.producto}". Subheadline: "${p.beneficio}". Call to action button text: "¡Comprar ahora!". Dramatic cinematic product shot centered. Dark premium background with orange accent lighting. Bold white typography. Commercial advertising quality. 4K ultra detailed.`,

  problema: (p) => `Emotional lifestyle photo showing the PROBLEM before using ${p.producto}. Person experiencing: ${p.problema}. Relatable, empathetic, slightly dark mood. Latin American context. Commercial photography quality.`,

  solucion: (p) => `Person happily using ${p.producto} and experiencing: ${p.beneficio}. Warm lighting, hopeful and positive mood. Latin American lifestyle. Before/after transformation feeling. Commercial photography quality.`,

  kit: (p) => `Professional product flat lay showing multiple products from the kit: ${p.producto}. Clean white or gradient background. All products visible and well arranged. Premium commercial photography.`,

  beneficios: (p) => `Clean infographic-style image showing 3 benefits of ${p.producto}. Minimalist design, orange accent colors, icons or simple illustrations. Modern flat design. Professional marketing material.`,

  como_funciona: (p) => `Simple step-by-step illustration showing how to use ${p.producto}. 3 clear steps with icons. Clean modern flat design. Latin American style. Professional infographic quality.`,

  testimonios: (p) => `Social proof testimonial image for ${p.producto}. Include 3 customer review cards with 5 stars, photos of happy Latin American customers, and short quotes about results. Bold headline text: "Lo que dicen nuestros clientes". Orange accent colors. Clean white background. Professional marketing design. Commercial quality.`,

  oferta: (p) => `${p.producto} product with price tag showing ${p.precioOferta}. Urgency visual elements — red accents, sale badge, limited time feeling. Dark dramatic background. High contrast commercial advertising.`,

  cta_final: (p) => `Clean premium product shot of ${p.producto} on elegant background. Inspiring closing mood. Aspirational lifestyle. The product as the hero. High end commercial photography quality.`,
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
      // Usar imagen del producto como referencia via edits
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
      // Generación directa sin referencia
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