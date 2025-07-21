// Configuration for different environments
interface Config {
  apiUrl: string;
  environment: 'production';
}

const getConfig = (): Config => {
  // Allow VITE_API_BASE_URL to override for flexible deployment
  const envApiUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) ? import.meta.env.VITE_API_BASE_URL : undefined;
  if (envApiUrl) {
    return {
      apiUrl: envApiUrl,
      environment: 'production'
    };
  }
  // Check if we're in production (Civicos deployment)
  const isProduction = window.location.hostname === 'civicos.ca' || window.location.hostname === 'www.civicos.ca';
  if (isProduction) {
    return {
      apiUrl: 'https://civicos.onrender.com', // Backend on Render
      environment: 'production'
    };
  }
  // Development
  return {
    apiUrl: 'http://localhost:5001', // Updated to match backend port
    environment: 'production'
  };
};

export const config = getConfig(); 