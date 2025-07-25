// Configuration for different environments
interface Config {
  apiUrl: string;
  environment: 'production';
}

const getConfig = (): Config => {
  const envApiUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) ? import.meta.env.VITE_API_BASE_URL : undefined;
  if (envApiUrl) {
    return {
      apiUrl: envApiUrl,
      environment: 'production'
    };
  }
  // Always use production URLs for live testing
  return {
    apiUrl: 'https://civicos.onrender.com',
    environment: 'production'
  };
};

export const config = getConfig(); 