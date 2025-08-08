import * as React from "react";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { VerificationStatusBadge } from "@/components/VerificationStatusBadge";
import { useMutation, useQuery } from "@tanstack/react-query";
import { authRequest, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CanadianCoatOfArms } from "@/components/CanadianCoatOfArms";
import DonationPopup from "@/components/DonationPopup";
import DonationSuccess from "@/components/DonationSuccess";
import civicOSLogo from "@assets/ChatGPT Image Jun 20, 2025, 05_42_18 PM_1750462997583.png";
import canadianCrest from "../../assets/ChatGPT Image Jun 20, 2025, 06_03_54 PM_1750464244456.png";
import { 
  Home, 
  Users, 
  FileText, 
  Gavel, 
  MessageSquare, 
  TrendingUp, 
  Settings, 
  Bell,
  Search,
  Crown,
  Shield,
  DollarSign,
  Building,
  Eye,
  Scale,
  AlertTriangle,
  Activity,
  Archive,
  BarChart3,
  Brain,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  LogOut,
  BookOpen,
  Heart,
  Vote,
  MapPin,
  Megaphone,
  Globe,
  User,
  Settings as SettingsIcon,
  Info,
  UserPlus,
  MessageCircle,
  Newspaper,
  FileSignature
} from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  subItems?: NavItem[];
}

// CivicSocial navigation items for top header
const civicsocialNavItems = [
  { title: "Feed", href: "/civicsocial/feed", icon: Home },
  { title: "Social Profile", href: "/civicsocial/profile", icon: User },
  { title: "Friends", href: "/civicsocial/friends", icon: UserPlus },
  { title: "News", href: "/news", icon: Newspaper },
  { title: "Petitions", href: "/petitions", icon: FileSignature },
];

// Sidebar navigation sections (excluding CivicSocial items)
const navigationSections = [
  {
    title: "Democracy",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: Home },
      { title: "Bills & Voting", href: "/voting", icon: Vote },
      { title: "Elections", href: "/elections", icon: Crown },
      { title: "Politicians", href: "/politicians", icon: Users },
      { title: "Contact Officials", href: "/contacts", icon: MessageSquare },
    ]
  },
  {
    title: "Legal & Rights",
    items: [
      { title: "Legal System", href: "/legal", icon: Gavel },
      { title: "Your Rights", href: "/rights", icon: Shield },
      { title: "Constitutional Cases", href: "/cases", icon: Scale },
      { title: "Legal Search", href: "/legal-search", icon: Search },
    ]
  },
  {
    title: "Transparency",
    items: [
      { title: "Campaign Finance", href: "/finance", icon: DollarSign },
      { title: "Lobbyist Mapping", href: "/lobbyists", icon: Eye },
      { title: "Procurement Tracker", href: "/procurement", icon: Building },
      { title: "Document Leaks", href: "/leaks", icon: Archive },
      { title: "FOI Requests", href: "/foi", icon: Eye },
      { title: "Whistleblower Portal", href: "/whistleblower", icon: AlertTriangle },
      { title: "Corruption Patterns", href: "/corruption", icon: Activity },
    ]
  },
  {
    title: "Analysis",
    items: [
      { title: "Political Memory", href: "/memory", icon: Brain },
      { title: "Pulse", href: "/pulse", icon: Activity },
      { title: "Trust Metrics", href: "/trust", icon: BarChart3 },
      { title: "Engagement Maps", href: "/maps", icon: MapPin },
      { title: "Ledger", href: "/ledger", icon: BookOpen },
    ]
  },
  {
    title: "Account",
    items: [
      { title: "Account Settings", href: "/profile", icon: SettingsIcon },
      { title: "Settings", href: "/settings", icon: SettingsIcon },
    ]
  }
];

// Add Notification type for clarity
interface Notification {
  id: string | number;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: string;
}

