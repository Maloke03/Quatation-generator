import React, { createContext, useState, useContext, useEffect } from 'react';
// eslint-disable-next-line
import { getOrCreateUser, getUserByDeviceId, createUserInSupabase } from '../db';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [access, setAccess] = useState({ allowed: true, status: 'loading' });
  const [loading, setLoading] = useState(true);
  const [deviceId, setDeviceId] = useState(null);

  // Generate or get device ID
  useEffect(() => {
    let id = localStorage.getItem('app_device_id');
    if (!id) {
      id = 'device_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
      localStorage.setItem('app_device_id', id);
    }
    setDeviceId(id);
  }, []);

  // Load user data
  useEffect(() => {
    if (!deviceId) return;

    const loadUser = async () => {
      try {
        console.log('Loading user for device:', deviceId);
        
        // Try to get or create user
        const userData = await getOrCreateUser(deviceId, {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
          screen: `${window.screen.width}x${window.screen.height}`,
          timestamp: new Date().toISOString()
        });
        
        console.log('User data loaded:', userData);
        setUser(userData);

        // Check access
        const now = new Date();
        const trialEnds = new Date(userData.trial_ends || userData.trialEnds);
        
        if (userData.has_paid || userData.hasPaid) {
          setAccess({ allowed: true, user: userData, status: 'paid' });
        } else if (trialEnds > now && (userData.is_active !== false && userData.isActive !== false)) {
          const daysLeft = Math.ceil((trialEnds - now) / (1000 * 60 * 60 * 24));
          setAccess({ allowed: true, user: userData, status: 'trial', daysLeft });
        } else {
          setAccess({ allowed: false, user: userData, status: 'expired' });
        }
      } catch (error) {
        console.error('Error loading user:', error);
        setAccess({ allowed: true, status: 'error' });
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [deviceId]);

  const refreshAccess = async () => {
    if (!deviceId) return;
    try {
      const userData = await getUserByDeviceId(deviceId);
      if (userData) {
        setUser(userData);
        const now = new Date();
        const trialEnds = new Date(userData.trial_ends || userData.trialEnds);
        
        if (userData.has_paid || userData.hasPaid) {
          setAccess({ allowed: true, user: userData, status: 'paid' });
        } else if (trialEnds > now && (userData.is_active !== false && userData.isActive !== false)) {
          const daysLeft = Math.ceil((trialEnds - now) / (1000 * 60 * 60 * 24));
          setAccess({ allowed: true, user: userData, status: 'trial', daysLeft });
        } else {
          setAccess({ allowed: false, user: userData, status: 'expired' });
        }
      }
    } catch (error) {
      console.error('Error refreshing access:', error);
    }
  };

  const refreshUser = async () => {
    if (!deviceId) return;
    try {
      const userData = await getUserByDeviceId(deviceId);
      if (userData) setUser(userData);
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  return (
    <UserContext.Provider value={{
      user,
      access,
      loading,
      deviceId,
      refreshAccess,
      refreshUser
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