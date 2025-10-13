import AdminProtectedRoute from '@/components/admin/AdminProtectedRoute';
import SupportManagement from '@/components/admin/SupportManagement';

export default function AdminSupportPage() {
  return (
    <AdminProtectedRoute>
      <SupportManagement />
    </AdminProtectedRoute>
  );
}
