/**
 * Server Warmup Utility for Replit Autoscale
 * 
 * Handles "sleeping" backend servers by pinging health endpoint
 * until server wakes up, then proceeds with actual request.
 */

import { config } from './config';

interface WarmupOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  timeout?: number;
}

export class ServerWarmupError extends Error {
  constructor(message: string, public attempts: number) {
    super(message);
    this.name = 'ServerWarmupError';
  }
}

/**
 * Wait for server to wake up by pinging health endpoint
 * Uses exponential backoff with jitter
 */
export async function waitForServerWakeup(options: WarmupOptions = {}): Promise<void> {
  const {
    maxRetries = 20,
    initialDelay = 500,
    maxDelay = 5000,
    timeout = 60000,
  } = options;

  const startTime = Date.now();
  let attempt = 0;
  let delay = initialDelay;

  while (attempt < maxRetries) {
    // Check if we've exceeded total timeout
    if (Date.now() - startTime > timeout) {
      throw new ServerWarmupError('Server warmup timed out', attempt);
    }

    try {
      // Ping health endpoint
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${config.apiUrl}/health`, {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-cache',
      });

      clearTimeout(timeoutId);

      // Server is awake if we get any response (even if not 200)
      if (response.status === 200 || response.status === 404) {
        return;
      }
    } catch (error) {
      // Ignore fetch errors, server is still waking up
    }

    // Wait before next attempt (exponential backoff with jitter)
    attempt++;
    if (attempt < maxRetries) {
      const jitter = Math.random() * 0.3 * delay; // 30% jitter
      await new Promise(resolve => setTimeout(resolve, delay + jitter));
      delay = Math.min(delay * 1.5, maxDelay); // Exponential backoff
    }
  }

  throw new ServerWarmupError('Server failed to wake up after maximum retries', attempt);
}

/**
 * Wrapper for fetch with automatic server warmup
 */
export async function fetchWithWarmup(
  url: string,
  options: RequestInit = {},
  warmupOptions: WarmupOptions = {}
): Promise<Response> {
  try {
    // Try direct fetch first
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    // If fetch fails, wait for server to wake up then retry
    if (error instanceof Error && (
      error.name === 'TypeError' || 
      error.name === 'AbortError' ||
      error.message.includes('fetch')
    )) {
      await waitForServerWakeup(warmupOptions);
      
      // Retry the request
      return fetch(url, options);
    }
    throw error;
  }
}

/**
 * Enhanced API request with warmup support
 */
export async function apiRequestWithWarmup(
  endpoint: string,
  method: string = 'GET',
  body?: any,
  warmupOptions: WarmupOptions = {}
): Promise<any> {
  const url = endpoint.startsWith('http') 
    ? endpoint 
    : `${config.apiUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const token = localStorage.getItem('civicos-jwt');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetchWithWarmup(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  }, warmupOptions);

  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    throw new Error(`${response.status}: ${text}`);
  }

  return response.json();
}
