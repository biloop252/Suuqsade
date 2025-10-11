'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Coupon, DiscountType, CouponStatus } from '@/types/database';
import { Plus, Edit, Trash2, Eye, EyeOff, Calendar, Users, Percent, DollarSign, Truck, Copy, Building2, Package, FolderTree } from 'lucide-react';
import CouponForm from '@/components/admin/CouponForm';

export default function CouponsManagement() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<CouponStatus | 'all'>('all');

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      
      // First try a simple query to see if coupons exist
      const { data: simpleData, error: simpleError } = await supabase
        .from('coupons')
        .select('*')
        .limit(5);

      console.log('Simple coupons query result:', { simpleData, simpleError });

      if (simpleError) {
        console.error('Error with simple coupons query:', simpleError);
        setCoupons([]);
        return;
      }

      // If we have data, try the full query with vendor info
      const { data, error } = await supabase
        .from('coupons')
        .select(`
          *,
          vendor:profiles!coupons_vendor_id_fkey(
            first_name,
            last_name,
            vendor_profile:vendor_profiles!inner(
              business_name
            )
          ),
          product_associations:vendor_product_discounts(
            product:products(name)
          ),
          category_associations:vendor_category_discounts(
            category:categories(name)
          ),
          brand_associations:vendor_brand_discounts(
            brand:brands(name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching coupons with vendor info:', error);
        // Fallback to simple data if vendor join fails
        setCoupons(simpleData || []);
      } else {
        console.log('Fetched coupons with vendor info:', data);
        setCoupons(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;

    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', id);

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
        .eq('id', coupon.id);

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
          <h1 className="text-2xl font-bold text-gray-900">Coupons</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage coupon codes for customer promotions
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Coupon
          </button>
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
                    Vendor
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
                      <div className="flex items-center">
                        <Building2 className="h-4 w-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm text-gray-900">
                            {(coupon as any).vendor?.vendor_profile?.business_name || 
                             `${(coupon as any).vendor?.first_name || ''} ${(coupon as any).vendor?.last_name || ''}`.trim() ||
                             'Global Coupon'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {coupon.vendor_id ? 'Vendor-specific' : 'Global'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {coupon.is_global ? (
                          <>
                            <Package className="h-4 w-4 text-green-500 mr-2" />
                            <div>
                              <div className="text-sm text-gray-900">All Products</div>
                              <div className="text-xs text-gray-500">Global scope</div>
                            </div>
                          </>
                        ) : (
                          <>
                            <FolderTree className="h-4 w-4 text-blue-500 mr-2" />
                            <div className="max-w-xs">
                              <div className="text-sm text-gray-900">Specific Items</div>
                              <div className="text-xs text-gray-500">
                                {(() => {
                                  const items = [];
                                  const productCount = (coupon as any).product_associations?.length || 0;
                                  const categoryCount = (coupon as any).category_associations?.length || 0;
                                  const brandCount = (coupon as any).brand_associations?.length || 0;
                                  
                                  if (productCount > 0) items.push(`${productCount} product${productCount > 1 ? 's' : ''}`);
                                  if (categoryCount > 0) items.push(`${categoryCount} categor${categoryCount > 1 ? 'ies' : 'y'}`);
                                  if (brandCount > 0) items.push(`${brandCount} brand${brandCount > 1 ? 's' : ''}`);
                                  
                                  return items.length > 0 ? items.join(', ') : 'No items selected';
                                })()}
                              </div>
                            </div>
                          </>
                        )}
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
          isVendor={false}
        />
      )}
    </div>
  );
}
