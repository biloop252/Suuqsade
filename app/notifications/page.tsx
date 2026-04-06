'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AppNotificationsPage from '@/components/notifications/AppNotificationsPage';
import { useAuth } from '@/lib/auth-context';

export default function CustomerNotificationsPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <AppNotificationsPage
            userId={user?.id}
            audience="customer"
            title="Notifications"
            subtitle="Orders, payments, account alerts, and promotions in one place."
          />
        </div>
      </div>
    </ProtectedRoute>
  );
}
