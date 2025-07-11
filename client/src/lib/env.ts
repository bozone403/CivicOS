// Environment configuration for the frontend
export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  API_URL: process.env.VITE_API_URL || 'http://localhost:3000',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
} as const;

// Runtime environment detection
export const getRuntimeEnv = () => {
  if (typeof window === 'undefined') {
    return env;
  }

  // Detect production by hostname
  const isProduction = window.location.hostname === 'civicos.ca' || 
                      window.location.hostname === 'www.civicos.ca' ||
                      window.location.hostname.includes('vercel.app');

  return {
    ...env,
    IS_PRODUCTION: isProduction,
    IS_DEVELOPMENT: !isProduction,
  };
}; 