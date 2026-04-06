'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { useAppNotifications } from '@/hooks/useAppNotifications';
import type { AppNotificationAudience } from '@/types/database';
import AppNotificationGroupedList from './AppNotificationGroupedList';

type Props = {
  userId: string | undefined;
  audience: AppNotificationAudience;
  centerHref: string;
  /** e.g. "Notifications" vs "Admin alerts" */
  panelTitle?: string;
  showPriority?: boolean;
};

export default function AppNotificationBell({
  userId,
  audience,
  centerHref,
  panelTitle = 'Notifications',
  showPriority,
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const { items, unreadCount, markRead, markAllRead, removeOne } = useAppNotifications(
    userId,
    audience
  );

  const preview = items.slice(0, 8);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) {
      document.addEventListener('mousedown', onDocClick);
      return () => document.removeEventListener('mousedown', onDocClick);
    }
  }, [open]);

  if (!userId) return null;

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-secondary px-1 text-[10px] font-bold text-gray-900">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-[100] mt-2 w-[min(100vw-1.5rem,22rem)] rounded-xl border border-gray-200 bg-white shadow-xl sm:w-96">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-900">{panelTitle}</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllRead()}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>
          <div className="max-h-[min(70vh,24rem)] overflow-y-auto p-3">
            <AppNotificationGroupedList
              notifications={preview}
              compact
              showPriority={showPriority}
              emptyHint="You are all caught up."
              onMarkRead={markRead}
              onDelete={removeOne}
            />
          </div>
          <div className="border-t border-gray-100 px-4 py-2 text-center">
            <Link
              href={centerHref}
              className="text-sm font-medium text-primary hover:underline"
              onClick={() => setOpen(false)}
            >
              View notification center
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
