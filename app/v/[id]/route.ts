import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { data } = await supabase
    .from("landings_publicadas")
    .select("html")
    .eq("id", id)
    .single();

  if (!data) {
    return new Response(
      `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:system-ui;text-align:center;padding:40px"><h1>Landing no encontrada</h1><p>Este enlace no existe o fue eliminado.</p></body></html>`,
      { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="margin:0">${data.html}</body></html>`;

  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}