// Configuration for different environments
declare global {
  const __DEV__: boolean;
}

interface Config {
  apiUrl: string;
  environment: 'development' | 'production';
  version: string;
}

const getConfig = (): Config => {
  // Check for environment variable first
  const envApiUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) ? import.meta.env.VITE_API_BASE_URL : undefined;
  
  if (envApiUrl) {
    return {
      apiUrl: envApiUrl,
      environment: 'production',
      version: '1.0.2' // Cache busting version - updated
    };
  }
  
  // Force local development server for now
  return {
    apiUrl: 'http://localhost:5001',
    environment: 'development',
    version: '1.0.2'
  };
  
  // Use production API in production mode
  return {
    apiUrl: 'https://civicos.onrender.com',
    environment: 'production',
    version: '1.0.2' // Cache busting version - updated
  };
};

export const config = getConfig(); 