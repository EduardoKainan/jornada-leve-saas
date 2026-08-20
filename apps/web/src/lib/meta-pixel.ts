'use client';

type MetaPixelEvent = 'CompleteRegistration' | 'InitiateCheckout' | 'Purchase' | 'PageView';

type MetaPixelPayload = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    fbq?: (command: 'track', event: MetaPixelEvent, payload?: MetaPixelPayload) => void;
  }
}

export function trackMetaEvent(event: MetaPixelEvent, payload?: MetaPixelPayload) {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;
  window.fbq('track', event, payload);
}

export function trackCompleteRegistration(method = 'email') {
  trackMetaEvent('CompleteRegistration', {
    content_name: 'Cadastro Jornada Leve',
    status: true,
    registration_method: method,
  });
}

export function trackInitiateCheckout(input: {
  planCode: string;
  planName: string;
  valueCents: number;
}) {
  trackMetaEvent('InitiateCheckout', {
    content_name: `Plano ${input.planName}`,
    content_category: 'subscription',
    content_ids: [input.planCode].join(','),
    currency: 'BRL',
    value: input.valueCents / 100,
  });
}

export function trackPurchase(input: {
  planCode: string;
  planName: string;
  valueCents: number;
  orderId?: string | null;
}) {
  trackMetaEvent('Purchase', {
    content_name: `Plano ${input.planName}`,
    content_category: 'subscription',
    content_ids: [input.planCode].join(','),
    currency: 'BRL',
    value: input.valueCents / 100,
    order_id: input.orderId,
  });
}
