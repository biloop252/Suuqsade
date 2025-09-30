'use client';

import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';

export default function DebugPage() {
  const { user, profile, loading } = useAuth();
  const [session, setSession] = useState(null);
  const [dbProfile, setDbProfile] = useState(null);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setDbProfile(profile);
      }
    };
    
    getSession();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Admin Debug Information</h1>
        
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Auth Context</h2>
            <div className="space-y-2">
              <p><strong>Loading:</strong> {loading ? 'true' : 'false'}</p>
              <p><strong>User:</strong> {user ? JSON.stringify(user, null, 2) : 'null'}</p>
              <p><strong>Profile:</strong> {profile ? JSON.stringify(profile, null, 2) : 'null'}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Direct Session Check</h2>
            <div className="space-y-2">
              <p><strong>Session:</strong> {session ? JSON.stringify(session, null, 2) : 'null'}</p>
              <p><strong>DB Profile:</strong> {dbProfile ? JSON.stringify(dbProfile, null, 2) : 'null'}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Admin User Check</h2>
            <AdminUserCheck />
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminUserCheck() {
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminUser = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', 'admin@suuqsade.com')
          .single();
        
        if (error) {
          console.error('Error fetching admin user:', error);
        } else {
          setAdminUser(data);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAdminUser();
  }, []);

  if (loading) {
    return <p>Loading admin user...</p>;
  }

  return (
    <div>
      <p><strong>Admin User Found:</strong> {adminUser ? 'Yes' : 'No'}</p>
      {adminUser && (
        <div className="mt-2">
          <p><strong>Admin User Data:</strong></p>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
            {JSON.stringify(adminUser, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}







