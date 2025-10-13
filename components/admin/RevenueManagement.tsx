'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface AdminRevenue {
  id: string;
  revenue_type: string;
  source_id?: string;
  source_type?: string;
  amount: number;
  currency: string;
  description?: string;
  period_start?: string;
  period_end?: string;
  status: string;
  transaction_id?: string;
  created_at: string;
  updated_at: string;
}

interface RevenueSummary {
  total_revenue: number;
  commission_revenue: number;
  subscription_revenue: number;
  advertising_revenue: number;
  other_revenue: number;
  total_transactions: number;
  pending_payouts: number;
}

export default function RevenueManagement() {
  const [revenues, setRevenues] = useState<AdminRevenue[]>([]);
  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  // Form state
  const [revenueType, setRevenueType] = useState('subscription');
  const [sourceType, setSourceType] = useState('vendor');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');

  useEffect(() => {
    loadData();
  }, [dateRange]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadRevenues(),
        loadSummary()
      ]);
    } catch (error) {
      console.error('Error loading revenue data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRevenues = async () => {
    const { data, error } = await supabase
      .from('admin_revenues')
      .select('*')
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    setRevenues(data || []);
  };

  const loadSummary = async () => {
    const { data, error } = await supabase.rpc('get_admin_financial_summary', {
      start_date: dateRange.start,
      end_date: dateRange.end
    });
    
    if (error) throw error;
    if (data && data.length > 0) {
      setSummary(data[0]);
    }
  };

  const createRevenue = async () => {
    if (!amount || !description) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_revenues')
        .insert({
          revenue_type: revenueType,
          source_type: sourceType,
          amount: parseFloat(amount),
          description: description,
          period_start: periodStart || null,
          period_end: periodEnd || null,
          status: 'confirmed'
        })
        .select()
        .single();
      
      if (error) throw error;

      // Create finance transaction
      const { error: transactionError } = await supabase
        .from('finance_transactions')
        .insert({
          transaction_type: 'admin_revenue',
          amount: parseFloat(amount),
          description: description,
          status: 'completed',
          reference_id: data.id
        });
      
      if (transactionError) throw transactionError;

      alert('Revenue record created successfully');
      setShowCreateModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error creating revenue:', error);
      alert('Error creating revenue record');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setRevenueType('subscription');
    setSourceType('vendor');
    setAmount('');
    setDescription('');
    setPeriodStart('');
    setPeriodEnd('');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getRevenueTypeColor = (type: string) => {
    const colors = {
      commission: 'bg-blue-100 text-blue-800',
      subscription: 'bg-green-100 text-green-800',
      advertising: 'bg-purple-100 text-purple-800',
      listing_fee: 'bg-yellow-100 text-yellow-800',
      premium_features: 'bg-indigo-100 text-indigo-800',
      other: 'bg-gray-100 text-gray-800'
    };
    
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-end items-center">
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Add Revenue
        </button>
      </div>

      {/* Date Range Filter */}
      <div className="mb-6 flex gap-4 items-center">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            className="border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            className="border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="mt-6 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Revenue Summary */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-2xl">💰</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(summary.total_revenue)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-2xl">📊</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Commission Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(summary.commission_revenue)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <span className="text-2xl">📈</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Subscription Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(summary.subscription_revenue)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <span className="text-2xl">📢</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Advertising Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(summary.advertising_revenue)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revenue Records */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Revenue Records</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {revenues.map((revenue) => (
                <tr key={revenue.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRevenueTypeColor(revenue.revenue_type)}`}>
                      {revenue.revenue_type.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {revenue.source_type?.toUpperCase() || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(revenue.amount)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {revenue.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {revenue.period_start && revenue.period_end 
                      ? `${formatDate(revenue.period_start)} - ${formatDate(revenue.period_end)}`
                      : 'N/A'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(revenue.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(revenue.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Revenue Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add Revenue Record</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Revenue Type
                </label>
                <select
                  value={revenueType}
                  onChange={(e) => setRevenueType(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="subscription">Subscription</option>
                  <option value="advertising">Advertising</option>
                  <option value="listing_fee">Listing Fee</option>
                  <option value="premium_features">Premium Features</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Source Type
                </label>
                <select
                  value={sourceType}
                  onChange={(e) => setSourceType(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="vendor">Vendor</option>
                  <option value="user">User</option>
                  <option value="advertiser">Advertiser</option>
                  <option value="system">System</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="0.00"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                  placeholder="Describe the revenue source..."
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Period Start (Optional)
                </label>
                <input
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Period End (Optional)
                </label>
                <input
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={createRevenue}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Revenue'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
