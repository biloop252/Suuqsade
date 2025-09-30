import AdminProtectedRoute from '@/components/admin/AdminProtectedRoute';
import VariantsManagement from '@/components/admin/VariantsManagement';

export default function AdminVariantsPage() {
  return (
    <AdminProtectedRoute>
      <VariantsManagement />
    </AdminProtectedRoute>
  );
}
