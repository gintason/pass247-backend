import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // CHANGE: /api/users/auth/status/ -> /api/auth/status/
      const response = await api.get('/api/auth/status/');
      if (response.data.is_authenticated) {
        setUser({
          ...response.data.user,
          isAdmin: response.data.user?.is_staff || response.data.user?.is_superuser
        });
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      // CHANGE: /api/users/login/ -> /api/auth/login/
      const response = await api.post('/api/auth/login/', {
        username,
        password
      });
      
      if (response.data.success) {
        setUser({
          ...response.data.user,
          isAdmin: response.data.user?.is_staff || response.data.user?.is_superuser
        });
        setIsAuthenticated(true);
        return { success: true };
      }
      return { success: false, error: 'Login failed' };
    } catch (error) {
      const data = error.response?.data || {};
      return {
        success: false,
        // The API returns 403 + requires_verification when the password is
        // correct but the email has not been confirmed yet.
        requiresVerification: Boolean(data.requires_verification),
        email: data.email,
        username: data.username,
        error: data.message || 'Login failed'
      };
    }
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout/');
    } catch (error) {
      // Clear local state regardless. If the request failed because the
      // session was already gone, staying "logged in" in the UI is worse
      // than the error itself.
      console.error('Logout request failed; clearing session locally:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/api/auth/register/', userData);
      return {
        success: true,
        data: response.data,
        requiresVerification: Boolean(response.data?.requires_verification),
        email: response.data?.email,
      };
    } catch (error) {
      const data = error.response?.data || {};
      return {
        success: false,
        errors: data.errors,
        error: data.message || 'Registration failed'
      };
    }
  };

  // Verify the signup code. On success the API activates the account and
  // establishes the session, so we adopt the returned user directly.
  const verifyEmail = async (email, code) => {
    try {
      const response = await api.post('/api/auth/verify-otp/', { email, code });
      if (response.data.success) {
        setUser({
          ...response.data.user,
          isAdmin: response.data.user?.is_staff || response.data.user?.is_superuser
        });
        setIsAuthenticated(true);
        return { success: true };
      }
      return { success: false, error: response.data.message || 'Verification failed' };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Verification failed'
      };
    }
  };

  const resendVerification = async (email) => {
    try {
      const response = await api.post('/api/auth/resend-otp/', { email });
      return { success: true, message: response.data?.message };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Could not send a new code'
      };
    }
  };

  const updateUser = (userData) => {
    setUser(prev => ({ ...prev, ...userData }));
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    register,
    verifyEmail,
    resendVerification,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};