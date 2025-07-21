import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  isAdmin?: boolean;
  is_admin?: boolean;
  // Add more fields as needed
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
        console.debug("[useAuth] Fetching /api/auth/user", url, "Token:", token);
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        console.debug("[useAuth] Response status:", response.status, response.statusText);
        if (response.status === 401) {
          localStorage.removeItem('civicos-jwt');
          setAuthError("Session expired or invalid. Please log in again.");
          return null;
        }
        if (!response.ok) {
          const text = await response.text();
          setAuthError(`API error: HTTP ${response.status}: ${response.statusText}. Response: ${text}`);
          console.error("[useAuth] /api/auth/user raw response:", text);
          throw new Error(`HTTP ${response.status}: ${response.statusText}. Response: ${text}`);
        }
        const data = await response.json();
        setAuthError(null);
        return data;
      } catch (error) {
        setAuthError("Network or server error. Please check your connection or try again later.");
        console.error("[useAuth] /api/auth/user error", error, JSON.stringify(error));
        return null;
      }
    },
  });

  // Handle network errors gracefully
  const hasNetworkError = error && (error.message?.includes("fetch") || error.message?.includes("network"));

  const logout = useMutation({
    mutationFn: async () => {
      localStorage.removeItem('civicos-jwt');
      return apiRequest("/api/auth/logout", "POST");
    },
    onSuccess: () => {
      queryClient.clear();
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      navigate("/auth");
    },
    onError: (error: any) => {
      toast({
        title: "Logout failed",
        description: error.message || "Failed to logout",
        variant: "destructive",
      });
    },
  });

  const login = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const result = await apiRequest("/api/auth/login", "POST", credentials);
      if (result.token) localStorage.setItem('civicos-jwt', result.token);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Login successful",
        description: "Welcome to CivicOS!",
      });
      navigate("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    },
  });

  return {
    user: user || null,
    isLoading: isLoading && !authError, // Don't show loading if there's a network error
    isAuthenticated: !!user, // Use actual user data
    logout,
    login,
    authError,
  };
}
