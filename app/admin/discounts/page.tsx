'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Discount, DiscountType, DiscountStatus } from '@/types/database';
import { Plus, Edit, Trash2, Eye, EyeOff, Calendar, Users, Percent, DollarSign, Truck, Building2, Package, FolderTree } from 'lucide-react';
import DiscountForm from '@/components/admin/DiscountForm';

export default function DiscountsManagement() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<DiscountStatus | 'all'>('all');

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('discounts')
        .select(`
          *,
          vendor:profiles!discounts_vendor_id_fkey(
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
        console.error('Error fetching discounts:', error);
        setDiscounts([]);
      } else {
        setDiscounts(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      setDiscounts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this discount?')) return;

    try {
      const { error } = await supabase
        .from('discounts')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting discount:', error);
        alert('Error deleting discount');
      } else {
        fetchDiscounts();
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error deleting discount');
    }
  };

  const handleToggleStatus = async (discount: Discount) => {
    try {
      const { error } = await supabase
        .from('discounts')
        .update({ 
          is_active: !discount.is_active,
          status: !discount.is_active ? 'active' : 'inactive'
        })
        .eq('id', discount.id);

      if (error) {
        console.error('Error updating discount:', error);
        alert('Error updating discount');
      } else {
        fetchDiscounts();
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error updating discount');
    }
  };

  const handleSaveDiscount = (discount: Discount) => {
    fetchDiscounts();
  };

  const filteredDiscounts = discounts.filter(discount => {
    const matchesSearch = discount.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         discount.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || discount.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

  const formatDiscountValue = (discount: Discount) => {
    switch (discount.type) {
      case 'percentage':
        return `${discount.value}%`;
      case 'fixed_amount':
        return `$${discount.value}`;
      case 'free_shipping':
        return 'Free Shipping';
      default:
        return `${discount.value}%`;
    }
  };

  const getStatusColor = (status: DiscountStatus) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
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
          <h1 className="text-2xl font-bold text-gray-900">Discounts</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage automatic discounts and promotions
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Discount
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <input
              type="text"
              placeholder="Search discounts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as DiscountStatus | 'all')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Discounts Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Discount
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
                {filteredDiscounts.map((discount) => (
                  <tr key={discount.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {discount.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          Code: {discount.code}
                        </div>
                        {discount.description && (
                          <div className="text-xs text-gray-400 mt-1">
                            {discount.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getDiscountIcon(discount.type)}
                        <span className="ml-2 text-sm text-gray-900">
                          {formatDiscountValue(discount)}
                        </span>
                      </div>
                      {discount.minimum_order_amount > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          Min: ${discount.minimum_order_amount}
                        </div>
                      )}
                    </td>
                     <td className="px-6 py-4 whitespace-nowrap">
                       <div className="flex items-center">
                         <Building2 className="h-4 w-4 text-gray-400 mr-2" />
                         <div>
                           <div className="text-sm text-gray-900">
                             {(discount as any).vendor?.vendor_profile?.business_name || 
                              `${(discount as any).vendor?.first_name || ''} ${(discount as any).vendor?.last_name || ''}`.trim() ||
                              'Global Discount'}
                           </div>
                           <div className="text-xs text-gray-500">
                             {discount.vendor_id ? 'Vendor-specific' : 'Global'}
                           </div>
                         </div>
                       </div>
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap">
                       <div className="flex items-center">
                         {discount.is_global ? (
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
                                   const productCount = (discount as any).product_associations?.length || 0;
                                   const categoryCount = (discount as any).category_associations?.length || 0;
                                   const brandCount = (discount as any).brand_associations?.length || 0;
                                   
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
                        {discount.used_count} / {discount.usage_limit || '∞'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {discount.usage_limit_per_user} per user
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(discount.status)}`}>
                        {discount.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        <div>
                          <div>Start: {new Date(discount.start_date).toLocaleDateString()}</div>
                          {discount.end_date && (
                            <div>End: {new Date(discount.end_date).toLocaleDateString()}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleToggleStatus(discount)}
                          className={`p-1 rounded ${
                            discount.is_active 
                              ? 'text-green-600 hover:text-green-800' 
                              : 'text-gray-400 hover:text-gray-600'
                          }`}
                          title={discount.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {discount.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => setEditingDiscount(discount)}
                          className="text-orange-600 hover:text-orange-800 p-1 rounded"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(discount.id)}
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
          
          {filteredDiscounts.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No discounts found</p>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingDiscount) && (
        <DiscountForm
          discount={editingDiscount || undefined}
          onClose={() => {
            setShowCreateModal(false);
            setEditingDiscount(null);
          }}
          onSave={handleSaveDiscount}
          isVendor={false}
        />
      )}
    </div>
  );
}
