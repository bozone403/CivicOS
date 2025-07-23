import React from "react";
import { Button } from "@/components/ui/button";
import { Languages, Flag } from "lucide-react";

interface LanguageToggleProps {
  language: "en" | "fr";
  onLanguageChange: (language: "en" | "fr") => void;
  className?: string;
}

export function LanguageToggle({ language, onLanguageChange, className = "" }: LanguageToggleProps) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Languages className="w-4 h-4 text-gray-600" />
      <Button
        variant={language === "en" ? "default" : "outline"}
        size="sm"
        onClick={() => onLanguageChange("en")}
        className="flex items-center space-x-1"
      >
        <Flag className="w-3 h-3" />
        <span>EN</span>
      </Button>
      <Button
        variant={language === "fr" ? "default" : "outline"}
        size="sm"
        onClick={() => onLanguageChange("fr")}
        className="flex items-center space-x-1"
      >
        <Flag className="w-3 h-3" />
        <span>FR</span>
      </Button>
    </div>
  );
} 