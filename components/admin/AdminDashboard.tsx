'use client';

import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { 
  ShoppingBagIcon, 
  UsersIcon, 
  CreditCardIcon, 
  TruckIcon,
  BarChart3,
  CogIcon
} from 'lucide-react';

export default function AdminDashboard() {
  const { profile } = useAuth();

  const adminFeatures = [
    {
      name: 'Products',
      description: 'Manage product catalog',
      icon: ShoppingBagIcon,
      href: '/admin/products',
      roles: ['admin', 'super_admin'],
    },
    {
      name: 'Orders',
      description: 'View and manage orders',
      icon: CreditCardIcon,
      href: '/admin/orders',
      roles: ['staff', 'admin', 'super_admin'],
    },
    {
      name: 'Customers',
      description: 'Manage customer accounts',
      icon: UsersIcon,
      href: '/admin/customers',
      roles: ['admin', 'super_admin'],
    },
    {
      name: 'Inventory',
      description: 'Track stock levels',
      icon: TruckIcon,
      href: '/admin/inventory',
      roles: ['admin', 'super_admin'],
    },
    {
      name: 'Analytics',
      description: 'View sales reports',
      icon: BarChart3,
      href: '/admin/analytics',
      roles: ['staff', 'admin', 'super_admin'],
    },
    {
      name: 'Settings',
      description: 'System configuration',
      icon: CogIcon,
      href: '/admin/settings',
      roles: ['super_admin'],
    },
  ];

  const filteredFeatures = adminFeatures.filter(feature => 
    feature.roles.includes(profile?.role || 'customer')
  );

  return (
    <div className="space-y-8">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ShoppingBagIcon className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Products</p>
              <p className="text-2xl font-semibold text-gray-900">1,234</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CreditCardIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Orders Today</p>
              <p className="text-2xl font-semibold text-gray-900">56</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UsersIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Customers</p>
              <p className="text-2xl font-semibold text-gray-900">8,901</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TruckIcon className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending Shipments</p>
              <p className="text-2xl font-semibold text-gray-900">23</p>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Features */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFeatures.map((feature) => (
            <Link key={feature.name} href={feature.href}>
              <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow duration-300 cursor-pointer">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <feature.icon className="h-8 w-8 text-primary-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{feature.name}</h3>
                    <p className="text-sm text-gray-500">{feature.description}</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-sm text-gray-600">New order #ORD-2024-00001234 received</span>
              <span className="text-xs text-gray-400">2 minutes ago</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-sm text-gray-600">Product "Wireless Headphones" stock updated</span>
              <span className="text-xs text-gray-400">15 minutes ago</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <span className="text-sm text-gray-600">New customer registration</span>
              <span className="text-xs text-gray-400">1 hour ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}







