import { NextRequest, NextResponse } from "next/server";

export const FONDOS_DISPONIBLES = [
  { id: "negro_fuego", nombre: "Negro dramático", categoria: "Universal", color: "#1a0500", prompt: "Dark dramatic black background with orange fire particles, smoke and cinematic lighting." },
  { id: "blanco_minimal", nombre: "Blanco minimalista", categoria: "Universal", color: "#f5f5f5", prompt: "Clean white minimalist background with soft natural shadows and subtle light gradient." },
  { id: "degradado_naranja", nombre: "Fuego naranja", categoria: "Universal", color: "#cc4400", prompt: "Vibrant orange to deep red fire gradient background with energy and warmth." },
  { id: "marmol_blanco", nombre: "Mármol blanco", categoria: "Universal", color: "#e8e4e0", prompt: "Luxury white marble background with elegant grey veins and premium texture." },
  { id: "negro_dorado", nombre: "Negro premium dorado", categoria: "Universal", color: "#1a1400", prompt: "Black premium background with floating golden particles and luxury accent lighting." },
  { id: "rosa_coral", nombre: "Rosa coral", categoria: "Belleza", color: "#ff6b6b", prompt: "Soft coral pink background with delicate flower petals, feminine and elegant aesthetic." },
  { id: "beige_seda", nombre: "Beige seda", categoria: "Belleza", color: "#d4b896", prompt: "Warm beige background with soft silk fabric texture, luxurious and sophisticated." },
  { id: "lavanda", nombre: "Lavanda floral", categoria: "Belleza", color: "#9b7fc7", prompt: "Soft lavender purple background with blurred flower elements, calm and elegant beauty aesthetic." },
  { id: "oro_rosa", nombre: "Oro rosa premium", categoria: "Belleza", color: "#c9956c", prompt: "Rose gold background with sparkling glitter particles and premium beauty aesthetic." },
  { id: "neon_azul", nombre: "Neón tecnológico", categoria: "Tecnología", color: "#003366", prompt: "Dark background with electric blue neon circuit lines and digital technology aesthetic." },
  { id: "datos_azul", nombre: "Datos digitales", categoria: "Tecnología", color: "#001a33", prompt: "Deep blue background with flowing data streams, holographic waves and futuristic technology." },
  { id: "metal_gris", nombre: "Metal plateado", categoria: "Tecnología", color: "#555555", prompt: "Premium metallic grey background with brushed aluminum texture and silver reflections." },
  { id: "madera_oscura", nombre: "Madera premium", categoria: "Hogar", color: "#3d1c00", prompt: "Rich dark wood background with warm ambient lighting, cozy and premium home aesthetic." },
  { id: "cocina_blanca", nombre: "Cocina moderna", categoria: "Hogar", color: "#f0ebe5", prompt: "Modern white kitchen background with natural light, clean countertops and fresh lifestyle." },
  { id: "piedra_volcanica", nombre: "Piedra volcánica", categoria: "Hogar", color: "#2a2a2a", prompt: "Dark volcanic stone texture background with moss accents and natural organic feel." },
  { id: "verde_energia", nombre: "Verde energía", categoria: "Deporte", color: "#1a4d00", prompt: "Vibrant emerald green background with energy burst effects, dynamic sport and health aesthetic." },
  { id: "oceano_azul", nombre: "Océano azul", categoria: "Deporte", color: "#003366", prompt: "Deep ocean blue background with flowing water movement and fresh aquatic energy." },
  { id: "amarillo_infantil", nombre: "Amarillo festivo", categoria: "Infantil", color: "#ffcc00", prompt: "Bright cheerful yellow background with colorful stars, confetti and playful children aesthetic." },
  { id: "celeste_nubes", nombre: "Celeste con nubes", categoria: "Infantil", color: "#87ceeb", prompt: "Soft sky blue background with fluffy white clouds, rainbow elements and sweet children's style." },
  { id: "jardin_infantil", nombre: "Jardín mágico", categoria: "Infantil", color: "#2d8a4e", prompt: "Green garden background with butterflies, colorful flowers and magical nature for children." },
  { id: "rojo_pasion", nombre: "Rojo pasión", categoria: "Universal", color: "#cc0000", prompt: "Deep dramatic red background with rich velvety texture and passionate intensity." },
  { id: "amarillo_energia", nombre: "Amarillo energético", categoria: "Universal", color: "#ffcc00", prompt: "Bright energetic yellow background with warm radiant light and vibrant energy." },
  { id: "verde_oscuro", nombre: "Verde esmeralda oscuro", categoria: "Universal", color: "#0a3d0a", prompt: "Deep dark emerald green background with subtle luxury texture and elegant depth." },
  { id: "azul_marino", nombre: "Azul marino profundo", categoria: "Universal", color: "#001a4d", prompt: "Deep navy blue background with subtle sheen and premium sophisticated atmosphere." },
  { id: "plateado", nombre: "Plateado metálico", categoria: "Universal", color: "#aaaaaa", prompt: "Sleek silver metallic background with reflective chrome texture and modern elegance." },
  { id: "bokeh_dorado", nombre: "Bokeh dorado", categoria: "Decorativo", color: "#b8860b", prompt: "Dark background with beautiful golden bokeh light circles, glamorous and festive atmosphere." },
  { id: "confeti", nombre: "Confeti festivo", categoria: "Decorativo", color: "#ff6699", prompt: "White background with colorful confetti falling, celebration and festive party atmosphere." },
  { id: "acuarela_pastel", nombre: "Acuarela pastel", categoria: "Decorativo", color: "#e8c4d8", prompt: "Soft watercolor pastel background with gentle pink, lavender and mint color washes, artistic and delicate." },
  { id: "geometrico", nombre: "Geométrico moderno", categoria: "Decorativo", color: "#1a1a2e", prompt: "Dark background with subtle geometric patterns and lines, modern minimalist design aesthetic." },
  { id: "terciopelo_rojo", nombre: "Terciopelo rojo", categoria: "Decorativo", color: "#8b0000", prompt: "Rich deep red velvet texture background, luxurious and dramatic with premium fabric feel." },
  { id: "cafe_lifestyle", nombre: "Mesa de café", categoria: "Lifestyle", color: "#8b6914", prompt: "Cozy coffee shop wooden table background with books and warm natural lighting, lifestyle aesthetic." },
  { id: "playa_atardecer", nombre: "Playa al atardecer", categoria: "Lifestyle", color: "#ff7043", prompt: "Tropical beach at sunset background with golden orange sky, waves and palm trees silhouette." },
  { id: "ciudad_nocturna", nombre: "Ciudad nocturna", categoria: "Lifestyle", color: "#0d1b2a", prompt: "Urban night city background with bokeh lights, buildings and vibrant city energy." },
  { id: "bosque_niebla", nombre: "Bosque con neblina", categoria: "Lifestyle", color: "#2d4a2d", prompt: "Misty forest background with soft morning fog through trees, mysterious and natural atmosphere." },
  { id: "estudio_blanco", nombre: "Estudio fotográfico", categoria: "Lifestyle", color: "#f5f5f5", prompt: "Clean white photography studio background with soft professional lighting and minimal shadows." },
  { id: "navidad", nombre: "Navidad con nieve", categoria: "Ocasiones", color: "#c41e3a", prompt: "Christmas red background with falling snowflakes, pine branches, gold ornaments and festive holiday spirit." },
  { id: "san_valentin", nombre: "San Valentín", categoria: "Ocasiones", color: "#ff1493", prompt: "Romantic Valentine's Day background with red and pink roses, hearts and soft romantic lighting." },
  { id: "graduacion", nombre: "Graduación dorada", categoria: "Ocasiones", color: "#c9a84c", prompt: "Elegant graduation background with golden confetti, diploma scroll elements and achievement celebration." },
  { id: "halloween", nombre: "Halloween naranja", categoria: "Ocasiones", color: "#ff6600", prompt: "Halloween orange background with pumpkins, bats and spooky atmospheric fog effects." },
  { id: "anio_nuevo", nombre: "Año nuevo", categoria: "Ocasiones", color: "#1a0033", prompt: "New Year celebration background with fireworks, gold and silver sparkles against dark midnight sky." },
];

