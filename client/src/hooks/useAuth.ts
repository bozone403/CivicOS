import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getToken } from "@/lib/queryClient";
import { config } from "@/lib/config";

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

  // Temporarily disable user query to avoid loading issues
  const { data: user, isLoading, error } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    retry: false,
    enabled: !!getToken(), // Only run query if there's a token
    queryFn: async () => {
      try {
        const token = getToken();
        if (!token) return null;
        
        const response = await fetch(`${config.apiUrl}/api/auth/user`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.status === 401) {
          localStorage.removeItem('civicos-jwt');
          return null;
        }
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('Auth query error:', error);
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
      window.location.href = "/auth";
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
      window.location.href = "/dashboard";
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
    isLoading: isLoading && !hasNetworkError, // Don't show loading if there's a network error
    isAuthenticated: !!user, // Use actual user data
    logout,
    login,
  };
}
