import crypto from "crypto";
import { PaymentProvider, NormalizedWebhookEvent } from "./types";

const LS_API = "https://api.lemonsqueezy.com/v1";

function mapEventType(lsEventName: string): NormalizedWebhookEvent["type"] {
  const mapa: Record<string, NormalizedWebhookEvent["type"]> = {
    subscription_created: "subscription_created",
    subscription_updated: "subscription_updated",
    subscription_payment_success: "subscription_payment_success",
    subscription_payment_failed: "subscription_payment_failed",
    subscription_cancelled: "subscription_cancelled",
    subscription_expired: "subscription_expired",
    subscription_paused: "subscription_paused",
    subscription_unpaused: "subscription_unpaused",
    order_created: "order_created",
  };
  return mapa[lsEventName] || "unknown";
}

export class LemonSqueezyProvider implements PaymentProvider {
  name = "lemon_squeezy";

  private apiKey = process.env.LEMON_SQUEEZY_API_KEY!;
  private storeId = process.env.LEMON_SQUEEZY_STORE_ID!;
  private signingSecret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET!;

  private async crearCheckout(variantId: string, userId: string, userEmail: string): Promise<string> {
    const resp = await fetch(`${LS_API}/checkouts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/vnd.api+json",
        Accept: "application/vnd.api+json",
      },
      body: JSON.stringify({
        data: {
          type: "checkouts",
          attributes: {
            checkout_data: {
              email: userEmail,
              custom: { user_id: userId },
            },
          },
          relationships: {
            store: { data: { type: "stores", id: this.storeId } },
            variant: { data: { type: "variants", id: variantId } },
          },
        },
      }),
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data?.errors?.[0]?.detail || "Error creando checkout en Lemon Squeezy");
    return data.data.attributes.url as string;
  }

  async createSubscriptionCheckout(params: { userId: string; userEmail: string; variantId: string }) {
    const checkoutUrl = await this.crearCheckout(params.variantId, params.userId, params.userEmail);
    return { checkoutUrl };
  }

  async createTopupCheckout(params: { userId: string; userEmail: string; variantId: string }) {
    const checkoutUrl = await this.crearCheckout(params.variantId, params.userId, params.userEmail);
    return { checkoutUrl };
  }

  async getCustomerPortalUrl(customerId: string): Promise<string | null> {
    const resp = await fetch(`${LS_API}/customers/${customerId}`, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: "application/vnd.api+json",
      },
    });
    const data = await resp.json();
    if (!resp.ok) return null;
    return data?.data?.attributes?.urls?.customer_portal || null;
  }

  verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
    if (!signatureHeader) return false;
    const hmac = crypto.createHmac("sha256", this.signingSecret);
    const digest = Buffer.from(hmac.update(rawBody).digest("hex"), "utf8");
    const signature = Buffer.from(signatureHeader, "utf8");
    if (digest.length !== signature.length) return false;
    return crypto.timingSafeEqual(digest, signature);
  }

  parseWebhookEvent(rawBody: string): NormalizedWebhookEvent {
    const json = JSON.parse(rawBody);
    const lsEventName = json?.meta?.event_name || "unknown";
    const dataId = json?.data?.id;
    return {
      id: dataId ? `${lsEventName}:${dataId}` : crypto.randomUUID(),
      type: mapEventType(lsEventName),
      raw: json,
    };
  }
}

// Punto unico de entrada: hoy siempre Lemon Squeezy.
// Fase 2: aqui se elegiria Wompi segun el pais del usuario, sin tocar el resto de la app.
export function getPaymentProvider(): PaymentProvider {
  return new LemonSqueezyProvider();
}