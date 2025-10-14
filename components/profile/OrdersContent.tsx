'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { 
  PackageIcon,
  CalendarIcon,
  CreditCardIcon,
  MapPinIcon,
  EyeIcon,
  SearchIcon,
  FilterIcon,
  ChevronDownIcon
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import Pagination from '@/components/admin/Pagination';

interface Order {
  id: string;
  order_number: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  discount_amount: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  order_items: OrderItem[];
  billing_address?: Address;
  shipping_address?: Address;
  payments?: Payment[];
}

interface Payment {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transaction_id?: string;
  created_at: string;
}

interface OrderItem {
  id: string;
  product_id: string;
  variant_id?: string;
  product_name: string;
  product_sku?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product?: {
    id: string;
    name: string;
    slug: string;
    images?: Array<{
      id: string;
      image_url: string;
      is_primary: boolean;
    }>;
  };
}

interface Address {
  id: string;
  type: 'billing' | 'shipping';
  first_name: string;
  last_name: string;
  company?: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone?: string;
}

export default function OrdersContent() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalOrders, setTotalOrders] = useState(0);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user, currentPage, itemsPerPage, searchTerm, statusFilter]);

  const fetchOrders = async () => {
    try {
      // Only set loading if we don't have orders yet
      if (orders.length === 0) {
        setLoading(true);
      }
      
      // Build the query with filters
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items(
            *,
            product:products(
              id,
              name,
              slug,
              images:product_images(
                id,
                image_url,
                is_primary
              )
            )
          ),
          billing_address:addresses!billing_address_id(*),
          shipping_address:addresses!shipping_address_id(*),
          payments(*)
        `, { count: 'exact' })
        .eq('user_id', user?.id);

      // Apply status filter
      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      // Apply search filter
      if (searchTerm) {
        query = query.or(`order_number.ilike.%${searchTerm}%,order_items.product_name.ilike.%${searchTerm}%`);
      }

      // Apply pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      
      query = query
        .order('created_at', { ascending: false })
        .range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching orders:', error);
      } else {
        setOrders(data || []);
        setTotalOrders(count || 0);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Reset to first page when search or filter changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Orders</h2>
          <p className="text-gray-600">Track and manage your orders</p>
        </div>
        <Link 
          href="/products" 
          className="bg-primary-600 text-white px-4 py-2 rounded-md font-medium hover:bg-primary-700 transition-colors"
        >
          Continue Shopping
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders or products..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <FilterIcon className="h-4 w-4 mr-2" />
            Filter
            <ChevronDownIcon className={`h-4 w-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleStatusFilterChange('')}
                className={`px-3 py-1 text-sm rounded-full ${
                  !statusFilter ? 'bg-primary-100 text-primary-800' : 'bg-gray-100 text-gray-700'
                }`}
              >
                All Orders
              </button>
              {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusFilterChange(status)}
                  className={`px-3 py-1 text-sm rounded-full capitalize ${
                    statusFilter === status ? 'bg-primary-100 text-primary-800' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <PackageIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {totalOrders === 0 ? "No orders yet" : "No orders found"}
          </h3>
          <p className="text-gray-600 mb-8">
            {totalOrders === 0 
              ? "You haven't placed any orders yet." 
              : "Try adjusting your search or filter criteria."
            }
          </p>
          {totalOrders === 0 && (
            <Link 
              href="/products" 
              className="bg-primary-600 text-white px-6 py-3 rounded-md font-medium hover:bg-primary-700"
            >
              Start Shopping
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  {/* Order Info */}
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      <PackageIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">
                        Order #{order.order_number}
                      </h3>
                      <p className="text-xs text-gray-500 flex items-center">
                        <CalendarIcon className="h-3 w-3 mr-1" />
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Items Count */}
                  <div className="hidden sm:block text-center px-3">
                    <p className="text-xs text-gray-500">Items</p>
                    <p className="text-sm font-medium text-gray-900">{order.order_items.length}</p>
                  </div>

                  {/* Status */}
                  <div className="text-center px-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>

                  {/* Total Amount */}
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      ${order.total_amount.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {order.order_items.length} item{order.order_items.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  {/* View Details Button */}
                  <div className="ml-4 flex-shrink-0">
                    <button 
                      onClick={() => toggleOrderExpansion(order.id)}
                      className="text-primary-600 hover:text-primary-700 text-xs font-medium"
                    >
                      {expandedOrders.has(order.id) ? 'Hide Details' : 'View Details'}
                    </button>
                  </div>
                </div>

                {/* Collapsible Details */}
                {expandedOrders.has(order.id) && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Order Items Summary */}
                    <div>
                      <h4 className="text-xs font-medium text-gray-900 mb-2">Items</h4>
                      <div className="space-y-2">
                        {order.order_items.slice(0, 3).map((item) => (
                          <div key={item.id} className="flex items-center space-x-2 text-xs">
                            <div className="w-6 h-6 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                              {item.product?.images?.[0] ? (
                                <Image
                                  src={item.product.images[0].image_url}
                                  alt={item.product_name}
                                  width={24}
                                  height={24}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <span className="text-gray-400 text-xs">?</span>
                                </div>
                              )}
                            </div>
                            <span className="truncate">{item.product_name}</span>
                            <span className="text-gray-500">x{item.quantity}</span>
                          </div>
                        ))}
                        {order.order_items.length > 3 && (
                          <p className="text-xs text-gray-500">+{order.order_items.length - 3} more items</p>
                        )}
                      </div>
                    </div>

                    {/* Payment & Address Summary */}
                    <div>
                      <h4 className="text-xs font-medium text-gray-900 mb-2">Details</h4>
                      <div className="space-y-1 text-xs text-gray-600">
                        {order.payments && order.payments.length > 0 && (
                          <p>Payment: {order.payments[0].payment_method.replace('_', ' ')}</p>
                        )}
                        {order.shipping_address && (
                          <p>Ship to: {order.shipping_address.city}, {order.shipping_address.state}</p>
                        )}
                        <p>Subtotal: ${order.subtotal.toFixed(2)}</p>
                        {order.shipping_amount > 0 && (
                          <p>Shipping: ${order.shipping_amount.toFixed(2)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalOrders > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(totalOrders / itemsPerPage)}
          totalItems={totalOrders}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          showItemsPerPage={true}
        />
      )}
    </div>
  );
}
