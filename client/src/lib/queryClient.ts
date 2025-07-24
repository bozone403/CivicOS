import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { config } from "./config";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Use config for API base URL
const API_BASE_URL = config.apiUrl;

export function getToken() {
  return localStorage.getItem('civicos-jwt') || '';
}

export async function apiRequest(
  url: string,
  method: string = 'GET',
  data?: unknown | undefined,
): Promise<any> {
  // Paranoid: robust URL join, never double slashes
  const base = API_BASE_URL ? API_BASE_URL.replace(/\/$/, "") : "";
  const path = url.startsWith("/") ? url : "/" + url;
  const fullUrl = url.startsWith("http") ? url : base + path;
  const token = getToken();
  const headers: Record<string, string> = data ? { "Content-Type": "application/json" } : {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  
  // Add timeout controller
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
  
  try {
    const res = await fetch(fullUrl, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      const text = (await res.text()) || res.statusText;
      if (res.status === 401) {
        // Clear invalid token
        localStorage.removeItem('civicos-jwt');
        throw new Error("Authentication failed. Please log in again.");
      }
      throw new Error(`${res.status}: ${text}`);
    }
    
    return await res.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error("Request timed out. Please try again.");
    }
    throw error;
  }
}

// AI requests don't require authentication
export async function aiRequest(
  url: string,
  method: string = 'GET',
  data?: unknown | undefined,
): Promise<any> {
  // Paranoid: robust URL join, never double slashes
  const base = API_BASE_URL ? API_BASE_URL.replace(/\/$/, "") : "";
  const path = url.startsWith("/") ? url : "/" + url;
  const fullUrl = url.startsWith("http") ? url : base + path;
  const headers: Record<string, string> = data ? { "Content-Type": "application/json" } : {};
  
  // Add timeout controller
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout for AI
  
  try {
    const res = await fetch(fullUrl, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      const text = (await res.text()) || res.statusText;
      throw new Error(`${res.status}: ${text}`);
    }
    
    return await res.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error("AI request timed out. Please try again.");
    }
    throw error;
  }
}

// Authenticated requests that return empty data when not logged in
export async function authRequest(
  url: string,
  method: string = 'GET',
  data?: unknown | undefined,
): Promise<any> {
  const token = getToken();
  if (!token) {
    // Return empty data for common endpoints when not authenticated
    if (url.includes('/messages/unread/count')) {
      return { unreadCount: 0 };
    }
    if (url.includes('/notifications')) {
      return [];
    }
    if (url.includes('/messages/conversations')) {
      return [];
    }
    throw new Error("Authentication required");
  }
  
  return apiRequest(url, method, data);
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const token = getToken();
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
