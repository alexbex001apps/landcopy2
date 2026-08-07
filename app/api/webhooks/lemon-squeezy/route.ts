import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getPaymentProvider } from "@/lib/payments/lemon-squeezy";
import { otorgarCredito } from "@/lib/credits";

// Convierte el status de Lemon Squeezy a nuestro status interno.
function mapearStatus(lsStatus: string): string {
  const mapa: Record<string, string> = {
    on_trial: "active",
    active: "active",
    paused: "paused",
    past_due: "past_due",
    unpaid: "past_due",
    cancelled: "cancelled",
    expired: "expired",
  };
  return mapa[lsStatus] || lsStatus;
}

async function procesarSubscriptionUpsert(supabase: any, raw: any, esNueva: boolean) {
  const attrs = raw.data.attributes;
  const lsSubscriptionId = String(raw.data.id);
  const userId = raw.meta?.custom_data?.user_id;
  if (!userId) return;

  const { data: plan } = await supabase
    .from("plans")
    .select("*")
    .eq("ls_variant_id", String(attrs.variant_id))
    .maybeSingle();

  const filaSuscripcion = {
    user_id: userId,
    plan_id: plan?.id || null,
    status: mapearStatus(attrs.status),
    ls_subscription_id: lsSubscriptionId,
    ls_customer_id: String(attrs.customer_id),
    current_period_start: attrs.renews_at ? new Date(attrs.created_at).toISOString() : null,
    current_period_end: attrs.renews_at || attrs.ends_at || null,
    cancel_at_period_end: !!attrs.cancelled,
    updated_at: new Date().toISOString(),
  };

  const { data: existente } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("ls_subscription_id", lsSubscriptionId)
    .maybeSingle();

  if (existente) {
    await supabase.from("subscriptions").update(filaSuscripcion).eq("id", existente.id);
  } else {
    await supabase.from("subscriptions").insert(filaSuscripcion);
  }

  // Solo se otorgan creditos iniciales la primera vez que se crea la suscripcion.
  if (esNueva && !existente && plan) {
    await otorgarCredito(userId, plan.imagenes_incluidas, "grant", "subscription_initial", lsSubscriptionId);
  }
}

async function procesarRenovacionPago(supabase: any, raw: any) {
  const lsSubscriptionId = String(raw.data.attributes.subscription_id);

  const { data: suscripcion } = await supabase
    .from("subscriptions")
    .select("*, plan:plans(*)")
    .eq("ls_subscription_id", lsSubscriptionId)
    .maybeSingle();

  if (!suscripcion || !suscripcion.plan) return;

  await otorgarCredito(
    suscripcion.user_id,
    suscripcion.plan.imagenes_incluidas,
    "grant",
    "subscription_renewal",
    lsSubscriptionId
  );
}

async function procesarCambioEstado(supabase: any, raw: any, nuevoStatus: string) {
  const lsSubscriptionId = String(raw.data.id);
  await supabase
    .from("subscriptions")
    .update({ status: nuevoStatus, updated_at: new Date().toISOString() })
    .eq("ls_subscription_id", lsSubscriptionId);
}

async function procesarOrdenCreada(supabase: any, raw: any) {
  const attrs = raw.data.attributes;
  const variantId = String(attrs.first_order_item?.variant_id || "");
  const userId = raw.meta?.custom_data?.user_id;
  if (!userId || !variantId) return;

  const { data: pack } = await supabase
    .from("topup_packs")
    .select("*")
    .eq("ls_variant_id", variantId)
    .maybeSingle();

  // Si el variant_id no corresponde a un pack de imagenes, es una orden de suscripcion normal: se ignora aqui
  // (la suscripcion se maneja via subscription_created).
  if (!pack) return;

  await otorgarCredito(userId, pack.imagenes, "purchase", "topup_purchase", String(raw.data.id));

  await supabase.from("orders").insert({
    user_id: userId,
    ls_order_id: String(raw.data.id),
    tipo: "topup",
    topup_pack_id: pack.id,
    monto_centavos: attrs.total,
    status: "paid",
    imagenes_otorgadas: pack.imagenes,
  });
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-signature");

  const provider = getPaymentProvider();

  if (!provider.verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Firma invalida" }, { status: 401 });
  }

  const evento = provider.parseWebhookEvent(rawBody);
  const supabase = createServiceClient();

  // Idempotencia: si ya procesamos este evento, no lo repetimos.
  const { error: errorInsert } = await supabase
    .from("webhook_events")
    .insert({ id: evento.id, tipo: evento.type, payload: evento.raw });

  if (errorInsert) {
    // Codigo 23505 = llave duplicada -> evento ya procesado antes, lo ignoramos sin error.
    if (errorInsert.code === "23505") {
      return NextResponse.json({ ok: true, duplicado: true });
    }
    return NextResponse.json({ error: errorInsert.message }, { status: 500 });
  }

  try {
    switch (evento.type) {
      case "subscription_created":
        await procesarSubscriptionUpsert(supabase, evento.raw, true);
        break;
      case "subscription_updated":
        await procesarSubscriptionUpsert(supabase, evento.raw, false);
        break;
      case "subscription_payment_success":
        await procesarRenovacionPago(supabase, evento.raw);
        break;
      case "subscription_payment_failed":
        await procesarCambioEstado(supabase, evento.raw, "past_due");
        break;
      case "subscription_cancelled":
        await procesarCambioEstado(supabase, evento.raw, "cancelled");
        break;
      case "subscription_expired":
        await procesarCambioEstado(supabase, evento.raw, "expired");
        break;
      case "subscription_paused":
        await procesarCambioEstado(supabase, evento.raw, "paused");
        break;
      case "subscription_unpaused":
        await procesarCambioEstado(supabase, evento.raw, "active");
        break;
      case "order_created":
        await procesarOrdenCreada(supabase, evento.raw);
        break;
      default:
        break;
    }
  } catch (err: any) {
    console.error("Error procesando webhook:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}