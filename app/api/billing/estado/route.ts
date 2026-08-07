import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { obtenerSaldo } from "@/lib/credits";

// Devuelve el plan actual, el estado de la suscripcion, y el saldo de imagenes del usuario logueado.
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { data: suscripcion } = await supabase
      .from("subscriptions")
      .select("*, plan:plans(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const saldo = await obtenerSaldo(user.id);

    return NextResponse.json({
      suscripcion: suscripcion || null,
      saldo,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}