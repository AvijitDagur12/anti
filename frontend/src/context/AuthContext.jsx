import { createContext, useContext, useState } from 'react';
import { authApi, setToken, removeToken, getToken } from '../services/api.js';

// Create the context
const AuthContext = createContext(null);

/**
 * AuthProvider component that wraps the application
 * Manages user state, token state, and localStorage synchronization
 */
export const AuthProvider = ({ children }) => {
  // Initialize user and token from localStorage if present
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('moneytrack_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setTokenState] = useState(() => getToken());
  const [loading, setLoading] = useState(false);

  // Login handler
  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      // Store token and user information
      setToken(res.token);
      localStorage.setItem('moneytrack_user', JSON.stringify(res.user));
      setTokenState(res.token);
      setUser(res.user);
      return { success: true, message: res.message || 'Login successful' };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Register handler
  const register = async (name, email, password) => {
    setLoading(true);
    try {
      const res = await authApi.register(name, email, password);
      // Auto-login upon registration
      setToken(res.token);
      localStorage.setItem('moneytrack_user', JSON.stringify(res.user));
      setTokenState(res.token);
      setUser(res.user);
      return { success: true, message: res.message || 'Registration successful' };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Logout handler
  const logout = () => {
    removeToken();
    localStorage.removeItem('moneytrack_user');
    setTokenState(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token && user),
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook for easy access to AuthContext
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
