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

  // Temporarily disable user query to avoid loading issues
  const { data: user, isLoading, error } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    retry: false,
    enabled: !!getToken(), // Only run query if there's a token
    queryFn: async () => {
      try {
        const token = getToken();
        if (!token) return null;
        const url = `${config.apiUrl.replace(/\/$/, "")}/api/auth/user`;
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (response.status === 401) {
          localStorage.removeItem('civicos-jwt');
          setAuthError("Session expired or invalid. Please log in again.");
          return null;
        }
        if (!response.ok) {
          const text = await response.text();
          setAuthError(`API error: HTTP ${response.status}: ${response.statusText}. Response: ${text}`);
          throw new Error(`HTTP ${response.status}: ${response.statusText}. Response: ${text}`);
        }
        const data = await response.json();
        setAuthError(null);
        return data;
      } catch (error) {
        setAuthError("Network or server error. Please check your connection or try again later.");
        return null;
      }
    },
  });

  // Handle network errors gracefully
  const hasNetworkError = error && (error.message?.includes("fetch") || error.message?.includes("network"));

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
      if (result.token) localStorage.setItem('civicos-jwt', result.token);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Login successful",
        description: "Welcome to CivicOS!",
      });
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user?.id) {
      throw new Error('No user ID available');
    }

    try {
      await apiRequest(`/api/users/${user.id}/profile`, 'PATCH', updates);
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