const PROMPTS_IMAGEN: Record<string, (p: any) => string> = {
  hero: (p) => `Professional ecommerce hero banner for Latin American market. MUST include large bold text overlay on the image. Product: ${p.producto}. Bold headline text: "${p.headline || p.producto}". Subheadline text: "${p.beneficio}". CTA button with text: "¡Comprar ahora!". Dramatic cinematic product shot. Bold white typography. Commercial advertising quality. 4K ultra detailed. BACKGROUND: ${p.fondo || "Dark premium background with orange accent lighting."}`,

  problema: (p) => `Emotional marketing image showing the PROBLEM before using ${p.producto}. MUST include bold text overlay on the image. Main text: "${p.problema}". Secondary text: "¿Te ha pasado esto?". Split before/after style. Person looking frustrated or in pain. Latin American context. Bold white typography over image. Commercial photography quality. BACKGROUND: ${p.fondo || "Dark moody lighting on left side."}`,

  solucion: (p) => `Transformation marketing image for ${p.producto}. MUST include bold text overlay. Before side text: "Antes" with sad person. After side text: "Después" with happy person using the product. Center headline: "${p.beneficio}". Bold white and orange typography. Latin American lifestyle. Commercial photography quality. BACKGROUND: ${p.fondo || "Warm hopeful lighting."}`,

  kit: (p) => `Professional product kit flat lay for ${p.producto}. MUST include bold text overlay. Headline text: "Todo lo que incluye tu kit". All products visible and well arranged. Orange accent colors. Premium commercial photography with text labels for each product. BACKGROUND: ${p.fondo || "Clean white or gradient background."}`,

  beneficios: (p) => `Marketing infographic for ${p.producto}. MUST include bold text overlay. Large headline: "3 Beneficios que cambian todo". Three benefit sections with icons and bold text descriptions related to: ${p.beneficio}. Orange and white color scheme. Modern flat design. Professional marketing material quality. BACKGROUND: ${p.fondo || "Clean modern background."}`,

  como_funciona: (p) => `Step-by-step marketing infographic for ${p.producto}. MUST include bold text overlay. Large headline: "¿Cómo funciona?". Three numbered steps (1, 2, 3) with icons and short bold text instructions. Orange numbered circles. Bold typography. Professional infographic quality. BACKGROUND: ${p.fondo || "Clean white background."}`,

  testimonios: (p) => `Social proof marketing image for ${p.producto}. MUST include bold text overlay. Large headline: "Lo que dicen nuestros clientes". Three customer review cards with 5 orange stars each, photos of happy Latin American customers, and short bold quote text. Trust badges at bottom: "Garantía 30 días", "Envío rápido", "Pago seguro". Orange accent colors. Professional marketing design. BACKGROUND: ${p.fondo || "Clean professional background."}`,

  oferta: (p) => `Urgency sales image for ${p.producto}. MUST include large bold text overlay. Main price text: "${p.precioOferta || "Precio especial"}". Crossed out old price: "${p.precioAnterior || ""}". Bold text: "¡OFERTA LIMITADA!". Countdown or urgency badge. Red and orange accent colors. High contrast commercial advertising typography. BACKGROUND: ${p.fondo || "Dark dramatic background."}`,

  cta_final: (p) => `Closing sales banner for ${p.producto}. MUST include bold text overlay. Large headline: "¿Listo para transformar tu vida?". Subheadline: "${p.beneficio}". Bold CTA button text: "¡Quiero el mío ahora!". Guarantee text: "Garantía de satisfacción". Premium product shot centered. Orange and white bold typography. High end commercial quality. BACKGROUND: ${p.fondo || "Aspirational lifestyle background."}`,
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { seccion, producto, problema, beneficio, precioOferta, precioAnterior, imagen_url, fondoId } = body;

    if (!seccion || !producto) {
      return NextResponse.json({ error: "Sección y producto requeridos" }, { status: 400 });
    }

    const promptFn = PROMPTS_IMAGEN[seccion];
    if (!promptFn) {
      return NextResponse.json({ error: `Sección "${seccion}" no reconocida` }, { status: 400 });
    }

    const fondoSeleccionado = FONDOS_DISPONIBLES.find(f => f.id === fondoId);
    const fondo = fondoSeleccionado?.prompt || null;

    const prompt = promptFn({ producto, problema, beneficio, precioOferta, precioAnterior, fondo });

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