'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { SupportNotification } from '@/types/database';
import { Bell, X, CheckCircle, AlertCircle, MessageSquare, Clock } from 'lucide-react';

export default function NotificationCenter() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<SupportNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      setupRealtimeSubscription();
    }

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('support_notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.is_read).length || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!user) return;

    // Subscribe to support ticket updates
    subscriptionRef.current = supabase
      .channel('support_notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_tickets',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          handleTicketUpdate(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `ticket_id=in.(${getUserTicketIds()})`
        },
        (payload) => {
          handleNewMessage(payload);
        }
      )
      .subscribe();
  };

  const getUserTicketIds = () => {
    // This would need to be implemented to get user's ticket IDs
    // For now, we'll use a simple approach
    return '1'; // Placeholder
  };

  const handleTicketUpdate = (payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    if (eventType === 'UPDATE') {
      // Check if status changed
      if (oldRecord.status !== newRecord.status) {
        createNotification({
          type: 'status_change',
          title: 'Ticket Status Updated',
          message: `Your ticket ${newRecord.ticket_number} status changed to ${newRecord.status.replace('_', ' ')}`,
          ticket_id: newRecord.id,
          ticket_number: newRecord.ticket_number
        });
      }

      // Check if assigned to someone
      if (!oldRecord.assigned_to && newRecord.assigned_to) {
        createNotification({
          type: 'assignment',
          title: 'Ticket Assigned',
          message: `Your ticket ${newRecord.ticket_number} has been assigned to a support agent`,
          ticket_id: newRecord.id,
          ticket_number: newRecord.ticket_number
        });
      }
    }
  };

  const handleNewMessage = (payload: any) => {
    const { new: newMessage } = payload;
    
    // Only notify if message is not from the current user
    if (newMessage.user_id !== user?.id && !newMessage.is_internal) {
      createNotification({
        type: 'new_message',
        title: 'New Message',
        message: `You have a new message on your support ticket`,
        ticket_id: newMessage.ticket_id
      });
    }
  };

  const createNotification = async (notificationData: Partial<SupportNotification>) => {
    try {
      const { data, error } = await supabase
        .from('support_notifications')
        .insert({
          user_id: user?.id,
          type: notificationData.type,
          title: notificationData.title,
          message: notificationData.message,
          ticket_id: notificationData.ticket_id,
          ticket_number: notificationData.ticket_number,
          is_read: false
        })
        .select()
        .single();

      if (error) throw error;

      // Add to local state
      setNotifications(prev => [data, ...prev]);
      setUnreadCount(prev => prev + 1);
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('support_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('support_notifications')
        .update({ is_read: true })
        .eq('user_id', user?.id)
        .eq('is_read', false);

      if (error) throw error;

      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ticket_update':
        return <MessageSquare className="h-4 w-4" />;
      case 'new_message':
        return <MessageSquare className="h-4 w-4" />;
      case 'status_change':
        return <CheckCircle className="h-4 w-4" />;
      case 'assignment':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'ticket_update':
        return 'text-blue-600';
      case 'new_message':
        return 'text-green-600';
      case 'status_change':
        return 'text-orange-600';
      case 'assignment':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 rounded-lg"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              <div className="flex space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-orange-600 hover:text-orange-700"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Bell className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer ${
                      !notification.is_read ? 'bg-orange-50' : ''
                    }`}
                    onClick={() => {
                      if (!notification.is_read) {
                        markAsRead(notification.id);
                      }
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 ${getNotificationColor(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <p className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </p>
                          <span className="text-xs text-gray-500 ml-2">
                            {formatDate(notification.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        {notification.ticket_number && (
                          <p className="text-xs text-orange-600 mt-1 font-medium">
                            {notification.ticket_number}
                          </p>
                        )}
                      </div>
                      {!notification.is_read && (
                        <div className="flex-shrink-0">
                          <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-4 border-t border-gray-200 text-center">
              <a
                href="/support"
                className="text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                View all support tickets
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
