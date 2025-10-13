'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  FileText, 
  Download, 
  Calendar, 
  TrendingUp, 
  DollarSign,
  Users,
  Package
} from 'lucide-react';

interface FinancialReport {
  id: string;
  report_type: string;
  report_period_start: string;
  report_period_end: string;
  generated_by?: string;
  data: any;
  file_url?: string;
  status: string;
  created_at: string;
}

export default function FinanceReports() {
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<FinancialReport[]>([]);
  const [selectedReportType, setSelectedReportType] = useState('daily_sales');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const reportTypes = [
    {
      id: 'daily_sales',
      name: 'Daily Sales Report',
      description: 'Daily sales summary with commission breakdown',
      icon: TrendingUp
    },
    {
      id: 'monthly_commissions',
      name: 'Monthly Commissions',
      description: 'Monthly commission report for all vendors',
      icon: DollarSign
    },
    {
      id: 'vendor_commission_revenue',
      name: 'Vendor Commission Revenue',
      description: 'Detailed commission revenue breakdown by vendor',
      icon: DollarSign
    },
    {
      id: 'vendor_payouts',
      name: 'Vendor Payouts',
      description: 'Vendor payout summary and status',
      icon: Users
    },
    {
      id: 'admin_revenue',
      name: 'Admin Revenue',
      description: 'Admin revenue streams and performance',
      icon: Package
    },
    {
      id: 'tax_summary',
      name: 'Tax Summary',
      description: 'Tax reporting and compliance data',
      icon: FileText
    }
  ];

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('financial_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      // Generate report data based on type
      let reportData = {};
      
      switch (selectedReportType) {
        case 'daily_sales':
          reportData = await generateDailySalesReport();
          break;
        case 'monthly_commissions':
          reportData = await generateMonthlyCommissionsReport();
          break;
        case 'vendor_commission_revenue':
          reportData = await generateVendorCommissionRevenueReport();
          break;
        case 'vendor_payouts':
          reportData = await generateVendorPayoutsReport();
          break;
        case 'admin_revenue':
          reportData = await generateAdminRevenueReport();
          break;
        case 'tax_summary':
          reportData = await generateTaxSummaryReport();
          break;
      }

      // Create report record
      const { data, error } = await supabase
        .from('financial_reports')
        .insert({
          report_type: selectedReportType,
          report_period_start: dateRange.start,
          report_period_end: dateRange.end,
          generated_by: user?.id,
          data: reportData,
          status: 'generated'
        })
        .select()
        .single();
      
      if (error) throw error;

      alert('Report generated successfully');
      loadReports();
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report');
    } finally {
      setLoading(false);
    }
  };

  const generateDailySalesReport = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(*),
        payments(*)
      `)
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end)
      .eq('status', 'delivered');
    
    if (error) throw error;
    
    const totalSales = data?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
    const totalOrders = data?.length || 0;
    
    return {
      total_sales: totalSales,
      total_orders: totalOrders,
      average_order_value: totalOrders > 0 ? totalSales / totalOrders : 0,
      orders: data
    };
  };

  const generateMonthlyCommissionsReport = async () => {
    const { data, error } = await supabase
      .from('vendor_commissions')
      .select(`
        *,
        vendor_profiles(business_name)
      `)
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end);
    
    if (error) throw error;
    
    const totalCommissions = data?.reduce((sum, commission) => sum + commission.commission_amount, 0) || 0;
    const totalAdminRevenue = data?.reduce((sum, commission) => sum + commission.admin_amount, 0) || 0;
    
    return {
      total_commissions: totalCommissions,
      total_admin_revenue: totalAdminRevenue,
      total_orders: data?.length || 0,
      commissions: data
    };
  };

  const generateVendorCommissionRevenueReport = async () => {
    const { data, error } = await supabase.rpc('get_vendor_commission_revenue_breakdown', {
      vendor_uuid: null,
      start_date: dateRange.start,
      end_date: dateRange.end
    });
    
    if (error) throw error;
    
    const totalCommissionRevenue = data?.reduce((sum, vendor) => sum + vendor.total_commission_revenue, 0) || 0;
    const totalSales = data?.reduce((sum, vendor) => sum + vendor.total_sales, 0) || 0;
    const totalOrders = data?.reduce((sum, vendor) => sum + vendor.total_orders, 0) || 0;
    
    return {
      total_commission_revenue: totalCommissionRevenue,
      total_sales: totalSales,
      total_orders: totalOrders,
      average_commission_rate: data?.length > 0 ? data.reduce((sum, vendor) => sum + vendor.commission_rate, 0) / data.length : 0,
      vendor_count: data?.length || 0,
      vendors: data
    };
  };

  const generateVendorPayoutsReport = async () => {
    const { data, error } = await supabase
      .from('vendor_payouts')
      .select(`
        *,
        vendor_profiles(business_name)
      `)
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end);
    
    if (error) throw error;
    
    const totalPayouts = data?.reduce((sum, payout) => sum + payout.total_commission, 0) || 0;
    const pendingPayouts = data?.filter(p => p.status === 'pending').reduce((sum, payout) => sum + payout.total_commission, 0) || 0;
    
    return {
      total_payouts: totalPayouts,
      pending_payouts: pendingPayouts,
      completed_payouts: totalPayouts - pendingPayouts,
      payouts: data
    };
  };

  const generateAdminRevenueReport = async () => {
    const { data, error } = await supabase
      .from('admin_revenues')
      .select('*')
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end);
    
    if (error) throw error;
    
    const revenueByType = data?.reduce((acc, revenue) => {
      acc[revenue.revenue_type] = (acc[revenue.revenue_type] || 0) + revenue.amount;
      return acc;
    }, {} as Record<string, number>) || {};
    
    return {
      total_revenue: data?.reduce((sum, revenue) => sum + revenue.amount, 0) || 0,
      revenue_by_type: revenueByType,
      revenues: data
    };
  };

  const generateTaxSummaryReport = async () => {
    // This would typically include tax calculations
    // For now, we'll return a basic structure
    return {
      total_sales: 0,
      total_tax_collected: 0,
      tax_by_jurisdiction: {},
      note: 'Tax calculations require additional business logic'
    };
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
      generating: 'bg-yellow-100 text-yellow-800',
      generated: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="p-6">

      {/* Report Generation */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Generate New Report</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Type
            </label>
            <select
              value={selectedReportType}
              onChange={(e) => setSelectedReportType(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              {reportTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mt-1">
              {reportTypes.find(t => t.id === selectedReportType)?.description}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="flex-1 border border-gray-300 rounded-md px-3 py-2"
              />
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="flex-1 border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={generateReport}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            <FileText className="h-4 w-4 mr-2" />
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>

      {/* Report History */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Report History</h3>
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
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Generated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reports.map((report) => (
                <tr key={report.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {reportTypes.find(t => t.id === report.report_type)?.name || report.report_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(report.report_period_start)} - {formatDate(report.report_period_end)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(report.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(report.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {report.status === 'generated' && (
                      <button className="text-blue-600 hover:text-blue-900 flex items-center">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
