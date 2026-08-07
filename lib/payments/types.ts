// Evento de webhook normalizado — sin importar si viene de Lemon Squeezy o (en Fase 2) de Wompi,
// el resto de la app siempre trabaja con esta misma forma.
export type NormalizedWebhookEvent = {
  id: string;
  type:
    | "subscription_created"
    | "subscription_updated"
    | "subscription_payment_success"
    | "subscription_payment_failed"
    | "subscription_cancelled"
    | "subscription_expired"
    | "subscription_paused"
    | "subscription_unpaused"
    | "order_created"
    | "unknown";
  raw: any;
};

// Contrato que cualquier pasarela de pagos debe cumplir.
// Lemon Squeezy lo implementa ahora; Wompi lo implementara en Fase 2 sin tocar el resto de la app.
export interface PaymentProvider {
  name: string;

  createSubscriptionCheckout(params: {
    userId: string;
    userEmail: string;
    variantId: string;
  }): Promise<{ checkoutUrl: string }>;

  createTopupCheckout(params: {
    userId: string;
    userEmail: string;
    variantId: string;
  }): Promise<{ checkoutUrl: string }>;

  getCustomerPortalUrl(customerId: string): Promise<string | null>;

  verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean;

  parseWebhookEvent(rawBody: string): NormalizedWebhookEvent;
}