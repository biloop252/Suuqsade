'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { Profile } from '@/types/database';

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
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const isInitialized = useRef(false);
  const authSubscription = useRef<any>(null);

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
    authSubscription.current = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log('Auth state change:', event, session?.user?.id);
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
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
  }, [profile, session]);

  const fetchProfile = async (userId: string) => {
    try {
      // Reduced timeout for faster failure detection
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile fetch timeout')), 5000);
      });

      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      const { data, error } = await Promise.race([profilePromise, timeoutPromise]) as any;

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Don't set profile to null on error, keep existing profile
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
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

