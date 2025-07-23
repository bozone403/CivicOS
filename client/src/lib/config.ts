// Configuration for different environments
interface Config {
  apiUrl: string;
  environment: 'production' | 'development';
}

const getConfig = (): Config => {
  const envApiUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) ? import.meta.env.VITE_API_BASE_URL : undefined;
  if (envApiUrl) {
    return {
      apiUrl: envApiUrl,
      environment: 'production'
    };
  }
  const isProduction = window.location.hostname === 'civicos.ca' || window.location.hostname === 'www.civicos.ca';
  if (isProduction) {
    return {
      apiUrl: 'https://civicos.onrender.com',
      environment: 'production'
    };
  }
  // Only allow localhost fallback in explicit development mode
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return {
      apiUrl: 'http://localhost:5001',
      environment: 'development'
    };
  }
  throw new Error('API base URL is not set. Please set VITE_API_BASE_URL for this environment.');
};

export const config = getConfig(); 