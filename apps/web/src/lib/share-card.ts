import { calculateCheckinStreak } from './sprint3.ts';

export type WeightRecord = {
  weight_kg: number | string;
  measured_at: string;
};

export type ShareCardStats = {
  weightChangeKg: number | null;
  trackingDays: number;
  streak: number;
  totalCheckins: number;
  totalReports: number;
};

type ShareCardInput = {
  firstWeight: WeightRecord | null;
  latestWeight: WeightRecord | null;
  checkinDates: readonly string[];
  totalCheckins: number;
  totalReports: number;
  now?: Date;
};

const DAY_IN_MS = 86_400_000;

export function buildShareCardStats({
  firstWeight,
  latestWeight,
  checkinDates,
  totalCheckins,
  totalReports,
  now = new Date(),
}: ShareCardInput): ShareCardStats {
  const hasWeightPeriod = Boolean(firstWeight && latestWeight);
  const weightChangeKg = hasWeightPeriod
    ? Math.round((Number(latestWeight!.weight_kg) - Number(firstWeight!.weight_kg)) * 10) / 10
    : null;
  const trackingDays = hasWeightPeriod
    ? Math.max(1, Math.floor((Date.parse(latestWeight!.measured_at) - Date.parse(firstWeight!.measured_at)) / DAY_IN_MS) + 1)
    : 0;

  return {
    weightChangeKg,
    trackingDays,
    streak: calculateCheckinStreak(checkinDates, now),
    totalCheckins,
    totalReports,
  };
}

export function formatWeightChange(value: number | null): string {
  if (value === null) return '—';
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg`;
}
