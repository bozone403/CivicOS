import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';

// Extend Window interface for debugging
declare global {
  interface Window {
    authDebug?: Array<{ timestamp: string; message: string; data?: any }>;
  }
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  bio?: string;
  city?: string;
  province?: string;
  civicLevel?: string;
  trustScore?: string;
  isVerified?: boolean;
  isAdmin?: boolean;
  verificationStatus?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  createUserProfile: (userData: Partial<User>) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Debug function that survives production builds
const debugLog = (message: string, data?: any) => {
  // This will survive production builds
  if (typeof window !== 'undefined') {
    window.authDebug = window.authDebug || [];
    const logEntry = { timestamp: new Date().toISOString(), message, data };
    window.authDebug.push(logEntry);
    
    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      // console.log removed for production
    }
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    debugLog('AuthProvider useEffect triggered');
    const token = localStorage.getItem('civicos-jwt');
    debugLog('Token from localStorage:', token ? 'exists' : 'missing');
    if (token) {
      validateToken();
    } else {
      debugLog('No token found, setting loading to false');
      setIsLoading(false);
    }
  }, []);

  const validateToken = async () => {
    try {
      debugLog('Starting token validation...');
      const token = localStorage.getItem('civicos-jwt');
      debugLog('Token from localStorage:', token ? 'exists' : 'missing');
      const response = await apiRequest('/api/auth/user', 'GET');
      debugLog('Token validation response:', response);
      
      // The backend returns user data directly, not wrapped in a 'user' property
      if (response && response.id && response.email) {
        debugLog('Setting user from response:', response);
        setUser(response);
        await ensureUserProfile(response);
      } else {
        debugLog('No valid user data in response, clearing token');
        // Clear invalid token
        localStorage.removeItem('civicos-jwt');
        setUser(null);
      }
    } catch (error) {
      debugLog('Token validation error:', error);
      // console.error removed for production
      // Clear invalid token on any error
      localStorage.removeItem('civicos-jwt');
      setUser(null);
    } finally {
      debugLog('Setting loading to false');
      setIsLoading(false);
    }
  };

  const ensureUserProfile = async (userData: User) => {
    try {
      if (!userData.firstName || !userData.lastName || !userData.bio) {
        const profileData = {
          firstName: userData.firstName || userData.email?.split('@')[0] || 'User',
          lastName: userData.lastName || '',
          bio: userData.bio || 'New CivicOS user. Join me in building a better democracy!',
          city: userData.city || '',
          province: userData.province || '',
          civicLevel: userData.civicLevel || 'Registered',
          trustScore: userData.trustScore || '100.00',
          isVerified: userData.isVerified || false,
        };
        await updateProfile(profileData);
      }
    } catch (error) {
      // console.error removed for production
    }
  };

  const login = async (email: string, password: string) => {
    try {
      debugLog('Starting login process...');
      const response = await apiRequest('/api/auth/login', 'POST', { email, password });
      debugLog('Login response:', response);
      if (response.token) {
        debugLog('Storing token in localStorage...');
        localStorage.setItem('civicos-jwt', response.token);
        if (response.user) {
          debugLog('Setting user from login response:', response.user);
          setUser(response.user);
          await ensureUserProfile(response.user);
        }
        // Force a re-validation to ensure state is consistent
        setTimeout(() => {
          debugLog('Forcing token re-validation after login');
          validateToken();
        }, 100);
      } else {
        debugLog('No token in login response!');
      }
    } catch (error) {
      debugLog('Login error:', error);
      // console.error removed for production
      throw error;
    }
  };

  const register = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      const response = await apiRequest('/api/auth/register', 'POST', { 
        email, 
        password, 
        firstName, 
        lastName 
      });
      
      if (response.token) {
        localStorage.setItem('civicos-jwt', response.token);
        
        const userData = {
          id: response.user?.id || email,
          email,
          firstName,
          lastName,
          bio: `New CivicOS user. Join me in building a better democracy!`,
          civicLevel: 'Registered',
          trustScore: '100.00',
          isVerified: false,
        };
        
        setUser(userData);
        await createUserProfile(userData);
      }
    } catch (error) {
      // console.error removed for production
      throw error;
    }
  };

  const createUserProfile = async (userData: Partial<User>): Promise<User> => {
    try {
      const response = await apiRequest('/api/users/profile', 'POST', userData);
      if (response.user) {
        setUser(response.user);
        return response.user;
      }
      throw new Error('Failed to create user profile');
    } catch (error) {
      // console.error removed for production
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    try {
      const response = await apiRequest('/api/users/profile', 'PUT', updates);
      if (response.user) {
        setUser(response.user);
      }
    } catch (error) {
      // console.error removed for production
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('civicos-jwt');
    setUser(null);
  };

  const isAuthenticated = !!user && !isLoading;
  
  // Debug authentication state
  debugLog('Authentication state:', { user, isAuthenticated, isLoading });

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
    createUserProfile,
  };

  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 