'use client';

import AdminProtectedRoute from '@/components/admin/AdminProtectedRoute';
import AppNotificationsPage from '@/components/notifications/AppNotificationsPage';
import { useAuth } from '@/lib/auth-context';

export default function AdminNotificationsPage() {
  const { user } = useAuth();

  return (
    <AdminProtectedRoute>
      <AppNotificationsPage
        userId={user?.id}
        audience="admin"
        title="Admin notifications"
        subtitle="Orders, customers, products, payments, system health, and reports."
      />
    </AdminProtectedRoute>
  );
}
