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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <PromotionalBanner 
            position="footer" 
            className="h-24"
            showTitle={true}
            showDescription={false}
          />
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Company Info */}
          <div className="lg:col-span-1">
            <div className="mb-6">
              <div className="mb-2">
                <Image
                  src="https://uwautfehppioudadfgcc.supabase.co/storage/v1/object/public/brand-logos/Logo1.png"
                  alt="Suuqsade Logo"
                  width={200}
                  height={67}
                  className="h-16 w-auto object-contain"
                />
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                Your trusted online marketplace for quality products. We bring you the best deals 
                from top brands with fast delivery and excellent customer service.
              </p>
            </div>
            
            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center text-gray-600 text-sm">
                <MailIcon className="h-4 w-4 mr-3 text-primary-500" />
                <span>support@suuqsade.com</span>
              </div>
              <div className="flex items-center text-gray-600 text-sm">
                <PhoneIcon className="h-4 w-4 mr-3 text-primary-500" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-start text-gray-600 text-sm">
                <MapPinIcon className="h-4 w-4 mr-3 mt-0.5 text-primary-500" />
                <span>123 Commerce Street<br />Business District, BD 12345</span>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-primary-500">Shop by Category</h4>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((category) => (
                <Link 
                  key={category.name} 
                  href={category.href}
                  className="flex items-center text-gray-600 hover:text-primary-500 transition-colors text-sm py-1"
                >
                  <category.icon className="h-3 w-3 mr-2" />
                  {category.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-primary-500">Customer Service</h4>
            <ul className="space-y-2">
              {customerService.map((item) => (
                <li key={item.name}>
                  <Link 
                    href={item.href}
                    className="text-gray-600 hover:text-primary-500 transition-colors text-sm"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company & Legal */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-primary-500">Company</h4>
            <ul className="space-y-2 mb-6">
              {company.map((item) => (
                <li key={item.name}>
                  <Link 
                    href={item.href}
                    className="text-gray-600 hover:text-primary-500 transition-colors text-sm"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
            
            <h4 className="text-lg font-semibold mb-4 text-primary-500">Legal</h4>
            <ul className="space-y-2">
              {legal.map((item) => (
                <li key={item.name}>
                  <Link 
                    href={item.href}
                    className="text-gray-600 hover:text-primary-500 transition-colors text-sm"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Features Section */}
        <div className="border-t border-gray-300 mt-12 pt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center text-gray-600">
              <div className="bg-primary-500/20 rounded-lg p-3 mr-4">
                <TruckIcon className="h-6 w-6 text-primary-500" />
              </div>
              <div>
                <h5 className="font-semibold text-gray-800">Free Shipping</h5>
                <p className="text-sm">On orders in same city</p>
              </div>
            </div>
            
            <div className="flex items-center text-gray-600">
              <div className="bg-primary-500/20 rounded-lg p-3 mr-4">
                <RotateCcwIcon className="h-6 w-6 text-primary-500" />
              </div>
              <div>
                <h5 className="font-semibold text-gray-800">Easy Returns</h5>
                <p className="text-sm">30-day return policy</p>
              </div>
            </div>
            
            <div className="flex items-center text-gray-600">
              <div className="bg-primary-500/20 rounded-lg p-3 mr-4">
                <ShieldCheckIcon className="h-6 w-6 text-primary-500" />
              </div>
              <div>
                <h5 className="font-semibold text-gray-800">Secure Payment</h5>
                <p className="text-sm">SSL encrypted checkout</p>
              </div>
            </div>
            
            <div className="flex items-center text-gray-600">
              <div className="bg-primary-500/20 rounded-lg p-3 mr-4">
                <MessageSquareIcon className="h-6 w-6 text-primary-500" />
              </div>
              <div>
                <h5 className="font-semibold text-gray-800">24/7 Support</h5>
                <p className="text-sm">Always here to help</p>
              </div>
            </div>
          </div>
        </div>

        {/* Social Media & Newsletter */}
        <div className="border-t border-gray-300 mt-8 pt-8">
          <div className="flex flex-col lg:flex-row justify-between items-center">
            <div className="mb-6 lg:mb-0">
              <h4 className="text-lg font-semibold mb-3 text-primary-500">Follow Us</h4>
              <div className="flex space-x-4">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gray-200 hover:bg-primary-500 hover:text-white rounded-lg p-3 transition-colors"
                    aria-label={social.name}
                  >
                    <social.icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            </div>
            
            <div className="text-center lg:text-right">
              <h4 className="text-lg font-semibold mb-3 text-primary-500">Newsletter</h4>
              <p className="text-gray-600 text-sm mb-4">Get the latest deals and updates</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <button className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-300 bg-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-600 text-sm mb-4 md:mb-0">
              © {currentYear} Suuqsade Marketplace. All rights reserved.
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <span>We accept:</span>
              <div className="flex items-center space-x-2">
                <CreditCardIcon className="h-5 w-5" />
                <span>Visa</span>
              </div>
              <div className="flex items-center space-x-2">
                <CreditCardIcon className="h-5 w-5" />
                <span>Mastercard</span>
              </div>
              <div className="flex items-center space-x-2">
                <CreditCardIcon className="h-5 w-5" />
                <span>PayPal</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
