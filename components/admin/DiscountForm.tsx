'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Discount, DiscountType, DiscountStatus, Product, Category, Brand, Profile } from '@/types/database';
import { X, Save, Calendar, DollarSign, Percent, Truck, Package, FolderTree, Award, Users, Building2 } from 'lucide-react';

interface DiscountFormProps {
  discount?: Discount;
  onClose: () => void;
  onSave: (discount: Discount) => void;
  isVendor?: boolean;
  vendorId?: string;
}

export default function DiscountForm({ discount, onClose, onSave, isVendor = false, vendorId }: DiscountFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    code: '',
    type: 'percentage' as DiscountType,
    value: '',
    minimum_order_amount: '',
    maximum_discount_amount: '',
    usage_limit: '',
    usage_limit_per_user: '1',
    status: 'active' as DiscountStatus,
    start_date: '',
    end_date: '',
    is_active: true,
    is_global: false,
    vendor_id: vendorId || ''
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [vendors, setVendors] = useState<Profile[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (discount) {
      setFormData({
        name: discount.name,
        description: discount.description || '',
        code: discount.code,
        type: discount.type,
        value: discount.value.toString(),
        minimum_order_amount: discount.minimum_order_amount.toString(),
        maximum_discount_amount: discount.maximum_discount_amount?.toString() || '',
        usage_limit: discount.usage_limit?.toString() || '',
        usage_limit_per_user: discount.usage_limit_per_user.toString(),
        status: discount.status,
        start_date: new Date(discount.start_date).toISOString().slice(0, 16),
        end_date: discount.end_date ? new Date(discount.end_date).toISOString().slice(0, 16) : '',
        is_active: discount.is_active,
        is_global: discount.is_global,
        vendor_id: discount.vendor_id || ''
      });
      
      // Fetch existing associations for editing
      if (!discount.is_global) {
        fetchExistingAssociations(discount.id);
      }
    } else {
      // Set default start date to now
      setFormData(prev => ({
        ...prev,
        start_date: new Date().toISOString().slice(0, 16)
      }));
    }
    fetchData();
  }, [discount, vendorId]);

  // Refetch data when vendor selection changes (for admin forms)
  useEffect(() => {
    if (!isVendor && formData.vendor_id !== discount?.vendor_id) {
      // Clear selected items when vendor changes
      setSelectedProducts([]);
      setSelectedCategories([]);
      setSelectedBrands([]);
      fetchData();
    }
  }, [formData.vendor_id]);

  const fetchExistingAssociations = async (discountId: string) => {
    try {
      // Fetch existing product associations
      const { data: productAssociations } = await supabase
        .from('vendor_product_discounts')
        .select('product_id')
        .eq('discount_id', discountId);

      // Fetch existing category associations
      const { data: categoryAssociations } = await supabase
        .from('vendor_category_discounts')
        .select('category_id')
        .eq('discount_id', discountId);

      // Fetch existing brand associations
      const { data: brandAssociations } = await supabase
        .from('vendor_brand_discounts')
        .select('brand_id')
        .eq('discount_id', discountId);

      // Set the selected items
      setSelectedProducts(productAssociations?.map(a => a.product_id) || []);
      setSelectedCategories(categoryAssociations?.map(a => a.category_id) || []);
      setSelectedBrands(brandAssociations?.map(a => a.brand_id) || []);
    } catch (error) {
      console.error('Error fetching existing associations:', error);
    }
  };

  const fetchData = async () => {
    try {
      const promises = [];

      // Determine which vendor ID to use for filtering
      const vendorIdForFiltering = isVendor ? vendorId : (formData.vendor_id || discount?.vendor_id);

      // Fetch products
      if (isVendor && vendorId) {
        promises.push(
          supabase
            .from('products')
            .select('*')
            .eq('vendor_id', vendorId)
            .eq('is_active', true)
        );
      } else if (vendorIdForFiltering) {
        // Filter by selected vendor for admin forms (create or edit)
        promises.push(
          supabase
            .from('products')
            .select('*')
            .eq('vendor_id', vendorIdForFiltering)
            .eq('is_active', true)
        );
      } else {
        promises.push(
          supabase
            .from('products')
            .select('*')
            .eq('is_active', true)
        );
      }

      // Fetch categories (filter by vendor's products if vendor is selected)
      if (vendorIdForFiltering) {
        // Get categories that have products from this vendor
        const { data: vendorCategories } = await supabase
          .from('products')
          .select('category_id')
          .eq('vendor_id', vendorIdForFiltering)
          .not('category_id', 'is', null);
        
        const categoryIds = [...new Set(vendorCategories?.map(p => p.category_id).filter(Boolean) || [])];
        
        promises.push(
          supabase
            .from('categories')
            .select('*')
            .eq('is_active', true)
            .in('id', categoryIds)
        );
      } else {
        promises.push(
          supabase
            .from('categories')
            .select('*')
            .eq('is_active', true)
        );
      }

      // Fetch brands (filter by vendor's products if vendor is selected)
      if (vendorIdForFiltering) {
        // Get brands that have products from this vendor
        const { data: vendorBrands } = await supabase
          .from('products')
          .select('brand_id')
          .eq('vendor_id', vendorIdForFiltering)
          .not('brand_id', 'is', null);
        
        const brandIds = [...new Set(vendorBrands?.map(p => p.brand_id).filter(Boolean) || [])];
        
        promises.push(
          supabase
            .from('brands')
            .select('*')
            .eq('is_active', true)
            .in('id', brandIds)
        );
      } else {
        promises.push(
          supabase
            .from('brands')
            .select('*')
            .eq('is_active', true)
        );
      }

      // Fetch vendors (only for admin)
      if (!isVendor) {
        promises.push(
          supabase
            .from('vendor_profiles')
            .select(`
              id,
              business_name,
              profiles!inner(
                first_name,
                last_name,
                role
              )
            `)
            .eq('status', 'active')
        );
      }

      const [productsResult, categoriesResult, brandsResult, vendorsResult] = await Promise.all(promises);

      setProducts(productsResult.data || []);
      setCategories(categoriesResult.data || []);
      setBrands(brandsResult.data || []);
      if (vendorsResult) {
        setVendors(vendorsResult.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Discount name is required';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Discount code is required';
    }

    if (!formData.value || parseFloat(formData.value) <= 0) {
      newErrors.value = 'Value must be greater than 0';
    }

    if (formData.type === 'percentage' && parseFloat(formData.value) > 100) {
      newErrors.value = 'Percentage cannot exceed 100%';
    }

    if (formData.minimum_order_amount && parseFloat(formData.minimum_order_amount) < 0) {
      newErrors.minimum_order_amount = 'Minimum order amount cannot be negative';
    }

    if (formData.maximum_discount_amount && parseFloat(formData.maximum_discount_amount) < 0) {
      newErrors.maximum_discount_amount = 'Maximum discount amount cannot be negative';
    }

    if (formData.usage_limit && parseInt(formData.usage_limit) < 0) {
      newErrors.usage_limit = 'Usage limit cannot be negative';
    }

    if (parseInt(formData.usage_limit_per_user) < 1) {
      newErrors.usage_limit_per_user = 'Usage limit per user must be at least 1';
    }

    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
    }

    if (formData.end_date && new Date(formData.end_date) <= new Date(formData.start_date)) {
      newErrors.end_date = 'End date must be after start date';
    }

    if (!formData.is_global && selectedProducts.length === 0 && selectedCategories.length === 0 && selectedBrands.length === 0) {
      newErrors.scope = 'Please select at least one product, category, or brand for specific discounts';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const discountData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        code: formData.code.trim(),
        type: formData.type,
        value: parseFloat(formData.value),
        minimum_order_amount: parseFloat(formData.minimum_order_amount) || 0,
        maximum_discount_amount: formData.maximum_discount_amount ? parseFloat(formData.maximum_discount_amount) : null,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        usage_limit_per_user: parseInt(formData.usage_limit_per_user),
        status: formData.status,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
        is_active: formData.is_active,
        is_global: formData.is_global,
        vendor_id: formData.vendor_id || null
      };

      let result;
      if (discount) {
        // Update existing discount
        result = await supabase
          .from('discounts')
          .update(discountData)
          .eq('id', discount.id);
      } else {
        // Create new discount
        result = await supabase
          .from('discounts')
          .insert(discountData)
          .select()
          .single();
      }

      if (result.error) {
        throw result.error;
      }

      const savedDiscount = result.data;

      // Handle product/category/brand associations
      if (!formData.is_global) {
        // Delete existing associations
        if (discount) {
          await supabase
            .from('vendor_product_discounts')
            .delete()
            .eq('discount_id', discount.id);
          await supabase
            .from('vendor_category_discounts')
            .delete()
            .eq('discount_id', discount.id);
          await supabase
            .from('vendor_brand_discounts')
            .delete()
            .eq('discount_id', discount.id);
        }

        // Create new associations
        const associations = [];

        // Product associations
        selectedProducts.forEach(productId => {
          associations.push({
            discount_id: savedDiscount.id,
            vendor_id: formData.vendor_id,
            product_id: productId
          });
        });

        // Category associations
        selectedCategories.forEach(categoryId => {
          associations.push({
            discount_id: savedDiscount.id,
            vendor_id: formData.vendor_id,
            category_id: categoryId
          });
        });

        // Brand associations
        selectedBrands.forEach(brandId => {
          associations.push({
            discount_id: savedDiscount.id,
            vendor_id: formData.vendor_id,
            brand_id: brandId
          });
        });

        if (associations.length > 0) {
          const productAssociations = associations.filter(a => a.product_id);
          const categoryAssociations = associations.filter(a => a.category_id);
          const brandAssociations = associations.filter(a => a.brand_id);

          if (productAssociations.length > 0) {
            await supabase.from('vendor_product_discounts').insert(productAssociations);
          }
          if (categoryAssociations.length > 0) {
            await supabase.from('vendor_category_discounts').insert(categoryAssociations);
          }
          if (brandAssociations.length > 0) {
            await supabase.from('vendor_brand_discounts').insert(brandAssociations);
          }
        }
      }

      onSave(savedDiscount);
      onClose();
    } catch (error: any) {
      console.error('Error saving discount:', error);
      setErrors({ submit: error.message || 'Failed to save discount' });
    } finally {
      setLoading(false);
    }
  };

  const getDiscountIcon = (type: DiscountType) => {
    switch (type) {
      case 'percentage':
        return <Percent className="h-4 w-4" />;
      case 'fixed_amount':
        return <DollarSign className="h-4 w-4" />;
      case 'free_shipping':
        return <Truck className="h-4 w-4" />;
      default:
        return <Percent className="h-4 w-4" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white mb-4">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            {discount ? 'Edit Discount' : 'Create Discount'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discount Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md focus:ring-orange-500 focus:border-orange-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Summer Sale 2024"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discount Code *
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                className={`w-full px-3 py-2 border rounded-md focus:ring-orange-500 focus:border-orange-500 ${
                  errors.code ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., SUMMER2024"
              />
              {errors.code && <p className="mt-1 text-sm text-red-600">{errors.code}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
              placeholder="Describe the discount..."
            />
          </div>

          {/* Discount Type and Value */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discount Type *
              </label>
              <div className="space-y-2">
                {[
                  { value: 'percentage', label: 'Percentage', icon: <Percent className="h-4 w-4" /> },
                  { value: 'fixed_amount', label: 'Fixed Amount', icon: <DollarSign className="h-4 w-4" /> },
                  { value: 'free_shipping', label: 'Free Shipping', icon: <Truck className="h-4 w-4" /> }
                ].map((type) => (
                  <label key={type.value} className="flex items-center">
                    <input
                      type="radio"
                      name="type"
                      value={type.value}
                      checked={formData.type === type.value}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as DiscountType }))}
                      className="mr-3"
                    />
                    <span className="flex items-center">
                      {type.icon}
                      <span className="ml-2">{type.label}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {formData.type === 'percentage' ? 'Percentage (%)' : 
                 formData.type === 'fixed_amount' ? 'Amount ($)' : 'Value'}
                *
              </label>
              <input
                type="number"
                min="0"
                max={formData.type === 'percentage' ? '100' : undefined}
                step={formData.type === 'percentage' ? '0.01' : '0.01'}
                value={formData.value}
                onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md focus:ring-orange-500 focus:border-orange-500 ${
                  errors.value ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder={formData.type === 'percentage' ? '20' : '10.00'}
                disabled={formData.type === 'free_shipping'}
              />
              {errors.value && <p className="mt-1 text-sm text-red-600">{errors.value}</p>}
            </div>
          </div>

          {/* Order Requirements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Order Amount ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.minimum_order_amount}
                onChange={(e) => setFormData(prev => ({ ...prev, minimum_order_amount: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md focus:ring-orange-500 focus:border-orange-500 ${
                  errors.minimum_order_amount ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {errors.minimum_order_amount && <p className="mt-1 text-sm text-red-600">{errors.minimum_order_amount}</p>}
            </div>

            {formData.type === 'percentage' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Discount Amount ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.maximum_discount_amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, maximum_discount_amount: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-orange-500 focus:border-orange-500 ${
                    errors.maximum_discount_amount ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="50.00"
                />
                {errors.maximum_discount_amount && <p className="mt-1 text-sm text-red-600">{errors.maximum_discount_amount}</p>}
              </div>
            )}
          </div>

          {/* Usage Limits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Usage Limit
              </label>
              <input
                type="number"
                min="0"
                value={formData.usage_limit}
                onChange={(e) => setFormData(prev => ({ ...prev, usage_limit: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md focus:ring-orange-500 focus:border-orange-500 ${
                  errors.usage_limit ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Leave empty for unlimited"
              />
              {errors.usage_limit && <p className="mt-1 text-sm text-red-600">{errors.usage_limit}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Usage Limit Per User *
              </label>
              <input
                type="number"
                min="1"
                value={formData.usage_limit_per_user}
                onChange={(e) => setFormData(prev => ({ ...prev, usage_limit_per_user: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md focus:ring-orange-500 focus:border-orange-500 ${
                  errors.usage_limit_per_user ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.usage_limit_per_user && <p className="mt-1 text-sm text-red-600">{errors.usage_limit_per_user}</p>}
            </div>
          </div>

          {/* Vendor Selection (Admin only) */}
          {!isVendor && (
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">
                 Vendor
               </label>
               <select
                 value={formData.vendor_id}
                 onChange={(e) => setFormData(prev => ({ ...prev, vendor_id: e.target.value }))}
                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
               >
                 <option value="">Global Discount (No Vendor)</option>
                 {vendors.map((vendor) => (
                   <option key={vendor.id} value={vendor.id}>
                     {vendor.business_name || `${vendor.profiles?.first_name || ''} ${vendor.profiles?.last_name || ''}`.trim()}
                   </option>
                 ))}
               </select>
            </div>
          )}

          {/* Scope Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Discount Scope
            </label>
            {formData.vendor_id && (
              <p className="text-sm text-blue-600 mb-3 bg-blue-50 p-2 rounded">
                <Building2 className="h-4 w-4 inline mr-1" />
                Scope is filtered to only show products, categories, and brands from the selected vendor.
              </p>
            )}
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="scope"
                  checked={formData.is_global}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_global: e.target.checked }))}
                  className="mr-3"
                />
                <span className="flex items-center">
                  <Package className="h-4 w-4 mr-2" />
                  Apply to all products
                </span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="radio"
                  name="scope"
                  checked={!formData.is_global}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_global: !e.target.checked }))}
                  className="mr-3"
                />
                <span className="flex items-center">
                  <FolderTree className="h-4 w-4 mr-2" />
                  Apply to specific products/categories/brands
                </span>
              </label>
            </div>
            {errors.scope && <p className="mt-1 text-sm text-red-600">{errors.scope}</p>}
          </div>

          {/* Specific Product/Category/Brand Selection */}
          {!formData.is_global && (
            <div className="space-y-6">
              {/* Products */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Products
                </label>
                <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3">
                  {products.length === 0 ? (
                    <p className="text-gray-500 text-sm">No products available</p>
                  ) : (
                    <div className="space-y-2">
                      {products.map((product) => (
                        <label key={product.id} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(product.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedProducts(prev => [...prev, product.id]);
                              } else {
                                setSelectedProducts(prev => prev.filter(id => id !== product.id));
                              }
                            }}
                            className="mr-3"
                          />
                          <span className="text-sm">{product.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Categories */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categories
                </label>
                <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3">
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <label key={category.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCategories(prev => [...prev, category.id]);
                            } else {
                              setSelectedCategories(prev => prev.filter(id => id !== category.id));
                            }
                          }}
                          className="mr-3"
                        />
                        <span className="text-sm">{category.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Brands */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brands
                </label>
                <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3">
                  <div className="space-y-2">
                    {brands.map((brand) => (
                      <label key={brand.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedBrands.includes(brand.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedBrands(prev => [...prev, brand.id]);
                            } else {
                              setSelectedBrands(prev => prev.filter(id => id !== brand.id));
                            }
                          }}
                          className="mr-3"
                        />
                        <span className="text-sm">{brand.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date *
              </label>
              <input
                type="datetime-local"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md focus:ring-orange-500 focus:border-orange-500 ${
                  errors.start_date ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.start_date && <p className="mt-1 text-sm text-red-600">{errors.start_date}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="datetime-local"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md focus:ring-orange-500 focus:border-orange-500 ${
                  errors.end_date ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.end_date && <p className="mt-1 text-sm text-red-600">{errors.end_date}</p>}
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">Active</span>
            </label>
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {discount ? 'Update Discount' : 'Create Discount'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
