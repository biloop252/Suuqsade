'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { 
  Building2, 
  Package, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp,
  LogOut,
  Settings,
  Plus
} from 'lucide-react';

interface VendorStats {
  total_products: number;
  total_orders: number;
  total_revenue: number;
  pending_orders: number;
}

export default function VendorDashboard() {
  const [stats, setStats] = useState<VendorStats>({
    total_products: 0,
    total_orders: 0,
    total_revenue: 0,
    pending_orders: 0
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user, profile, signOut } = useAuth();

  useEffect(() => {
    if (!user || profile?.role !== 'vendor') {
      router.push('/vendor/login');
      return;
    }
    
    loadVendorStats();
  }, [user, profile, router]);

  const loadVendorStats = async () => {
    if (!user) return;
    
    try {
      // Get vendor profile
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendor_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (vendorError) {
        console.error('Error loading vendor data:', vendorError);
        return;
      }

      // Get products count
      const { count: productsCountResult, error: productsError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('vendor_id', user.id);

      // Get orders count for this vendor
      const { count: ordersCountResult, error: ordersError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('vendor_id', user.id);

      // Get total revenue from paid orders for this vendor
      const { data: revenueData, error: revenueError } = await supabase
        .from('orders')
        .select(`
          total_amount,
          payments!inner(status)
        `)
        .eq('vendor_id', user.id)
        .eq('payments.status', 'paid');

      // Get pending orders count for this vendor
      const { count: pendingOrdersCount, error: pendingOrdersError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('vendor_id', user.id)
        .in('status', ['pending', 'confirmed', 'processing']);

      if (productsError) {
        console.error('Error loading products count:', productsError);
      }
      if (ordersError) {
        console.error('Error loading orders count:', ordersError);
      }
      if (revenueError) {
        console.error('Error loading revenue data:', revenueError);
      }
      if (pendingOrdersError) {
        console.error('Error loading pending orders count:', pendingOrdersError);
      }

      const totalRevenue = revenueData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

      setStats({
        total_products: typeof productsCountResult === 'number' ? productsCountResult : 0,
        total_orders: typeof ordersCountResult === 'number' ? ordersCountResult : 0,
        total_revenue: totalRevenue,
        pending_orders: typeof pendingOrdersCount === 'number' ? pendingOrdersCount : 0
      });
    } catch (error) {
      console.error('Error loading vendor stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/vendor/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-orange-600" />
              <h1 className="ml-2 text-2xl font-bold text-gray-900">Vendor Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/vendor/settings')}
                className="text-gray-500 hover:text-gray-700"
              >
                <Settings className="h-5 w-5" />
              </button>
              <button
                onClick={handleSignOut}
                className="text-gray-500 hover:text-gray-700"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              Welcome back, {profile?.first_name || 'Vendor'}!
            </h2>
            <p className="mt-2 text-gray-600">
              Here's what's happening with your business today.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Package className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Products
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.total_products}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ShoppingCart className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Orders
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.total_orders}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <DollarSign className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Revenue
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        ${stats.total_revenue.toFixed(2)}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrendingUp className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Pending Orders
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.pending_orders}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <button
                  onClick={() => router.push('/vendor/products/new')}
                  className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-orange-500 rounded-lg border border-gray-300 hover:border-gray-400"
                >
                  <div>
                    <span className="rounded-lg inline-flex p-3 bg-orange-50 text-orange-700 ring-4 ring-white">
                      <Plus className="h-6 w-6" />
                    </span>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-lg font-medium">
                      <span className="absolute inset-0" aria-hidden="true" />
                      Add New Product
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Create a new product listing for your store.
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => router.push('/vendor/products')}
                  className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-orange-500 rounded-lg border border-gray-300 hover:border-gray-400"
                >
                  <div>
                    <span className="rounded-lg inline-flex p-3 bg-orange-50 text-orange-700 ring-4 ring-white">
                      <Package className="h-6 w-6" />
                    </span>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-lg font-medium">
                      <span className="absolute inset-0" aria-hidden="true" />
                      Manage Products
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                      View and edit your product listings.
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => router.push('/vendor/orders')}
                  className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-orange-500 rounded-lg border border-gray-300 hover:border-gray-400"
                >
                  <div>
                    <span className="rounded-lg inline-flex p-3 bg-orange-50 text-orange-700 ring-4 ring-white">
                      <ShoppingCart className="h-6 w-6" />
                    </span>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-lg font-medium">
                      <span className="absolute inset-0" aria-hidden="true" />
                      View Orders
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Manage your customer orders.
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

