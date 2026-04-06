import { ADMIN_NOTIFICATION_TEMPLATES } from './admin-templates';
import { CUSTOMER_NOTIFICATION_TEMPLATES } from './customer-templates';
import type { AppNotificationAudience } from '@/types/database';

export function resolveNotificationIcon(
  audience: AppNotificationAudience,
  eventKey: string
): string {
  if (audience === 'customer') {
    const t = CUSTOMER_NOTIFICATION_TEMPLATES[eventKey as keyof typeof CUSTOMER_NOTIFICATION_TEMPLATES];
    return t?.icon ?? 'Bell';
  }
  const t = ADMIN_NOTIFICATION_TEMPLATES[eventKey as keyof typeof ADMIN_NOTIFICATION_TEMPLATES];
  return t?.icon ?? 'Bell';
}
