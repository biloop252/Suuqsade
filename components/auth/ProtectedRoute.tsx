'use client';

import { useAuth } from '@/lib/auth-context';
import { UserRole } from '@/types/database';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  fallback?: React.ReactNode;
}

export default function ProtectedRoute({ 
  children, 
  requiredRole, 
  fallback 
}: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return fallback || null;
  }

  if (requiredRole && profile) {
    const roleHierarchy: Record<UserRole, number> = {
      customer: 0,
      staff: 1,
      admin: 2,
      super_admin: 3,
    };

    if (roleHierarchy[profile.role] < roleHierarchy[requiredRole]) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-4">
              You don't have permission to access this page.
            </p>
            <button
              onClick={() => router.push('/')}
              className="btn-primary"
            >
              Go Home
            </button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}



























