// Configuration for different environments
interface Config {
  apiUrl: string;
  environment: 'development' | 'production';
  version: string;
}

const getConfig = (): Config => {
  const envApiUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) ? import.meta.env.VITE_API_BASE_URL : undefined;
  
  if (envApiUrl) {
    return {
      apiUrl: envApiUrl,
      environment: 'production',
      version: '1.0.1' // Cache busting version
    };
  }
  
  // Always use production API for live testing
  return {
    apiUrl: 'https://civicos.onrender.com',
    environment: 'production',
    version: '1.0.1' // Cache busting version
  };
};

export const config = getConfig(); 