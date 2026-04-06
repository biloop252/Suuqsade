import type { AppNotification } from '@/types/database';

export type DateGroupLabel = 'Today' | 'Yesterday' | 'Earlier';

export function groupNotificationsByRelativeDate(
  items: AppNotification[]
): { label: DateGroupLabel; items: AppNotification[] }[] {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  const today: AppNotification[] = [];
  const yesterday: AppNotification[] = [];
  const earlier: AppNotification[] = [];

  for (const n of items) {
    const d = new Date(n.created_at);
    if (d >= startOfToday) today.push(n);
    else if (d >= startOfYesterday) yesterday.push(n);
    else earlier.push(n);
  }

  const out: { label: DateGroupLabel; items: AppNotification[] }[] = [];
  if (today.length) out.push({ label: 'Today', items: today });
  if (yesterday.length) out.push({ label: 'Yesterday', items: yesterday });
  if (earlier.length) out.push({ label: 'Earlier', items: earlier });
  return out;
}
