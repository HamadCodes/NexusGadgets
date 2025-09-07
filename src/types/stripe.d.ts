// src/types/stripe.d.ts
import '@stripe/stripe-js';

declare module 'stripe' {
  interface PaymentIntent {
    id: string;
    client_secret: string;
    amount: number;
    currency: string;
    status: string;
    metadata: Record<string, string>;
  }

  interface StripeConfig {
    apiVersion: string;
  }

  class Stripe {
    constructor(apiKey: string, config?: StripeConfig);
    paymentIntents: {
      create(params: {
        amount: number;
        currency: string;
        automatic_payment_methods?: { enabled: boolean };
        metadata?: Record<string, string>;
      }): Promise<PaymentIntent>;
    };
    webhooks: {
      constructEvent(
        payload: string,
        header: string,
        secret: string
      );
    };
  }
}