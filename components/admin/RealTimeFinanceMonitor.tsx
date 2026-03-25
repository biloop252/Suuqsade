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
      confirmed: 'bg-primary-100 text-primary-800',
      processing: 'bg-purple-100 text-purple-800',
      shipped: 'bg-primary-100 text-primary-800',
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
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-slate-700" />
            <h3 className="text-base font-semibold text-slate-900">Today</h3>
          </div>
          {isLive && (
            <div className="flex items-center gap-1.5 text-emerald-600">
              <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              <span className="text-xs font-semibold uppercase tracking-wide">Live</span>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => setIsLive(!isLive)}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium ${
            isLive
              ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80 hover:bg-emerald-100'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Zap className="h-4 w-4" />
          {isLive ? 'Live' : 'Paused'}
        </button>
      </div>

      {/* Real-Time Metrics */}
      {metrics && (
        <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 shrink-0 text-slate-600" />
              <div>
                <p className="text-xs font-medium text-slate-500">Orders</p>
                <p className="text-xl font-semibold tabular-nums text-slate-900">{metrics.total_orders_today}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 shrink-0 text-slate-600" />
              <div>
                <p className="text-xs font-medium text-slate-500">Revenue</p>
                <p className="text-xl font-semibold tabular-nums text-slate-900">{formatCurrency(metrics.total_revenue_today)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 shrink-0 text-slate-600" />
              <div>
                <p className="text-xs font-medium text-slate-500">Vendor share</p>
                <p className="text-xl font-semibold tabular-nums text-slate-900">{formatCurrency(metrics.total_commissions_today)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 shrink-0 text-slate-600" />
              <div>
                <p className="text-xs font-medium text-slate-500">Admin commission</p>
                <p className="text-xl font-semibold tabular-nums text-slate-900">{formatCurrency(metrics.admin_revenue_today)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 shrink-0 text-slate-600" />
              <div>
                <p className="text-xs font-medium text-slate-500">Pending payouts</p>
                <p className="text-xl font-semibold tabular-nums text-slate-900">{formatCurrency(metrics.pending_payouts)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 shrink-0 text-slate-600" />
              <div>
                <p className="text-xs font-medium text-slate-500">Active vendors</p>
                <p className="text-xl font-semibold tabular-nums text-slate-900">{metrics.total_vendors_active}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div>
        <h4 className="mb-3 text-sm font-semibold text-slate-800">Recent orders</h4>
        <div className="space-y-2">
          {recentOrders.map((order) => (
            <div key={order.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                <div>
                  <p className="text-sm font-medium text-slate-900">{order.order_number}</p>
                  <p className="text-xs text-slate-500">{formatTime(order.created_at)}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-semibold tabular-nums text-slate-900">{formatCurrency(order.total_amount)}</p>
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
        <div className="flex items-center justify-center gap-2 py-4">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
          <span className="text-sm text-slate-500">Updating…</span>
        </div>
      )}
    </div>
  );
}
