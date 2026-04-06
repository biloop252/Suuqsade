import { createServiceRoleClient } from '@/lib/supabase-server';
import { ADMIN_NOTIFICATION_TEMPLATES, type AdminEventKey } from './admin-templates';
import { CUSTOMER_NOTIFICATION_TEMPLATES, type CustomerEventKey } from './customer-templates';
import { interpolateTemplate } from './interpolate';
import type { InsertAppNotificationInput } from './types';

const ADMIN_ROLES = ['admin', 'super_admin', 'staff'] as const;

export async function insertAppNotification(row: InsertAppNotificationInput) {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from('app_notifications').insert({
    recipient_id: row.recipient_id,
    audience: row.audience,
    category: row.category,
    event_key: row.event_key,
    title: row.title,
    body: row.body,
    severity: row.severity,
    priority: row.priority ?? null,
    metadata: row.metadata ?? {},
    channels: row.channels ?? ['in_app'],
    action_url: row.action_url ?? null,
  });
  if (error) throw error;
}

export async function notifyCustomer(
  recipientId: string,
  eventKey: CustomerEventKey,
  options?: {
    title?: string;
    body?: string;
    metadata?: Record<string, unknown>;
    action_url?: string | null;
  }
) {
  const t = CUSTOMER_NOTIFICATION_TEMPLATES[eventKey];
  if (!t) throw new Error(`Unknown customer notification key: ${String(eventKey)}`);
  const meta = options?.metadata ?? {};
  await insertAppNotification({
    recipient_id: recipientId,
    audience: 'customer',
    category: t.category,
    event_key: eventKey,
    title: options?.title ?? interpolateTemplate(t.title, meta),
    body: options?.body ?? interpolateTemplate(t.description, meta),
    severity: t.severity,
    priority: null,
    metadata: meta,
    channels: t.channels,
    action_url: options?.action_url,
  });
}

export async function notifyAdminUser(
  adminProfileId: string,
  eventKey: AdminEventKey,
  options?: {
    title?: string;
    body?: string;
    metadata?: Record<string, unknown>;
    action_url?: string | null;
  }
) {
  const t = ADMIN_NOTIFICATION_TEMPLATES[eventKey];
  if (!t) throw new Error(`Unknown admin notification key: ${String(eventKey)}`);
  const meta = options?.metadata ?? {};
  await insertAppNotification({
    recipient_id: adminProfileId,
    audience: 'admin',
    category: t.category,
    event_key: eventKey,
    title: options?.title ?? interpolateTemplate(t.title, meta),
    body: options?.body ?? interpolateTemplate(t.description, meta),
    severity: t.severity,
    priority: t.priority,
    metadata: meta,
    channels: t.channels,
    action_url: options?.action_url,
  });
}

/** Insert the same admin notification for every admin, super_admin, and staff profile. */
export async function notifyAllAdmins(
  eventKey: AdminEventKey,
  options?: {
    title?: string;
    body?: string;
    metadata?: Record<string, unknown>;
    action_url?: string | null;
  }
) {
  const supabase = createServiceRoleClient();
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id')
    .in('role', [...ADMIN_ROLES])
    .eq('is_active', true);

  if (error) throw error;
  const ids = (profiles ?? []).map((p) => p.id as string);
  if (ids.length === 0) {
    console.warn(
      '[app_notifications] notifyAllAdmins: no active admin/super_admin/staff profiles found; admin alerts skipped.'
    );
  }
  await Promise.all(ids.map((id) => notifyAdminUser(id, eventKey, options)));
}

/** Customer + admin alerts when an order is placed (COD checkout, API, or paid webhook). */
export async function dispatchOrderPlacedNotifications(userId: string, orderNumber: string) {
  await notifyCustomer(userId, 'order.placed_successfully', {
    metadata: { orderNumber },
    action_url: '/profile?tab=all-orders',
  });
  await notifyAllAdmins('admin.order.new_placed', {
    metadata: { orderNumber },
    action_url: '/admin/orders',
  });
}
