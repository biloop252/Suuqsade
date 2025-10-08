'use client';

import { useState, memo, useMemo } from 'react';
import { 
  PackageIcon, 
  StarIcon, 
  MessageSquareIcon, 
  RotateCcwIcon,
  GiftIcon,
  TicketIcon,
  EyeIcon,
  HeartIcon,
  CrownIcon,
  SettingsIcon,
  CreditCardIcon,
  MapPinIcon,
  BellIcon,
  ShieldIcon,
  HelpCircleIcon,
  SparklesIcon,
  BanknoteIcon,
  LayoutDashboardIcon
} from 'lucide-react';

interface ProfileSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const ProfileSidebar = memo(function ProfileSidebar({ activeTab, onTabChange }: ProfileSidebarProps) {
  const menuSections = useMemo(() => [
    {
      title: "Dashboard",
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboardIcon },
      ]
    },
    {
      title: "My Orders",
      items: [
        { id: 'all-orders', label: 'All My Orders', icon: PackageIcon },
        { id: 'reviews', label: 'My Reviews', icon: StarIcon },
        { id: 'discount-coupons', label: 'My Discount Coupons', icon: TicketIcon },
      ]
    },
    {
      title: "My Account & Help",
      items: [
        { id: 'user-information', label: 'My User Information', icon: SettingsIcon },
        { id: 'address-information', label: 'My Address Information', icon: MapPinIcon },
        { id: 'saved-cards', label: 'My Saved Cards', icon: CreditCardIcon },
        { id: 'help', label: 'Help', icon: HelpCircleIcon },
      ]
    }
  ], []);

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">My Account</h2>
        
        {menuSections.map((section, sectionIndex) => (
          <div key={section.title} className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
              {section.title}
            </h3>
            <nav className="space-y-1">
              {section.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === item.id
                      ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center">
                    <item.icon className="h-4 w-4 mr-3" />
                    {item.label}
                  </div>
                  {item.badge && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        ))}
      </div>
    </div>
  );
});

export default ProfileSidebar;
