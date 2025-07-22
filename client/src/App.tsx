import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ChatButton } from "@/components/ChatButton";
import { FloatingChatButton } from "@/components/FloatingChatButton";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

import { LuxuryNavigation } from "@/components/layout/LuxuryNavigation";
import { MobileNavigation } from "@/components/MobileNavigation";
import Landing from "@/pages/landing";
import About from "@/pages/about";
import Privacy from "@/pages/privacy";
import Terms from "@/pages/terms";
import Contact from "@/pages/contact";
import Accessibility from "@/pages/accessibility";
import Dashboard from "@/pages/dashboard";
import Voting from "@/pages/voting";
import Ledger from "@/pages/ledger";
import Politicians from "@/pages/politicians";
import Petitions from "@/pages/petitions";
import Discussions from "@/pages/discussions";
import Legal from "@/pages/legal";
import LegalSearch from "@/pages/legal-search";
import Rights from "@/pages/rights";
import Auth from "@/pages/auth";

import Elections from "@/pages/elections";
import Finance from "@/pages/finance";
import Lobbyists from "@/pages/lobbyists";
import Procurement from "@/pages/procurement";
import Memory from "@/pages/memory";
import Cases from "@/pages/cases";
import News from "@/pages/news";
import Contacts from "@/pages/contacts";
import Profile from "@/pages/profile";
import Settings from "@/pages/settings";
import FOI from "@/pages/foi";
import Leaks from "@/pages/leaks";
import Whistleblower from "@/pages/whistleblower";
import Corruption from "@/pages/corruption";
import Pulse from "@/pages/pulse";
import Trust from "@/pages/trust";
import Maps from "@/pages/maps";
import Notifications from "@/pages/notifications";
import UserProfile from "@/pages/user-profile";
import IdentityVerification from "@/pages/identity-verification";
import IdentityReview from "@/pages/admin/identity-review";
import Manifesto from "@/pages/manifesto";
import NotFound from "@/pages/not-found";
import canadianCrest from "./assets/ChatGPT Image Jun 20, 2025, 06_03_54 PM_1750464244456.png";
import DashboardDemo from "@/pages/dashboard-demo";
import CivicSocialLayout from "./pages/civicsocial";
import CivicSocialFeed from "./pages/civicsocial-feed";
import CivicSocialProfile from "./pages/civicsocial-profile";
import CivicSocialFriends from "./pages/civicsocial-friends";
import CivicSocialLanding from "./pages/civicsocial-landing";
import CivicSocialDiscussions from "./pages/civicsocial-discussions";
import { Button } from "./components/ui/button";
import NotificationBell from "./components/NotificationBell";
import { config } from "@/lib/config";
import FooterNav from "@/components/FooterNav";

// Add a simple error boundary
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(_error: any, _errorInfo: any) {
    // You can log error info here
    // console.error(error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-red-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-2">Something went wrong</h1>
            <p className="text-gray-700 mb-4">An unexpected error occurred. Please refresh the page or try again later.</p>
            <pre className="text-xs text-gray-500 bg-gray-100 rounded p-2 overflow-x-auto max-h-40 mb-4">{String(this.state.error)}</pre>
            <button className="bg-red-600 text-white px-4 py-2 rounded" onClick={() => window.location.reload()}>Reload</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ProtectedRoute component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const [hasAgreedToManifesto, setHasAgreedToManifesto] = useState(() => {
    return localStorage.getItem('civicos-manifesto-agreed') === 'true';
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/auth");
    }
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    if (isAuthenticated && !hasAgreedToManifesto) {
      navigate("/manifesto");
    }
  }, [isAuthenticated, hasAgreedToManifesto, navigate]);

  if (isLoading || isAuthenticated === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading CivicOS...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Redirect handled by useEffect
  }

  if (!hasAgreedToManifesto) {
    return null; // Redirect handled by useEffect
  }

  return <>{children}</>;
}

