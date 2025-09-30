'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { 
  ArrowLeftIcon,
  PackageIcon,
  CalendarIcon,
  CreditCardIcon,
  MapPinIcon,
  EyeIcon
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

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

export default function OrdersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOrders();
    } else {
      router.push('/auth/signin');
    }
  }, [user, router]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
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
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
      } else {
        setOrders(data || []);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center text-gray-600 hover:text-primary-600 mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-12">
            <PackageIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h2>
            <p className="text-gray-600 mb-8">You haven't placed any orders yet.</p>
            <Link 
              href="/products" 
              className="bg-primary-600 text-white px-6 py-3 rounded-md font-medium hover:bg-primary-700"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                {/* Order Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Order #{order.order_number}
                      </h3>
                      <p className="text-sm text-gray-600 flex items-center mt-1">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        Placed on {formatDate(order.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                      <p className="text-lg font-semibold text-gray-900 mt-1">
                        ${order.total_amount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-6">
                  <div className="space-y-4">
                    {order.order_items.map((item) => {
                      const primaryImage = item.product?.images?.find(img => img.is_primary) || item.product?.images?.[0];
                      
                      return (
                        <div key={item.id} className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                            {primaryImage ? (
                              <Image
                                src={primaryImage.image_url}
                                alt={item.product_name}
                                width={64}
                                height={64}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-gray-400 text-xs">No Image</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {item.product_name}
                            </h4>
                            {item.product_sku && (
                              <p className="text-xs text-gray-500">SKU: {item.product_sku}</p>
                            )}
                            <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              ${item.total_price.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500">
                              ${item.unit_price.toFixed(2)} each
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Order Summary */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Order Summary</h4>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span>${order.subtotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Tax:</span>
                            <span>${order.tax_amount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Shipping:</span>
                            <span>
                              {order.shipping_amount === 0 ? 'Free' : `$${order.shipping_amount.toFixed(2)}`}
                            </span>
                          </div>
                          {order.discount_amount > 0 && (
                            <div className="flex justify-between text-green-600">
                              <span>Discount:</span>
                              <span>-${order.discount_amount.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-medium text-gray-900 pt-2 border-t">
                            <span>Total:</span>
                            <span>${order.total_amount.toFixed(2)}</span>
                          </div>
                        </div>
                        
                        {/* Payment Method */}
                        {order.payments && order.payments.length > 0 && (
                          <div className="mt-4 pt-4 border-t">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Payment Method</h4>
                            <div className="flex items-center">
                              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-2">
                                <span className="text-green-600 font-bold text-xs">$</span>
                              </div>
                              <span className="text-sm text-gray-600 capitalize">
                                {order.payments[0].payment_method.replace('_', ' ')}
                              </span>
                              <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                                order.payments[0].status === 'pending' 
                                  ? 'bg-yellow-100 text-yellow-800' 
                                  : order.payments[0].status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {order.payments[0].status}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Billing Address</h4>
                        {order.billing_address ? (
                          <div className="text-sm text-gray-600">
                            <p>{order.billing_address.first_name} {order.billing_address.last_name}</p>
                            {order.billing_address.company && <p>{order.billing_address.company}</p>}
                            <p>{order.billing_address.address_line_1}</p>
                            {order.billing_address.address_line_2 && <p>{order.billing_address.address_line_2}</p>}
                            <p>{order.billing_address.city}, {order.billing_address.state} {order.billing_address.postal_code}</p>
                            <p>{order.billing_address.country}</p>
                            {order.billing_address.phone && <p>{order.billing_address.phone}</p>}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No billing address</p>
                        )}
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Shipping Address</h4>
                        {order.shipping_address ? (
                          <div className="text-sm text-gray-600">
                            <p>{order.shipping_address.first_name} {order.shipping_address.last_name}</p>
                            {order.shipping_address.company && <p>{order.shipping_address.company}</p>}
                            <p>{order.shipping_address.address_line_1}</p>
                            {order.shipping_address.address_line_2 && <p>{order.shipping_address.address_line_2}</p>}
                            <p>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}</p>
                            <p>{order.shipping_address.country}</p>
                            {order.shipping_address.phone && <p>{order.shipping_address.phone}</p>}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No shipping address</p>
                        )}
                      </div>
                    </div>

                    {order.notes && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Order Notes</h4>
                        <p className="text-sm text-gray-600">{order.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
