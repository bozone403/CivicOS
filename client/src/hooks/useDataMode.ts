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

  // Production always uses live data
  useEffect(() => {
    setConfig(prev => ({
      ...prev,
      useLiveData: true,
      dataSource: "Parliament of Canada APIs"
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