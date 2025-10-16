'use client';

import Link from 'next/link';
import Image from 'next/image';
import { 
  FacebookIcon, 
  TwitterIcon, 
  InstagramIcon, 
  YoutubeIcon,
  MailIcon,
  PhoneIcon,
  MapPinIcon,
  CreditCardIcon,
  TruckIcon,
  ShieldCheckIcon,
  RotateCcwIcon,
  MessageSquareIcon,
  SmartphoneIcon,
  ShirtIcon,
  HomeIcon,
  GamepadIcon,
  BookOpenIcon,
  CarIcon,
  BabyIcon,
  SparklesIcon
} from 'lucide-react';
import PromotionalBanner from '@/components/promotional/PromotionalBanner';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const categories = [
    { name: 'Electronics', icon: SmartphoneIcon, href: '/categories/electronics' },
    { name: 'Fashion', icon: ShirtIcon, href: '/categories/fashion' },
    { name: 'Home & Garden', icon: HomeIcon, href: '/categories/home-garden' },
    { name: 'Sports', icon: GamepadIcon, href: '/categories/sports' },
    { name: 'Books', icon: BookOpenIcon, href: '/categories/books' },
    { name: 'Beauty', icon: SparklesIcon, href: '/categories/beauty' },
    { name: 'Automotive', icon: CarIcon, href: '/categories/automotive' },
    { name: 'Toys', icon: BabyIcon, href: '/categories/toys' },
  ];

  const customerService = [
    { name: 'Help Center', href: '/help' },
    { name: 'Contact Us', href: '/contact' },
    { name: 'Track Your Order', href: '/track-order' },
    { name: 'Returns & Refunds', href: '/returns' },
    { name: 'Size Guide', href: '/size-guide' },
    { name: 'Shipping Info', href: '/shipping' },
  ];

  const company = [
    { name: 'About Us', href: '/about' },
    { name: 'Careers', href: '/careers' },
    { name: 'Press', href: '/press' },
    { name: 'Blog', href: '/blog' },
    { name: 'Investor Relations', href: '/investors' },
    { name: 'Sustainability', href: '/sustainability' },
  ];

  const legal = [
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Cookie Policy', href: '/cookies' },
    { name: 'Accessibility', href: '/accessibility' },
    { name: 'Sitemap', href: '/sitemap' },
  ];

  const socialLinks = [
    { name: 'Facebook', icon: FacebookIcon, href: 'https://facebook.com/suuqsade' },
    { name: 'Twitter', icon: TwitterIcon, href: 'https://twitter.com/suuqsade' },
    { name: 'Instagram', icon: InstagramIcon, href: 'https://instagram.com/suuqsade' },
    { name: 'YouTube', icon: YoutubeIcon, href: 'https://youtube.com/suuqsade' },
  ];

  return (
    <footer className="bg-gray-100 text-gray-800 border-t border-primary-500">
      {/* Footer Promotional Banner */}
      <div className="bg-white border-b border-gray-200">
        <div className="container-responsive py-4">
          <PromotionalBanner 
            position="footer" 
            className="h-16 sm:h-20 lg:h-24"
            showTitle={true}
            showDescription={false}
          />
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container-responsive py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          
          {/* Company Info */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="mb-6">
              <div className="mb-4">
                <Image
                  src="https://uwautfehppioudadfgcc.supabase.co/storage/v1/object/public/brand-logos/Logo1.png"
                  alt="Suuqsade Logo"
                  width={200}
                  height={67}
                  className="h-12 sm:h-16 w-auto object-contain"
                />
              </div>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                Your trusted online marketplace for quality products. We bring you the best deals 
                from top brands with fast delivery and excellent customer service.
              </p>
            </div>
            
            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center text-gray-600 text-sm sm:text-base">
                <MailIcon className="h-4 w-4 mr-3 text-primary-500 flex-shrink-0" />
                <span>support@suuqsade.com</span>
              </div>
              <div className="flex items-center text-gray-600 text-sm sm:text-base">
                <PhoneIcon className="h-4 w-4 mr-3 text-primary-500 flex-shrink-0" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-start text-gray-600 text-sm sm:text-base">
                <MapPinIcon className="h-4 w-4 mr-3 mt-0.5 text-primary-500 flex-shrink-0" />
                <span>123 Commerce Street<br />Business District, BD 12345</span>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-base sm:text-lg font-semibold mb-4 text-primary-500">Shop by Category</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {categories.map((category) => (
                <Link 
                  key={category.name} 
                  href={category.href}
                  className="flex items-center text-gray-600 hover:text-primary-500 transition-colors text-sm py-2 px-2 rounded-lg hover:bg-gray-50 min-h-[44px]"
                >
                  <category.icon className="h-4 w-4 mr-2 flex-shrink-0" />
                  {category.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-base sm:text-lg font-semibold mb-4 text-primary-500">Customer Service</h4>
            <ul className="space-y-2">
              {customerService.map((item) => (
                <li key={item.name}>
                  <Link 
                    href={item.href}
                    className="text-gray-600 hover:text-primary-500 transition-colors text-sm py-2 px-2 rounded-lg hover:bg-gray-50 block min-h-[44px] flex items-center"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company & Legal */}
          <div>
            <h4 className="text-base sm:text-lg font-semibold mb-4 text-primary-500">Company</h4>
            <ul className="space-y-2 mb-6">
              {company.map((item) => (
                <li key={item.name}>
                  <Link 
                    href={item.href}
                    className="text-gray-600 hover:text-primary-500 transition-colors text-sm py-2 px-2 rounded-lg hover:bg-gray-50 block min-h-[44px] flex items-center"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
            
            <h4 className="text-base sm:text-lg font-semibold mb-4 text-primary-500">Legal</h4>
            <ul className="space-y-2">
              {legal.map((item) => (
                <li key={item.name}>
                  <Link 
                    href={item.href}
                    className="text-gray-600 hover:text-primary-500 transition-colors text-sm py-2 px-2 rounded-lg hover:bg-gray-50 block min-h-[44px] flex items-center"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Features Section */}
        <div className="border-t border-gray-300 mt-8 sm:mt-12 pt-6 sm:pt-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="flex items-center text-gray-600 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="bg-primary-500/20 rounded-lg p-2 sm:p-3 mr-3 sm:mr-4 flex-shrink-0">
                <TruckIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary-500" />
              </div>
              <div>
                <h5 className="font-semibold text-gray-800 text-sm sm:text-base">Free Shipping</h5>
                <p className="text-xs sm:text-sm">On orders in same city</p>
              </div>
            </div>
            
            <div className="flex items-center text-gray-600 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="bg-primary-500/20 rounded-lg p-2 sm:p-3 mr-3 sm:mr-4 flex-shrink-0">
                <RotateCcwIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary-500" />
              </div>
              <div>
                <h5 className="font-semibold text-gray-800 text-sm sm:text-base">Easy Returns</h5>
                <p className="text-xs sm:text-sm">30-day return policy</p>
              </div>
            </div>
            
            <div className="flex items-center text-gray-600 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="bg-primary-500/20 rounded-lg p-2 sm:p-3 mr-3 sm:mr-4 flex-shrink-0">
                <ShieldCheckIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary-500" />
              </div>
              <div>
                <h5 className="font-semibold text-gray-800 text-sm sm:text-base">Secure Payment</h5>
                <p className="text-xs sm:text-sm">SSL encrypted checkout</p>
              </div>
            </div>
            
            <div className="flex items-center text-gray-600 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="bg-primary-500/20 rounded-lg p-2 sm:p-3 mr-3 sm:mr-4 flex-shrink-0">
                <MessageSquareIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary-500" />
              </div>
              <div>
                <h5 className="font-semibold text-gray-800 text-sm sm:text-base">24/7 Support</h5>
                <p className="text-xs sm:text-sm">Always here to help</p>
              </div>
            </div>
          </div>
        </div>

        {/* Social Media & Newsletter */}
        <div className="border-t border-gray-300 mt-6 sm:mt-8 pt-6 sm:pt-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-6 lg:space-y-0">
            <div className="w-full lg:w-auto">
              <h4 className="text-base sm:text-lg font-semibold mb-3 text-primary-500">Follow Us</h4>
              <div className="flex space-x-3 sm:space-x-4">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gray-200 hover:bg-primary-500 hover:text-white rounded-lg p-2 sm:p-3 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label={social.name}
                  >
                    <social.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </a>
                ))}
              </div>
            </div>
            
            <div className="w-full lg:w-auto text-center lg:text-right">
              <h4 className="text-base sm:text-lg font-semibold mb-3 text-primary-500">Newsletter</h4>
              <p className="text-gray-600 text-sm mb-4">Get the latest deals and updates</p>
              <div className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto lg:mx-0">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="px-3 sm:px-4 py-2 sm:py-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base min-h-[44px]"
                />
                <button className="bg-primary-500 hover:bg-primary-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-colors text-sm sm:text-base min-h-[44px]">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-300 bg-gray-200">
        <div className="container-responsive py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="text-gray-600 text-xs sm:text-sm text-center sm:text-left">
              © {currentYear} Suuqsade Marketplace. All rights reserved.
            </div>
            
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-6 text-xs sm:text-sm text-gray-600">
              <span className="text-center sm:text-left">We accept:</span>
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <CreditCardIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Visa</span>
                </div>
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <CreditCardIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Mastercard</span>
                </div>
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <CreditCardIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>PayPal</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
