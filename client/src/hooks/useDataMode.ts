import { useState, useEffect } from 'react';

interface DataModeConfig {
  useLiveData: boolean;
  dataSource: string;
  lastSync?: string;
}

// Global data mode configuration
const DEFAULT_CONFIG: DataModeConfig = {
  useLiveData: true,
  dataSource: "Government APIs",
  lastSync: new Date().toISOString()
};

export function useDataMode() {
  const [config, setConfig] = useState<DataModeConfig>(DEFAULT_CONFIG);

  // Check if we should use live data based on environment
  useEffect(() => {
    const isProduction = import.meta.env.MODE === 'production';
    
    setConfig(prev => ({
      ...prev,
      useLiveData: isProduction,
      dataSource: isProduction ? "Parliament of Canada APIs" : "Government APIs"
    }));
  }, []);

  const toggleDataMode = () => {
    setConfig(prev => ({
      ...prev,
      useLiveData: !prev.useLiveData,
      lastSync: prev.useLiveData ? undefined : new Date().toISOString()
    }));
  };

  return {
    ...config,
    toggleDataMode,
  };
}