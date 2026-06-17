import React, { createContext, useState, useContext, useEffect } from 'react';
import { getOrCreateUser, checkUserAccess, getUserByDeviceId } from '../db';

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
        // Get or create user
        const userData = await getOrCreateUser(deviceId, {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
          screen: `${window.screen.width}x${window.screen.height}`
        });
        setUser(userData);

        // Check access
        const accessData = await checkUserAccess(deviceId);
        setAccess(accessData);
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
    const accessData = await checkUserAccess(deviceId);
    setAccess(accessData);
  };

  const refreshUser = async () => {
    if (!deviceId) return;
    const userData = await getUserByDeviceId(deviceId);
    setUser(userData);
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