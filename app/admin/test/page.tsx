'use client';

import { useState, useEffect } from 'react';

export default function AdminTestPage() {
  const [adminSession, setAdminSession] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [adminProfile, setAdminProfile] = useState(null);

  useEffect(() => {
    const checkSession = () => {
      const session = localStorage.getItem('admin_session');
      const user = localStorage.getItem('admin_user');
      const profile = localStorage.getItem('admin_profile');
      
      console.log('Checking session:', session);
      console.log('Checking user:', user);
      console.log('Checking profile:', profile);
      
      setAdminSession(session === 'true');
      setAdminUser(user ? JSON.parse(user) : null);
      setAdminProfile(profile ? JSON.parse(profile) : null);
    };
    
    checkSession();
    
    // Check every second to see if session gets created
    const interval = setInterval(checkSession, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const clearSession = () => {
    localStorage.removeItem('admin_session');
    localStorage.removeItem('admin_user');
    localStorage.removeItem('admin_profile');
    setAdminSession(false);
    setAdminUser(null);
    setAdminProfile(null);
  };

  const createAdminSession = () => {
    const mockUser = {
      id: 'admin-test-id',
      email: 'admin@suuqsade.com',
      user_metadata: {},
      app_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    };
    
    const mockProfile = {
      id: 'admin-test-id',
      first_name: 'Admin',
      last_name: 'User',
      email: 'admin@suuqsade.com',
      role: 'super_admin',
      is_active: true,
    };
    
    localStorage.setItem('admin_user', JSON.stringify(mockUser));
    localStorage.setItem('admin_profile', JSON.stringify(mockProfile));
    localStorage.setItem('admin_session', 'true');
    
    // Update state immediately
    setAdminSession(true);
    setAdminUser(mockUser);
    setAdminProfile(mockProfile);
    
    console.log('Admin session created manually');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Admin Test Page</h1>
        
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Session Status</h2>
            <div className="space-y-2">
              <p><strong>Admin Session:</strong> {adminSession ? '✅ Active' : '❌ Not Active'}</p>
              <p><strong>Admin User:</strong> {adminUser ? '✅ Found' : '❌ Not Found'}</p>
              <p><strong>Admin Profile:</strong> {adminProfile ? '✅ Found' : '❌ Not Found'}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Admin User Data</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(adminUser, null, 2)}
            </pre>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Admin Profile Data</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(adminProfile, null, 2)}
            </pre>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Actions</h2>
            <div className="space-x-4 space-y-2">
              <button
                onClick={createAdminSession}
                className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
              >
                Create Admin Session
              </button>
              <button
                onClick={clearSession}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Clear Session
              </button>
              <a
                href="/admin/login"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 inline-block"
              >
                Go to Login
              </a>
              <a
                href="/admin"
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 inline-block"
              >
                Go to Admin Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
