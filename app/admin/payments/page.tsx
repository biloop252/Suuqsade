'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import PaymentManagement from '@/components/admin/PaymentManagement';

export default function PaymentsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [mockProfile, setMockProfile] = useState(null);

  useEffect(() => {
    setIsClient(true);
    const adminSession = localStorage.getItem('admin_session');
    const adminProfile = localStorage.getItem('admin_profile');
    
    if (adminSession === 'true' && adminProfile) {
      setMockProfile(JSON.parse(adminProfile));
    }
  }, []);

  const currentProfile = isClient ? (mockProfile || user) : user;

  useEffect(() => {
    if (isClient && !currentProfile) {
      console.log('No profile found, redirecting to admin login');
      router.push('/admin/login');
    } else if (isClient && currentProfile) {
      console.log('Profile found:', currentProfile);
    }
  }, [currentProfile, isClient, router]);

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

  if (!currentProfile) {
    return null;
  }

  return <PaymentManagement />;
}
