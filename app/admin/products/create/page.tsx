'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Category, Brand, ProductAttribute, ProductWithDetails } from '@/types/database';
import ProductForm from '@/components/admin/ProductForm';
import AdminProtectedRoute from '@/components/admin/AdminProtectedRoute';

export default function CreateProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name');

      // Fetch brands
      const { data: brandsData } = await supabase
        .from('brands')
        .select('*')
        .eq('is_active', true)
        .order('name');

      // Fetch attributes
      const { data: attributesData } = await supabase
        .from('product_attributes')
        .select('*')
        .eq('is_active', true)
        .order('name');

      setCategories(categoriesData || []);
      setBrands(brandsData || []);
      setAttributes(attributesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = (product: ProductWithDetails) => {
    // Show success message and redirect
    alert('Product created successfully!');
    router.push('/admin/products');
  };

  const handleCancel = () => {
    router.push('/admin/products');
  };

  if (loading) {
    return (
      <AdminProtectedRoute>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </AdminProtectedRoute>
    );
  }

  return (
    <AdminProtectedRoute>
      <ProductForm
        product={null}
        categories={categories}
        brands={brands}
        attributes={attributes}
        onSave={handleSave}
        onCancel={handleCancel}
        loading={loading}
      />
    </AdminProtectedRoute>
  );
}


