import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

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
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  civicPoints?: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<User>;
  register: (userData: { email: string; password: string; firstName: string; lastName: string }) => Promise<User>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<User>;
  createUserProfile: (userData: Partial<User>) => Promise<User>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(true);

  // Unified user query with proper error handling
  const { 
    data: user, 
    isLoading: isUserLoading, 
    error: userError,
    refetch: refreshUser 
  } = useQuery({
    queryKey: ['auth-user'],
    queryFn: async () => {
      const token = localStorage.getItem('civicos-jwt');
      if (!token) {
        throw new Error('No token found');
      }

      try {
        const response = await apiRequest('/api/auth/user', 'GET');
        
        if (!response || !response.id) {
          throw new Error('Invalid user data');
        }

        return response as User;
      } catch (error) {
        // Clear invalid token
        localStorage.removeItem('civicos-jwt');
        throw error;
      }
    },
    retry: 1,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!localStorage.getItem('civicos-jwt'),
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await apiRequest('/api/auth/login', 'POST', credentials);
      
      if (!response.token) {
        throw new Error('No token received from server');
      }
      
      localStorage.setItem('civicos-jwt', response.token);
      return response.user as User;
    },
    onSuccess: (userData) => {
      queryClient.setQueryData(['auth-user'], userData);
      setIsLoading(false);
    },
    onError: (error) => {
      console.error('Login failed:', error);
      localStorage.removeItem('civicos-jwt');
      queryClient.setQueryData(['auth-user'], null);
      setIsLoading(false);
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: { 
      email: string; 
      password: string; 
      firstName: string; 
      lastName: string 
    }) => {
      const response = await apiRequest('/api/auth/register', 'POST', userData);
      
      if (!response.token) {
        throw new Error('No token received from server');
      }
      
      localStorage.setItem('civicos-jwt', response.token);
      return response.user as User;
    },
    onSuccess: (userData) => {
      queryClient.setQueryData(['auth-user'], userData);
      setIsLoading(false);
    },
    onError: (error) => {
      console.error('Registration failed:', error);
      localStorage.removeItem('civicos-jwt');
      queryClient.setQueryData(['auth-user'], null);
      setIsLoading(false);
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<User>) => {
      const response = await apiRequest('/api/users/profile', 'PUT', updates);
      return response as User;
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['auth-user'], updatedUser);
    },
    onError: (error) => {
      console.error('Profile update failed:', error);
    },
  });

  // Logout function
  const logout = () => {
    localStorage.removeItem('civicos-jwt');
    queryClient.setQueryData(['auth-user'], null);
    queryClient.clear(); // Clear all cached data
    setIsLoading(false);
  };

  // Create user profile
  const createUserProfile = async (userData: Partial<User>): Promise<User> => {
    const response = await apiRequest('/api/users/profile', 'POST', userData);
    queryClient.setQueryData(['auth-user'], response);
    return response as User;
  };

  // Handle initial loading state
  useEffect(() => {
    if (!localStorage.getItem('civicos-jwt')) {
      setIsLoading(false);
    }
  }, []);

  // Handle user error
  useEffect(() => {
    if (userError) {
      console.error('User authentication error:', userError);
      localStorage.removeItem('civicos-jwt');
      setIsLoading(false);
    }
  }, [userError]);

  const value: AuthContextType = {
    user: user || null,
    isAuthenticated: !!user,
    isLoading: isLoading || isUserLoading,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout,
    updateProfile: updateProfileMutation.mutateAsync,
    createUserProfile,
    refreshUser: async () => {
      await refreshUser();
    },
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