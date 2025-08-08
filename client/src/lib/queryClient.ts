import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { config } from "./config";
import { createCivicOsClient } from "./civicos-sdk-wrapper";

interface ApiRequestOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}

export async function apiRequest(endpoint: string, method: string = 'GET', body?: any): Promise<any> {
  const token = localStorage.getItem('civicos-jwt') || undefined;
  const client = createCivicOsClient(token);
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return client.request({ method, url: cleanEndpoint, body }) as any;
}

// AI requests don't require authentication
export async function aiRequest(
  url: string,
  method: string = 'GET',
  data?: unknown | undefined,
): Promise<any> {
  // Paranoid: robust URL join, never double slashes
  const base = config.apiUrl ? config.apiUrl.replace(/\/$/, "") : "";
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
  const token = localStorage.getItem('civicos-jwt');
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
    const token = localStorage.getItem('civicos-jwt');
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    if (!res.ok) {
      const text = (await res.text()) || res.statusText;
      throw new Error(`${res.status}: ${text}`);
    }
    
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
