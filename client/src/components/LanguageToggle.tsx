import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

interface LanguageToggleProps {
  className?: string;
  onLanguageChange?: (language: 'en' | 'fr') => void;
  currentLanguage?: 'en' | 'fr';
}

export function LanguageToggle({ className, onLanguageChange, currentLanguage }: LanguageToggleProps) {
  const [language, setLanguage] = useState<'en' | 'fr'>(currentLanguage || 'en');

  useEffect(() => {
    if (currentLanguage) {
      setLanguage(currentLanguage);
    }
  }, [currentLanguage]);

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'fr' : 'en';
    setLanguage(newLang);
    localStorage.setItem('civicos-language', newLang);
    onLanguageChange?.(newLang);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLanguage}
      className={`flex items-center space-x-2 ${className}`}
    >
      <Globe className="w-4 h-4" />
      <span>{language === 'en' ? 'EN' : 'FR'}</span>
    </Button>
  );
} 