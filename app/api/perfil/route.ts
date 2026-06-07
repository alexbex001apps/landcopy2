import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { imagen } = await req.json();
    if (!imagen || !imagen.startsWith("data:image")) {
      return NextResponse.json({ error: "Imagen requerida" }, { status: 400 });
    }

    // base64 → Buffer
    const base64 = imagen.split(",")[1];
    const buffer = Buffer.from(base64, "base64");
    const path = `${user.id}/avatar.jpg`;

    const { error: upError } = await supabase.storage
      .from("avatares")
      .upload(path, buffer, { contentType: "image/jpeg", upsert: true });
    if (upError) return NextResponse.json({ error: upError.message }, { status: 500 });

    const { data: pub } = supabase.storage.from("avatares").getPublicUrl(path);
    const avatarUrl = `${pub.publicUrl}?v=${Date.now()}`;

    const { error: metaError } = await supabase.auth.updateUser({
      data: { avatar_url: avatarUrl },
    });
    if (metaError) return NextResponse.json({ error: metaError.message }, { status: 500 });

    return NextResponse.json({ avatar_url: avatarUrl });
  } catch (err: any) {
    console.error("Error perfil:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}