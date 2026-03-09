import { createContext, useContext, useState, useCallback } from 'react';
import { getStoredUser } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());

  const setAuth = useCallback((token, userData) => {
    localStorage.setItem('grant_token', token);
    localStorage.setItem('grant_user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('grant_token');
    localStorage.removeItem('grant_user');
    setUser(null);
  }, []);

  const value = { user, setAuth, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
