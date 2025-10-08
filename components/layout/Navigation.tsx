'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { supabase } from '@/lib/supabase';
import { Category } from '@/types/database';
import CategoriesDropdown from './CategoriesDropdown';
import { 
  ShoppingCartIcon, 
  UserIcon, 
  MenuIcon, 
  XIcon,
  PackageIcon,
  StarIcon,
  CreditCardIcon,
  GiftIcon,
  MessageSquareIcon,
  TicketIcon,
  SettingsIcon,
  CrownIcon,
  SparklesIcon,
  LogOutIcon,
  ChevronDownIcon,
  HeartIcon,
  SearchIcon,
  TruckIcon,
  PercentIcon,
  ShoppingBagIcon,
  SmartphoneIcon,
  ShirtIcon,
  HomeIcon,
  GamepadIcon,
  BookOpenIcon,
  CarIcon,
  BabyIcon
} from 'lucide-react';

export default function Navigation() {
  const { user, profile, signOut } = useAuth();
  const { cartCount } = useCart();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    await signOut();
    setIsUserDropdownOpen(false);
  };

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .is('parent_id', null)
          .order('sort_order')
          .order('name');

        if (error) {
          console.error('Error fetching categories:', error);
        } else {
          setCategories(data || []);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="bg-white shadow-sm">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-10 text-sm">
            <div className="flex items-center space-x-6">
              <Link href="/coupons" className="text-gray-600 hover:text-orange-500 transition-colors text-sm">
                My Discount Coupons
            </Link>
              <Link href="/sell" className="text-gray-600 hover:text-orange-500 transition-colors text-sm">
                Sell on Suuqsade
              </Link>
              <Link href="/about" className="text-gray-600 hover:text-orange-500 transition-colors text-sm">
                About Us
              </Link>
              <Link href="/support" className="text-gray-600 hover:text-orange-500 transition-colors text-sm">
                Help & Support
              </Link>
            </div>
            <div className="text-sm text-gray-500">
              Suuqsade English
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-gray-900 lowercase">
                <span className="text-orange-500">s</span>uuqsade
              </h1>
            </Link>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl mx-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Write the product, category or brand you are looking for"
                  className="w-full px-4 py-2.5 pr-12 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                />
                <button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-orange-500 text-white p-1.5 rounded hover:bg-orange-600">
                  <SearchIcon className="h-4 w-4" />
                </button>
            </div>
          </div>

            {/* User Actions */}
            <div className="flex items-center space-x-6">
            {user ? (
              <>
                  <Link href="/favorites" className="flex items-center text-gray-700 hover:text-orange-500 transition-colors">
                    <HeartIcon className="h-5 w-5 mr-2" />
                    <span className="text-sm">My Favorites</span>
                  </Link>
                  
                  <Link href="/cart" className="flex items-center text-gray-700 hover:text-orange-500 transition-colors relative">
                    <ShoppingCartIcon className="h-5 w-5 mr-2" />
                    <span className="text-sm">My Cart</span>
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium">
                        {cartCount}
                      </span>
                    )}
                </Link>
                
                <div className="relative" ref={dropdownRef}>
                  <button 
                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                      className="flex items-center text-gray-700 hover:text-orange-500 transition-colors"
                    >
                      <UserIcon className="h-5 w-5 mr-2" />
                      <span className="text-sm">My Account</span>
                  </button>
                  
                  {isUserDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                      {/* User Info Header */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                              <UserIcon className="h-6 w-6 text-orange-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}`.trim() : 'Suuqsade User'}
                            </p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        <Link 
                          href="/profile?tab=all-orders" 
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setIsUserDropdownOpen(false)}
                        >
                          <PackageIcon className="h-4 w-4 mr-3" />
                          All My Orders
                        </Link>

                        <Link 
                          href="/profile?tab=reviews" 
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setIsUserDropdownOpen(false)}
                        >
                          <StarIcon className="h-4 w-4 mr-3" />
                          My Reviews
                        </Link>

                        <Link 
                          href="/profile?tab=discount-coupons" 
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setIsUserDropdownOpen(false)}
                        >
                          <TicketIcon className="h-4 w-4 mr-3" />
                          My Discount Coupons
                        </Link>

                        <Link 
                          href="/profile?tab=user-information" 
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setIsUserDropdownOpen(false)}
                        >
                          <SettingsIcon className="h-4 w-4 mr-3" />
                          My User Information
                        </Link>

                        <div className="border-t border-gray-100 my-2"></div>

                    <button
                      onClick={handleSignOut}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                          <LogOutIcon className="h-4 w-4 mr-3" />
                          Log Out
                    </button>
                  </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
                <div className="flex items-center space-x-6">
                  <Link href="/auth/signin" className="flex items-center text-gray-700 hover:text-orange-500 transition-colors">
                    <UserIcon className="h-5 w-5 mr-2" />
                    <span className="text-sm">Login</span>
                  </Link>
                  <Link href="/favorites" className="flex items-center text-gray-700 hover:text-orange-500 transition-colors">
                    <HeartIcon className="h-5 w-5 mr-2" />
                    <span className="text-sm">My Favorites</span>
                </Link>
                  <Link href="/cart" className="flex items-center text-gray-700 hover:text-orange-500 transition-colors relative">
                    <ShoppingCartIcon className="h-5 w-5 mr-2" />
                    <span className="text-sm">My Cart</span>
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium">
                        {cartCount}
                      </span>
                    )}
                </Link>
              </div>
            )}

            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="text-gray-600 hover:text-orange-500 p-2 transition-colors"
              >
                {isMobileMenuOpen ? (
                  <XIcon className="h-6 w-6" />
                ) : (
                  <MenuIcon className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Category Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-12">
            <CategoriesDropdown />
            
            <div className="flex items-center space-x-4 ml-6 overflow-x-auto scrollbar-hide flex-1">
              {categoriesLoading ? (
                // Loading skeleton for categories - show 8 skeleton items
                [...Array(8)].map((_, index) => (
                  <div key={index} className="h-4 w-20 bg-gray-200 rounded animate-pulse flex-shrink-0"></div>
                ))
              ) : (
                categories.map((category, index) => {
                  const isActive = pathname === `/categories/${category.slug}`;
                  return (
                    <Link 
                      key={category.id}
                      href={`/categories/${category.slug}`} 
                      className={`transition-colors text-sm flex-shrink-0 px-2 py-1 ${
                        isActive 
                          ? 'text-orange-500 border-b-2 border-orange-500 font-medium' 
                          : 'text-gray-700 hover:text-orange-500'
                      }`}
                    >
                      {category.name}
                    </Link>
                  );
                })
              )}
              
              <Link href="/products?sort=bestsellers" className="flex items-center space-x-2 text-gray-700 hover:text-orange-500 transition-colors flex-shrink-0 px-2 py-1">
                <span className="text-sm">Best Sellers</span>
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">New</span>
              </Link>
              
              <Link href="/products?sort=flash" className="flex items-center space-x-2 text-gray-700 hover:text-orange-500 transition-colors flex-shrink-0 px-2 py-1">
                <span className="text-sm">Flash Products</span>
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">New</span>
              </Link>
            </div>
          </div>
        </div>
      </div>



      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
            <Link href="/products" className="text-gray-700 hover:text-orange-500 block px-3 py-2 rounded-md text-base font-medium transition-colors">
              All Products
            </Link>
            <Link href="/categories" className="text-gray-700 hover:text-orange-500 block px-3 py-2 rounded-md text-base font-medium transition-colors">
              Categories
            </Link>
            <Link href="/brands" className="text-gray-700 hover:text-orange-500 block px-3 py-2 rounded-md text-base font-medium transition-colors">
              Brands
            </Link>
            <Link href="/deals" className="text-gray-700 hover:text-orange-500 block px-3 py-2 rounded-md text-base font-medium transition-colors">
              Deals
            </Link>
            {user && (
              <>
                <Link href="/favorites" className="text-gray-700 hover:text-orange-500 block px-3 py-2 rounded-md text-base font-medium transition-colors">
                  Favorites
                </Link>
                <Link href="/cart" className="text-gray-700 hover:text-orange-500 block px-3 py-2 rounded-md text-base font-medium transition-colors">
                  Cart
                </Link>
                <Link href="/profile" className="text-gray-700 hover:text-orange-500 block px-3 py-2 rounded-md text-base font-medium transition-colors">
                  Profile
                </Link>
                <Link href="/orders" className="text-gray-700 hover:text-orange-500 block px-3 py-2 rounded-md text-base font-medium transition-colors">
                  Orders
                </Link>
                {profile?.role !== 'customer' && (
                  <Link href="/admin" className="text-gray-700 hover:text-orange-500 block px-3 py-2 rounded-md text-base font-medium transition-colors">
                    Admin Panel
                  </Link>
                )}
                <button
                  onClick={handleSignOut}
                  className="text-gray-700 hover:text-orange-500 block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors"
                >
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}