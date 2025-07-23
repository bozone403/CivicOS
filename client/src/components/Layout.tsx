import React from "react";
import { LuxuryNavigation } from "./layout/LuxuryNavigation";
import { MobileNavigation } from "./MobileNavigation";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { isAuthenticated } = useAuth();
  const [location] = useLocation();

  // Don't show navigation on auth pages or landing page
  const hideNavigation = location === "/auth" || location === "/" || location === "/landing";

  if (hideNavigation) {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-bold mb-2">Loading...</h2>
          <p className="text-gray-600">Please wait while we verify your credentials.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Navigation */}
      <div className="hidden md:block">
        <LuxuryNavigation />
        <div className="md:ml-64 pt-16">
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <MobileNavigation />
        <main className="pt-16 pb-20">
          {children}
        </main>
      </div>
    </div>
  );
} 