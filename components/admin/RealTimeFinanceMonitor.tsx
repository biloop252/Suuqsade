'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Package,
  Activity,
  Zap
} from 'lucide-react';

interface RealTimeMetrics {
  total_orders_today: number;
  total_revenue_today: number;
  total_commissions_today: number;
  admin_revenue_today: number;
  pending_payouts: number;
  total_vendors_active: number;
}

interface RecentOrder {
  id: string;
  order_number: string;
  total_amount: number;
  status: string;
  created_at: string;
  user_id: string;
}

export default function RealTimeFinanceMonitor() {
  const [metrics, setMetrics] = useState<RealTimeMetrics | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    loadRealTimeData();
    
    // Set up real-time subscription for orders
    const ordersSubscription = supabase
      .channel('orders_changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('New order received:', payload);
          loadRealTimeData();
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('Order updated:', payload);
          loadRealTimeData();
        }
      )
      .subscribe();

    // Set up real-time subscription for payments
    const paymentsSubscription = supabase
      .channel('payments_changes')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'payments' },
        (payload) => {
          console.log('Payment updated:', payload);
          loadRealTimeData();
        }
      )
      .subscribe();

    // Set up real-time subscription for finance transactions
    const financeSubscription = supabase
      .channel('finance_transactions_changes')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'finance_transactions' },
        (payload) => {
          console.log('New finance transaction:', payload);
          loadRealTimeData();
        }
      )
      .subscribe();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      if (isLive) {
        loadRealTimeData();
      }
    }, 30000);

    return () => {
      ordersSubscription.unsubscribe();
      paymentsSubscription.unsubscribe();
      financeSubscription.unsubscribe();
      clearInterval(interval);
    };
  }, [isLive]);

  const loadRealTimeData = async () => {
    setLoading(true);
    try {
      // Load real-time metrics
      const { data: metricsData, error: metricsError } = await supabase.rpc('get_realtime_finance_summary');
      
      if (metricsError) {
        console.error('Error loading real-time metrics:', metricsError);
      } else if (metricsData && metricsData.length > 0) {
        setMetrics(metricsData[0]);
      }

      // Load recent orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('id, order_number, total_amount, status, created_at, user_id')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (ordersError) {
        console.error('Error loading recent orders:', ordersError);
      } else {
        setRecentOrders(ordersData || []);
      }
    } catch (error) {
      console.error('Error loading real-time data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString();
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      shipped: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="flex items-center mr-3">
            <Activity className="h-5 w-5 text-green-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Real-Time Finance Monitor</h3>
          </div>
          {isLive && (
            <div className="flex items-center text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
              <span className="text-sm font-medium">LIVE</span>
            </div>
          )}
        </div>
        <button
          onClick={() => setIsLive(!isLive)}
          className={`flex items-center px-3 py-1 rounded-md text-sm font-medium ${
            isLive 
              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
        >
          <Zap className="h-4 w-4 mr-1" />
          {isLive ? 'Live' : 'Paused'}
        </button>
      </div>

      {/* Real-Time Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Package className="h-6 w-6 text-blue-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-blue-600">Orders Today</p>
                <p className="text-2xl font-bold text-blue-900">{metrics.total_orders_today}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <DollarSign className="h-6 w-6 text-green-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-green-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-900">{formatCurrency(metrics.total_revenue_today)}</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center">
              <TrendingUp className="h-6 w-6 text-purple-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-purple-600">Vendor Commissions</p>
                <p className="text-2xl font-bold text-purple-900">{formatCurrency(metrics.total_commissions_today)}</p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center">
              <DollarSign className="h-6 w-6 text-orange-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-orange-600">Admin Revenue</p>
                <p className="text-2xl font-bold text-orange-900">{formatCurrency(metrics.admin_revenue_today)}</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Users className="h-6 w-6 text-yellow-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-yellow-600">Pending Payouts</p>
                <p className="text-2xl font-bold text-yellow-900">{formatCurrency(metrics.pending_payouts)}</p>
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Users className="h-6 w-6 text-indigo-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-indigo-600">Active Vendors</p>
                <p className="text-2xl font-bold text-indigo-900">{metrics.total_vendors_active}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div>
        <h4 className="text-md font-semibold text-gray-900 mb-4">Recent Orders</h4>
        <div className="space-y-3">
          {recentOrders.map((order) => (
            <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <div>
                  <p className="font-medium text-gray-900">{order.order_number}</p>
                  <p className="text-sm text-gray-500">{formatTime(order.created_at)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{formatCurrency(order.total_amount)}</p>
                </div>
                <div>
                  {getStatusBadge(order.status)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-gray-600">Updating...</span>
        </div>
      )}
    </div>
  );
}
