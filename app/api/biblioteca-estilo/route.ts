import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { esAdminBibliotecaEstilo } from "@/lib/bibliotecaEstilo/admin";
import { describirImagenesConIA } from "@/lib/bibliotecaEstilo/vision";
import { CATEGORIAS_ESTILO } from "@/lib/bibliotecaEstilo/categorias";

// Subir varias imagenes + analizarlas con IA (vision) puede tardar bastante.
// 300s es el maximo del plan Pro.
export const maxDuration = 300;

// ─────────────────────────────────────────────────────────────
// BIBLIOTECA DE ESTILO · banco global de referencias de marca.
// Solo Alejandro y Leonel (BIBLIOTECA_ESTILO_ADMINS) pueden leer/escribir.
// No tiene RLS por usuario: todo pasa por aqui con el service_role.
// ─────────────────────────────────────────────────────────────

async function usuarioAdminActual() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !esAdminBibliotecaEstilo(user.email)) return null;
  return user;
}

export async function GET() {
  const admin = await usuarioAdminActual();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("biblioteca_estilo")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ referencias: data });
}

export async function POST(req: NextRequest) {
  try {
    const admin = await usuarioAdminActual();
    if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    const form = await req.formData();
    const categoria = String(form.get("categoria") || "");
    const titulo = String(form.get("titulo") || "") || null;
    const texto = String(form.get("texto") || "") || null;
    const archivos = form.getAll("archivo").filter((f): f is File => f instanceof File && f.size > 0);

    if (!CATEGORIAS_ESTILO.includes(categoria as any)) {
      return NextResponse.json({ error: "Categoria invalida" }, { status: 400 });
    }
    if (archivos.length === 0 && !texto) {
      return NextResponse.json({ error: "Falta el texto, el PDF o las imagenes" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const timestamp = Date.now();

    let textoPlano = texto;
    const imagenesUrls: string[] = [];
    let pdfUrl: string | null = null;

    const pdfArchivo = archivos.find((f) => f.type === "application/pdf");
    const imagenesArchivos = archivos.filter((f) => f.type.startsWith("image/"));
    const otro = archivos.find((f) => f.type !== "application/pdf" && !f.type.startsWith("image/"));

    if (otro) {
      return NextResponse.json({ error: "Los archivos deben ser PDF o imagenes" }, { status: 400 });
    }

    // Un carrusel es una secuencia: se sube UN PDF (todas sus laminas) o VARIAS imagenes (una por lamina).
    if (pdfArchivo) {
      // Import diferido: pdf-parse solo se carga cuando realmente se sube un PDF,
      // para que un problema de empaquetado ahi no tumbe la subida de imagenes.
      const { procesarPdf } = await import("@/lib/bibliotecaEstilo/pdf");
      const buffer = Buffer.from(await pdfArchivo.arrayBuffer());
      const { texto: textoExtraido, imagenPrimeraPagina } = await procesarPdf(buffer);
      textoPlano = [texto, textoExtraido].filter(Boolean).join("\n\n") || null;

      const pathPdf = `${categoria}/${timestamp}_original.pdf`;
      await supabase.storage.from("biblioteca-estilo").upload(pathPdf, buffer, { contentType: "application/pdf" });
      pdfUrl = supabase.storage.from("biblioteca-estilo").getPublicUrl(pathPdf).data.publicUrl;

      if (imagenPrimeraPagina) {
        const pathImg = `${categoria}/${timestamp}_preview.png`;
        await supabase.storage.from("biblioteca-estilo").upload(pathImg, imagenPrimeraPagina, { contentType: "image/png" });
        imagenesUrls.push(supabase.storage.from("biblioteca-estilo").getPublicUrl(pathImg).data.publicUrl);
      }

      // Si el PDF no traia texto util (era un mockup visual, no un guion) y no escribiste nada,
      // que la IA describa el estilo a partir de la imagen renderizada de la pagina.
      if (!texto && !textoExtraido?.trim() && imagenPrimeraPagina) {
        textoPlano = await describirImagenesConIA([{ buffer: imagenPrimeraPagina, mime: "image/png" }], categoria) || null;
      }
    } else {
      const buffers: { buffer: Buffer; mime: string }[] = [];
      for (let i = 0; i < imagenesArchivos.length; i++) {
        const archivo = imagenesArchivos[i];
        const buffer = Buffer.from(await archivo.arrayBuffer());
        buffers.push({ buffer, mime: archivo.type });
        const ext = archivo.type.split("/")[1] || "jpg";
        const pathImg = `${categoria}/${timestamp}_${i}.${ext}`;
        await supabase.storage.from("biblioteca-estilo").upload(pathImg, buffer, { contentType: archivo.type });
        imagenesUrls.push(supabase.storage.from("biblioteca-estilo").getPublicUrl(pathImg).data.publicUrl);
      }

      // Subiste imagenes sin escribir texto: que la IA describa el formato/estilo por ti.
      if (!texto && buffers.length > 0) {
        textoPlano = await describirImagenesConIA(buffers, categoria) || null;
      }
    }

    const { data, error } = await supabase
      .from("biblioteca_estilo")
      .insert({
        categoria,
        titulo,
        texto_plano: textoPlano,
        imagenes_urls: imagenesUrls,
        pdf_url: pdfUrl,
        created_by: admin.email,
      })
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ referencia: data });
  } catch (err: any) {
    console.error("Error en POST /api/biblioteca-estilo:", err);
    return NextResponse.json({ error: err.message || "Error desconocido" }, { status: 500 });
  }
}
