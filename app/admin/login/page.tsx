'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Eye, EyeOff } from 'lucide-react';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { user, profile } = useAuth();

  // Redirect if already logged in as admin
  useEffect(() => {
    if (user && profile) {
      const adminRoles = ['admin', 'super_admin', 'staff'];
      if (adminRoles.includes(profile.role)) {
        router.push('/admin');
      }
    }
  }, [user, profile, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Attempting admin login for:', email);
      
      // For testing, let's use a simple hardcoded admin check
      if (email === 'admin@suuqsade.com' && password === 'Admin123!') {
        console.log('Hardcoded admin login successful');
        
        // Create a mock session for testing
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
        
        // Store in localStorage for testing
        try {
          localStorage.setItem('admin_user', JSON.stringify(mockUser));
          localStorage.setItem('admin_profile', JSON.stringify(mockProfile));
          localStorage.setItem('admin_session', 'true');
          
          console.log('Admin session stored in localStorage');
          console.log('admin_user:', localStorage.getItem('admin_user'));
          console.log('admin_profile:', localStorage.getItem('admin_profile'));
          console.log('admin_session:', localStorage.getItem('admin_session'));
          
          // Wait a moment then redirect
          setTimeout(() => {
            console.log('Redirecting to admin panel');
            window.location.href = '/admin';
          }, 1000);
        } catch (error) {
          console.error('Error storing admin session:', error);
          setError('Error creating admin session');
        }
        return;
      }
      
      // Try normal Supabase auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        setError(error.message);
        return;
      }

      if (data.user) {
        console.log('User logged in:', data.user.id);
        
        // Wait a moment for the auth context to update
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if user has admin privileges
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, first_name, last_name')
          .eq('id', data.user.id)
          .single();

        console.log('Profile data:', profile);
        console.log('Profile error:', profileError);

        if (profileError) {
          setError('Error fetching user profile');
          await supabase.auth.signOut();
          return;
        }

        if (profile && ['admin', 'super_admin', 'staff'].includes(profile.role)) {
          console.log('Admin user confirmed, redirecting to admin panel');
          // Force a page reload to ensure auth context is updated
          window.location.href = '/admin';
        } else {
          console.log('User does not have admin privileges');
          setError('You do not have admin privileges');
          await supabase.auth.signOut();
        }
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Admin Login</h2>
          <p className="mt-2 text-sm text-gray-600">Sign in to access the admin panel</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Test credentials:</p>
          <p className="font-mono text-xs mt-1">admin@suuqsade.com / Admin123!</p>
        </div>
      </div>
    </div>
  );
}
