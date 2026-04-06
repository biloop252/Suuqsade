'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { AppNotification, AppNotificationAudience } from '@/types/database';

export function useAppNotifications(
  userId: string | undefined,
  audience: AppNotificationAudience
) {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchAll = useCallback(async () => {
    if (!userId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('app_notifications')
      .select('*')
      .eq('recipient_id', userId)
      .eq('audience', audience)
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      console.error('app_notifications fetch', error);
      setItems([]);
    } else {
      setItems((data as AppNotification[]) ?? []);
    }
    setLoading(false);
  }, [userId, audience]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (!userId) return;

    const ch = supabase
      .channel(`app_notifications:${audience}:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'app_notifications',
          filter: `recipient_id=eq.${userId}`,
        },
        () => {
          fetchAll();
        }
      )
      .subscribe();

    channelRef.current = ch;
    return () => {
      ch.unsubscribe();
      channelRef.current = null;
    };
  }, [userId, audience, fetchAll]);

  const unreadCount = useMemo(() => items.filter((n) => !n.is_read).length, [items]);

  const markRead = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('app_notifications')
      .update({ is_read: true })
      .eq('id', id);
    if (error) {
      console.error('mark read', error);
      return;
    }
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  }, []);

  const markAllRead = useCallback(async () => {
    if (!userId) return;
    const { error } = await supabase
      .from('app_notifications')
      .update({ is_read: true })
      .eq('recipient_id', userId)
      .eq('audience', audience)
      .eq('is_read', false);
    if (error) {
      console.error('mark all read', error);
      return;
    }
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }, [userId, audience]);

  const removeOne = useCallback(async (id: string) => {
    const { error } = await supabase.from('app_notifications').delete().eq('id', id);
    if (error) {
      console.error('delete notification', error);
      return;
    }
    setItems((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return {
    items,
    loading,
    unreadCount,
    refetch: fetchAll,
    markRead,
    markAllRead,
    removeOne,
  };
}
