'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import LocationsManagement from '@/components/admin/LocationsManagement';

export default function AdminLocationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [mockProfile, setMockProfile] = useState(null);

  console.log('=== LOCATIONS PAGE LOADING ===');
  console.log('Current URL:', typeof window !== 'undefined' ? window.location.href : 'SSR');
  console.log('Current pathname:', typeof window !== 'undefined' ? window.location.pathname : 'SSR');
  console.log('User:', user);
  console.log('isClient:', isClient);

  useEffect(() => {
    console.log('=== USEEFFECT RUNNING ===');
    setIsClient(true);
    const adminSession = localStorage.getItem('admin_session');
    const adminProfile = localStorage.getItem('admin_profile');
    
    console.log('Admin session:', adminSession);
    console.log('Admin profile:', adminProfile);
    
    if (adminSession === 'true' && adminProfile) {
      const parsedProfile = JSON.parse(adminProfile);
      console.log('Setting mock profile:', parsedProfile);
      setMockProfile(parsedProfile);
    }
  }, []);

  const currentProfile = isClient ? (mockProfile || user) : user;
  console.log('Current profile:', currentProfile);

  useEffect(() => {
    console.log('=== AUTH USEEFFECT RUNNING ===');
    console.log('isClient:', isClient);
    console.log('currentProfile:', currentProfile);
    console.log('currentProfile.role:', currentProfile?.role);
    console.log('typeof currentProfile.role:', typeof currentProfile?.role);
    
    if (isClient && !currentProfile) {
      console.log('No profile found, redirecting to admin');
      router.push('/admin');
    } else if (isClient && currentProfile) {
      console.log('Profile found:', currentProfile);
      console.log('Role check:');
      console.log('- currentProfile.role:', currentProfile.role);
      console.log('- role === "admin":', currentProfile.role === 'admin');
      console.log('- role === "super_admin":', currentProfile.role === 'super_admin');
      console.log('- role === "staff":', currentProfile.role === 'staff');
      
      // Check if user has admin access - allow authenticated users for now
      if (currentProfile.role !== 'admin' && currentProfile.role !== 'super_admin' && currentProfile.role !== 'staff' && currentProfile.role !== 'authenticated') {
        console.log('User does not have admin access, redirecting to admin');
        console.log('Actual role:', currentProfile.role);
        router.push('/admin');
      } else {
        console.log('User has access, staying on page');
        console.log('Role:', currentProfile.role);
      }
    }
  }, [currentProfile, isClient, router]);

  if (!isClient) {
    console.log('Not client side, showing loading');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!currentProfile) {
    console.log('No current profile, returning null');
    return null;
  }

  console.log('Rendering locations page content');
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LocationsManagement />
      </div>
    </div>
  );
}
