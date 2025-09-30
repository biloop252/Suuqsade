'use client';

import { useAuth } from '@/lib/auth-context';
import { memo } from 'react';
import ProfileForm from './ProfileForm';
import AddressList from './AddressList';

interface ProfileContentProps {
  activeTab: string;
}

const ProfileContent = memo(function ProfileContent({ activeTab }: ProfileContentProps) {
  const { profile } = useAuth();

  const renderContent = () => {
    switch (activeTab) {
      case 'user-information':
        return <ProfileForm />;
      
      case 'address-information':
        return <AddressList />;
      
      case 'all-orders':
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">All My Orders</h3>
            <p className="text-gray-600">Your order history will appear here.</p>
          </div>
        );
      
      case 'reviews':
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">My Reviews</h3>
            <p className="text-gray-600">Your product reviews will appear here.</p>
          </div>
        );
      
      case 'seller-messages':
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">My Seller Messages</h3>
            <p className="text-gray-600">Your messages with sellers will appear here.</p>
          </div>
        );
      
      case 'buy-again':
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Buy Again</h3>
            <p className="text-gray-600">Products you've purchased before will appear here.</p>
          </div>
        );
      
      case 'special-for-you':
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Special for You</h3>
            <p className="text-gray-600">Personalized recommendations will appear here.</p>
          </div>
        );
      
      case 'discount-coupons':
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">My Discount Coupons</h3>
            <p className="text-gray-600">Your available coupons will appear here.</p>
          </div>
        );
      
      case 'visited-before':
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Things I've Visited Before</h3>
            <p className="text-gray-600">Your browsing history will appear here.</p>
          </div>
        );
      
      case 'stores-follow':
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Stores I Follow</h3>
            <p className="text-gray-600">Stores you follow will appear here.</p>
          </div>
        );
      
      case 'suuqsade-elite':
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Suuqsade Elite</h3>
            <p className="text-gray-600">Elite membership benefits and information.</p>
          </div>
        );
      
      case 'my-services':
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">My Services</h3>
            <p className="text-gray-600">Your service subscriptions will appear here.</p>
          </div>
        );
      
      case 'loans':
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Loans</h3>
            <p className="text-gray-600">Your loan information will appear here.</p>
          </div>
        );
      
      case 'zero-interest':
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">0% Interest Opportunity</h3>
            <p className="text-gray-600">Zero interest loan options will appear here.</p>
          </div>
        );
      
      case 'lucky-draw':
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Lucky Draw</h3>
            <p className="text-gray-600">Participate in lucky draws and win prizes!</p>
          </div>
        );
      
      case 'qnb-suuqsade':
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">QNB Suuqsade</h3>
            <p className="text-gray-600">QNB Suuqsade banking services.</p>
          </div>
        );
      
      case 'saved-cards':
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">My Saved Cards</h3>
            <p className="text-gray-600">Manage your saved payment methods.</p>
          </div>
        );
      
      case 'announcement-preferences':
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">My Announcement Preferences</h3>
            <p className="text-gray-600">Manage your notification preferences.</p>
          </div>
        );
      
      case 'active-sessions':
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">My Active Sessions</h3>
            <p className="text-gray-600">View and manage your active login sessions.</p>
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
        return <ProfileForm />;
    }
  };

  return (
    <div className="flex-1 p-6">
      {renderContent()}
    </div>
  );
});

export default ProfileContent;
