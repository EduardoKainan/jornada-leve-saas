import { z } from 'zod';

export type ReminderFrequency = 'daily' | 'weekdays';

export type CalendarDay = {
  date: Date;
  dateKey: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isFuture: boolean;
  hasCheckin: boolean;
  weightKg: number | null;
};

export const accountProfileSchema = z.object({
  displayName: z.string().trim().min(2, 'Informe seu nome.').max(80, 'Use no máximo 80 caracteres.'),
  heightCm: z.coerce.number().min(120, 'A altura deve ser de pelo menos 120 cm.').max(230, 'A altura deve ser de no máximo 230 cm.').multipleOf(0.1).nullable(),
});

export const passwordSchema = z.object({
  password: z.string().min(8, 'A nova senha deve ter pelo menos 8 caracteres.').max(72, 'A senha deve ter no máximo 72 caracteres.'),
});

export const notificationPreferenceSchema = z.object({
  enabled: z.boolean(),
  localTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Informe um horário válido.'),
  frequency: z.enum(['daily', 'weekdays']),
  timezone: z.string().trim().min(1).max(80),
});

function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function buildCalendarDays(
  year: number,
  month: number,
  checkinDates: ReadonlySet<string>,
  weightsByDate: ReadonlyMap<string, number>,
  now = new Date(),
): CalendarDay[] {
  const first = new Date(year, month, 1, 12);
  const mondayOffset = (first.getDay() + 6) % 7;
  const start = addDays(first, -mondayOffset);
  const last = new Date(year, month + 1, 0, 12);
  const sundayOffset = (7 - last.getDay()) % 7;
  const end = addDays(last, sundayOffset);
  const todayKey = dateKey(now);
  const days: CalendarDay[] = [];
  for (let current = start; current <= end; current = addDays(current, 1)) {
    const key = dateKey(current);
    days.push({
      date: new Date(current),
      dateKey: key,
      dayNumber: current.getDate(),
      isCurrentMonth: current.getMonth() === month,
      isFuture: key > todayKey,
      hasCheckin: checkinDates.has(key),
      weightKg: weightsByDate.get(key) ?? null,
    });
  }
  return days;
}

export function calculateCheckinStreak(checkinDates: readonly string[], now = new Date()): number {
  const dates = new Set(checkinDates);
  let cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
  if (!dates.has(dateKey(cursor))) cursor = addDays(cursor, -1);
  let streak = 0;
  while (dates.has(dateKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function getNextReminderDelay(localTime: string, frequency: ReminderFrequency, now = new Date()): number {
  const [hourText, minuteText] = localTime.split(':');
  const hour = Number(hourText);
  const minute = Number(minuteText);
  let scheduled = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
  if (scheduled <= now) scheduled = addDays(scheduled, 1);
  if (frequency === 'weekdays') {
    while (scheduled.getDay() === 0 || scheduled.getDay() === 6) scheduled = addDays(scheduled, 1);
  }
  return scheduled.getTime() - now.getTime();
}
