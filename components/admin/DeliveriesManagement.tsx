'use client';

import { useMemo, useState, useEffect } from 'react';
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
  MapPin,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface DeliveryBoy {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
}

interface Delivery {
  id: string;
  order_id: string;
  tracking_number: string;
  carrier: string;
  status: 'pending' | 'in_transit' | 'delivered' | 'failed';
  estimated_delivery_date: string;
  actual_delivery_date?: string;
  shipping_label_url?: string;
  assigned_delivery_boy_id?: string | null;
  assigned_at?: string | null;
  assigned_delivery_boy?: DeliveryBoy | null;
  created_at: string;
  updated_at: string;
  order?: {
    id: string;
    order_number: string;
    status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
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
      district: string;
      neighborhood: string;
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

const orderStatusConfig = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800', icon: Package },
  processing: { label: 'Processing', color: 'bg-blue-100 text-blue-800', icon: Package },
  shipped: { label: 'Shipped', color: 'bg-purple-100 text-purple-800', icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle },
  returned: { label: 'Returned', color: 'bg-red-100 text-red-800', icon: XCircle }
};

const deliveryStatusOrder: Delivery['status'][] = ['pending', 'in_transit', 'delivered', 'failed'];
const deliveryStatusRank = (s: Delivery['status']) => deliveryStatusOrder.indexOf(s);

export default function DeliveriesManagement() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deliveryBoys, setDeliveryBoys] = useState<DeliveryBoy[]>([]);
  const [editStatus, setEditStatus] = useState<Delivery['status']>('pending');
  const [editAssignedBoyId, setEditAssignedBoyId] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearchTerm(searchTerm), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    fetchDeliveries();
  }, []);

  useEffect(() => {
    fetchDeliveryBoys();
  }, []);

  useEffect(() => {
    if (!showEditModal || !selectedDelivery) return;
    setEditStatus(selectedDelivery.status);
    setEditAssignedBoyId(selectedDelivery.assigned_delivery_boy_id ?? '');
  }, [showEditModal, selectedDelivery]);

  const toISOStart = (dateStr: string) => {
    if (!dateStr) return null;
    const d = new Date(`${dateStr}T00:00:00.000Z`);
    return isNaN(d.getTime()) ? null : d.toISOString();
  };

  const toISOEnd = (dateStr: string) => {
    if (!dateStr) return null;
    const d = new Date(`${dateStr}T23:59:59.999Z`);
    return isNaN(d.getTime()) ? null : d.toISOString();
  };

  const mapDeliveryToOrderStatus = (deliveryStatus: string): string => {
    switch (deliveryStatus) {
      case 'pending':
        return 'processing';
      case 'in_transit':
        return 'shipped';
      case 'delivered':
        return 'delivered';
      case 'failed':
        return 'cancelled';
      default:
        return 'processing';
    }
  };

  const isStatusSynced = (deliveryStatus: string, orderStatus?: string) => {
    if (!orderStatus) return true; // No order means synced
    
    const expectedOrderStatus = mapDeliveryToOrderStatus(deliveryStatus);
    return expectedOrderStatus === orderStatus;
  };

  const syncDeliveryOrderStatus = async (deliveryId: string) => {
    try {
      const { error } = await supabase.rpc('sync_delivery_order_status', {
        delivery_id_param: deliveryId
      });

      if (error) throw error;

      // Refresh deliveries to get updated status
      await fetchDeliveries();
    } catch (error) {
      console.error('Error syncing delivery order status:', error);
    }
  };

  const fetchDeliveryBoys = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .eq('role', 'delivery_boy')
        .eq('is_active', true)
        .order('first_name', { ascending: true });

      if (error) {
        console.error('Error fetching delivery boys:', error);
        setDeliveryBoys([]);
        return;
      }

      setDeliveryBoys((data as any) || []);
    } catch (error) {
      console.error('Error fetching delivery boys:', error);
      setDeliveryBoys([]);
    }
  };

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('deliveries')
        .select(`
          *,
          assigned_delivery_boy:profiles!assigned_delivery_boy_id(
            id,
            first_name,
            last_name,
            email
          ),
          order:orders(
            id,
            order_number,
            status,
            user:profiles(
              id,
              first_name,
              last_name,
              email
            ),
            shipping_address:addresses!shipping_address_id(
              first_name,
              last_name,
              address_line_1,
              city,
              district,
              neighborhood,
              country
            )
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        // Fetch a reasonable working set once; filters/search are applied client-side
        // to avoid "loading" on every keystroke or filter tweak.
        .range(0, 999);

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching deliveries:', error);
        alert(`Error fetching deliveries: ${error.message}`);
        setDeliveries([]);
        return;
      }

      setDeliveries(data || []);
    } catch (error) {
      console.error('Error fetching deliveries:', error);
      alert('An error occurred while fetching deliveries. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleShipmentUpdate = async () => {
    try {
      if (!selectedDelivery) return;
      // Prevent backwards status updates (forward-only)
      if (deliveryStatusRank(editStatus) !== -1 && deliveryStatusRank(selectedDelivery.status) !== -1) {
        if (deliveryStatusRank(editStatus) < deliveryStatusRank(selectedDelivery.status)) {
          alert('Shipment status can only move forward.');
          return;
        }
        // Prevent leaving terminal states
        if (['delivered', 'failed'].includes(selectedDelivery.status) && editStatus !== selectedDelivery.status) {
          alert('This shipment is in a terminal state and cannot be changed.');
          return;
        }
      }

      setSaving(true);

      const assignedId = editAssignedBoyId ? editAssignedBoyId : null;
      const assigneeChanged = (selectedDelivery.assigned_delivery_boy_id ?? null) !== assignedId;

      const updateData: any = {
        status: editStatus,
        assigned_delivery_boy_id: assignedId
      };
      
      if (editStatus === 'delivered') {
        updateData.actual_delivery_date = new Date().toISOString();
      }
      if (assigneeChanged) {
        updateData.assigned_at = assignedId ? new Date().toISOString() : null;
      }

      const { error } = await supabase
        .from('deliveries')
        .update(updateData)
        .eq('id', selectedDelivery.id);

      if (error) {
        console.error('Error updating shipment:', error);
        alert('Error updating shipment. Please try again.');
        return;
      }

      // Update local state
      setDeliveries(prev => 
        prev.map(delivery => 
          delivery.id === selectedDelivery.id 
            ? { ...delivery, ...updateData }
            : delivery
        )
      );

      setShowEditModal(false);
      setSelectedDelivery(null);
      alert('Shipment updated successfully!');
    } catch (error) {
      console.error('Error updating shipment:', error);
      alert('Error updating shipment. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const filteredDeliveries = useMemo(() => {
    const s = debouncedSearchTerm.trim().toLowerCase();
    const createdAtFrom = toISOStart(dateFrom);
    const createdAtTo = toISOEnd(dateTo);

    const matchesSearch = (d: Delivery) => {
      if (!s) return true;
      const assigneeFullName = `${d.assigned_delivery_boy?.first_name ?? ''} ${d.assigned_delivery_boy?.last_name ?? ''}`.trim();
      const fields = [
        d.tracking_number,
        d.carrier,
        d.order?.order_number,
        d.order?.user?.first_name,
        d.order?.user?.last_name,
        d.order?.user?.email,
        d.assigned_delivery_boy?.first_name,
        d.assigned_delivery_boy?.last_name,
        d.assigned_delivery_boy?.email,
        assigneeFullName
      ];
      return fields
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(s));
    };

    const matchesStatus = (d: Delivery) =>
      statusFilter === 'all' ? true : d.status === statusFilter;

    const matchesDate = (d: Delivery) => {
      if (!createdAtFrom && !createdAtTo) return true;
      const created = new Date(d.created_at).toISOString();
      if (createdAtFrom && created < createdAtFrom) return false;
      if (createdAtTo && created > createdAtTo) return false;
      return true;
    };

    return deliveries.filter((d) => matchesStatus(d) && matchesDate(d) && matchesSearch(d));
  }, [deliveries, debouncedSearchTerm, statusFilter, dateFrom, dateTo]);

  const totalCount = filteredDeliveries.length;
  const totalPages = totalCount ? Math.ceil(totalCount / pageSize) : 1;
  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  const pagedDeliveries = useMemo(() => {
    const from = (page - 1) * pageSize;
    return filteredDeliveries.slice(from, from + pageSize);
  }, [filteredDeliveries, page, pageSize]);

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
    <div className="w-full min-w-0 space-y-6">
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
              {totalCount} shipments
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
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
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

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Date from</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Date to</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Deliveries Table */}
      <div className="w-full min-w-0 overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max divide-y divide-gray-200">
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
                  Order Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Delivery Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned To
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
              {pagedDeliveries.map((delivery) => {
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
                        {delivery.order?.order_number ? `#${delivery.order.order_number}` : 
                         delivery.order_id ? `Order: ${delivery.order_id.slice(0, 8)}...` : 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(delivery.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {delivery.order?.user ? 
                          `${delivery.order.user.first_name || ''} ${delivery.order.user.last_name || ''}`.trim() || 'N/A' : 
                          'N/A'
                        }
                      </div>
                      <div className="text-sm text-gray-500">
                        {delivery.order?.user?.email || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {delivery.order?.status ? (
                          <>
                            {(() => {
                              const OrderStatusIcon = orderStatusConfig[delivery.order.status].icon;
                              return <OrderStatusIcon className="h-3 w-3 mr-1" />;
                            })()}
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${orderStatusConfig[delivery.order.status].color}`}>
                              {orderStatusConfig[delivery.order.status].label}
                            </span>
                            {!isStatusSynced(delivery.status, delivery.order.status) && (
                              <AlertCircle className="ml-1 h-3 w-3 text-primary-500" />
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-gray-400">No order</span>
                        )}
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
                        {delivery.assigned_delivery_boy ? (
                          `${delivery.assigned_delivery_boy.first_name || ''} ${delivery.assigned_delivery_boy.last_name || ''}`.trim() ||
                          delivery.assigned_delivery_boy.email ||
                          'Assigned'
                        ) : (
                          <span className="text-gray-400">Unassigned</span>
                        )}
                      </div>
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
                        {delivery.order?.status && !isStatusSynced(delivery.status, delivery.order.status) && (
                          <button
                            onClick={() => syncDeliveryOrderStatus(delivery.id)}
                            className="text-primary-500 hover:text-primary-600"
                            title="Sync status"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </button>
                        )}
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

        {pagedDeliveries.length === 0 && (
          <div className="text-center py-12">
            <Truck className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No shipments found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all' || dateFrom || dateTo
                ? 'Try adjusting your search or filter criteria.'
                : 'Shipments will appear here when customers place orders.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-t bg-gray-50">
        <div className="text-sm text-gray-600">
          {totalCount ? (
            <>
              Showing{' '}
              <span className="font-medium text-gray-900">
                {Math.min((page - 1) * pageSize + 1, totalCount)}
              </span>
              -
              <span className="font-medium text-gray-900">
                {Math.min(page * pageSize, totalCount)}
              </span>{' '}
              of <span className="font-medium text-gray-900">{totalCount}</span>
            </>
          ) : (
            <>No results to paginate</>
          )}
        </div>

        <div className="flex items-center gap-2 justify-between sm:justify-end">
          <div className="flex items-center gap-2">
            <button
              disabled={!canGoPrev}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed bg-white hover:bg-gray-100"
            >
              Previous
            </button>

            <div className="text-sm text-gray-700 px-2">
              Page <span className="font-medium text-gray-900">{page}</span> of{' '}
              <span className="font-medium text-gray-900">{totalPages}</span>
            </div>

            <button
              disabled={!canGoNext}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed bg-white hover:bg-gray-100"
            >
              Next
            </button>
          </div>

          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm bg-white"
            aria-label="Page size"
          >
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
          </select>
        </div>
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
              {selectedDelivery.order && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Order Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Order Number:</span>
                      <div className="text-gray-900">#{selectedDelivery.order.order_number}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Customer:</span>
                      <div className="text-gray-900">
                        {selectedDelivery.order.user ? 
                          `${selectedDelivery.order.user.first_name} ${selectedDelivery.order.user.last_name}` : 
                          'N/A'
                        }
                      </div>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500">Email:</span>
                      <div className="text-gray-900">{selectedDelivery.order.user?.email || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Delivery Address */}
              {selectedDelivery.order?.shipping_address && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Delivery Address</h4>
                  <div className="text-sm text-gray-900">
                    <div>{selectedDelivery.order.shipping_address.first_name} {selectedDelivery.order.shipping_address.last_name}</div>
                    <div>{selectedDelivery.order.shipping_address.address_line_1}</div>
                    <div>
                      {selectedDelivery.order.shipping_address.city}, {selectedDelivery.order.shipping_address.district}{' '}
                      {selectedDelivery.order.shipping_address.neighborhood}
                    </div>
                    <div>{selectedDelivery.order.shipping_address.country}</div>
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

              {/* Assigned Delivery Boy */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-md font-semibold text-gray-900 mb-3">Assignment</h4>
                <div className="text-sm text-gray-900">
                  {selectedDelivery.assigned_delivery_boy ? (
                    <>
                      <div>
                        {(selectedDelivery.assigned_delivery_boy.first_name || '')}{' '}
                        {(selectedDelivery.assigned_delivery_boy.last_name || '')}
                      </div>
                      <div className="text-gray-600">{selectedDelivery.assigned_delivery_boy.email || ''}</div>
                    </>
                  ) : (
                    <div className="text-gray-500">Unassigned</div>
                  )}
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
              <h3 className="text-lg font-semibold text-gray-900">Update Shipment</h3>
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
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as Delivery['status'])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {deliveryStatusOrder
                    .filter((s) => deliveryStatusRank(s) >= deliveryStatusRank(selectedDelivery.status))
                    .map((s) => (
                      <option key={s} value={s}>
                        {s === 'in_transit' ? 'In Transit' : s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign Delivery Boy
                </label>
                <select
                  value={editAssignedBoyId}
                  onChange={(e) => setEditAssignedBoyId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Unassigned</option>
                  {deliveryBoys.map((boy) => {
                    const label =
                      `${boy.first_name || ''} ${boy.last_name || ''}`.trim() ||
                      boy.email ||
                      boy.id;
                    return (
                      <option key={boy.id} value={boy.id}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleShipmentUpdate}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
