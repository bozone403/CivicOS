import React, { useState, useEffect } from "react";
import { Router, Route, Switch, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { FloatingChatButton } from "@/components/FloatingChatButton";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { CanadianCoatOfArms } from "@/components/CanadianCoatOfArms";
import canadianCrest from "@/assets/ChatGPT Image Jun 20, 2025, 06_03_54 PM_1750464244456.png";

// Pages
import Landing from "@/pages/landing";
import Auth from "@/pages/auth";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/dashboard";
import Profile from "@/pages/profile";
import Settings from "@/pages/settings";
import News from "@/pages/news";
import Politicians from "@/pages/politicians";
import Petitions from "@/pages/petitions";
import Voting from "@/pages/voting";
import Elections from "@/pages/elections";
import Contacts from "@/pages/contacts";
import Legal from "@/pages/legal";
import Rights from "@/pages/rights";
import Cases from "@/pages/cases";
import LegalSearch from "@/pages/legal-search";
import Finance from "@/pages/finance";
import Lobbyists from "@/pages/lobbyists";
import Procurement from "@/pages/procurement";
import Leaks from "@/pages/leaks";
import FOI from "@/pages/foi";
import Whistleblower from "@/pages/whistleblower";
import Corruption from "@/pages/corruption";
import Memory from "@/pages/memory";
import Pulse from "@/pages/pulse";
import Trust from "@/pages/trust";
import Maps from "@/pages/maps";
import Ledger from "@/pages/ledger";

// CivicSocial Pages
import CivicSocialFeed from "@/pages/civicsocial-feed";
import CivicSocialProfile from "@/pages/civicsocial-profile";
import CivicSocialFriends from "@/pages/civicsocial-friends";
import CivicSocialDiscussions from "@/pages/civicsocial-discussions";
import CivicSocialMessages from "@/pages/civicsocial-messages";

// Other pages
import About from "@/pages/about";
import Contact from "@/pages/contact";
import Privacy from "@/pages/privacy";
import Terms from "@/pages/terms";
import Accessibility from "@/pages/accessibility";
import Notifications from "@/pages/notifications";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

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

  if (isLoading) {
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

  if (!isAuthenticated) {
    return null;
  }

  if (!hasAgreedToManifesto) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <img src={canadianCrest} alt="CivicOS" className="w-20 h-20 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to CivicOS</h1>
            <p className="text-lg text-gray-600 mb-6">
              Before you begin, please review and agree to our platform manifesto.
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-blue-900 mb-4">Our Commitment</h2>
            <div className="space-y-3 text-blue-800">
              <p>• We provide transparent, authentic government accountability</p>
              <p>• Your privacy and security are our top priorities</p>
              <p>• We promote respectful, fact-based civic engagement</p>
              <p>• All information is verified from official sources</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => {
                setHasAgreedToManifesto(true);
                localStorage.setItem('civicos-manifesto-agreed', 'true');
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              I Agree & Continue
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/auth")}
              className="flex-1"
            >
              Maybe Later
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="App">
          <Switch>
            {/* Public Routes */}
            <Route path="/" component={Landing} />
            <Route path="/auth" component={Auth} />
            <Route path="/login" component={Login} />
            <Route path="/register" component={Register} />
            <Route path="/about" component={About} />
            <Route path="/contact" component={Contact} />
            <Route path="/privacy" component={Privacy} />
            <Route path="/terms" component={Terms} />
            <Route path="/accessibility" component={Accessibility} />

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

            <Route path="/notifications">
              <ProtectedRoute>
                <Layout>
                  <Notifications />
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

            {/* 404 Route */}
            <Route component={NotFound} />
          </Switch>
        </div>
        <Toaster />
        <FloatingChatButton />
      </Router>
    </QueryClientProvider>
  );
}