function Router() {
  const { isAuthenticated, isLoading, authError } = useAuth();

  // Fix Manifesto route for wouter (must be a function with props)
  const ManifestoRoute = () => {
    const [, navigate] = useLocation();
    const handleAgree = () => {
      localStorage.setItem('civicos-manifesto-agreed', 'true');
      navigate('/dashboard');
    };
    return <Manifesto onAgree={handleAgree} />;
  };

  React.useEffect(() => {
    // console.debug("[Router] isAuthenticated", isAuthenticated, "isLoading", isLoading, "config.apiUrl", config.apiUrl);
  }, [isAuthenticated, isLoading]);

  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Authentication Error</h1>
          <p className="text-gray-700 mb-4">{authError}</p>
          <button className="bg-red-600 text-white px-4 py-2 rounded" onClick={() => window.location.href = "/auth"}>Go to Login</button>
        </div>
      </div>
    );
  }

  if (isLoading || isAuthenticated === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading CivicOS...</p>
        </div>
      </div>
    );
  }

  // Public routes only
  if (!isAuthenticated) {
    return (
      <main>
        <Switch>
          <Route path="/" component={Landing} />
          <Route path="/about" component={About} />
          <Route path="/privacy" component={Privacy} />
          <Route path="/terms" component={Terms} />
          <Route path="/contact" component={Contact} />
          <Route path="/accessibility" component={Accessibility} />
          <Route path="/auth" component={Auth} />
          <Route path="/login" component={Auth} />
          <Route path="/register" component={Auth} />
          <Route path="/manifesto" component={ManifestoRoute} />
          <Route path="*">{() => <NotFound />}</Route>
        </Switch>
      </main>
    );
  }

  // Authenticated: show nav and protected routes
  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <LuxuryNavigation />
        <main className="flex-1 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen overflow-x-auto">
          {/* Mobile Navigation */}
          <div className="lg:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 flex items-center justify-center shadow-lg border border-slate-600 overflow-hidden">
                  <img 
                    src={canadianCrest} 
                    alt="CivicOS" 
                    className="w-6 h-6 object-contain rounded-full"
                  />
                </div>
                <h1 className="text-lg font-bold font-serif text-slate-900 dark:text-slate-100">CivicOS</h1>
              </div>
              <div className="flex items-center space-x-2">
                <ChatButton />
              </div>
            </div>
          </div>
          <div className="p-2 sm:p-4 lg:p-6">
            <Switch>
              <Route path="/dashboard" component={() => <ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/voting" component={() => <ProtectedRoute><Voting /></ProtectedRoute>} />
              <Route path="/ledger" component={() => <ProtectedRoute><Ledger /></ProtectedRoute>} />
              <Route path="/politicians" component={() => <ProtectedRoute><Politicians /></ProtectedRoute>} />
              <Route path="/petitions" component={() => <ProtectedRoute><Petitions /></ProtectedRoute>} />
              <Route path="/discussions" component={() => <ProtectedRoute><Discussions /></ProtectedRoute>} />
              <Route path="/legal" component={() => <ProtectedRoute><Legal /></ProtectedRoute>} />
              <Route path="/legal-search" component={() => <ProtectedRoute><LegalSearch /></ProtectedRoute>} />
              <Route path="/rights" component={() => <ProtectedRoute><Rights /></ProtectedRoute>} />
              <Route path="/elections" component={() => <ProtectedRoute><Elections /></ProtectedRoute>} />
              <Route path="/news" component={() => <ProtectedRoute><News /></ProtectedRoute>} />
              <Route path="/contacts" component={() => <ProtectedRoute><Contacts /></ProtectedRoute>} />
              <Route path="/profile" component={() => <ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/settings" component={() => <ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/finance" component={() => <ProtectedRoute><Finance /></ProtectedRoute>} />
              <Route path="/lobbyists" component={() => <ProtectedRoute><Lobbyists /></ProtectedRoute>} />
              <Route path="/procurement" component={() => <ProtectedRoute><Procurement /></ProtectedRoute>} />
              <Route path="/memory" component={() => <ProtectedRoute><Memory /></ProtectedRoute>} />
              <Route path="/cases" component={() => <ProtectedRoute><Cases /></ProtectedRoute>} />
              <Route path="/foi" component={() => <ProtectedRoute><FOI /></ProtectedRoute>} />
              <Route path="/leaks" component={() => <ProtectedRoute><Leaks /></ProtectedRoute>} />
              <Route path="/whistleblower" component={() => <ProtectedRoute><Whistleblower /></ProtectedRoute>} />
              <Route path="/corruption" component={() => <ProtectedRoute><Corruption /></ProtectedRoute>} />
              <Route path="/pulse" component={() => <ProtectedRoute><Pulse /></ProtectedRoute>} />
              <Route path="/trust" component={() => <ProtectedRoute><Trust /></ProtectedRoute>} />
              <Route path="/maps" component={() => <ProtectedRoute><Maps /></ProtectedRoute>} />
              <Route path="/manifesto" component={ManifestoRoute} />
              <Route path="/identity-verification" component={() => <ProtectedRoute><IdentityVerification /></ProtectedRoute>} />
              <Route path="/admin/identity-review" component={() => <ProtectedRoute><IdentityReview /></ProtectedRoute>} />
              <Route path="/notifications" component={() => <ProtectedRoute><Notifications /></ProtectedRoute>} />
              <Route path="/users/:userId" component={() => <ProtectedRoute><UserProfile /></ProtectedRoute>} />
              <Route path="/dashboard-demo" component={() => <ProtectedRoute><DashboardDemo /></ProtectedRoute>} />
              {/* CivicSocial routes (protected) */}
              <Route path="/civicsocial" component={() => <ProtectedRoute><CivicSocialLanding /></ProtectedRoute>} />
              <Route path="/civicsocial/feed" component={() => <ProtectedRoute><CivicSocialFeed /></ProtectedRoute>} />
              <Route path="/civicsocial/profile" component={() => <ProtectedRoute><CivicSocialProfile /></ProtectedRoute>} />
              <Route path="/civicsocial/discussions" component={() => <ProtectedRoute><CivicSocialDiscussions /></ProtectedRoute>} />
              <Route path="/civicsocial/friends" component={() => <ProtectedRoute><CivicSocialFriends /></ProtectedRoute>} />
              <Route path="*">{() => <NotFound />}</Route>
            </Switch>
          </div>
        </main>
      </div>
    </div>
  );
}

function AppWithBot() {
  return (
    <>
      <Router />
      <FloatingChatButton />
    </>
  );
}

function App() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();
  return (
    <TooltipProvider>
      <ErrorBoundary>
        <Toaster />
        <Router />
        <FloatingChatButton />
        <FooterNav /> {/* Mobile footer nav, md:hidden */}
      </ErrorBoundary>
    </TooltipProvider>
  );
}

export default App;
