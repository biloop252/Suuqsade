'use client';

import { useState } from 'react';

export default function TestAdminPage() {
  const [testResult, setTestResult] = useState('');

  const testAdminLogin = () => {
    // Simulate admin login
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
    
    // Store in localStorage
    localStorage.setItem('admin_user', JSON.stringify(mockUser));
    localStorage.setItem('admin_profile', JSON.stringify(mockProfile));
    localStorage.setItem('admin_session', 'true');
    
    setTestResult('Admin session created successfully!');
    
    // Redirect to admin panel after 2 seconds
    setTimeout(() => {
      window.location.href = '/admin';
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Admin Test Page</h1>
        
        <div className="space-y-4">
          <p className="text-gray-600 text-center">
            This page will create a mock admin session for testing.
          </p>
          
          <button
            onClick={testAdminLogin}
            className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 transition-colors"
          >
            Create Admin Session
          </button>
          
          {testResult && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              {testResult}
            </div>
          )}
          
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-500">Or go to:</p>
            <a 
              href="/admin/login" 
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Admin Login Page
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}







