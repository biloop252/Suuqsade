'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Pagination from './Pagination';
import FinanceKpiStrip, { type FinanceKpiMetrics } from './FinanceKpiStrip';
import AddRevenueRecordModal from './AddRevenueRecordModal';
import CreateVendorPayoutModal from './CreateVendorPayoutModal';

interface VendorFinancialSummary {
  vendor_id: string;
  total_orders: number;
  total_sales: number;
  total_commission: number;
  pending_commission: number;
  paid_commission: number;
  average_commission_rate: number;
}

interface VendorCommissionRevenue {
  vendor_id: string;
  business_name: string;
  total_sales: number;
  total_commission_revenue: number;
  total_orders: number;
  average_order_value: number;
  commission_rate: number;
  last_sale_date: string;
}

interface FinanceTransaction {
  id: string;
  transaction_type: string;
  order_id?: string;
  vendor_id?: string;
  user_id?: string;
  amount: number;
  currency: string;
  description?: string;
  status: string;
  reference_id?: string;
  metadata?: any;
  processed_at?: string;
  created_at: string;
  updated_at: string;
}

interface VendorCommission {
  id: string;
  order_id: string;
  vendor_id: string;
  order_item_id: string;
  product_id?: string;
  commission_rate: number;
  order_amount: number;
  commission_amount: number;
  admin_amount: number;
  status: string;
  paid_at?: string;
  payout_transaction_id?: string;
  created_at: string;
  updated_at: string;
}

