import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getToken } from "@/lib/queryClient";
import { config } from "@/lib/config";
import { useLocation } from "wouter";
import { useState } from "react";

// Add User type
export interface User {
  id: string | number;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  bio?: string;
  location?: string;
  website?: string;
  social?: {
    twitter?: string;
    facebook?: string;
    linkedin?: string;
    instagram?: string;
  };
  isVerified?: boolean;
  verificationLevel?: string;
  civicLevel?: string;
  trustScore?: number;
  civicPoints?: number;
  isAdmin?: boolean;
  is_admin?: boolean;
}

export function useAuth() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [authError, setAuthError] = useState<string | null>(null);

  // Check for existing token on mount
  const [hasToken] = useState(() => {
    return !!getToken();
  });

  // User query with better error handling and timeout
  const { data: user, isLoading, error } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    retry: 2,
    retryDelay: 1000,
    enabled: hasToken, // Only run query if there's a token
    staleTime: 5 * 60 * 1000, // 5 minutes
    queryFn: async () => {
      try {
        const token = getToken();
        if (!token) return null;
        
        const url = `${config.apiUrl.replace(/\/$/, "")}/api/auth/user`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        try {
          const response = await fetch(url, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          
          if (response.status === 401) {
            localStorage.removeItem('civicos-jwt');
            setAuthError("Session expired. Please log in again.");
            return null;
          }
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const data = await response.json();
          setAuthError(null);
          return data;
        } catch (fetchError) {
          clearTimeout(timeoutId);
          if (fetchError instanceof Error && fetchError.name === 'AbortError') {
            setAuthError("Request timed out. Please check your connection.");
            return null;
          }
          throw fetchError;
        }
      } catch (error) {
        setAuthError("Network or server error. Please try again later.");
        return null;
      }
    },
  });

  // Handle network errors gracefully
  const hasNetworkError = error && (error.message?.includes("fetch") || error.message?.includes("network") || error.message?.includes("timeout"));

  const logout = () => {
    localStorage.removeItem('civicos-jwt');
    queryClient.clear();
    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    navigate("/auth");
  };

  const login = async (email: string, password: string) => {
    try {
      const result = await apiRequest("/api/auth/login", "POST", { email, password });
      if (result.token) {
        localStorage.setItem('civicos-jwt', result.token);
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        toast({
          title: "Login successful",
          description: "Welcome to CivicOS!",
        });
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user?.id) {
      throw new Error('No user ID available');
    }

    try {
      await apiRequest(`/api/users/profile`, 'PUT', updates);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Profile updated!",
        description: "Your changes have been saved successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  };

  return {
    user: user || null,
    isLoading: isLoading && !authError, // Don't show loading if there's a network error
    isAuthenticated: !!user, // Use actual user data
    logout,
    login,
    updateProfile,
    authError,
  };
} 