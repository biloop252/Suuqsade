'use client';

import { useState, useCallback } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import ProfileSidebar from '@/components/profile/ProfileSidebar';
import ProfileContent from '@/components/profile/ProfileContent';
import { useAuth } from '@/lib/auth-context';

export default function ProfilePage() {
  const { loading } = useAuth();
  const [activeTab, setActiveTab] = useState('user-information');

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
            <p className="text-gray-600 mt-2">Manage your account and preferences</p>
          </div>
          
          <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <ProfileSidebar activeTab={activeTab} onTabChange={handleTabChange} />
            <ProfileContent activeTab={activeTab} />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

