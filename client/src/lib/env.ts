// Environment configuration for the frontend
export const env = {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  IS_PRODUCTION: import.meta.env.NODE_ENV === 'production',
} as const;

// Remove dev/test defaults, use empty string or throw for missing production values
export const getRuntimeEnv = () => {
  if (typeof window === 'undefined') {
    return env;
  }

  // Detect production by hostname
  const isProduction = window.location.hostname === 'civicos.ca' || 
                      window.location.hostname === 'www.civicos.ca';

  return {
    ...env,
    IS_PRODUCTION: isProduction,
  };
}; 