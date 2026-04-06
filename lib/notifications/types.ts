import type {
  AppAdminNotificationPriority,
  AppNotificationAudience,
  AppNotificationSeverity,
} from '@/types/database';

export type CustomerCategory =
  | 'orders'
  | 'payments'
  | 'account'
  | 'wishlist'
  | 'promotions'
  | 'support';

export type AdminCategory =
  | 'orders'
  | 'customers'
  | 'products'
  | 'payments'
  | 'system'
  | 'reports';

export type CustomerChannel = 'in_app' | 'push' | 'email' | 'sms';
export type AdminChannel = 'dashboard' | 'email' | 'sms';

export interface CustomerTemplateDef {
  category: CustomerCategory;
  title: string;
  description: string;
  icon: string;
  severity: AppNotificationSeverity;
  channels: CustomerChannel[];
}

export interface AdminTemplateDef {
  category: AdminCategory;
  title: string;
  description: string;
  icon: string;
  severity: AppNotificationSeverity;
  priority: AppAdminNotificationPriority;
  channels: AdminChannel[];
}

export type InsertAppNotificationInput = {
  recipient_id: string;
  audience: AppNotificationAudience;
  category: string;
  event_key: string;
  title: string;
  body: string;
  severity: AppNotificationSeverity;
  priority?: AppAdminNotificationPriority | null;
  metadata?: Record<string, unknown>;
  channels?: unknown;
  action_url?: string | null;
};
