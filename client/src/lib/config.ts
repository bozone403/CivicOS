// Configuration for different environments
interface Config {
  apiUrl: string;
  environment: 'production';
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
  // API calls should go to the Render backend
  return {
    apiUrl: 'https://civicos.onrender.com',
    environment: 'production',
    version: '1.0.1' // Cache busting version
  };
};

export const config = getConfig(); 