'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import AdminLayout from '@/components/admin/AdminLayout';
import Dashboard from '@/components/admin/Dashboard';

export default function AdminPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('Admin page - loading:', loading);
    console.log('Admin page - user:', user);
    console.log('Admin page - profile:', profile);
    
    // Check for mock admin session first
    const adminSession = localStorage.getItem('admin_session');
    const adminUser = localStorage.getItem('admin_user');
    const adminProfile = localStorage.getItem('admin_profile');
    
    console.log('Checking mock session:');
    console.log('adminSession:', adminSession);
    console.log('adminUser:', adminUser);
    console.log('adminProfile:', adminProfile);
    
    if (adminSession === 'true' && adminUser && adminProfile) {
      console.log('Mock admin session found, allowing access');
      return;
    } else {
      console.log('Mock admin session not found or incomplete');
    }
    
    if (!loading) {
      if (!user || !profile) {
        console.log('No user or profile, redirecting to login');
        router.push('/admin/login');
        return;
      }

      // Check if user has admin privileges
      const adminRoles = ['admin', 'super_admin', 'staff'];
      console.log('User role:', profile.role);
      console.log('Admin roles:', adminRoles);
      console.log('Has admin role:', adminRoles.includes(profile.role));
      
      if (!adminRoles.includes(profile.role)) {
        console.log('User does not have admin role, redirecting to login');
        router.push('/admin/login');
        return;
      }
      
      console.log('Admin access granted');
    }
  }, [user, profile, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  const adminRoles = ['admin', 'super_admin', 'staff'];
  if (!adminRoles.includes(profile.role)) {
    return null;
  }

  return <Dashboard />;
}







