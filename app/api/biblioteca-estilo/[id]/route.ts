import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { esAdminBibliotecaEstilo } from "@/lib/bibliotecaEstilo/admin";

async function usuarioAdminActual() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !esAdminBibliotecaEstilo(user.email)) return null;
  return user;
}

// Extrae "categoria/archivo.ext" de una URL publica de Supabase Storage.
function pathDesdeUrlPublica(url: string | null, bucket: string): string | null {
  if (!url) return null;
  const marcador = `/public/${bucket}/`;
  const idx = url.indexOf(marcador);
  if (idx === -1) return null;
  return url.slice(idx + marcador.length);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await usuarioAdminActual();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();

  const cambios: Record<string, any> = {};
  if (typeof body.activa === "boolean") cambios.activa = body.activa;
  if (typeof body.texto_plano === "string") cambios.texto_plano = body.texto_plano;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("biblioteca_estilo")
    .update(cambios)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ referencia: data });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await usuarioAdminActual();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id } = await params;
  const supabase = createServiceClient();

  const { data: fila } = await supabase
    .from("biblioteca_estilo")
    .select("imagenes_urls, pdf_url")
    .eq("id", id)
    .maybeSingle();

  if (fila) {
    const paths = [
      ...(fila.imagenes_urls || []).map((u: string) => pathDesdeUrlPublica(u, "biblioteca-estilo")),
      pathDesdeUrlPublica(fila.pdf_url, "biblioteca-estilo"),
    ].filter((p): p is string => !!p);

    if (paths.length > 0) {
      await supabase.storage.from("biblioteca-estilo").remove(paths);
    }
  }

  const { error } = await supabase.from("biblioteca_estilo").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
