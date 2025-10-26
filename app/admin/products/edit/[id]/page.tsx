'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Category, Brand, ProductAttribute, ProductWithDetails } from '@/types/database';
import ProductForm from '@/components/admin/ProductForm';
import AdminProtectedRoute from '@/components/admin/AdminProtectedRoute';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  
  const [product, setProduct] = useState<ProductWithDetails | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (productId) {
      fetchData();
    }
  }, [productId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch product with relations
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(name),
          brand:brands(name),
          images:product_images(*),
          return_policy:return_policies(*),
          cod_policy:cod_policies(*),
          cancellation_policy:cancellation_policies(*),
          attribute_assignments:product_attribute_assignments(
            *,
            attribute_value:attribute_values(
              *,
              attribute:product_attributes(*)
            )
          ),
          tag_assignments:product_tag_assignments(
            tag:product_tags(*)
          )
        `)
        .eq('id', productId)
        .single();

      if (productError) {
        console.error('Error fetching product:', productError);
        alert('Product not found');
        router.push('/admin/products');
        return;
      }

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

      setProduct(productData);
      setCategories(categoriesData || []);
      setBrands(brandsData || []);
      setAttributes(attributesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Error loading product data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = (updatedProduct: ProductWithDetails) => {
    // Show success message and redirect
    alert('Product updated successfully!');
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
            <p className="text-gray-600">Loading product...</p>
          </div>
        </div>
      </AdminProtectedRoute>
    );
  }

  if (!product) {
    return (
      <AdminProtectedRoute>
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Product Not Found</h2>
          <p className="text-gray-600 mb-6">The product you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/admin/products')}
            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
          >
            Back to Products
          </button>
        </div>
      </AdminProtectedRoute>
    );
  }

  return (
    <AdminProtectedRoute>
      <ProductForm
        product={product}
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


