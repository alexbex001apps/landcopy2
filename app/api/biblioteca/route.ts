import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const tipo = searchParams.get("tipo");
    const modulo = searchParams.get("modulo");
    const favorito = searchParams.get("favorito");

    let query = supabase
      .from("biblioteca")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (tipo) query = query.eq("tipo", tipo);
    if (modulo) query = query.eq("modulo", modulo);
    if (favorito === "true") query = query.eq("favorito", true);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ items: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await req.json();
    const { tipo, modulo, nombre, contenido, imagen_url, producto, campana_id, metadata } = body;

    if (!tipo || !modulo || !nombre) {
      return NextResponse.json({ error: "tipo, modulo y nombre son requeridos" }, { status: 400 });
    }

    const { data, error } = await supabase.from("biblioteca").insert({
      user_id: user.id, tipo, modulo, nombre, contenido,
      imagen_url, producto, campana_id, metadata,
    }).select().single();

    if (error) throw error;
    return NextResponse.json({ item: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await req.json();
    const { id, favorito, nombre, carpeta_id, notas } = body;

    const updates: any = {};
    if (favorito !== undefined) updates.favorito = favorito;
    if (carpeta_id !== undefined) updates.carpeta_id = carpeta_id;
    if (nombre !== undefined) updates.nombre = nombre;
    if (notas !== undefined) updates.notas = notas;

    const { data, error } = await supabase.from("biblioteca")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select().single();

    if (error) throw error;
    return NextResponse.json({ item: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { id } = await req.json();
    const { error } = await supabase.from("biblioteca")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}