'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const code = searchParams.get('code');
        const next = searchParams.get('next') ?? '/';

        console.log('Auth callback received:', {
          code: code ? 'present' : 'missing',
          next,
          fullUrl: window.location.href
        });

        if (!code) {
          throw new Error('No authorization code received');
        }

        console.log('Waiting for Supabase to process the session...');
        
        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('Auth state change:', event, session?.user?.email);
          
          if (event === 'SIGNED_IN' && session) {
            console.log('User signed in successfully:', {
              user: session.user?.id,
              email: session.user?.email
            });
            
            setStatus('success');
            
            // Small delay to show success state, then redirect
            setTimeout(() => {
              console.log('Redirecting to:', next);
              router.push(next);
            }, 1000);
            
            // Unsubscribe from auth changes
            subscription.unsubscribe();
          } else if (event === 'SIGNED_OUT') {
            console.log('User signed out');
            setError('Authentication failed - user signed out');
            setStatus('error');
            
            setTimeout(() => {
              router.push(`/auth/signin?error=${encodeURIComponent('Authentication failed')}`);
            }, 2000);
            
            subscription.unsubscribe();
          }
        });

        // Also try to get the current session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          throw sessionError;
        }

        if (sessionData.session) {
          console.log('Session already exists:', {
            user: sessionData.session.user?.id,
            email: sessionData.session.user?.email
          });
          
          setStatus('success');
          
          setTimeout(() => {
            console.log('Redirecting to:', next);
            router.push(next);
          }, 1000);
          
          subscription.unsubscribe();
        } else {
          console.log('No existing session, waiting for auth state change...');
        }

        // Set a timeout in case auth state change doesn't fire
        const timeout = setTimeout(() => {
          console.log('Timeout waiting for auth state change');
          setError('Authentication timeout - please try again');
          setStatus('error');
          
          setTimeout(() => {
            router.push(`/auth/signin?error=${encodeURIComponent('Authentication timeout')}`);
          }, 2000);
          
          subscription.unsubscribe();
        }, 10000); // 10 second timeout

        // Cleanup function
        return () => {
          clearTimeout(timeout);
          subscription.unsubscribe();
        };

      } catch (err: any) {
        console.error('Auth callback exception:', err);
        setError(err.message || 'Authentication failed');
        setStatus('error');
        
        // Redirect to signin with error after delay
        setTimeout(() => {
          router.push(`/auth/signin?error=${encodeURIComponent(err.message || 'Authentication failed')}`);
        }, 2000);
      }
    };

    handleAuthCallback();
  }, [router, searchParams]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900">Completing sign in...</h2>
          <p className="text-gray-600 mt-2">Please wait while we finish setting up your account.</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Sign in successful!</h2>
          <p className="text-gray-600 mt-2">Redirecting you to your dashboard...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Sign in failed</h2>
          <p className="text-gray-600 mt-2">{error}</p>
          <p className="text-sm text-gray-500 mt-4">Redirecting you back to sign in...</p>
        </div>
      </div>
    );
  }

  return null;
}
