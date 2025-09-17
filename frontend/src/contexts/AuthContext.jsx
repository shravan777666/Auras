import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/auth';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auracare_token');
      if (token) {
        // On initial load, fetch user data from the token
        const response = await authService.getCurrentUser();
        const currentUser = response?.data?.data?.user;
        if (currentUser) {
          setUser(currentUser);
        }
      }
    } catch (error) {
      // If token is invalid or fetching fails, clear it
      localStorage.removeItem('auracare_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const response = await authService.login(credentials);
      const { user, token } = response?.data?.data || {};

      if (token) localStorage.setItem('auracare_token', token);
      if (user) setUser(user);

      return response?.data?.data; // Return normalized data { token, user }
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      const { user, token } = response?.data?.data || {};

      if (token) localStorage.setItem('auracare_token', token);
      if (user) setUser(user);

      return response?.data?.data; // Return normalized data { token, user }
    } catch (error) {
      throw error;
    }
  };

  // Allow components to update user details in context (e.g., after setup)
  const updateUser = (updated) => {
    setUser((prev) => {
      if (typeof updated === 'function') return updated(prev);
      if (!prev) return updated; // handle initial set when no user exists
      return { ...prev, ...updated };
    });
  };

  const logout = () => {
    localStorage.removeItem('auracare_token');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    checkAuthStatus,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};