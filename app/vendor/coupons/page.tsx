'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Coupon, DiscountType, CouponStatus, Product, Category, Brand } from '@/types/database';
import { useAuth } from '@/lib/auth-context';
import { Plus, Edit, Trash2, Eye, EyeOff, Calendar, Users, Percent, DollarSign, Truck, Package, FolderTree, Award, Copy } from 'lucide-react';
import CouponForm from '@/components/admin/CouponForm';

export default function VendorCouponsManagement() {
  const { profile } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<CouponStatus | 'all'>('all');

  useEffect(() => {
    if (profile?.id) {
      fetchCoupons();
      fetchVendorData();
    }
  }, [profile]);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('vendor_id', profile?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching coupons:', error);
      } else {
        setCoupons(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendorData = async () => {
    try {
      // Fetch vendor's products
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('vendor_id', profile?.id)
        .eq('is_active', true);

      // Fetch all categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true);

      // Fetch all brands
      const { data: brandsData } = await supabase
        .from('brands')
        .select('*')
        .eq('is_active', true);

      setProducts(productsData || []);
      setCategories(categoriesData || []);
      setBrands(brandsData || []);
    } catch (error) {
      console.error('Error fetching vendor data:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;

    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', id)
        .eq('vendor_id', profile?.id); // Ensure vendor can only delete their own coupons

      if (error) {
        console.error('Error deleting coupon:', error);
        alert('Error deleting coupon');
      } else {
        fetchCoupons();
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error deleting coupon');
    }
  };

  const handleToggleStatus = async (coupon: Coupon) => {
    try {
      const { error } = await supabase
        .from('coupons')
        .update({ 
          is_active: !coupon.is_active,
          status: !coupon.is_active ? 'active' : 'inactive'
        })
        .eq('id', coupon.id)
        .eq('vendor_id', profile?.id); // Ensure vendor can only update their own coupons

      if (error) {
        console.error('Error updating coupon:', error);
        alert('Error updating coupon');
      } else {
        fetchCoupons();
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error updating coupon');
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    // You could add a toast notification here
  };

  const handleSaveCoupon = (coupon: Coupon) => {
    fetchCoupons();
  };

  const filteredCoupons = coupons.filter(coupon => {
    const matchesSearch = coupon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         coupon.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || coupon.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getCouponIcon = (type: DiscountType) => {
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

  const formatCouponValue = (coupon: Coupon) => {
    switch (coupon.type) {
      case 'percentage':
        return `${coupon.value}%`;
      case 'fixed_amount':
        return `$${coupon.value}`;
      case 'free_shipping':
        return 'Free Shipping';
      default:
        return `${coupon.value}%`;
    }
  };

  const getStatusColor = (status: CouponStatus) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'used_up':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Coupons</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage coupon codes for your products and categories
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Coupon
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Eye className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Coupons</p>
              <p className="text-2xl font-semibold text-gray-900">
                {coupons.filter(c => c.status === 'active').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">My Products</p>
              <p className="text-2xl font-semibold text-gray-900">{products.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FolderTree className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Categories</p>
              <p className="text-2xl font-semibold text-gray-900">{categories.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Users className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Usage</p>
              <p className="text-2xl font-semibold text-gray-900">
                {coupons.reduce((sum, c) => sum + c.used_count, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <input
              type="text"
              placeholder="Search coupons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as CouponStatus | 'all')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="expired">Expired</option>
              <option value="used_up">Used Up</option>
            </select>
          </div>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Coupon
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type & Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scope
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCoupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {coupon.name}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                            {coupon.code}
                          </span>
                          <button
                            onClick={() => handleCopyCode(coupon.code)}
                            className="ml-2 text-gray-400 hover:text-gray-600"
                            title="Copy code"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                        {coupon.description && (
                          <div className="text-xs text-gray-400 mt-1">
                            {coupon.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getCouponIcon(coupon.type)}
                        <span className="ml-2 text-sm text-gray-900">
                          {formatCouponValue(coupon)}
                        </span>
                      </div>
                      {coupon.minimum_order_amount > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          Min: ${coupon.minimum_order_amount}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {coupon.is_global ? 'All Products' : 'Specific Products/Categories'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {coupon.used_count} / {coupon.usage_limit || '∞'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {coupon.usage_limit_per_user} per user
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(coupon.status)}`}>
                        {coupon.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        <div>
                          <div>Start: {new Date(coupon.start_date).toLocaleDateString()}</div>
                          {coupon.end_date && (
                            <div>End: {new Date(coupon.end_date).toLocaleDateString()}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleToggleStatus(coupon)}
                          className={`p-1 rounded ${
                            coupon.is_active 
                              ? 'text-green-600 hover:text-green-800' 
                              : 'text-gray-400 hover:text-gray-600'
                          }`}
                          title={coupon.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {coupon.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => setEditingCoupon(coupon)}
                          className="text-orange-600 hover:text-orange-800 p-1 rounded"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(coupon.id)}
                          className="text-red-600 hover:text-red-800 p-1 rounded"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredCoupons.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No coupons found</p>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingCoupon) && (
        <CouponForm
          coupon={editingCoupon || undefined}
          onClose={() => {
            setShowCreateModal(false);
            setEditingCoupon(null);
          }}
          onSave={handleSaveCoupon}
          isVendor={true}
          vendorId={profile?.id}
        />
      )}
    </div>
  );
}
