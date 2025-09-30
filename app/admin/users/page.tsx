import AdminProtectedRoute from '@/components/admin/AdminProtectedRoute';
import UsersManagement from '@/components/admin/UsersManagement';

export default function AdminUsersPage() {
  return (
    <AdminProtectedRoute>
      <UsersManagement />
    </AdminProtectedRoute>
  );
}
