import AdminProtectedRoute from '@/components/admin/AdminProtectedRoute';
import ProductsManagement from '@/components/admin/ProductsManagement';

export default function AdminProductsPage() {
  return (
    <AdminProtectedRoute>
      <ProductsManagement />
    </AdminProtectedRoute>
  );
}
