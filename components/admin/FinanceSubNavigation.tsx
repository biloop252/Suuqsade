'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  DollarSign, 
  BarChart3, 
  CreditCard, 
  TrendingUp,
  FileText
} from 'lucide-react';

export default function FinanceSubNavigation() {
  const pathname = usePathname();

  const financeTabs = [
    { 
      name: 'Dashboard', 
      href: '/admin/finance', 
      icon: DollarSign,
      description: 'Financial overview and key metrics'
    },
    { 
      name: 'Overview', 
      href: '/admin/finance/overview', 
      icon: BarChart3,
      description: 'Detailed financial reports and analysis'
    },
    { 
      name: 'Payouts', 
      href: '/admin/finance/payouts', 
      icon: CreditCard,
      description: 'Manage vendor commission payouts'
    },
    { 
      name: 'Revenues', 
      href: '/admin/finance/revenues', 
      icon: TrendingUp,
      description: 'Track admin revenue streams'
    },
    { 
      name: 'Reports', 
      href: '/admin/finance/reports', 
      icon: FileText,
      description: 'Generate and download financial reports'
    },
  ];

  const isActive = (href: string) => {
    if (href === '/admin/finance') {
      return pathname === '/admin/finance';
    }
    return pathname === href;
  };

  return (
    <div className="bg-white border-b border-gray-200 mb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Finance Management</h1>
              <p className="text-sm text-gray-600">Manage commissions, payouts, and revenue tracking</p>
            </div>
          </div>
        </div>
        
        {/* Finance Sub-navigation */}
        <nav className="flex space-x-8" aria-label="Finance tabs">
          {financeTabs.map((tab) => (
            <Link
              key={tab.name}
              href={tab.href}
              className={`group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                isActive(tab.href)
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className={`mr-2 h-4 w-4 ${
                isActive(tab.href) ? 'text-green-500' : 'text-gray-400 group-hover:text-gray-500'
              }`} />
              <div className="text-left">
                <div className="font-medium">{tab.name}</div>
                <div className="text-xs text-gray-400 hidden lg:block">{tab.description}</div>
              </div>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}