export function LuxuryNavigation() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [showDonationPopup, setShowDonationPopup] = useState(false);
  const [showDonationSuccess, setShowDonationSuccess] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  // Check if popups have been shown in this session
  useEffect(() => {
    const donationShown = sessionStorage.getItem('donationPopupShown');
    if (donationShown) {
      setShowDonationPopup(false);
    }
  }, []);

  // Fetch notifications and unread count
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    queryFn: () => authRequest('/api/notifications', 'GET'),
    refetchInterval: 30000,
  });
  const { data: unreadObj } = useQuery<{ unread: number }>({
    queryKey: ['/api/notifications/unread-count'],
    queryFn: () => authRequest('/api/notifications/unread-count', 'GET'),
    refetchInterval: 30000,
  });
  const unreadCount = unreadObj?.unread ?? notifications.filter(n => !n.read).length;

  const markAllMutation = useMutation({
    mutationFn: async () => authRequest('/api/notifications/read-all', 'PATCH'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
      toast({ title: 'Notifications', description: 'All notifications marked as read' });
    }
  });

  const toggleSection = (sectionTitle: string) => {
    const newCollapsed = new Set(collapsedSections);
    if (newCollapsed.has(sectionTitle)) {
      newCollapsed.delete(sectionTitle);
    } else {
      newCollapsed.add(sectionTitle);
    }
    setCollapsedSections(newCollapsed);
  };

  const isActive = (href: string) => {
    return location === href || location.startsWith(href + '/');
  };

  const handleDonationSuccess = () => {
    setShowDonationPopup(false);
    setShowDonationSuccess(true);
    sessionStorage.setItem('donationPopupShown', 'true');
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      toast({
        title: "Search",
        description: "Please enter a search term",
        variant: "destructive"
      });
      return;
    }

    try {
      // Navigate to search results page with query
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    } catch (error) {
      toast({
        title: "Search Error",
        description: "Failed to perform search. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      {/* Facebook-style Top Bar with CivicSocial Navigation */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-4 h-16">
          {/* Left: Logo and Search */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <img src={canadianCrest} alt="CivicOS" className="w-8 h-8" />
              <span className="text-xl font-bold text-gray-900">CivicOS</span>
            </div>
            <form onSubmit={handleSearch} className="hidden md:flex relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search CivicOS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-10 pr-4 py-2 bg-gray-100 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </form>
          </div>

          {/* Center: CivicSocial Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {civicsocialNavItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button 
                  variant={isActive(item.href) ? 'default' : 'ghost'} 
                  size="sm" 
                  className="px-4"
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.title}
                </Button>
              </Link>
            ))}
          </div>

          {/* Right: User Menu */}
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="relative" onClick={() => markAllMutation.mutate()} title="Mark all as read">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">
                  {unreadCount}
                </Badge>
              )}
            </Button>
            <div className="relative group">
              <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white text-sm font-bold">
                  {user?.firstName?.[0] || user?.email?.[0] || "U"}
                </div>
                <span className="hidden md:block text-sm font-medium">
                  {user?.firstName || user?.email?.split('@')[0] || 'User'}
                </span>
                <ChevronDown className="w-4 h-4" />
              </Button>
              <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-2">
                  <Link href="/profile">
                    <Button variant="ghost" className="w-full justify-start px-4 py-2">
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </Button>
                  </Link>
                  <Link href="/settings">
                    <Button variant="ghost" className="w-full justify-start px-4 py-2">
                      <SettingsIcon className="w-4 h-4 mr-2" />
                      Settings
                    </Button>
                  </Link>
                  <Separator className="my-1" />
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => logout()}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <div className={cn(
        "fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 shadow-sm transition-all duration-300 z-40",
        isCollapsed ? "w-16" : "w-64"
      )}>
        <ScrollArea className="h-full">
          <div className="p-4 space-y-6">
            {/* Collapse Button */}
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="w-8 h-8 p-0"
              >
                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>

            {/* Navigation Sections */}
            {navigationSections.map((section) => (
              <div key={section.title} className="space-y-2">
                {!isCollapsed && (
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {section.title}
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSection(section.title)}
                      className="w-6 h-6 p-0"
                    >
                      {collapsedSections.has(section.title) ? (
                        <ChevronRight className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                )}
                
                {(!isCollapsed && !collapsedSections.has(section.title)) && (
                  <div className="space-y-1">
                    {section.items.map((item) => (
                      <Link key={item.href} href={item.href}>
                        <Button
                          variant={isActive(item.href) ? "default" : "ghost"}
                          className={cn(
                            "w-full justify-start text-sm h-9",
                            isActive(item.href) && "bg-blue-50 text-blue-700 border-blue-200"
                          )}
                        >
                          <item.icon className="w-4 h-4 mr-3" />
                          {item.title}
                        </Button>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Support Section - More Prominent */}
            {!isCollapsed && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Support
                </h3>
                <div className="space-y-1">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start text-sm h-9 border-2 border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-300 text-red-700 font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                    onClick={() => setShowDonationPopup(true)}
                  >
                    <Heart className="w-4 h-4 mr-3 text-red-600" />
                    Support Platform
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start text-sm h-9">
                    <Info className="w-4 h-4 mr-3" />
                    About CivicOS
                  </Button>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content Area */}
      <div className={cn(
        "transition-all duration-300",
        isCollapsed ? "ml-16" : "ml-64"
      )}>
        <div className="pt-16">
          {/* Content will be rendered here */}
        </div>
      </div>

      {/* Donation Popups */}
      {showDonationPopup && (
        <DonationPopup
          isOpen={showDonationPopup}
          onClose={() => setShowDonationPopup(false)}
          onSuccess={handleDonationSuccess}
        />
      )}
      {showDonationSuccess && (
        <DonationSuccess
          isOpen={showDonationSuccess}
          onClose={() => setShowDonationSuccess(false)}
          amount={25}
        />
      )}
    </>
  );
}