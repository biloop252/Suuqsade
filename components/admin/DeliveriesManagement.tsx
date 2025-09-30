'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Truck, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  CheckCircle, 
  Clock, 
  XCircle,
  Package,
  Calendar,
  MapPin
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Delivery {
  id: string;
  order_id: string;
  tracking_number: string;
  carrier: string;
  status: 'pending' | 'in_transit' | 'delivered' | 'failed';
  estimated_delivery_date: string;
  actual_delivery_date?: string;
  shipping_label_url?: string;
  created_at: string;
  updated_at: string;
  order?: {
    order_number: string;
    user: {
      first_name: string;
      last_name: string;
      email: string;
    };
    shipping_address: {
      first_name: string;
      last_name: string;
      address_line_1: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    };
  };
}

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  in_transit: { label: 'In Transit', color: 'bg-blue-100 text-blue-800', icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-800', icon: XCircle }
};

export default function DeliveriesManagement() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      // Fetch deliveries first
      const { data: deliveriesData, error: deliveriesError } = await supabase
        .from('deliveries')
        .select('*')
        .order('created_at', { ascending: false });

      if (deliveriesError) {
        console.error('Error fetching deliveries:', deliveriesError);
        return;
      }

      if (!deliveriesData || deliveriesData.length === 0) {
        setDeliveries([]);
        return;
      }

      // Get unique order IDs
      const orderIds = [...new Set(deliveriesData.map(d => d.order_id))];

      // First try to fetch orders without profiles join to see if orders exist
      const { data: simpleOrdersData, error: simpleOrdersError } = await supabase
        .from('orders')
        .select('id, order_number, user_id')
        .in('id', orderIds);

      if (simpleOrdersError || !simpleOrdersData || simpleOrdersData.length === 0) {
        setDeliveries(deliveriesData.map(delivery => ({ ...delivery, orders: null })));
        return;
      }

      // Now try to fetch orders with profiles
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          user_id,
          profiles!inner(
            first_name,
            last_name,
            email
          ),
          addresses!shipping_address_id(
            first_name,
            last_name,
            address_line_1,
            city,
            state,
            postal_code,
            country
          )
        `)
        .in('id', orderIds);

      if (ordersError) {
        console.error('Error fetching orders with profiles:', ordersError);
        
        // Try to fetch profiles separately
        const userIds = [...new Set(simpleOrdersData.map(o => o.user_id))];
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email')
          .in('id', userIds);

        if (profilesError || !profilesData) {
          const ordersMap = new Map();
          simpleOrdersData?.forEach(order => {
            ordersMap.set(order.id, order);
          });
          const combinedData = deliveriesData.map(delivery => ({
            ...delivery,
            orders: ordersMap.get(delivery.order_id) || null
          }));
          setDeliveries(combinedData);
          return;
        }

        // Combine orders with profiles manually
        const profilesMap = new Map();
        profilesData.forEach(profile => {
          profilesMap.set(profile.id, profile);
        });

        const ordersWithProfiles = simpleOrdersData.map(order => ({
          ...order,
          profiles: profilesMap.get(order.user_id) || null
        }));

        const ordersMap = new Map();
        ordersWithProfiles.forEach(order => {
          ordersMap.set(order.id, order);
        });

        const combinedData = deliveriesData.map(delivery => ({
          ...delivery,
          orders: ordersMap.get(delivery.order_id) || null
        }));

        setDeliveries(combinedData);
        return;
      }

      // Create a map of order data
      const ordersMap = new Map();
      ordersData?.forEach(order => {
        ordersMap.set(order.id, order);
      });

      // Combine deliveries with order data
      const combinedData = deliveriesData.map(delivery => ({
        ...delivery,
        orders: ordersMap.get(delivery.order_id) || null
      }));

      setDeliveries(combinedData);
    } catch (error) {
      console.error('Error fetching deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (deliveryId: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      
      if (newStatus === 'delivered') {
        updateData.actual_delivery_date = new Date().toISOString();
      }

      const { error } = await supabase
        .from('deliveries')
        .update(updateData)
        .eq('id', deliveryId);

      if (error) {
        console.error('Error updating delivery status:', error);
        alert('Error updating delivery status. Please try again.');
        return;
      }

      // Update local state
      setDeliveries(prev => 
        prev.map(delivery => 
          delivery.id === deliveryId 
            ? { ...delivery, status: newStatus as any, ...updateData }
            : delivery
        )
      );

      setShowEditModal(false);
      setSelectedDelivery(null);
      alert('Delivery status updated successfully!');
    } catch (error) {
      console.error('Error updating delivery status:', error);
      alert('Error updating delivery status. Please try again.');
    }
  };

  const filteredDeliveries = deliveries.filter(delivery => {
    const matchesSearch = 
      delivery.tracking_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.carrier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.orders?.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${delivery.orders?.profiles?.first_name || ''} ${delivery.orders?.profiles?.last_name || ''}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || delivery.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shipment Management</h1>
          <p className="text-gray-600">Track and manage all deliveries and shipments</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={fetchDeliveries}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            Refresh
          </button>
          <div className="flex items-center space-x-2">
            <Package className="h-6 w-6 text-blue-600" />
            <span className="text-sm text-gray-500">
              {filteredDeliveries.length} shipments
            </span>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search by tracking number, carrier, order number, or customer name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_transit">In Transit</option>
              <option value="delivered">Delivered</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Deliveries Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tracking Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Delivery Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDeliveries.map((delivery) => {
                const StatusIcon = statusConfig[delivery.status].icon;
                return (
                  <tr key={delivery.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Truck className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900 font-mono">
                            {delivery.tracking_number}
                          </div>
                          <div className="text-sm text-gray-500">
                            {delivery.carrier}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {delivery.orders?.order_number ? `#${delivery.orders.order_number}` : 
                         delivery.order_id ? `Order: ${delivery.order_id.slice(0, 8)}...` : 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(delivery.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {delivery.orders?.profiles ? 
                          `${delivery.orders.profiles.first_name || ''} ${delivery.orders.profiles.last_name || ''}`.trim() || 'N/A' : 
                          'N/A'
                        }
                      </div>
                      <div className="text-sm text-gray-500">
                        {delivery.orders?.profiles?.email || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[delivery.status].color}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig[delivery.status].label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {delivery.actual_delivery_date ? (
                          <div className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                            {formatDate(delivery.actual_delivery_date)}
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                            {delivery.estimated_delivery_date ? 
                              new Date(delivery.estimated_delivery_date).toLocaleDateString() : 
                              'TBD'
                            }
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedDelivery(delivery);
                            setShowDetailsModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedDelivery(delivery);
                            setShowEditModal(true);
                          }}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredDeliveries.length === 0 && (
          <div className="text-center py-12">
            <Truck className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No shipments found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Shipments will appear here when customers place orders.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Delivery Details Modal */}
      {showDetailsModal && selectedDelivery && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Shipment Details</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Tracking Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-md font-semibold text-gray-900 mb-3">Tracking Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Tracking Number:</span>
                    <div className="font-mono text-gray-900">{selectedDelivery.tracking_number}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Carrier:</span>
                    <div className="text-gray-900">{selectedDelivery.carrier}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <div className="text-gray-900">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[selectedDelivery.status].color}`}>
                        {statusConfig[selectedDelivery.status].label}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Created:</span>
                    <div className="text-gray-900">{formatDate(selectedDelivery.created_at)}</div>
                  </div>
                </div>
              </div>

              {/* Order Information */}
              {selectedDelivery.orders && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Order Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Order Number:</span>
                      <div className="text-gray-900">#{selectedDelivery.orders.order_number}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Customer:</span>
                      <div className="text-gray-900">
                        {selectedDelivery.orders.profiles ? 
                          `${selectedDelivery.orders.profiles.first_name} ${selectedDelivery.orders.profiles.last_name}` : 
                          'N/A'
                        }
                      </div>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500">Email:</span>
                      <div className="text-gray-900">{selectedDelivery.orders.profiles?.email || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Delivery Address */}
              {selectedDelivery.orders?.addresses && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Delivery Address</h4>
                  <div className="text-sm text-gray-900">
                    <div>{selectedDelivery.orders.addresses.first_name} {selectedDelivery.orders.addresses.last_name}</div>
                    <div>{selectedDelivery.orders.addresses.address_line_1}</div>
                    <div>
                      {selectedDelivery.orders.addresses.city}, {selectedDelivery.orders.addresses.state} {selectedDelivery.orders.addresses.postal_code}
                    </div>
                    <div>{selectedDelivery.orders.addresses.country}</div>
                  </div>
                </div>
              )}

              {/* Delivery Dates */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-md font-semibold text-gray-900 mb-3">Delivery Timeline</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Estimated Delivery:</span>
                    <div className="text-gray-900">
                      {selectedDelivery.estimated_delivery_date ? 
                        new Date(selectedDelivery.estimated_delivery_date).toLocaleDateString() : 
                        'TBD'
                      }
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Actual Delivery:</span>
                    <div className="text-gray-900">
                      {selectedDelivery.actual_delivery_date ? 
                        formatDate(selectedDelivery.actual_delivery_date) : 
                        'Not delivered yet'
                      }
                    </div>
                  </div>
                </div>
              </div>

              {/* Shipping Label */}
              {selectedDelivery.shipping_label_url && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Shipping Label</h4>
                  <a
                    href={selectedDelivery.shipping_label_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    View Shipping Label
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Status Modal */}
      {showEditModal && selectedDelivery && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Update Shipment Status</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tracking Number
                </label>
                <div className="text-sm text-gray-900 font-mono bg-gray-100 p-2 rounded">
                  {selectedDelivery.tracking_number}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Status
                </label>
                <div className="text-sm">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[selectedDelivery.status].color}`}>
                    {statusConfig[selectedDelivery.status].label}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Update Status
                </label>
                <select
                  defaultValue={selectedDelivery.status}
                  onChange={(e) => {
                    if (e.target.value !== selectedDelivery.status) {
                      handleStatusUpdate(selectedDelivery.id, e.target.value);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="in_transit">In Transit</option>
                  <option value="delivered">Delivered</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
