// Configuration for different environments
interface Config {
  apiUrl: string;
  environment: 'development' | 'production';
}

const getConfig = (): Config => {
  // Check if we're in production (Vercel deployment)
  const isProduction = window.location.hostname === 'civicos.ca' || 
                      window.location.hostname === 'www.civicos.ca' ||
                      window.location.hostname.includes('vercel.app');

  if (isProduction) {
    return {
      apiUrl: 'https://civicos.ca', // Same domain for API
      environment: 'production'
    };
  }

  // Development
  return {
    apiUrl: 'http://localhost:3000',
    environment: 'development'
  };
};

export const config = getConfig(); 