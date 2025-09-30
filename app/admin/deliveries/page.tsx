'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import DeliveriesManagement from '@/components/admin/DeliveriesManagement';

export default function AdminDeliveriesPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [mockProfile, setMockProfile] = useState<any>(null);

  useEffect(() => {
    setIsClient(true);
    
    // Check for mock admin session
    const mockAdmin = localStorage.getItem('mockAdmin');
    if (mockAdmin) {
      try {
        const adminData = JSON.parse(mockAdmin);
        setMockProfile(adminData);
      } catch (error) {
        console.error('Error parsing mock admin data:', error);
      }
    }
  }, []);

  const currentProfile = profile || mockProfile;

  useEffect(() => {
    if (isClient) {
      console.log('Admin deliveries page - User:', user?.id);
      console.log('Admin deliveries page - Profile:', currentProfile);
      console.log('Admin deliveries page - Mock profile:', mockProfile);
      
      if (!currentProfile) {
        console.log('No profile found, redirecting to admin login');
        router.push('/admin/login');
        return;
      }

      if (currentProfile.role !== 'admin' && currentProfile.role !== 'super_admin' && currentProfile.role !== 'staff') {
        console.log('User not authorized, redirecting to admin login');
        router.push('/admin/login');
        return;
      }
    }
  }, [isClient, currentProfile, router]);

  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentProfile) {
    return null;
  }

  return (
    <div className="p-6">
      <DeliveriesManagement />
    </div>
  );
}
