import React, { useState, useEffect, Suspense, lazy } from "react";
import { Router, Route, Switch, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { FloatingChatButton } from "@/components/FloatingChatButton";
import { FloatingMessageButton } from "@/components/FloatingMessageButton";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/Layout";
import { FeatureTutorial } from "@/components/FeatureTutorial";
import { useAuth, AuthProvider } from "@/hooks/useAuth";
import { CanadianCoatOfArms } from "@/components/CanadianCoatOfArms";
import canadianCrest from "@/assets/ChatGPT Image Jun 20, 2025, 06_03_54 PM_1750464244456.png";

// Lazy load pages for better performance
const Landing = lazy(() => import("@/pages/landing"));
const Auth = lazy(() => import("@/pages/auth"));
const Register = lazy(() => import("@/pages/Register"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const Profile = lazy(() => import("@/pages/profile"));
const Settings = lazy(() => import("@/pages/settings"));
const News = lazy(() => import("@/pages/news"));
const Politicians = lazy(() => import("@/pages/politicians"));
const Petitions = lazy(() => import("@/pages/petitions"));
const Voting = lazy(() => import("@/pages/voting"));
const Elections = lazy(() => import("@/pages/elections"));
const Contacts = lazy(() => import("@/pages/contacts"));
const Legal = lazy(() => import("@/pages/legal"));
const Rights = lazy(() => import("@/pages/rights"));
const Cases = lazy(() => import("@/pages/cases"));
const LegalSearch = lazy(() => import("@/pages/legal-search"));
const Finance = lazy(() => import("@/pages/finance"));
const Lobbyists = lazy(() => import("@/pages/lobbyists"));
const Procurement = lazy(() => import("@/pages/procurement"));
const Leaks = lazy(() => import("@/pages/leaks"));
const FOI = lazy(() => import("@/pages/foi"));
const Whistleblower = lazy(() => import("@/pages/whistleblower"));
const Corruption = lazy(() => import("@/pages/corruption"));
const Memory = lazy(() => import("@/pages/memory"));
const Pulse = lazy(() => import("@/pages/pulse"));
const Trust = lazy(() => import("@/pages/trust"));
const Maps = lazy(() => import("@/pages/maps"));
const Ledger = lazy(() => import("@/pages/ledger"));
const Search = lazy(() => import("@/pages/search"));

// CivicSocial Pages
const CivicSocialFeed = lazy(() => import("@/pages/civicsocial-feed"));
const CivicSocialProfile = lazy(() => import("@/pages/civicsocial-profile"));
const CivicSocialFriends = lazy(() => import("@/pages/civicsocial-friends"));
const CivicSocialDiscussions = lazy(() => import("@/pages/civicsocial-discussions"));
const CivicSocialMessages = lazy(() => import("@/pages/civicsocial-messages"));
const UserSearch = lazy(() => import("@/pages/user-search"));
const Social = lazy(() => import("@/pages/social"));

// Other pages
const About = lazy(() => import("@/pages/about"));
const Contact = lazy(() => import("@/pages/contact"));
const Privacy = lazy(() => import("@/pages/privacy"));
const Terms = lazy(() => import("@/pages/terms"));
const Accessibility = lazy(() => import("@/pages/accessibility"));
const Notifications = lazy(() => import("@/pages/notifications"));
const Support = lazy(() => import("@/pages/support"));
const NotFound = lazy(() => import("@/pages/not-found"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
    <div className="text-center">
      <CanadianCoatOfArms className="w-16 h-16 mx-auto mb-4 animate-pulse" />
      <div className="text-lg font-semibold text-gray-700 mb-2">Loading CivicOS...</div>
      <div className="text-sm text-gray-500">Building a better democracy</div>
    </div>
  </div>
);

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(_error: any, _errorInfo: any) {
    // Log error to console in development
    // console.error removed for production
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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [location] = useLocation();
  const token = localStorage.getItem('civicos-jwt');
  
  // Additional debug logging
  console.log('[ProtectedRoute]', {
    isAuthenticated,
    isLoading,
    hasUser: !!user,
    hasToken: !!token,
    location
  });
  
  if (isLoading) {
    return <PageLoader />;
  }
  
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-6">Please log in to access this page.</p>
          <div className="space-y-2 text-sm text-gray-500 mb-4">
            <div>Debug: Token exists: {token ? 'Yes' : 'No'}</div>
            <div>Debug: User exists: {user ? 'Yes' : 'No'}</div>
            <div>Debug: Loading: {isLoading ? 'Yes' : 'No'}</div>
          </div>
          <Button onClick={() => window.location.href = '/auth'}>
            Go to Login
          </Button>
          <div className="mt-4">
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/debug-auth'}
              className="text-sm"
            >
              Debug Authentication
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}

// Import the debug page
const DebugAuthPage = lazy(() => import("@/pages/debug-auth"));

export default function App() {
  const [showTutorial, setShowTutorial] = useState(false);
  const [hasSeenTutorial] = useState(() => {
    return localStorage.getItem('civicos-tutorial-seen') === 'true';
  });

  useEffect(() => {
    if (!hasSeenTutorial) {
      setShowTutorial(true);
    }
  }, [hasSeenTutorial]);

  const handleTutorialComplete = () => {
    setShowTutorial(false);
    localStorage.setItem('civicos-tutorial-seen', 'true');
  };

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
              <Suspense fallback={<PageLoader />}>
                <Switch>
                  {/* Public Routes */}
                  <Route path="/" component={Landing} />
                  <Route path="/auth" component={Auth} />
                  <Route path="/register" component={Register} />
                  <Route path="/about" component={About} />
                  <Route path="/contact" component={Contact} />
                  <Route path="/privacy" component={Privacy} />
                  <Route path="/terms" component={Terms} />
                  <Route path="/accessibility" component={Accessibility} />
                  <Route path="/support" component={Support} />
                  
                  {/* Debug route for testing auth */}
                  <Route path="/debug-auth">
                    <DebugAuthPage />
                  </Route>
                  
                  {/* Protected Routes */}
                  <Route path="/dashboard">
                    <ProtectedRoute>
                      <Layout>
                        <Dashboard />
                      </Layout>
                    </ProtectedRoute>
                  </Route>
                  
                  <Route path="/profile">
                    <ProtectedRoute>
                      <Layout>
                        <Profile />
                      </Layout>
                    </ProtectedRoute>
                  </Route>
                  
                  <Route path="/settings">
                    <ProtectedRoute>
                      <Layout>
                        <Settings />
                      </Layout>
                    </ProtectedRoute>
                  </Route>
                  
                  <Route path="/news">
                    <ProtectedRoute>
                      <Layout>
                        <News />
                      </Layout>
                    </ProtectedRoute>
                  </Route>
                  
                  <Route path="/politicians">
                    <ProtectedRoute>
                      <Layout>
                        <Politicians />
                      </Layout>
                    </ProtectedRoute>
                  </Route>
                  
                  <Route path="/petitions">
                    <ProtectedRoute>
                      <Layout>
                        <Petitions />
                      </Layout>
                    </ProtectedRoute>
                  </Route>
                  
                  <Route path="/voting">
                    <ProtectedRoute>
                      <Layout>
                        <Voting />
                      </Layout>
                    </ProtectedRoute>
                  </Route>
                  
                  <Route path="/elections">
                    <ProtectedRoute>
                      <Layout>
                        <Elections />
                      </Layout>
                    </ProtectedRoute>
                  </Route>
                  
                  <Route path="/contacts">
                    <ProtectedRoute>
                      <Layout>
                        <Contacts />
                      </Layout>
                    </ProtectedRoute>
                  </Route>
                  
                  <Route path="/legal">
                    <ProtectedRoute>
                      <Layout>
                        <Legal />
                      </Layout>
                    </ProtectedRoute>
                  </Route>
                  
                  <Route path="/rights">
                    <ProtectedRoute>
                      <Layout>
                        <Rights />
                      </Layout>
                    </ProtectedRoute>
                  </Route>
                  
                  <Route path="/cases">
                    <ProtectedRoute>
                      <Layout>
                        <Cases />
                      </Layout>
                    </ProtectedRoute>
                  </Route>
                  
                  <Route path="/legal-search">
                    <ProtectedRoute>
                      <Layout>
                        <LegalSearch />
                      </Layout>
                    </ProtectedRoute>
                  </Route>
                  
                  <Route path="/finance">
                    <ProtectedRoute>
                      <Layout>
                        <Finance />
                      </Layout>
                    </ProtectedRoute>
                  </Route>
                  
                  <Route path="/lobbyists">
                    <ProtectedRoute>
                      <Layout>
                        <Lobbyists />
                      </Layout>
                    </ProtectedRoute>
                  </Route>
                  
                  <Route path="/procurement">
                    <ProtectedRoute>
                      <Layout>
                        <Procurement />
                      </Layout>
                    </ProtectedRoute>
                  </Route>
                  
                  <Route path="/leaks">
                    <ProtectedRoute>
                      <Layout>
                        <Leaks />
                      </Layout>
                    </ProtectedRoute>
                  </Route>
                  
                  <Route path="/foi">
                    <ProtectedRoute>
                      <Layout>
                        <FOI />
                      </Layout>
                    </ProtectedRoute>
                  </Route>
                  
                  <Route path="/whistleblower">
                    <ProtectedRoute>
                      <Layout>
                        <Whistleblower />
                      </Layout>
                    </ProtectedRoute>
                  </Route>
                  
                  <Route path="/corruption">
                    <ProtectedRoute>
                      <Layout>
                        <Corruption />
                      </Layout>
                    </ProtectedRoute>
                  </Route>
                  
                  <Route path="/memory">
                    <ProtectedRoute>
                      <Layout>
                        <Memory />
                      </Layout>
                    </ProtectedRoute>
                  </Route>
                  
                  <Route path="/pulse">
                    <ProtectedRoute>
                      <Layout>
                        <Pulse />
                      </Layout>
                    </ProtectedRoute>
                  </Route>
                  
                  <Route path="/trust">
                    <ProtectedRoute>
                      <Layout>
                        <Trust />
                      </Layout>
                    </ProtectedRoute>
                  </Route>
                  
                  <Route path="/maps">
                    <ProtectedRoute>
                      <Layout>
                        <Maps />
                      </Layout>
                    </ProtectedRoute>
                  </Route>
                  
                  <Route path="/ledger">
                    <ProtectedRoute>
                      <Layout>
                        <Ledger />
                      </Layout>
                    </ProtectedRoute>
                  </Route>
                  
                  <Route path="/search">
                    <ProtectedRoute>
                      <Layout>
                        <Search />
                      </Layout>
                    </ProtectedRoute>
                  </Route>
                  
                  {/* CivicSocial Routes */}
                  <Route path="/civicsocial/feed">
                    <ProtectedRoute>
                      <Layout>
                        <CivicSocialFeed />
                      </Layout>
                    </ProtectedRoute>
                  </Route>
                  
                  <Route path="/civicsocial/profile">
                    <ProtectedRoute>
                      <Layout>
                        <CivicSocialProfile />
                      </Layout>
                    </ProtectedRoute>
                  </Route>
                  
                  <Route path="/civicsocial/friends">
                    <ProtectedRoute>
                      <Layout>
                        <CivicSocialFriends />
                      </Layout>
                    </ProtectedRoute>
                  </Route>
                  
                  <Route path="/civicsocial/discussions">
                    <ProtectedRoute>
                      <Layout>
                        <CivicSocialDiscussions />
                      </Layout>
                    </ProtectedRoute>
                  </Route>
                  
                  <Route path="/civicsocial/messages">
                    <ProtectedRoute>
                      <Layout>
                        <CivicSocialMessages />
                      </Layout>
                    </ProtectedRoute>
                  </Route>
                  
                  <Route path="/user-search">
                    <ProtectedRoute>
                      <Layout>
                        <UserSearch />
                      </Layout>
                    </ProtectedRoute>
                  </Route>
                  
                  <Route path="/social">
                    <ProtectedRoute>
                      <Layout>
                        <Social />
                      </Layout>
                    </ProtectedRoute>
                  </Route>
                  
                  {/* 404 Route */}
                  <Route path="*" component={NotFound} />
                </Switch>
              </Suspense>
              
              {/* Global Components */}
              <FloatingChatButton />
              <FloatingMessageButton />
              <Toaster />
              
              {/* Tutorial */}
              {showTutorial && (
                <FeatureTutorial onComplete={handleTutorialComplete} />
              )}
            </div>
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
