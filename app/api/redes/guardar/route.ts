import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const body = await req.json();
    const { idea, producto, pais, tono, destino, tipo, textos } = body;

    if (!idea?.imageUrl) {
      return NextResponse.json({ error: "No hay imagen para guardar" }, { status: 400 });
    }

    // Descargar imagen desde URL de OpenAI
    const imgRes = await fetch(idea.imageUrl);
    if (!imgRes.ok) {
      return NextResponse.json({ error: "No se pudo descargar la imagen" }, { status: 500 });
    }
    const imgBuffer = await imgRes.arrayBuffer();

    // Subir a Supabase Storage
    const fileName = `${user.id}/${Date.now()}-${producto.replace(/\s+/g, "-").toLowerCase()}.png`;
    const { error: uploadError } = await supabase.storage
      .from("redes-imagenes")
      .upload(fileName, imgBuffer, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) {
      console.error("Error subiendo imagen:", uploadError);
      return NextResponse.json({ error: "Error subiendo imagen" }, { status: 500 });
    }

    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from("redes-imagenes")
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;

    // Guardar metadata en la base de datos
    const { error: dbError } = await supabase
      .from("redes_guardadas")
      .insert({
        user_id: user.id,
        producto,
        pais,
        tono,
        destino,
        tipo,
        image_url: publicUrl,
        file_name: fileName,
        prompt: idea.desc,
        modo: idea.modo,
        caption: textos?.caption || "",
        hashtags: textos?.hashtags || "",
        guion: textos?.guion || "",
        compartible: true,
        created_at: new Date().toISOString(),
      });

    if (dbError) {
      console.error("Error guardando en DB:", dbError);
      // La imagen ya se subió, devolvemos la URL aunque falle el registro
    }

    return NextResponse.json({ url: publicUrl, ok: true });

  } catch (err) {
    console.error("Error en /api/redes/guardar:", err);
    return NextResponse.json({ error: "Error guardando imagen" }, { status: 500 });
  }
}
