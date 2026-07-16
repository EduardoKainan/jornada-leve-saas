'use client';

import { useEffect, useRef } from 'react';
import { getNextReminderDelay, type ReminderFrequency } from '@/lib/sprint3';

export function ReminderScheduler({ enabled, localTime, frequency }: { enabled: boolean; localTime: string; frequency: ReminderFrequency }) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!enabled || typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    let cancelled = false;
    const schedule = () => {
      timeoutRef.current = setTimeout(() => {
        if (cancelled) return;
        if (document.visibilityState === 'visible') new Notification('Hora do seu check-in 🌿', { body: 'Reserve um minuto para registrar como você está hoje.', icon: '/icon-192.png', tag: 'daily-checkin' });
        schedule();
      }, getNextReminderDelay(localTime, frequency));
    };
    schedule();
    return () => { cancelled = true; if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [enabled, frequency, localTime]);
  return null;
}