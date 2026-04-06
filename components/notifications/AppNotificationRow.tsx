'use client';

import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import type { AppNotification } from '@/types/database';
import { NotificationGlyph } from '@/lib/notifications/notification-icons';
import { resolveNotificationIcon } from '@/lib/notifications/resolve-icon';
import { severityBorderClass, severityRingClass, priorityBadgeClass } from '@/lib/notifications/severity-styles';

type Props = {
  n: AppNotification;
  compact?: boolean;
  showPriority?: boolean;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
};

function RowBody({
  n,
  compact,
  showPriority,
  iconName,
}: {
  n: AppNotification;
  compact?: boolean;
  showPriority?: boolean;
  iconName: string;
}) {
  return (
    <div className="flex min-w-0 flex-1 gap-3">
      <div
        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ring-2 ${severityRingClass(
          n.severity
        )}`}
      >
        <NotificationGlyph name={iconName} className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className={`text-sm font-semibold text-gray-900 ${compact ? 'line-clamp-1' : ''}`}>
            {n.title}
          </p>
          {showPriority && n.priority && (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${priorityBadgeClass(
                n.priority
              )}`}
            >
              {n.priority}
            </span>
          )}
          {!n.is_read && (
            <span className="h-2 w-2 flex-shrink-0 rounded-full bg-primary" title="Unread" />
          )}
        </div>
        <p className={`mt-0.5 text-sm text-gray-600 ${compact ? 'line-clamp-2' : 'line-clamp-3'}`}>
          {n.body}
        </p>
        {!compact && n.action_url && (
          <p className="mt-1 text-xs font-medium text-primary">Open linked page →</p>
        )}
      </div>
    </div>
  );
}

export default function AppNotificationRow({
  n,
  compact,
  showPriority,
  onMarkRead,
  onDelete,
}: Props) {
  const iconName = resolveNotificationIcon(n.audience, n.event_key);

  const shellClass = `flex gap-3 rounded-lg border border-gray-100 border-l-4 bg-white p-3 shadow-sm transition hover:bg-gray-50/80 ${severityBorderClass(
    n.severity
  )} ${!n.is_read ? 'bg-orange-50/40' : ''}`;

  const onActivate = () => {
    if (!n.is_read) onMarkRead(n.id);
  };

  const deleteBtn = (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onDelete(n.id);
      }}
      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-gray-400 hover:bg-red-50 hover:text-red-600"
      aria-label="Delete notification"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );

  if (n.action_url) {
    return (
      <div className={`${shellClass} items-start`}>
        <Link href={n.action_url} className="min-w-0 flex-1" onClick={onActivate}>
          <RowBody n={n} compact={compact} showPriority={showPriority} iconName={iconName} />
        </Link>
        {deleteBtn}
      </div>
    );
  }

  return (
    <div
      className={`${shellClass} cursor-pointer items-start`}
      role="button"
      tabIndex={0}
      onClick={onActivate}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onActivate();
        }
      }}
    >
      <RowBody n={n} compact={compact} showPriority={showPriority} iconName={iconName} />
      {deleteBtn}
    </div>
  );
}
