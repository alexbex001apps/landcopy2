import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPaymentProvider } from "@/lib/payments/lemon-squeezy";

// Crea el link de checkout de Lemon Squeezy para comprar un pack de imagenes extra (pago unico).
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.email) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { packSlug } = await req.json();
    if (!packSlug) {
      return NextResponse.json({ error: "Falta el pack" }, { status: 400 });
    }

    const { data: pack } = await supabase
      .from("topup_packs")
      .select("*")
      .eq("slug", packSlug)
      .eq("activo", true)
      .maybeSingle();

    if (!pack) {
      return NextResponse.json({ error: "Pack no encontrado" }, { status: 404 });
    }

    if (!pack.ls_variant_id) {
      return NextResponse.json(
        { error: "Este pack aun no tiene configurado su variant_id de Lemon Squeezy. Faltan los datos de la cuenta." },
        { status: 503 }
      );
    }

    const provider = getPaymentProvider();
    const { checkoutUrl } = await provider.createTopupCheckout({
      userId: user.id,
      userEmail: user.email,
      variantId: pack.ls_variant_id,
    });

    return NextResponse.json({ checkoutUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}