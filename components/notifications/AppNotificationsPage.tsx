'use client';

import { useMemo, useState } from 'react';
import { useAppNotifications } from '@/hooks/useAppNotifications';
import type { AppNotificationAudience } from '@/types/database';
import AppNotificationGroupedList from './AppNotificationGroupedList';

const CUSTOMER_TABS: { id: string; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'orders', label: 'Orders' },
  { id: 'payments', label: 'Payments' },
  { id: 'account', label: 'Account' },
  { id: 'wishlist', label: 'Wishlist' },
  { id: 'promotions', label: 'Promotions' },
  { id: 'support', label: 'Support' },
];

const ADMIN_TABS: { id: string; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'orders', label: 'Orders' },
  { id: 'customers', label: 'Customers' },
  { id: 'products', label: 'Products' },
  { id: 'payments', label: 'Payments' },
  { id: 'system', label: 'System' },
  { id: 'reports', label: 'Reports' },
];

type Props = {
  userId: string | undefined;
  audience: AppNotificationAudience;
  title: string;
  subtitle?: string;
};

export default function AppNotificationsPage({
  userId,
  audience,
  title,
  subtitle,
}: Props) {
  const [filter, setFilter] = useState('all');
  const { items, loading, unreadCount, markRead, markAllRead, removeOne } = useAppNotifications(
    userId,
    audience
  );

  const tabs = audience === 'customer' ? CUSTOMER_TABS : ADMIN_TABS;

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((n) => n.category === filter);
  }, [items, filter]);

  if (!userId) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-600">
        Sign in to view notifications.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="mt-1 text-gray-600">{subtitle}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {unreadCount > 0 && (
            <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              {unreadCount} unread
            </span>
          )}
          <button
            type="button"
            disabled={unreadCount === 0 || loading}
            onClick={() => markAllRead()}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Mark all as read
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setFilter(t.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              filter === t.id
                ? 'bg-primary text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <AppNotificationGroupedList
          notifications={filtered}
          showPriority={audience === 'admin'}
          emptyHint="No notifications in this category."
          onMarkRead={markRead}
          onDelete={removeOne}
        />
      )}
    </div>
  );
}
