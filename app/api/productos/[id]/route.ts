import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const CAMPOS = [
  "tipo", "nombre", "descripcion", "detalle", "problema", "beneficio", "beneficios",
  "publico_objetivo", "precio", "precio_oferta", "precio_anterior",
  "promocion", "tono", "imagenes", "activo",
] as const;

function limpiarBody(body: any) {
  const fila: Record<string, any> = {};
  for (const c of CAMPOS) {
    if (body[c] !== undefined) fila[c] = body[c];
  }
  return fila;
}

// Edita un producto (RLS garantiza que solo el dueño lo toca)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await req.json();
    const { data, error } = await supabase
      .from("productos")
      .update(limpiarBody(body))
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ producto: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Borra un producto
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { error } = await supabase.from("productos").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
