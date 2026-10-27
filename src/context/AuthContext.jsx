/**
 * TraceIt — Authentication Context
 * AuthContext.jsx
 *
 * Manages user authentication state, sign-in, account creation, demo profiles, and sign-out.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getCurrentUser,
  login as authLogin,
  register as authRegister,
  getDemoAccounts,
  ensureDefaultUsers,
} from '../services/auth.js';
import { clearCurrentUserSession } from '../services/storage.js';

// Create the Auth Context
const AuthContext = createContext(null);

/**
 * AuthProvider wraps the application and provides user state and auth actions.
 */
export function AuthProvider({ children }) {
  // Read current user from localStorage on initial load
  const [user, setUser] = useState(() => getCurrentUser());

  // Ensure default demo users exist in localStorage
  useEffect(() => {
    ensureDefaultUsers();
  }, []);

  // Standard email & password login
  const login = (email, password) => {
    const res = authLogin(email, password);
    if (res.success && res.user) {
      setUser(res.user);
    }
    return res;
  };

  // New account registration
  const register = (userData) => {
    const res = authRegister(userData);
    if (res.success && res.user) {
      setUser(res.user);
    }
    return res;
  };

  // 1-Click demo account login (Student or Faculty)
  const loginDemo = (accountId) => {
    const demos = getDemoAccounts();
    const target = demos.find((d) => d.id === accountId) || demos[0];
    if (target) {
      return login(target.email, target.password);
    }
    return { success: false, message: 'Demo account not found' };
  };

  // Sign out
  const logout = () => {
    clearCurrentUserSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        login,
        register,
        loginDemo,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Helper hook to consume the auth state in any component.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
