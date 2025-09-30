import AdminProtectedRoute from '@/components/admin/AdminProtectedRoute';
import OrdersManagement from '@/components/admin/OrdersManagement';

export default function AdminOrdersPage() {
  return (
    <AdminProtectedRoute>
      <OrdersManagement />
    </AdminProtectedRoute>
  );
}
