'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  DollarSign, 
  TrendingUp, 
  CreditCard, 
  Users, 
  Package, 
  Calendar,
  ArrowUpIcon,
  ArrowDownIcon,
  EyeIcon
} from 'lucide-react';
import RealTimeFinanceMonitor from './RealTimeFinanceMonitor';

interface FinanceSummary {
  total_revenue: number;
  commission_revenue: number;
  subscription_revenue: number;
  advertising_revenue: number;
  other_revenue: number;
  total_transactions: number;
  pending_payouts: number;
}

interface VendorFinancialSummary {
  vendor_id: string;
  total_orders: number;
  total_sales: number;
  total_commission: number;
  pending_commission: number;
  paid_commission: number;
  average_commission_rate: number;
}

interface RecentTransaction {
  id: string;
  transaction_type: string;
  amount: number;
  description?: string;
  status: string;
  created_at: string;
}

export default function FinanceDashboard() {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const [financeSummary, setFinanceSummary] = useState<FinanceSummary | null>(null);
  const [vendorSummaries, setVendorSummaries] = useState<VendorFinancialSummary[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [topVendors, setTopVendors] = useState<VendorFinancialSummary[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, [dateRange]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadFinanceSummary(),
        loadVendorSummaries(),
        loadRecentTransactions(),
        loadTopVendors()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFinanceSummary = async () => {
    try {
      // Get real-time summary
      const { data: realtimeData, error: realtimeError } = await supabase.rpc('get_realtime_finance_summary');
      
      if (realtimeError) {
        console.error('Error loading real-time summary:', realtimeError);
      }
      
      // Get historical summary for the date range
      const { data, error } = await supabase.rpc('get_admin_financial_summary', {
        start_date: dateRange.start,
        end_date: dateRange.end
      });
      
      if (error) {
        console.error('Error loading admin financial summary:', error);
        // Set default values on error
        setFinanceSummary({
          total_revenue: 0,
          commission_revenue: 0,
          subscription_revenue: 0,
          advertising_revenue: 0,
          other_revenue: 0,
          total_transactions: 0,
          pending_payouts: 0
        });
        return;
      }
      
      if (data && data.length > 0) {
        // Merge real-time data with historical data
        const summary = data[0];
         if (realtimeData && realtimeData.length > 0) {
           const realtime = realtimeData[0];
           setFinanceSummary({
             ...summary,
             total_revenue: realtime.total_revenue_today || summary.total_revenue,
             commission_revenue: realtime.admin_revenue_today || summary.commission_revenue,
             pending_payouts: realtime.pending_payouts || summary.pending_payouts,
             total_transactions: realtime.total_orders_today || summary.total_transactions
           });
         } else {
           setFinanceSummary(summary);
         }
      } else {
        // Set default values if no data
        setFinanceSummary({
          total_revenue: 0,
          commission_revenue: 0,
          subscription_revenue: 0,
          advertising_revenue: 0,
          other_revenue: 0,
          total_transactions: 0,
          pending_payouts: 0
        });
      }
    } catch (error) {
      console.error('Error in loadFinanceSummary:', error);
      setFinanceSummary({
        total_revenue: 0,
        commission_revenue: 0,
        subscription_revenue: 0,
        advertising_revenue: 0,
        other_revenue: 0,
        total_transactions: 0,
        pending_payouts: 0
      });
    }
  };

  const loadVendorSummaries = async () => {
    // Use the new performance metrics function
    const { data, error } = await supabase.rpc('get_vendor_performance_metrics', {
      vendor_uuid: null, // Get all vendors
      days_back: Math.ceil((new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime()) / (1000 * 60 * 60 * 24))
    });
    
    if (error) {
      console.error('Error loading vendor summaries:', error);
      // Set empty array on error
      setVendorSummaries([]);
      return;
    }
    
    // Transform the data to match the expected interface
    const summaries = (data || []).map((vendor: any) => ({
      vendor_id: vendor.vendor_id,
      business_name: vendor.business_name,
      email: vendor.email,
      total_orders: vendor.total_orders,
      total_sales: vendor.total_sales,
      total_commission: vendor.total_commission,
      pending_commission: vendor.pending_commission,
      paid_commission: vendor.total_commission - vendor.pending_commission,
      average_commission_rate: vendor.commission_rate
    }));
    
    setVendorSummaries(summaries);
  };

  const loadRecentTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('finance_transactions')
        .select('id, transaction_type, amount, description, status, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) {
        console.error('Error loading recent transactions:', error);
        setRecentTransactions([]);
        return;
      }
      
      setRecentTransactions(data || []);
    } catch (error) {
      console.error('Error in loadRecentTransactions:', error);
      setRecentTransactions([]);
    }
  };

  const loadTopVendors = async () => {
    try {
      // Use the performance metrics function which includes business_name
      const { data, error } = await supabase.rpc('get_vendor_performance_metrics', {
        vendor_uuid: null, // Get all vendors
        days_back: Math.ceil((new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime()) / (1000 * 60 * 60 * 24))
      });
      
      if (error) {
        console.error('Error loading top vendors:', error);
        setTopVendors([]);
        return;
      }
      
      // Sort by total sales and take top 5
      const topVendors = (data || [])
        .sort((a: any, b: any) => b.total_sales - a.total_sales)
        .slice(0, 5)
        .map((vendor: any) => ({
          vendor_id: vendor.vendor_id,
          business_name: vendor.business_name,
          email: vendor.email,
          total_orders: vendor.total_orders,
          total_sales: vendor.total_sales,
          total_commission: vendor.total_commission,
          pending_commission: vendor.pending_commission,
          paid_commission: vendor.total_commission - vendor.pending_commission,
          average_commission_rate: vendor.commission_rate
        }));
      
      setTopVendors(topVendors);
    } catch (error) {
      console.error('Error in loadTopVendors:', error);
      setTopVendors([]);
    }
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
      completed: 'bg-green-100 text-green-800',
      paid: 'bg-green-100 text-green-800',
      processing: 'bg-blue-100 text-blue-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'sale_commission':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'vendor_payout':
        return <CreditCard className="h-4 w-4 text-blue-600" />;
      case 'admin_revenue':
        return <DollarSign className="h-4 w-4 text-purple-600" />;
      default:
        return <DollarSign className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-end items-center">
        <div className="flex gap-4">
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
            onClick={loadDashboardData}
            disabled={loading}
            className="mt-6 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Real-Time Monitor */}
      <div className="mb-6">
        <RealTimeFinanceMonitor />
      </div>

      {/* Quick Actions */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/admin/finance"
          className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
        >
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h3 className="font-medium text-gray-900">Finance Overview</h3>
              <p className="text-sm text-gray-600">View detailed financial reports</p>
            </div>
          </div>
        </Link>
        
        <Link
          href="/admin/finance/payouts"
          className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
        >
          <div className="flex items-center">
            <CreditCard className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <h3 className="font-medium text-gray-900">Vendor Payouts</h3>
              <p className="text-sm text-gray-600">Manage vendor commission payouts</p>
            </div>
          </div>
        </Link>
        
        <Link
          href="/admin/finance/revenues"
          className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
        >
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <h3 className="font-medium text-gray-900">Revenue Management</h3>
              <p className="text-sm text-gray-600">Track admin revenue streams</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Finance Summary Cards */}
      {financeSummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(financeSummary.total_revenue)}
                </p>
              </div>
            </div>
          </div>

           <div className="bg-white p-6 rounded-lg shadow">
             <div className="flex items-center">
               <div className="p-2 bg-blue-100 rounded-lg">
                 <TrendingUp className="h-6 w-6 text-blue-600" />
               </div>
               <div className="ml-4">
                 <p className="text-sm font-medium text-gray-600">Admin Commission Revenue</p>
                 <p className="text-2xl font-bold text-gray-900">
                   {formatCurrency(financeSummary.commission_revenue)}
                 </p>
               </div>
             </div>
           </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Subscription Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(financeSummary.subscription_revenue)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <CreditCard className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Payouts</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(financeSummary.pending_payouts)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Vendors */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Top Performing Vendors</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {topVendors.length > 0 ? (
                topVendors.map((vendor, index) => (
                  <div key={vendor.vendor_id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">#{index + 1}</span>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {(vendor as any).business_name || 'Unknown Vendor'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(vendor as any).email || vendor.vendor_id.slice(0, 8) + '...'} • {vendor.total_orders} orders • {vendor.average_commission_rate.toFixed(1)}% commission
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(vendor.total_sales)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatCurrency(vendor.total_commission)} commission
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No vendor performance data available</p>
                  <p className="text-sm">Try adjusting the date range or check if vendors have completed orders</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Transactions</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        {getTransactionIcon(transaction.transaction_type)}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {transaction.transaction_type.replace('_', ' ').toUpperCase()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {transaction.description || 'No description'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(transaction.amount)}
                      </p>
                      <div className="mt-1">
                        {getStatusBadge(transaction.status)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No recent transactions found</p>
                  <p className="text-sm">Transactions will appear here as orders are processed</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Vendor Performance Summary */}
      <div className="mt-6 bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Vendor Performance Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orders
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Sales
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commission
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pending
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vendorSummaries.length > 0 ? (
                vendorSummaries.slice(0, 10).map((summary, index) => (
                  <tr key={summary.vendor_id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {(summary as any).business_name || 'Unknown Vendor'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {(summary as any).email || summary.vendor_id?.slice(0, 8) + '...'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {summary.total_orders}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(summary.total_sales)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(summary.total_commission)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(summary.pending_commission)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {summary.average_commission_rate.toFixed(2)}%
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    <div>
                      <p className="text-lg font-medium">No vendor data available</p>
                      <p className="text-sm mt-1">Try adjusting the date range or check if vendors have completed orders</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {vendorSummaries.length > 10 && (
          <div className="px-6 py-4 border-t border-gray-200 text-center">
            <Link
              href="/admin/finance"
              className="text-blue-600 hover:text-blue-900 text-sm font-medium"
            >
              View all vendors →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
