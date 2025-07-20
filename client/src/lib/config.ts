// Configuration for different environments
interface Config {
  apiUrl: string;
  environment: 'development' | 'production';
}

const getConfig = (): Config => {
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
    apiUrl: 'http://localhost:3000',
    environment: 'development'
  };
};

export const config = getConfig(); 