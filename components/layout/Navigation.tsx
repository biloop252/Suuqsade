'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { supabase } from '@/lib/supabase';
import { Category } from '@/types/database';
import CategoriesDropdown from './CategoriesDropdown';
import SearchSuggestions from '@/components/ui/SearchSuggestions';
import { useSearchSuggestions } from '@/hooks/useSearchSuggestions';
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
  BabyIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from 'lucide-react';

export default function Navigation() {
  const { user, profile, signOut } = useAuth();
  const { cartCount } = useCart();
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const { suggestions, loading } = useSearchSuggestions(searchTerm);

  const handleSignOut = async () => {
    await signOut();
    setIsUserDropdownOpen(false);
  };

  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Scroll functions for category navigation
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -200,
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 200,
        behavior: 'smooth'
      });
    }
  };

  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth);
    }
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

  // Check scroll buttons visibility
  useEffect(() => {
    const checkScroll = () => {
      checkScrollButtons();
    };

    // Check initially and after categories load
    checkScroll();
    
    // Add scroll event listener
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      
      return () => {
        scrollContainer.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [categories, categoriesLoading]);

  return (
    <div className="bg-white shadow-sm">
      {/* Top Header - Hidden on mobile */}
      <div className="bg-white border-b border-gray-100 desktop-only">
        <div className="container-responsive">
          <div className="flex justify-between items-center h-10 text-sm">
            <div className="flex items-center space-x-4 lg:space-x-6 overflow-x-auto scrollbar-hide">
              <Link href="/coupons" className="text-gray-600 hover:text-primary-500 transition-colors text-xs sm:text-sm whitespace-nowrap">
                My Discount Coupons
              </Link>
              <Link href="/sell" className="text-gray-600 hover:text-primary-500 transition-colors text-xs sm:text-sm whitespace-nowrap">
                Sell on Suuqsade
              </Link>
              <Link href="/about" className="text-gray-600 hover:text-primary-500 transition-colors text-xs sm:text-sm whitespace-nowrap">
                About Us
              </Link>
              <Link href="/support" className="text-gray-600 hover:text-primary-500 transition-colors text-xs sm:text-sm whitespace-nowrap">
                Help & Support
              </Link>
            </div>
            <div className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">
              Suuqsade English
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="bg-white">
        <div className="container-responsive">
          <div className="flex items-center justify-between h-16 sm:h-20 lg:h-24">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <div className="flex items-center">
                <Image
                  src="https://uwautfehppioudadfgcc.supabase.co/storage/v1/object/public/brand-logos/Logo1.png"
                  alt="Suuqsade Logo"
                  width={240}
                  height={80}
                  className="h-12 sm:h-16 lg:h-20 w-auto object-contain"
                  priority
                />
              </div>
            </Link>

            {/* Search Bar - Hidden on mobile */}
            <div className="hidden md:flex flex-1 max-w-2xl mx-4 lg:mx-8">
              <SearchSuggestions
                value={searchTerm}
                onChange={setSearchTerm}
                onSubmit={handleSearch}
                placeholder="Write the product, category or brand you are looking for"
                suggestions={suggestions}
                loading={loading}
                className="w-full"
              />
            </div>

            {/* User Actions */}
            <div className="flex items-center space-x-2 sm:space-x-4 lg:space-x-6">
            {user ? (
              <>
                  {/* Favorites - Icon only on mobile */}
                  <Link href="/favorites" className="flex items-center text-gray-700 hover:text-primary-500 transition-colors p-2 rounded-lg hover:bg-gray-50">
                    <HeartIcon className="h-5 w-5 sm:mr-2" />
                    <span className="hidden sm:inline text-sm">My Favorites</span>
                  </Link>
                  
                  {/* Cart */}
                  <Link href="/cart" className="flex items-center text-gray-700 hover:text-primary-500 transition-colors relative p-2 rounded-lg hover:bg-gray-50">
                    <ShoppingCartIcon className="h-5 w-5 sm:mr-2" />
                    <span className="hidden sm:inline text-sm">My Cart</span>
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-secondary-500 text-gray-900 text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium">
                        {cartCount}
                      </span>
                    )}
                </Link>

                
                <div className="relative" ref={dropdownRef}>
                  <button 
                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                      className="flex items-center text-gray-700 hover:text-primary-500 transition-colors p-2 rounded-lg hover:bg-gray-50"
                    >
                      <UserIcon className="h-5 w-5 sm:mr-2" />
                      <span className="hidden sm:inline text-sm">My Account</span>
                  </button>
                  
                  {isUserDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                      {/* User Info Header */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                              <UserIcon className="h-6 w-6 text-primary-600" />
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
                          href="/profile?tab=support-tickets" 
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setIsUserDropdownOpen(false)}
                        >
                          <MessageSquareIcon className="h-4 w-4 mr-3" />
                          Support Tickets
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
                          className="flex items-center w-full px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 transition-colors"
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
                <div className="flex items-center space-x-2 sm:space-x-4">
                  <Link href="/auth/signin" className="flex items-center text-gray-700 hover:text-primary-500 transition-colors p-2 rounded-lg hover:bg-gray-50">
                    <UserIcon className="h-5 w-5 sm:mr-2" />
                    <span className="hidden sm:inline text-sm">Login</span>
                  </Link>
                  <Link href="/favorites" className="flex items-center text-gray-700 hover:text-primary-500 transition-colors p-2 rounded-lg hover:bg-gray-50">
                    <HeartIcon className="h-5 w-5 sm:mr-2" />
                    <span className="hidden sm:inline text-sm">My Favorites</span>
                </Link>
                  <Link href="/cart" className="flex items-center text-gray-700 hover:text-primary-500 transition-colors relative p-2 rounded-lg hover:bg-gray-50">
                    <ShoppingCartIcon className="h-5 w-5 sm:mr-2" />
                    <span className="hidden sm:inline text-sm">My Cart</span>
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-secondary-500 text-gray-900 text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium">
                        {cartCount}
                      </span>
                    )}
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="text-gray-600 hover:text-primary-500 p-2 transition-colors rounded-lg hover:bg-gray-50 min-h-[44px] min-w-[44px] flex items-center justify-center"
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
        <div className="container-responsive">
          <div className="flex items-center h-10 sm:h-12">
            <CategoriesDropdown />
            
            {/* Scroll Left Button */}
            {canScrollLeft && (
              <button
                onClick={scrollLeft}
                className="flex-shrink-0 p-1 ml-1 sm:ml-2 text-gray-500 hover:text-primary-500 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Scroll left"
              >
                <ChevronLeftIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            )}
            
            <div 
              ref={scrollContainerRef}
              className="flex items-center space-x-2 sm:space-x-4 ml-1 sm:ml-2 overflow-x-auto scrollbar-hide flex-1 scroll-smooth"
            >
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
                      className={`transition-colors text-xs sm:text-sm flex-shrink-0 px-1 sm:px-2 py-1 min-h-[44px] flex items-center ${
                        isActive 
                          ? 'text-primary-500 border-b-2 border-primary-500 font-medium' 
                          : 'text-gray-700 hover:text-primary-500'
                      }`}
                    >
                      {category.name}
                    </Link>
                  );
                })
              )}
              
              <Link href="/products?sort=bestsellers" className="flex items-center space-x-1 sm:space-x-2 text-gray-700 hover:text-primary-500 transition-colors flex-shrink-0 px-1 sm:px-2 py-1 min-h-[44px]">
                <span className="text-xs sm:text-sm">Best Sellers</span>
                <span className="bg-secondary-500 text-gray-900 text-xs px-1 sm:px-2 py-0.5 rounded-full">New</span>
              </Link>
              
              <Link href="/products?sort=flash" className="flex items-center space-x-1 sm:space-x-2 text-gray-700 hover:text-primary-500 transition-colors flex-shrink-0 px-1 sm:px-2 py-1 min-h-[44px]">
                <span className="text-xs sm:text-sm">Flash Products</span>
                <span className="bg-secondary-500 text-gray-900 text-xs px-1 sm:px-2 py-0.5 rounded-full">New</span>
              </Link>
            </div>

            {/* Scroll Right Button */}
            {canScrollRight && (
              <button
                onClick={scrollRight}
                className="flex-shrink-0 p-1 ml-1 sm:ml-2 text-gray-500 hover:text-primary-500 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Scroll right"
              >
                <ChevronRightIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            )}
          </div>
        </div>
      </div>



      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          {/* Mobile Search */}
          <div className="px-4 py-3 border-b border-gray-100">
            <SearchSuggestions
              value={searchTerm}
              onChange={setSearchTerm}
              onSubmit={handleSearch}
              placeholder="Search products..."
              suggestions={suggestions}
              loading={loading}
              className="w-full"
            />
          </div>
          
          <div className="px-4 py-3 space-y-1">
            <Link href="/products" className="text-gray-700 hover:text-primary-500 block px-3 py-3 rounded-lg text-base font-medium transition-colors min-h-[44px] flex items-center">
              All Products
            </Link>
            <Link href="/categories" className="text-gray-700 hover:text-primary-500 block px-3 py-3 rounded-lg text-base font-medium transition-colors min-h-[44px] flex items-center">
              Categories
            </Link>
            <Link href="/brands" className="text-gray-700 hover:text-primary-500 block px-3 py-3 rounded-lg text-base font-medium transition-colors min-h-[44px] flex items-center">
              Brands
            </Link>
            <Link href="/deals" className="text-gray-700 hover:text-primary-500 block px-3 py-3 rounded-lg text-base font-medium transition-colors min-h-[44px] flex items-center">
              Deals
            </Link>
            {user && (
              <>
                <div className="border-t border-gray-200 my-2"></div>
                <Link href="/favorites" className="text-gray-700 hover:text-primary-500 block px-3 py-3 rounded-lg text-base font-medium transition-colors min-h-[44px] flex items-center">
                  Favorites
                </Link>
                <Link href="/cart" className="text-gray-700 hover:text-primary-500 block px-3 py-3 rounded-lg text-base font-medium transition-colors min-h-[44px] flex items-center">
                  Cart
                </Link>
                <Link href="/profile" className="text-gray-700 hover:text-primary-500 block px-3 py-3 rounded-lg text-base font-medium transition-colors min-h-[44px] flex items-center">
                  Profile
                </Link>
                <Link href="/orders" className="text-gray-700 hover:text-primary-500 block px-3 py-3 rounded-lg text-base font-medium transition-colors min-h-[44px] flex items-center">
                  Orders
                </Link>
                {profile?.role !== 'customer' && (
                  <Link href="/admin" className="text-gray-700 hover:text-primary-500 block px-3 py-3 rounded-lg text-base font-medium transition-colors min-h-[44px] flex items-center">
                    Admin Panel
                  </Link>
                )}
                <button
                  onClick={handleSignOut}
                  className="text-gray-700 hover:text-primary-500 block w-full text-left px-3 py-3 rounded-lg text-base font-medium transition-colors min-h-[44px] flex items-center"
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