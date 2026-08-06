import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { esAdminBibliotecaEstilo } from "@/lib/bibliotecaEstilo/admin";

// Chequeo liviano para que el frontend sepa si debe mostrar el enlace
// a la Biblioteca de Estilo, sin exponer la lista de emails admin al navegador.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return NextResponse.json({ esAdmin: esAdminBibliotecaEstilo(user?.email) });
}