interface VendorPayout {
  id: string;
  vendor_id: string;
  payout_period_start: string;
  payout_period_end: string;
  total_commission: number;
  total_orders: number;
  payout_method: string;
  payout_details: any;
  status: string;
  transaction_id?: string;
  processed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

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

export default function FinanceManagement() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  // State for different data
  const [kpiMetrics, setKpiMetrics] = useState<FinanceKpiMetrics | null>(null);
  const [vendorSummaries, setVendorSummaries] = useState<VendorFinancialSummary[]>([]);
  const [vendorCommissionRevenues, setVendorCommissionRevenues] = useState<VendorCommissionRevenue[]>([]);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [commissions, setCommissions] = useState<VendorCommission[]>([]);
  const [payouts, setPayouts] = useState<VendorPayout[]>([]);
  const [adminRevenues, setAdminRevenues] = useState<AdminRevenue[]>([]);
  const [financialReports, setFinancialReports] = useState<any[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<string>('');

  const [statusEdits, setStatusEdits] = useState<Record<string, string>>({});
  const [savingStatusFor, setSavingStatusFor] = useState<string | null>(null);

  const [addRevenueModalOpen, setAddRevenueModalOpen] = useState(false);
  const [createPayoutModalOpen, setCreatePayoutModalOpen] = useState(false);
  const [payoutModalVendorId, setPayoutModalVendorId] = useState('');

  // Pagination state
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [commissionsPage, setCommissionsPage] = useState(1);
  const [payoutsPage, setPayoutsPage] = useState(1);
  const [adminRevenuesPage, setAdminRevenuesPage] = useState(1);
  const [reportsPage, setReportsPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  useEffect(() => {
    loadFinanceData();
  }, [dateRange, transactionsPage, commissionsPage, payoutsPage, adminRevenuesPage, reportsPage, itemsPerPage]);

  const loadFinanceData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadFinanceKpis(),
        loadVendorSummaries(),
        loadVendorCommissionRevenues(),
        loadTransactions(),
        loadCommissions(),
        loadPayouts(),
        loadAdminRevenues(),
        loadFinancialReports(),
      ]);
    } catch (error) {
      console.error('Error loading finance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFinanceKpis = async () => {
    try {
      const { data, error } = await supabase.rpc('get_finance_dashboard_metrics', {
        start_date: dateRange.start,
        end_date: dateRange.end,
      });

      if (error) {
        console.error('Error loading finance KPIs:', error);
        setKpiMetrics({
          total_sales: 0,
          admin_commission: 0,
          pending_payout: 0,
        });
        return;
      }

      if (data && data.length > 0) {
        const row = data[0] as FinanceKpiMetrics;
        setKpiMetrics({
          total_sales: Number(row.total_sales) || 0,
          admin_commission: Number(row.admin_commission) || 0,
          pending_payout: Number(row.pending_payout) || 0,
        });
      } else {
        setKpiMetrics({
          total_sales: 0,
          admin_commission: 0,
          pending_payout: 0,
        });
      }
    } catch (e) {
      console.error('loadFinanceKpis:', e);
      setKpiMetrics({
        total_sales: 0,
        admin_commission: 0,
        pending_payout: 0,
      });
    }
  };

  const loadVendorSummaries = async () => {
    try {
      // Use the performance metrics function which includes business_name
      const { data, error } = await supabase.rpc('get_vendor_performance_metrics', {
        vendor_uuid: null, // Get all vendors
        days_back: Math.ceil((new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime()) / (1000 * 60 * 60 * 24))
      });
      
      if (error) {
        console.error('Error loading vendor summaries:', error);
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
    } catch (error) {
      console.error('Error in loadVendorSummaries:', error);
      setVendorSummaries([]);
    }
  };

  const loadVendorCommissionRevenues = async () => {
    try {
      console.log('Loading vendor commission revenues...', {
        selectedVendor,
        dateRange,
        start_date: dateRange.start,
        end_date: dateRange.end
      });

      // Try the simpler function first
      const { data, error } = await supabase.rpc('get_vendor_commission_revenue_breakdown_simple', {
        vendor_uuid: selectedVendor || null,
        start_date: dateRange.start,
        end_date: dateRange.end
      });
      
      if (error) {
        console.error('Error loading vendor commission revenues (simple function):', error);
        
        // Try the original function as fallback
        const { data: data2, error: error2 } = await supabase.rpc('get_vendor_commission_revenue_breakdown', {
          vendor_uuid: selectedVendor || null,
          start_date: dateRange.start,
          end_date: dateRange.end
        });
        
        if (error2) {
          console.error('Error loading vendor commission revenues (original function):', error2);
          // Use direct query fallback
          console.log('Both functions failed, using direct query fallback');
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('vendor_commissions')
            .select(`
              vendor_id,
              commission_amount,
              admin_amount,
              order_amount,
              created_at
            `)
            .gte('created_at', dateRange.start)
            .lte('created_at', dateRange.end)
            .order('created_at', { ascending: false });
          
          if (fallbackError) {
            console.error('Fallback query also failed:', fallbackError);
            setVendorCommissionRevenues([]);
            return;
          }
          
          console.log('Fallback query successful, processing data...', fallbackData?.length || 0, 'records');
          
          // Group by vendor for fallback data
          const grouped = (fallbackData || []).reduce((acc, commission) => {
            const vendorId = commission.vendor_id;
            if (!acc[vendorId]) {
              acc[vendorId] = {
                vendor_id: vendorId,
                business_name: 'Unknown Vendor',
                total_sales: 0,
                total_commission_revenue: 0,
                total_orders: 0,
                average_order_value: 0,
                commission_rate: 0,
                last_sale_date: null
              };
            }
            acc[vendorId].total_sales += commission.order_amount;
            acc[vendorId].total_commission_revenue += commission.admin_amount;
            acc[vendorId].total_orders += 1;
            acc[vendorId].last_sale_date = commission.created_at;
            return acc;
          }, {} as Record<string, any>);
          
          // Calculate averages
          Object.values(grouped).forEach((vendor: any) => {
            vendor.average_order_value = vendor.total_orders > 0 ? vendor.total_sales / vendor.total_orders : 0;
          });
          
          const processedData = Object.values(grouped);
          console.log('Processed fallback data:', processedData.length, 'vendors');
          setVendorCommissionRevenues(processedData);
          return;
        }
        
        console.log('Original function successful:', data2?.length || 0, 'records');
        setVendorCommissionRevenues(data2 || []);
        return;
      }
      
      console.log('Simple function successful:', data?.length || 0, 'records');
      setVendorCommissionRevenues(data || []);
    } catch (error) {
      console.error('Error in loadVendorCommissionRevenues:', error);
      setVendorCommissionRevenues([]);
    }
  };

  const loadTransactions = async () => {
    const from = (transactionsPage - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;
    
    const { data, error } = await supabase
      .from('finance_transactions')
      .select('*')
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end)
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (error) throw error;
    setTransactions(data || []);
  };

  const loadCommissions = async () => {
    const from = (commissionsPage - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;
    
    // Use the view instead of the function for now
    const { data, error } = await supabase
      .from('vendor_commissions_with_profiles')
      .select('*')
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end)
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (error) {
      // Fallback to basic query if view doesn't exist
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('vendor_commissions')
        .select('*')
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end)
        .order('created_at', { ascending: false })
        .range(from, to);
      
      if (fallbackError) throw fallbackError;
      setCommissions(fallbackData || []);
    } else {
      setCommissions(data || []);
    }
  };

  const loadPayouts = async () => {
    const from = (payoutsPage - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;
    
    // Try the function first, fallback to basic query
    const { data, error } = await supabase
      .rpc('get_vendor_payouts_with_profiles');
    
    if (error) {
      // Fallback to basic query if function doesn't exist
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('vendor_payouts')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to);
      
      if (fallbackError) throw fallbackError;
      const nextPayouts = fallbackData || [];
      setPayouts(nextPayouts);
      setStatusEdits(() => {
        const next: Record<string, string> = {};
        for (const p of nextPayouts) next[p.id] = p.status;
        return next;
      });
    } else {
      // Apply pagination to the function result
      const paginatedData = data?.slice(from, to + 1) || [];
      setPayouts(paginatedData);
      setStatusEdits(() => {
        const next: Record<string, string> = {};
        for (const p of paginatedData) next[p.id] = p.status;
        return next;
      });
    }
  };

  const savePayoutStatus = async (payoutId: string) => {
    const status = statusEdits[payoutId];
    if (!status) return;

    setSavingStatusFor(payoutId);
    try {
      const isTestAdmin =
        typeof window !== 'undefined' &&
        (window.localStorage.getItem('admin_session') === 'true' ||
          !!window.localStorage.getItem('admin_profile'));

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      const res = await fetch(`/api/admin/finance/payouts/${payoutId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(isTestAdmin ? { 'x-test-admin': 'true' } : {}),
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ status }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(json?.error || 'Failed to update payout status');
        return;
      }

      // Refresh KPI + current payouts table after status change.
      await Promise.all([loadFinanceKpis(), loadPayouts()]);
      alert('Payout status updated successfully');
    } catch (e) {
      alert(`Failed to update payout status: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      setSavingStatusFor(null);
    }
  };

  const loadAdminRevenues = async () => {
    const from = (adminRevenuesPage - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;
    
    try {
      console.log('Loading admin revenues...', {
        dateRange,
        start_date: dateRange.start,
        end_date: dateRange.end,
        from,
        to
      });

      const { data, error } = await supabase
        .from('admin_revenues')
        .select('*')
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end)
        .order('created_at', { ascending: false })
        .range(from, to);
      
      if (error) {
        console.error('Error loading admin revenues:', error);
        setAdminRevenues([]);
        return;
      }
      
      console.log('Admin revenues loaded successfully:', data?.length || 0, 'records');
      setAdminRevenues(data || []);
    } catch (error) {
      console.error('Error in loadAdminRevenues:', error);
      setAdminRevenues([]);
    }
  };

  const loadFinancialReports = async () => {
    const from = (reportsPage - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;
    
    const { data, error } = await supabase
      .from('financial_reports')
      .select(`
        *,
        profiles!financial_reports_generated_by_fkey (
          id,
          first_name,
          last_name
        )
      `)
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (error) throw error;
    setFinancialReports(data || []);
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
      processing: 'bg-primary-100 text-primary-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Pagination handlers
  const handleTransactionsPageChange = (page: number) => {
    setTransactionsPage(page);
  };

  const handleCommissionsPageChange = (page: number) => {
    setCommissionsPage(page);
  };

  const handlePayoutsPageChange = (page: number) => {
    setPayoutsPage(page);
  };

  const handleAdminRevenuesPageChange = (page: number) => {
    setAdminRevenuesPage(page);
  };

  const handleReportsPageChange = (page: number) => {
    setReportsPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    // Reset all pages to 1 when changing items per page
    setTransactionsPage(1);
    setCommissionsPage(1);
    setPayoutsPage(1);
    setAdminRevenuesPage(1);
    setReportsPage(1);
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'commission-revenue', name: 'Commission Revenue', icon: '💵' },
    { id: 'transactions', name: 'Transactions', icon: '💳' },
    { id: 'commissions', name: 'Commissions', icon: '💰' },
    { id: 'payouts', name: 'Payouts', icon: '🏦' },
    { id: 'revenues', name: 'Admin Revenues', icon: '📈' },
    { id: 'reports', name: 'Financial Reports', icon: '📋' }
  ];

  const overviewPeriodLabel = `Reporting period · ${formatDate(dateRange.start)} – ${formatDate(dateRange.end)}`;

  return (
    <div className="p-4 sm:p-6 lg:p-8">

      {/* Date Range Filter */}
      <div className="mb-6 flex flex-col gap-4 rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 lg:flex-row lg:flex-wrap lg:items-end">
        <div className="flex flex-wrap gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Start</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">End</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Vendor</label>
            <select
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
              className="min-w-[180px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              <option value="">All vendors</option>
              {vendorCommissionRevenues.map((vendor) => (
                <option key={vendor.vendor_id} value={vendor.vendor_id}>
                  {vendor.business_name || `Vendor ${vendor.vendor_id.slice(0, 8)}...`}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          type="button"
          onClick={loadFinanceData}
          disabled={loading}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:opacity-50 lg:ml-auto"
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-slate-200">
        <nav className="-mb-px flex flex-wrap gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-t-lg px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border border-b-0 border-slate-200 bg-white text-slate-900'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className="mr-1.5 opacity-70">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <FinanceKpiStrip
                metrics={kpiMetrics}
                loading={loading}
                periodLabel={overviewPeriodLabel}
                formatCurrency={formatCurrency}
              />

              <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="w-full text-sm text-slate-600">
                  Record ledger revenue or pay vendors—same forms as on the Admin Revenues and Payouts tabs.
                </p>
                <button
                  type="button"
                  onClick={() => setAddRevenueModalOpen(true)}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
                >
                  Add revenue record
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPayoutModalVendorId('');
                    setCreatePayoutModalOpen(true);
                  }}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
                >
                  Create vendor payout
                </button>
              </div>

              {/* Vendor Performance */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Vendor Performance</h3>
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
                        vendorSummaries.map((summary, index) => (
                          <tr key={index}>
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
                              <p className="text-lg font-medium">No vendor performance data available</p>
                              <p className="text-sm mt-1">Try adjusting the date range or check if vendors have completed orders</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Commission Revenue Tab */}
          {activeTab === 'commission-revenue' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="rounded-lg bg-white p-6 shadow">
                  <div className="flex items-center">
                    <div className="rounded-lg bg-green-100 p-2">
                      <span className="text-2xl">💵</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Commission Revenue</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(
                          vendorCommissionRevenues.reduce((sum, vendor) => sum + vendor.total_commission_revenue, 0)
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-white p-6 shadow">
                  <div className="flex items-center">
                    <div className="rounded-lg bg-primary-100 p-2">
                      <span className="text-2xl">📊</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Sales</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(
                          vendorCommissionRevenues.reduce((sum, vendor) => sum + vendor.total_sales, 0)
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-white p-6 shadow">
                  <div className="flex items-center">
                    <div className="rounded-lg bg-purple-100 p-2">
                      <span className="text-2xl">🏪</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Active Vendors</p>
                      <p className="text-2xl font-bold text-gray-900">{vendorCommissionRevenues.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vendor Commission Revenue Table */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">
                    {selectedVendor ? 'Vendor Commission Revenue Details' : 'Commission Revenue by Vendor'}
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Vendor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Sales
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Commission Revenue
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Orders
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Avg Order Value
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Commission Rate
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Sale
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {vendorCommissionRevenues.length > 0 ? (
                        vendorCommissionRevenues.map((vendor) => (
                          <tr key={vendor.vendor_id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {vendor.business_name || `Vendor ${vendor.vendor_id.slice(0, 8)}...`}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatCurrency(vendor.total_sales)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                              {formatCurrency(vendor.total_commission_revenue)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {vendor.total_orders}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatCurrency(vendor.average_order_value)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {vendor.commission_rate}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {vendor.last_sale_date ? formatDate(vendor.last_sale_date) : 'N/A'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                            <div>
                              <p className="text-lg font-medium">No commission revenue data found</p>
                              <p className="text-sm mt-1">Try adjusting the date range or check if vendors have completed orders</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Financial Transactions</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
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
                    {transactions.length > 0 ? (
                      transactions.map((transaction) => (
                        <tr key={transaction.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {transaction.transaction_type.replace('_', ' ').toUpperCase()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(transaction.amount)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {transaction.description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(transaction.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(transaction.created_at)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                          <div>
                            <p className="text-lg font-medium">No transactions found</p>
                            <p className="text-sm mt-1">Transactions will appear here as orders are processed</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={transactionsPage}
                totalPages={Math.ceil(100 / itemsPerPage)} // We'll need to get actual count
                totalItems={100} // We'll need to get actual count
                itemsPerPage={itemsPerPage}
                onPageChange={handleTransactionsPageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
                showItemsPerPage={true}
              />
            </div>
          )}

          {/* Commissions Tab */}
          {activeTab === 'commissions' && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Vendor Commissions</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vendor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Commission
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Admin Share
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {commissions.length > 0 ? (
                      commissions.map((commission) => (
                        <tr key={commission.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {commission.order_id.slice(0, 8) + '...'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatDate(commission.created_at)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {(commission as any).business_name || 'Unknown Vendor'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {(commission as any).email || commission.vendor_id.slice(0, 8) + '...'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(commission.order_amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                            {formatCurrency(commission.commission_amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-600">
                            {formatCurrency(commission.admin_amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {commission.commission_rate}%
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(commission.status)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                          <div>
                            <p className="text-lg font-medium">No commission data found</p>
                            <p className="text-sm mt-1">Commissions will appear here as orders are processed and paid</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={commissionsPage}
                totalPages={Math.ceil(100 / itemsPerPage)} // We'll need to get actual count
                totalItems={100} // We'll need to get actual count
                itemsPerPage={itemsPerPage}
                onPageChange={handleCommissionsPageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
                showItemsPerPage={true}
              />
            </div>
          )}

          {/* Payouts Tab */}
          {activeTab === 'payouts' && (
            <div className="bg-white rounded-lg shadow">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-6 py-4">
                <h3 className="text-lg font-medium text-gray-900">Vendor Payouts</h3>
                <button
                  type="button"
                  onClick={() => {
                    setPayoutModalVendorId('');
                    setCreatePayoutModalOpen(true);
                  }}
                  className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                >
                  Create payout
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vendor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Period
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Commission
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Orders
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Method
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payouts.length > 0 ? (
                      payouts.map((payout) => (
                        <tr key={payout.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {(payout as any).business_name || 'Unknown Vendor'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {(payout as any).email || payout.vendor_id.slice(0, 8) + '...'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div>{formatDate(payout.payout_period_start)}</div>
                            <div className="text-xs text-gray-400">to {formatDate(payout.payout_period_end)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                            {formatCurrency(payout.total_commission)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {payout.total_orders} orders
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                              {payout.payout_method.replace('_', ' ').toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              {getStatusBadge(payout.status)}
                              <select
                                value={statusEdits[payout.id] ?? payout.status}
                                onChange={(e) => setStatusEdits((prev) => ({ ...prev, [payout.id]: e.target.value }))}
                                disabled={savingStatusFor === payout.id || payout.status === 'completed'}
                                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900"
                              >
                                <option value="pending">Pending</option>
                                <option value="processing">Processing</option>
                                <option value="completed">Completed</option>
                                <option value="failed">Failed</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                              <button
                                type="button"
                                onClick={() => savePayoutStatus(payout.id)}
                                disabled={
                                  savingStatusFor === payout.id ||
                                  payout.status === 'completed' ||
                                  (statusEdits[payout.id] ?? payout.status) === payout.status
                                }
                                className="rounded-md bg-primary-600 px-3 py-1.5 text-sm text-white hover:bg-primary-700 disabled:opacity-50"
                              >
                                {savingStatusFor === payout.id ? 'Saving...' : 'Save'}
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(payout.created_at)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                          <div>
                            <p className="text-lg font-medium">No payout data found</p>
                            <p className="text-sm mt-1">Payouts will appear here as vendor commissions are processed</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={payoutsPage}
                totalPages={Math.ceil(100 / itemsPerPage)} // We'll need to get actual count
                totalItems={100} // We'll need to get actual count
                itemsPerPage={itemsPerPage}
                onPageChange={handlePayoutsPageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
                showItemsPerPage={true}
              />
            </div>
          )}

          {/* Admin Revenues Tab */}
          {activeTab === 'revenues' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg bg-white p-6 shadow">
                  <div className="flex items-center">
                    <div className="rounded-lg bg-green-100 p-2">
                      <span className="text-2xl">💰</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(adminRevenues.reduce((sum, revenue) => sum + revenue.amount, 0))}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-white p-6 shadow">
                  <div className="flex items-center">
                    <div className="rounded-lg bg-primary-100 p-2">
                      <span className="text-2xl">📊</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Commission Revenue</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(
                          adminRevenues
                            .filter((r) => r.revenue_type === 'commission')
                            .reduce((sum, revenue) => sum + revenue.amount, 0)
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-white p-6 shadow">
                  <div className="flex items-center">
                    <div className="rounded-lg bg-purple-100 p-2">
                      <span className="text-2xl">📈</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Subscription Revenue</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(
                          adminRevenues
                            .filter((r) => r.revenue_type === 'subscription')
                            .reduce((sum, revenue) => sum + revenue.amount, 0)
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-white p-6 shadow">
                  <div className="flex items-center">
                    <div className="rounded-lg bg-yellow-100 p-2">
                      <span className="text-2xl">📢</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Advertising Revenue</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(
                          adminRevenues
                            .filter((r) => r.revenue_type === 'advertising')
                            .reduce((sum, revenue) => sum + revenue.amount, 0)
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Admin Revenues Table */}
              <div className="bg-white rounded-lg shadow">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-6 py-4">
                  <h3 className="text-lg font-medium text-gray-900">Admin Revenues</h3>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setAddRevenueModalOpen(true)}
                      className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                    >
                      Add revenue
                    </button>
                    <button
                      type="button"
                      onClick={() => loadAdminRevenues()}
                      disabled={loading}
                      className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                    >
                      {loading ? 'Loading...' : 'Refresh'}
                    </button>
                  </div>
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
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {adminRevenues.length > 0 ? (
                        adminRevenues.map((revenue) => (
                          <tr key={revenue.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {revenue.revenue_type.replace('_', ' ').toUpperCase()}
                              </div>
                              <div className="text-xs text-gray-500">
                                ID: {revenue.id.slice(0, 8)}...
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {revenue.source_type?.toUpperCase() || 'N/A'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {revenue.source_id ? revenue.source_id.slice(0, 8) + '...' : 'N/A'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                              {formatCurrency(revenue.amount)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              <div className="max-w-xs truncate" title={revenue.description}>
                                {revenue.description}
                              </div>
                              {revenue.period_start && revenue.period_end && (
                                <div className="text-xs text-gray-400 mt-1">
                                  Period: {formatDate(revenue.period_start)} - {formatDate(revenue.period_end)}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(revenue.status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(revenue.created_at)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                            <div>
                              <p className="text-lg font-medium">No admin revenue data found</p>
                              <p className="text-sm mt-1">Admin revenues will appear here as commissions are calculated</p>
                              <button
                                onClick={() => loadAdminRevenues()}
                                className="mt-4 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 text-sm"
                              >
                                Refresh Data
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  currentPage={adminRevenuesPage}
                  totalPages={Math.ceil(100 / itemsPerPage)} // We'll need to get actual count
                  totalItems={100} // We'll need to get actual count
                  itemsPerPage={itemsPerPage}
                  onPageChange={handleAdminRevenuesPageChange}
                  onItemsPerPageChange={handleItemsPerPageChange}
                  showItemsPerPage={true}
                />
              </div>
            </div>
          )}

          {/* Financial Reports Tab */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg bg-white p-6 shadow">
                  <div className="flex items-center">
                    <div className="rounded-lg bg-primary-100 p-2">
                      <span className="text-2xl">📋</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Reports</p>
                      <p className="text-2xl font-bold text-gray-900">{financialReports.length}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-white p-6 shadow">
                  <div className="flex items-center">
                    <div className="rounded-lg bg-green-100 p-2">
                      <span className="text-2xl">✅</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Generated</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {financialReports.filter((r) => r.status === 'generated').length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-white p-6 shadow">
                  <div className="flex items-center">
                    <div className="rounded-lg bg-yellow-100 p-2">
                      <span className="text-2xl">⏳</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Generating</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {financialReports.filter((r) => r.status === 'generating').length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-white p-6 shadow">
                  <div className="flex items-center">
                    <div className="rounded-lg bg-red-100 p-2">
                      <span className="text-2xl">❌</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Failed</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {financialReports.filter((r) => r.status === 'failed').length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Reports Table */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Financial Reports</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Report Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Period
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Generated By
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          File
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {financialReports.length > 0 ? (
                        financialReports.map((report) => (
                          <tr key={report.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {report.report_type.replace('_', ' ').toUpperCase()}
                              </div>
                              <div className="text-xs text-gray-500">
                                ID: {report.id.slice(0, 8)}...
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div>{formatDate(report.report_period_start)}</div>
                              <div className="text-xs text-gray-400">to {formatDate(report.report_period_end)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {report.profiles ? 
                                `${report.profiles.first_name} ${report.profiles.last_name}` : 
                                'System'
                              }
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(report.status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {report.file_url ? (
                                <a 
                                  href={report.file_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-primary-600 hover:text-primary-800 underline"
                                >
                                  Download
                                </a>
                              ) : (
                                <span className="text-gray-400">No file</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(report.created_at)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                            <div>
                              <p className="text-lg font-medium">No financial reports found</p>
                              <p className="text-sm mt-1">Reports will appear here as they are generated</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  currentPage={reportsPage}
                  totalPages={Math.ceil(100 / itemsPerPage)} // We'll need to get actual count
                  totalItems={100} // We'll need to get actual count
                  itemsPerPage={itemsPerPage}
                  onPageChange={handleReportsPageChange}
                  onItemsPerPageChange={handleItemsPerPageChange}
                  showItemsPerPage={true}
                />
              </div>
            </div>
          )}
        </>
      )}

      <AddRevenueRecordModal
        open={addRevenueModalOpen}
        onClose={() => setAddRevenueModalOpen(false)}
        onSuccess={() => {
          loadFinanceData();
          setAddRevenueModalOpen(false);
        }}
      />
      <CreateVendorPayoutModal
        open={createPayoutModalOpen}
        initialVendorId={payoutModalVendorId}
        onClose={() => {
          setCreatePayoutModalOpen(false);
          setPayoutModalVendorId('');
        }}
        onSuccess={() => {
          loadFinanceData();
          setCreatePayoutModalOpen(false);
          setPayoutModalVendorId('');
        }}
      />
    </div>
  );
}
