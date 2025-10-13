'use client';

import { useAuth } from '@/lib/auth-context';
import { memo } from 'react';
import ProfileForm from './ProfileForm';
import AddressList from './AddressList';
import DashboardContent from './DashboardContent';
import OrdersContent from './OrdersContent';
import ReviewsContent from './ReviewsContent';
import SupportTicketsContent from './SupportTicketsContent';

interface ProfileContentProps {
  activeTab: string;
}

const ProfileContent = memo(function ProfileContent({ activeTab }: ProfileContentProps) {
  const { profile } = useAuth();

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardContent />;
      
      case 'user-information':
        return <ProfileForm />;
      
      case 'address-information':
        return <AddressList />;
      
      case 'all-orders':
        return <OrdersContent />;
      
      case 'reviews':
        return <ReviewsContent />;
      
      case 'support-tickets':
        return <SupportTicketsContent />;
      
      case 'discount-coupons':
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">My Discount Coupons</h3>
            <p className="text-gray-600">Your available coupons will appear here.</p>
          </div>
        );
      
      case 'saved-cards':
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">My Saved Cards</h3>
            <p className="text-gray-600">Manage your saved payment methods.</p>
          </div>
        );
      
      case 'help':
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Help</h3>
            <p className="text-gray-600">Get help and support for your account.</p>
          </div>
        );
      
      default:
        return <DashboardContent />;
    }
  };

  return (
    <div className="flex-1 p-6">
      {renderContent()}
    </div>
  );
});

export default ProfileContent;
