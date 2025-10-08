'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { 
  LayoutDashboard, 
  Package, 
  FolderTree, 
  Settings, 
  ShoppingCart, 
  Users, 
  BarChart3,
  Menu,
  X,
  LogOut,
  Tag,
  Layers,
  Home,
  Award,
  Plus,
  List,
  ChevronDown,
  ChevronRight,
  Truck,
  Building2,
  CreditCard,
  MapPin,
  RefreshCw,
  Image
} from 'lucide-react';

interface AdminLayoutWrapperProps {
  children: React.ReactNode;
}

export default function AdminLayoutWrapper({ children }: AdminLayoutWrapperProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [productsDropdownOpen, setProductsDropdownOpen] = useState(false);
  const [settingsDropdownOpen, setSettingsDropdownOpen] = useState(false);
  const { profile, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  
  // Check for mock admin session
  const [mockProfile, setMockProfile] = useState(null);
  
  useEffect(() => {
    setIsClient(true);
    const adminSession = localStorage.getItem('admin_session');
    const adminProfile = localStorage.getItem('admin_profile');
    
    if (adminSession === 'true' && adminProfile) {
      setMockProfile(JSON.parse(adminProfile));
    }
  }, []);
  
  const currentProfile = isClient ? (mockProfile || profile) : profile;

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { 
      name: 'Products', 
      href: '/admin/products', 
      icon: Package,
      hasDropdown: true,
      dropdownItems: [
        { name: 'Manage Products', href: '/admin/products', icon: List },
        { name: 'Add Product', href: '/admin/products/create', icon: Plus },
      ]
    },
    { name: 'Categories', href: '/admin/categories', icon: FolderTree },
    { name: 'Brands', href: '/admin/brands', icon: Award },
    { name: 'Attributes', href: '/admin/attributes', icon: Tag },
    { name: 'Variants', href: '/admin/variants', icon: Layers },
    { name: 'Vendors', href: '/admin/vendors', icon: Building2 },
    { name: 'Locations', href: '/admin/locations', icon: MapPin },
    { name: 'Promotional Media', href: '/admin/promotional-media', icon: Image },
    { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
    { name: 'Shipments', href: '/admin/deliveries', icon: Truck },
    { name: 'Payments', href: '/admin/payments', icon: CreditCard },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { 
      name: 'Settings', 
      href: '/admin/settings', 
      icon: Settings,
      hasDropdown: true,
      dropdownItems: [
        { name: 'General Settings', href: '/admin/settings', icon: Settings },
        { name: 'Delivery Options', href: '/admin/delivery', icon: Truck },
      ]
    },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  const handleNavigation = (href: string, name: string) => {
    console.log('=== NAVIGATION DEBUG ===');
    console.log('Clicking on:', name);
    console.log('Target href:', href);
    console.log('Current pathname:', pathname);
    console.log('Will navigate to:', href);
  };

  // Auto-open dropdowns if on relevant pages
  useEffect(() => {
    if (pathname.startsWith('/admin/products')) {
      setProductsDropdownOpen(true);
    }
    if (pathname.startsWith('/admin/settings') || pathname.startsWith('/admin/delivery')) {
      setSettingsDropdownOpen(true);
    }
  }, [pathname]);

  const handleSignOut = async () => {
    // Clear mock session if it exists
    localStorage.removeItem('admin_session');
    localStorage.removeItem('admin_user');
    localStorage.removeItem('admin_profile');
    
    // Clear mock profile state
    setMockProfile(null);
    
    // Sign out from Supabase if there's a real session
    if (profile) {
      await signOut();
    }
    
    router.push('/admin/login');
  };

  // Prevent hydration mismatch by showing loading state
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex w-64 flex-col bg-white shadow-xl">
          <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-orange-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => (
              <div key={item.name}>
                {item.hasDropdown ? (
                  <div>
                    <button
                      onClick={() => {
                        if (item.name === 'Products') {
                          setProductsDropdownOpen(!productsDropdownOpen);
                        } else if (item.name === 'Settings') {
                          setSettingsDropdownOpen(!settingsDropdownOpen);
                        }
                      }}
                      className={`group flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive(item.href)
                          ? 'bg-orange-100 text-orange-700 border-r-2 border-orange-500'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <div className="flex items-center">
                        <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                        {item.name}
                      </div>
                      {(item.name === 'Products' ? productsDropdownOpen : settingsDropdownOpen) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    {((item.name === 'Products' && productsDropdownOpen) || (item.name === 'Settings' && settingsDropdownOpen)) && (
                      <div className="ml-6 mt-1 space-y-1">
                        {item.dropdownItems?.map((dropdownItem) => (
                          <Link
                            key={dropdownItem.name}
                            href={dropdownItem.href}
                            className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                              isActive(dropdownItem.href)
                                ? 'bg-orange-100 text-orange-700 border-r-2 border-orange-500'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                            onClick={() => setSidebarOpen(false)}
                          >
                            <dropdownItem.icon className="mr-3 h-4 w-4 flex-shrink-0" />
                            {dropdownItem.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive(item.href)
                        ? 'bg-orange-100 text-orange-700 border-r-2 border-orange-500'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    onClick={() => {
                      setSidebarOpen(false);
                      handleNavigation(item.href, item.name);
                    }}
                  >
                    <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                    {item.name}
                  </Link>
                )}
              </div>
            ))}
          </nav>
          <div className="flex-shrink-0 border-t border-gray-200 p-4">
            <div className="flex items-center mb-3">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-orange-600">
                    {currentProfile?.first_name?.charAt(0) || 'A'}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">
                  {currentProfile?.first_name} {currentProfile?.last_name}
                </p>
                <p className="text-xs text-gray-500 capitalize">{currentProfile?.role?.replace('_', ' ')}</p>
              </div>
            </div>
            <div className="space-y-1">
              <Link
                href="/"
                className="flex items-center px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-md"
              >
                <Home className="mr-3 h-4 w-4" />
                View Website
              </Link>
              <button
                onClick={handleSignOut}
                className="flex w-full items-center px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-md"
              >
                <LogOut className="mr-3 h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-grow flex-col overflow-y-auto bg-white shadow-lg border-r border-gray-200">
          <div className="flex h-16 items-center px-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-orange-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
            </div>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => (
              <div key={item.name}>
                {item.hasDropdown ? (
                  <div>
                    <button
                      onClick={() => {
                        if (item.name === 'Products') {
                          setProductsDropdownOpen(!productsDropdownOpen);
                        } else if (item.name === 'Settings') {
                          setSettingsDropdownOpen(!settingsDropdownOpen);
                        }
                      }}
                      className={`group flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive(item.href)
                          ? 'bg-orange-100 text-orange-700 border-r-2 border-orange-500'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <div className="flex items-center">
                        <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                        {item.name}
                      </div>
                      {(item.name === 'Products' ? productsDropdownOpen : settingsDropdownOpen) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    {((item.name === 'Products' && productsDropdownOpen) || (item.name === 'Settings' && settingsDropdownOpen)) && (
                      <div className="ml-6 mt-1 space-y-1">
                        {item.dropdownItems?.map((dropdownItem) => (
                          <Link
                            key={dropdownItem.name}
                            href={dropdownItem.href}
                            className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                              isActive(dropdownItem.href)
                                ? 'bg-orange-100 text-orange-700 border-r-2 border-orange-500'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                          >
                            <dropdownItem.icon className="mr-3 h-4 w-4 flex-shrink-0" />
                            {dropdownItem.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive(item.href)
                        ? 'bg-orange-100 text-orange-700 border-r-2 border-orange-500'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    onClick={() => handleNavigation(item.href, item.name)}
                  >
                    <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                    {item.name}
                  </Link>
                )}
              </div>
            ))}
          </nav>
          <div className="flex-shrink-0 border-t border-gray-200 p-4">
            <div className="flex items-center mb-3">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-orange-600">
                    {currentProfile?.first_name?.charAt(0) || 'A'}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">
                  {currentProfile?.first_name} {currentProfile?.last_name}
                </p>
                <p className="text-xs text-gray-500 capitalize">{currentProfile?.role?.replace('_', ' ')}</p>
              </div>
            </div>
            <div className="space-y-1">
              <Link
                href="/"
                className="flex items-center px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-md"
              >
                <Home className="mr-3 h-4 w-4" />
                View Website
              </Link>
              <button
                onClick={handleSignOut}
                className="flex w-full items-center px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-md"
              >
                <LogOut className="mr-3 h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1" />
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" />
              <div className="flex items-center gap-x-4 lg:gap-x-6">
                <div className="relative">
                  <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-orange-600">
                      {currentProfile?.first_name?.charAt(0) || 'A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}



