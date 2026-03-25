'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Payment, OrderWithDetails } from '@/types/database';
import { 
  CreditCardIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  RotateCcw
} from 'lucide-react';
import PaymentForm from './PaymentForm';

interface PaymentWithOrder extends Payment {
  order?: OrderWithDetails;
}

export default function PaymentManagement() {
  const [payments, setPayments] = useState<PaymentWithOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'failed' | 'refunded'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearchTerm(searchTerm), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    fetchPayments();
  }, [filter, debouncedSearchTerm, dateFrom, dateTo, minAmount, maxAmount, page, pageSize]);

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

  const fetchPayments = async () => {
    try {
      setLoading(true);
      console.log('Fetching payments...');
      
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('payments')
        .select(`
          *,
          order:orders(
            id,
            order_number,
            status,
            total_amount,
            user:profiles(
              id,
              first_name,
              last_name,
              email
            )
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply status filter
      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      // Apply date range filter (by created_at)
      const createdAtFrom = toISOStart(dateFrom);
      if (createdAtFrom) {
        query = query.gte('created_at', createdAtFrom);
      }

      const createdAtTo = toISOEnd(dateTo);
      if (createdAtTo) {
        query = query.lte('created_at', createdAtTo);
      }

      // Apply amount range filter (by amount)
      const min = minAmount.trim() ? Number(minAmount) : null;
      if (min !== null && Number.isFinite(min)) {
        query = query.gte('amount', min);
      }

      const max = maxAmount.trim() ? Number(maxAmount) : null;
      if (max !== null && Number.isFinite(max)) {
        query = query.lte('amount', max);
      }

      // Apply search filter
      if (debouncedSearchTerm) {
        query = query.or(`transaction_id.ilike.%${debouncedSearchTerm}%,order.order_number.ilike.%${debouncedSearchTerm}%`);
      }

      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching payments:', error);
        alert(`Error fetching payments: ${error.message}`);
        return;
      }

      console.log('Payments fetched successfully:', data);
      setPayments(data || []);
      setTotalCount(typeof count === 'number' ? count : 0);
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred while fetching payments. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  const handleEditPaymentStatus = (payment: Payment) => {
    setEditingPayment(payment);
    setShowForm(true);
  };

  const handleDeletePayment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting payment:', error);
        alert('Error deleting payment. Please try again.');
        return;
      }

      setPayments(payments.filter(p => p.id !== id));
      alert('Payment deleted successfully!');
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
    }
  };

  const handleUpdatePaymentStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) {
        console.error('Error updating payment status:', error);
        alert('Error updating payment status. Please try again.');
        return;
      }

      setPayments(payments.map(p => 
        p.id === id ? { ...p, status: newStatus as any } : p
      ));
      alert('Payment status updated successfully!');
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'refunded':
        return <RotateCcw className="h-5 w-5 text-blue-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const totalPages = totalCount ? Math.ceil(totalCount / pageSize) : 1;
  const canGoPrev = page > 1;
  const canGoNext = totalCount ? page < totalPages : payments.length === pageSize;

  return (
    <div className="w-full min-w-0 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Management</h1>
          <p className="text-gray-600">View and manage payment statuses</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by transaction ID or order number..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value as any);
                setPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Date from</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Min amount</label>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              value={minAmount}
              onChange={(e) => {
                setMinAmount(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="0.00"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Max amount</label>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              value={maxAmount}
              onChange={(e) => {
                setMaxAmount(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="w-full min-w-0 overflow-hidden rounded-lg border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <CreditCardIcon className="h-8 w-8 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {payment.transaction_id || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {payment.id.slice(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {payment.order?.order_number || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {payment.order?.user?.first_name} {payment.order?.user?.last_name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(payment.amount, payment.currency)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {payment.payment_method.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(payment.status)}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                        {payment.status.toUpperCase()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(payment.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEditPaymentStatus(payment)}
                      className="text-primary-600 hover:text-primary-900 text-xs px-2 py-1 border border-primary-300 rounded hover:bg-primary-50"
                    >
                      Update Status
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {payments.length === 0 && (
          <div className="text-center py-12">
            <CreditCardIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No payments found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filter !== 'all' || dateFrom || dateTo || minAmount || maxAmount
                ? 'Try adjusting your search or filter criteria.'
                : 'Payments will appear here when customers place orders.'
              }
            </p>
          </div>
        )}

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
      </div>

      {/* Payment Form Modal */}
      {showForm && (
        <PaymentForm
          payment={editingPayment}
          onClose={() => {
            setShowForm(false);
            setEditingPayment(null);
          }}
          onSave={() => {
            setShowForm(false);
            setEditingPayment(null);
            fetchPayments();
          }}
        />
      )}
    </div>
  );
}
