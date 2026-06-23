import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { checkUserAccess } from '../db';

const UserContext = createContext();

export function UserProvider({ children, navigate }) {
  const [user, setUser] = useState(null);
  const [access, setAccess] = useState({ allowed: true, status: 'loading' });
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  const loadUser = useCallback(async (userId) => {
    try {
      // Get user from our users table
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setUser(data);
        const accessData = await checkUserAccess(data.id);
        setAccess(accessData);
      } else {
        // User doesn't exist in users table - create them
        const trialEnds = new Date();
        trialEnds.setDate(trialEnds.getDate() + 30);
        
        const newUser = {
          id: userId,
          device_id: userId,
          email: session?.user?.email || '',
          trial_ends: trialEnds.toISOString(),
          is_active: true,
          has_paid: false,
          is_admin: false,
          subscription_status: 'trial'
        };
        
        const { error: insertError } = await supabase
          .from('users')
          .insert(newUser);
        
        if (insertError) throw insertError;
        
        setUser(newUser);
        setAccess({ allowed: true, user: newUser, status: 'trial', daysLeft: 30 });
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.email]);

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        loadUser(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // In UserContext.jsx, update the auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event);
      setSession(session);
      
      if (session) {
        loadUser(session.user.id);
      } else {
        setUser(null);
        setAccess({ allowed: false, status: 'logged_out' });
        setLoading(false);
        
        // Only redirect if not on a public page
        const currentPath = window.location.pathname;
        const isPublicPage = currentPath === '/' || 
                            currentPath.includes('/landing') || 
                            currentPath.includes('/login') || 
                            currentPath.includes('/subscribe');
        
        if (!isPublicPage) {
          window.location.replace('/');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [loadUser]);

  const refreshAccess = async () => {
    if (!user) return;
    const accessData = await checkUserAccess(user.id);
    setAccess(accessData);
  };

  const refreshUser = async () => {
    if (!user) return;
    loadUser(user.id);
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setAccess({ allowed: false, status: 'logged_out' });
      
      // Clear local storage
      localStorage.clear();
      
      // Navigate to login
      if (navigate) {
        navigate('login');
      } else {
        window.location.replace('/login');
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even if error
      window.location.replace('/login');
    }
  };

  return (
    <UserContext.Provider value={{
      user,
      access,
      loading,
      session,
      refreshAccess,
      refreshUser,
      logout
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
}