import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPaymentProvider } from "@/lib/payments/lemon-squeezy";
import { emitirEventoMeta, guardarContextoClick } from "@/lib/meta/events";

// Crea el link de checkout de Lemon Squeezy para suscribirse a un plan.
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.email) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { planSlug } = await req.json();
    if (!planSlug) {
      return NextResponse.json({ error: "Falta el plan" }, { status: 400 });
    }

    const { data: plan } = await supabase
      .from("plans")
      .select("*")
      .eq("slug", planSlug)
      .eq("activo", true)
      .maybeSingle();

    if (!plan) {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });
    }

    if (!plan.ls_variant_id) {
      return NextResponse.json(
        { error: "Este plan aun no tiene configurado su variant_id de Lemon Squeezy. Faltan los datos de la cuenta." },
        { status: 503 }
      );
    }

    const fbp = req.cookies.get("_fbp")?.value;
    const fbc = req.cookies.get("_fbc")?.value;
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const userAgent = req.headers.get("user-agent") || undefined;

    await guardarContextoClick(user.id, { fbp, fbc, ip, userAgent });

    const provider = getPaymentProvider();
    const { checkoutUrl } = await provider.createSubscriptionCheckout({
      userId: user.id,
      userEmail: user.email,
      variantId: plan.ls_variant_id,
    });

    await emitirEventoMeta({
      eventName: "InitiateCheckout",
      eventId: randomUUID(),
      eventSourceUrl: req.headers.get("referer") || undefined,
      userData: {
        email: user.email,
        externalId: user.id,
        clientIpAddress: ip,
        clientUserAgent: userAgent,
        fbp,
        fbc,
      },
      customData: { contentName: planSlug },
      referencia: `checkout_suscripcion:${planSlug}:${user.id}`,
    });

    return NextResponse.json({ checkoutUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}