import { createHmac, timingSafeEqual } from 'node:crypto';

export type PlanCode = 'trial' | 'monthly' | 'annual';

export type PlanDefinition = {
  code: PlanCode;
  name: string;
  description: string;
  priceCents: number;
  intervalDays: number;
  recommended: boolean;
  badge?: string;
  features: readonly string[];
};

const sharedFeatures = [
  'Check-in diário e acompanhamento de peso',
  'Medidas e gráficos de evolução',
  'Calendário e lembretes personalizados',
] as const;

export const PLANS: readonly PlanDefinition[] = [
  {
    code: 'trial',
    name: 'Gratuito',
    description: 'Conheça a Jornada Leve por 7 dias.',
    priceCents: 0,
    intervalDays: 7,
    recommended: false,
    features: sharedFeatures,
  },
  {
    code: 'monthly',
    name: 'Mensal',
    description: 'Flexibilidade para cuidar de você mês a mês.',
    priceCents: 2_990,
    intervalDays: 30,
    recommended: false,
    features: [...sharedFeatures, 'Renovação automática a cada 30 dias'],
  },
  {
    code: 'annual',
    name: 'Anual',
    description: 'O melhor valor para uma jornada consistente.',
    priceCents: 24_990,
    intervalDays: 365,
    recommended: true,
    badge: 'Economize 2 meses',
    features: [...sharedFeatures, 'Renovação automática anual', 'Economia de R$ 108,90 por ano'],
  },
];

export type SubscriptionAccess = {
  status: string;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
};

export function trialDaysRemaining(trialEndsAt: string | null, now = new Date()): number {
  if (!trialEndsAt) return 0;
  const milliseconds = new Date(trialEndsAt).getTime() - now.getTime();
  if (!Number.isFinite(milliseconds) || milliseconds <= 0) return 0;
  return Math.ceil(milliseconds / 86_400_000);
}

export function hasPlanAccess(subscription: SubscriptionAccess | null, now = new Date()): boolean {
  if (!subscription) return false;
  if (subscription.status === 'active' || subscription.status === 'grace_period') return true;
  if (subscription.status === 'canceled_end_of_period' && subscription.currentPeriodEnd) {
    return new Date(subscription.currentPeriodEnd).getTime() > now.getTime();
  }
  return subscription.status === 'trialing' && trialDaysRemaining(subscription.trialEndsAt, now) > 0;
}

export function dunningSchedule(failedAt = new Date()): Date[] {
  return [3, 7, 14].map((days) => new Date(failedAt.getTime() + days * 86_400_000));
}

function secureEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function verifyEfiSignature(rawBody: string, providedSignature: string | null, secret: string): boolean {
  if (!providedSignature || !secret) return false;
  if (secureEqual(providedSignature, secret)) return true;
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  const candidate = providedSignature.replace(/^sha256=/i, '').trim();
  return secureEqual(candidate, expected);
}

type UnknownRecord = Record<string, unknown>;

function record(value: unknown): UnknownRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as UnknownRecord : {};
}

function text(value: unknown): string | null {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : null;
}

function amount(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : null;
}

export type NormalizedEfiWebhook = {
  eventId: string;
  type: string;
  subscriptionId: string | null;
  chargeId: string | null;
  amountCents: number | null;
  paymentMethod: string | null;
  cardLast4: string | null;
};

export function normalizeEfiWebhook(payload: unknown): NormalizedEfiWebhook {
  const root = record(payload);
  const data = record(root.data ?? root.notification ?? root);
  const card = record(data.card ?? record(data.payment).card);
  const type = text(root.event ?? root.type ?? root.notification_type ?? data.event) ?? 'unknown';
  const subscriptionId = text(data.subscription_id ?? data.subscriptionId ?? root.subscription_id);
  const chargeId = text(data.charge_id ?? data.chargeId ?? root.charge_id);
  const fallbackId = [subscriptionId, chargeId, type].filter(Boolean).join(':');
  return {
    eventId: text(root.id ?? root.event_id ?? root.notification_id) ?? fallbackId,
    type,
    subscriptionId,
    chargeId,
    amountCents: amount(data.amount ?? data.value ?? record(data.charge).amount),
    paymentMethod: text(data.payment_method ?? record(data.payment).method),
    cardLast4: text(card.last_four_digits ?? card.last4 ?? card.last_digits),
  };
}
