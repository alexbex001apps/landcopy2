import crypto from "crypto";
import { createServiceClient } from "@/lib/supabase/service";

const GRAPH_API_VERSION = "v21.0";

function normalizarHash(valor: string): string {
  return crypto.createHash("sha256").update(valor.trim().toLowerCase()).digest("hex");
}

export type MetaUserData = {
  email?: string;
  externalId?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
  fbp?: string;
  fbc?: string;
};

export type MetaCustomData = {
  value?: number;
  currency?: string;
  contentName?: string;
  [key: string]: any;
};

export type EmitirEventoParams = {
  eventName: string;
  eventId: string;
  eventSourceUrl?: string;
  userData: MetaUserData;
  customData?: MetaCustomData;
  referencia?: string;
};

function metaHabilitado(): boolean {
  return (
    process.env.META_TRACKING_ENABLED === "true" &&
    !!process.env.META_PIXEL_ID &&
    !!process.env.META_CAPI_ACCESS_TOKEN
  );
}

// Envia un evento a Meta via Conversions API. Es "best-effort": nunca lanza error
// hacia arriba, para que un fallo de Meta jamas bloquee el flujo real del usuario.
export async function emitirEventoMeta(params: EmitirEventoParams): Promise<void> {
  if (!metaHabilitado()) return;

  const supabase = createServiceClient();

  try {
    // Deduplicacion: si ya se envio este mismo evento (ej. webhook reintentado), no se reenvia.
    const { data: yaEnviado } = await supabase
      .from("meta_events_log")
      .select("id")
      .eq("event_id", params.eventId)
      .eq("status", "sent")
      .maybeSingle();

    if (yaEnviado) return;

    const pixelId = process.env.META_PIXEL_ID!;
    const accessToken = process.env.META_CAPI_ACCESS_TOKEN!;
    const testEventCode = process.env.META_TEST_EVENT_CODE;

    const user_data: Record<string, any> = {};
    if (params.userData.email) user_data.em = [normalizarHash(params.userData.email)];
    if (params.userData.externalId) user_data.external_id = [normalizarHash(params.userData.externalId)];
    if (params.userData.clientIpAddress) user_data.client_ip_address = params.userData.clientIpAddress;
    if (params.userData.clientUserAgent) user_data.client_user_agent = params.userData.clientUserAgent;
    if (params.userData.fbp) user_data.fbp = params.userData.fbp;
    if (params.userData.fbc) user_data.fbc = params.userData.fbc;

    const body: any = {
      data: [
        {
          event_name: params.eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_id: params.eventId,
          action_source: "website",
          event_source_url: params.eventSourceUrl || "https://socialred.app",
          user_data,
          custom_data: params.customData || {},
        },
      ],
    };
    if (testEventCode) body.test_event_code = testEventCode;

    const resp = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${pixelId}/events?access_token=${accessToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    const data = await resp.json();

    await supabase.from("meta_events_log").insert({
      event_id: params.eventId,
      event_name: params.eventName,
      source: "capi",
      status: resp.ok ? "sent" : "error",
      referencia: params.referencia || null,
      detalle: resp.ok ? null : JSON.stringify(data).slice(0, 500),
    });
  } catch (err: any) {
    try {
      await supabase.from("meta_events_log").insert({
        event_id: params.eventId,
        event_name: params.eventName,
        source: "capi",
        status: "error",
        referencia: params.referencia || null,
        detalle: String(err?.message || err).slice(0, 500),
      });
    } catch {}
  }
}

// Guarda el contexto de Meta Ads del usuario (cookies fbp/fbc, ip) para usarlo
// despues cuando llegue la confirmacion de pago via webhook.
export async function guardarContextoClick(
  userId: string,
  datos: { fbp?: string; fbc?: string; ip?: string; userAgent?: string }
) {
  try {
    const supabase = createServiceClient();
    await supabase.from("meta_click_context").upsert({
      user_id: userId,
      fbp: datos.fbp || null,
      fbc: datos.fbc || null,
      ip: datos.ip || null,
      user_agent: datos.userAgent || null,
      updated_at: new Date().toISOString(),
    });
  } catch {}
}

export async function obtenerContextoClick(userId: string) {
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("meta_click_context")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    return data;
  } catch {
    return null;
  }
}