import AdminProtectedRoute from '@/components/admin/AdminProtectedRoute';
import CategoriesManagement from '@/components/admin/CategoriesManagement';

export default function AdminCategoriesPage() {
  return (
    <AdminProtectedRoute>
      <CategoriesManagement />
    </AdminProtectedRoute>
  );
}
