'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { Profile } from '@/types/database';
import { useNotification } from '@/lib/notification-context';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { showSuccess } = useNotification();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const isInitialized = useRef(false);
  const authSubscription = useRef<any>(null);
  const inFlightProfileForUserId = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.error('Error getting session:', error);
          setLoading(false);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);
        
        // Set loading to false immediately for better UX
        setLoading(false);
        isInitialized.current = true;
        
        // Fetch profile in background if user exists
        if (session?.user) {
          fetchProfile(session.user.id);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Listen for auth changes
    authSubscription.current = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      console.log('Auth state change:', event, session?.user?.id);

      setSession(session);
      setUser(session?.user ?? null);

      if (!session?.user) {
        setProfile(null);
      } else if (event !== 'TOKEN_REFRESHED') {
        // Token refresh updates JWT only; refetching profile/cart/favorites is unnecessary and caused slowdowns.
        void fetchProfile(session.user.id);
      }

      setLoading(false);
    });

    initializeAuth();

    return () => {
      mounted = false;
      if (authSubscription.current) {
        authSubscription.current.data.subscription.unsubscribe();
      }
    };
  }, []);

  // Handle page visibility changes
  useEffect(() => {
    let lastVisibilityChange = Date.now();
    
    const handleVisibilityChange = async () => {
      const now = Date.now();
      // Throttle visibility changes to prevent excessive calls
      if (now - lastVisibilityChange < 2000) return;
      lastVisibilityChange = now;
      
      if (document.visibilityState === 'visible' && isInitialized.current) {
        // Only refresh if we don't have a profile or session seems stale
        if (!profile || !session) {
          try {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (!error && session) {
              setSession(session);
              setUser(session.user);
              if (session.user && (!profile || profile.id !== session.user.id)) {
                fetchProfile(session.user.id);
              }
            }
          } catch (error) {
            console.error('Error refreshing session on visibility change:', error);
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [profile?.id, session?.user?.id]);

  const fetchProfile = async (userId: string) => {
    try {
      // Avoid overlapping fetches for the same user
      if (inFlightProfileForUserId.current === userId) return;
      inFlightProfileForUserId.current = userId;

      const runOnce = async () => {
        // 5s is often too short in dev; keep a timeout but make it more forgiving.
        const timeoutMs = 20000;
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Profile fetch timeout')), timeoutMs);
        });

        const profilePromise = supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        return (await Promise.race([profilePromise, timeoutPromise])) as any;
      };

      let result: any;
      try {
        result = await runOnce();
      } catch (e) {
        // One retry helps with transient network hiccups.
        await new Promise((r) => setTimeout(r, 750));
        result = await runOnce();
      }

      const { data, error } = result || {};

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession?.user || currentSession.user.id !== userId) {
        return;
      }

      setProfile(data as Profile);
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Don't set profile to null on error, keep existing profile
    } finally {
      if (inFlightProfileForUserId.current === userId) {
        inFlightProfileForUserId.current = null;
      }
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const signOut = async () => {
    inFlightProfileForUserId.current = null;
    setSession(null);
    setUser(null);
    setProfile(null);
    setLoading(false);
    showSuccess('Signed out', 'You have been signed out.');
    void supabase.auth.signOut().catch((err) => {
      console.error('Sign out error:', err);
    });
  };

  const value = {
    user,
    profile,
    session,
    loading,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

