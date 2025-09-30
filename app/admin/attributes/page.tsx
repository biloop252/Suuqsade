import AdminProtectedRoute from '@/components/admin/AdminProtectedRoute';
import AttributesManagement from '@/components/admin/AttributesManagement';

export default function AdminAttributesPage() {
  return (
    <AdminProtectedRoute>
      <AttributesManagement />
    </AdminProtectedRoute>
  );
}
