import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getToken } from "@/lib/queryClient";

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

  // Use User as the generic type for the user query
  const { data: user, isLoading, error } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    retry: false,
    enabled: !!getToken(), // Only fetch if JWT is present
  });

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
      window.location.href = "/";
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
    isLoading,
    isAuthenticated: !!getToken() && !!user && !error,
    logout,
    login,
  };
}
