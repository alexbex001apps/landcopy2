import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { nombre, html, userId } = await req.json();

    const id = Math.random().toString(36).slice(2, 8);

    const { error } = await supabase.from("landings_publicadas").insert({
      id,
      user_id: userId || null,
      nombre: nombre || "Mi landing",
      html,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ id });
  } catch (e) {
    return NextResponse.json({ error: "Error al publicar" }, { status: 500 });
  }
}