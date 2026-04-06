'use client';

import type { AppNotification } from '@/types/database';
import { groupNotificationsByRelativeDate } from '@/lib/notifications/group-by-date';
import AppNotificationRow from './AppNotificationRow';

type Props = {
  notifications: AppNotification[];
  compact?: boolean;
  showPriority?: boolean;
  emptyHint?: string;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
};

export default function AppNotificationGroupedList({
  notifications,
  compact,
  showPriority,
  emptyHint = 'No notifications yet.',
  onMarkRead,
  onDelete,
}: Props) {
  if (!notifications.length) {
    return (
      <div className="py-10 text-center text-sm text-gray-500">
        {emptyHint}
      </div>
    );
  }

  const groups = groupNotificationsByRelativeDate(notifications);

  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <div key={g.label}>
          <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
            {g.label}
          </p>
          <div className="space-y-2">
            {g.items.map((n) => (
              <AppNotificationRow
                key={n.id}
                n={n}
                compact={compact}
                showPriority={showPriority}
                onMarkRead={onMarkRead}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
