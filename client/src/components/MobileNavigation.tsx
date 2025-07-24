import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  Vote, 
  Users, 
  FileText, 
  MessageSquare, 
  Bell,
  Settings, 
  LogOut,
  User,
  UserPlus,
  Heart,
  MoreHorizontal,
  HelpCircle,
  Shield,
  BookOpen,
  TrendingUp,
  MapPin,
  Gavel,
  Scale,
  Search,
  DollarSign,
  Eye,
  Building,
  Archive,
  AlertTriangle,
  Activity,
  Brain,
  BarChart3,
  Crown,
  Megaphone,
  Globe,
  Newspaper,
  FileSignature
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import DonationPopup from "@/components/DonationPopup";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";

// Add Notification type for clarity
interface Notification {
  id: string | number;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: string;
}

export function MobileNavigation() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showDonationPopup, setShowDonationPopup] = useState(false);

  const isActive = (href: string) => {
    if (href === "/" && location === "/") return true;
    if (href !== "/" && location.startsWith(href)) return true;
    return false;
  };

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: true,
  });
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Primary mobile navigation items (most important)
  const primaryNavItems = [
    { title: "Dashboard", href: "/dashboard", icon: Home },
    { title: "Feed", href: "/civicsocial/feed", icon: MessageSquare },
    { title: "Vote", href: "/voting", icon: Vote },
    { title: "Politicians", href: "/politicians", icon: Users },
  ];

  // CivicSocial navigation items
  const civicsocialItems = [
    { title: "Profile", href: "/civicsocial/profile", icon: User, description: "Your social profile" },
    { title: "Friends", href: "/civicsocial/friends", icon: UserPlus, description: "Manage friends" },
    { title: "Discussions", href: "/civicsocial/discussions", icon: MessageSquare, description: "Public discussions" },
  ];

  // Democracy section items
  const democracyItems = [
    { title: "Elections", href: "/elections", icon: Crown, description: "Election information" },
    { title: "Contact Officials", href: "/contacts", icon: MessageSquare, description: "Contact representatives" },
  ];

  // Legal & Rights section items
  const legalItems = [
    { title: "Legal System", href: "/legal", icon: Gavel, description: "Legal documents" },
    { title: "Your Rights", href: "/rights", icon: Shield, description: "Canadian rights" },
    { title: "Cases", href: "/cases", icon: Scale, description: "Constitutional cases" },
    { title: "Legal Search", href: "/legal-search", icon: Search, description: "Search legal info" },
  ];

  // Transparency section items
  const transparencyItems = [
    { title: "Campaign Finance", href: "/finance", icon: DollarSign, description: "Political funding" },
    { title: "Lobbyists", href: "/lobbyists", icon: Eye, description: "Lobbyist mapping" },
    { title: "Procurement", href: "/procurement", icon: Building, description: "Government contracts" },
    { title: "Leaks", href: "/leaks", icon: Archive, description: "Document leaks" },
    { title: "FOI Requests", href: "/foi", icon: Eye, description: "Freedom of information" },
    { title: "Whistleblower", href: "/whistleblower", icon: AlertTriangle, description: "Whistleblower portal" },
    { title: "Corruption", href: "/corruption", icon: Activity, description: "Corruption patterns" },
  ];

  // Analysis section items
  const analysisItems = [
    { title: "Political Memory", href: "/memory", icon: Brain, description: "Political history" },
    { title: "Pulse", href: "/pulse", icon: Activity, description: "Political pulse" },
    { title: "Trust Metrics", href: "/trust", icon: BarChart3, description: "Trust analysis" },
    { title: "Maps", href: "/maps", icon: MapPin, description: "Interactive maps" },
  ];

  // Other items
  const otherItems = [
    { title: "News", href: "/news", icon: FileText, description: "Latest news" },
    { title: "Support", href: "/support", icon: HelpCircle, description: "Get help" },
    { title: "Settings", href: "/settings", icon: Settings, description: "Account settings" },
    { title: "Profile", href: "/profile", icon: User, description: "Your profile" },
  ];

  return (
    <>
      {/* Bottom Navigation Toolbar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg md:hidden">
        <div className="flex items-center justify-around px-2 py-2">
          {primaryNavItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "flex flex-col items-center space-y-1 h-16 w-16 p-2",
                  isActive(item.href) 
                    ? "text-blue-600 bg-blue-50" 
                    : "text-gray-600 hover:text-blue-600"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.title}</span>
              </Button>
            </Link>
          ))}
          
          {/* Notifications with badge */}
          <div className="relative">
            <Link href="/notifications">
              <Button
                variant="ghost"
                size="sm"
                className="flex flex-col items-center space-y-1 h-16 w-16 p-2"
              >
                <Bell className="w-5 h-5" />
                <span className="text-xs font-medium">Alerts</span>
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </Link>
          </div>

          {/* More Menu */}
          <Sheet open={showMoreMenu} onOpenChange={setShowMoreMenu}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="flex flex-col items-center space-y-1 h-16 w-16 p-2"
              >
                <MoreHorizontal className="w-5 h-5" />
                <span className="text-xs font-medium">More</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh] bg-white">
              <SheetHeader>
                <SheetTitle className="text-left">CivicOS Features</SheetTitle>
              </SheetHeader>
              
              <div className="overflow-y-auto h-full pb-20">
                {/* Support Button */}
                <div className="mb-6">
                  <Button
                    onClick={() => {
                      setShowDonationPopup(true);
                      setShowMoreMenu(false);
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3"
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    Support CivicOS
                  </Button>
                </div>
                
                {/* CivicSocial Section */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">CivicSocial</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {civicsocialItems.map((item) => (
                      <Link key={item.href} href={item.href} onClick={() => setShowMoreMenu(false)}>
                        <Button
                          variant="outline"
                          className="h-20 w-full flex flex-col items-center justify-center space-y-2 p-4 bg-white"
                        >
                          <item.icon className="w-5 h-5" />
                          <div className="text-center">
                            <div className="font-medium text-xs">{item.title}</div>
                            <div className="text-xs text-gray-500">{item.description}</div>
                          </div>
                        </Button>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Democracy Section */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Democracy</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {democracyItems.map((item) => (
                      <Link key={item.href} href={item.href} onClick={() => setShowMoreMenu(false)}>
                        <Button
                          variant="outline"
                          className="h-20 w-full flex flex-col items-center justify-center space-y-2 p-4 bg-white"
                        >
                          <item.icon className="w-5 h-5" />
                          <div className="text-center">
                            <div className="font-medium text-xs">{item.title}</div>
                            <div className="text-xs text-gray-500">{item.description}</div>
                          </div>
                        </Button>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Legal & Rights Section */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Legal & Rights</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {legalItems.map((item) => (
                      <Link key={item.href} href={item.href} onClick={() => setShowMoreMenu(false)}>
                        <Button
                          variant="outline"
                          className="h-20 w-full flex flex-col items-center justify-center space-y-2 p-4 bg-white"
                        >
                          <item.icon className="w-5 h-5" />
                          <div className="text-center">
                            <div className="font-medium text-xs">{item.title}</div>
                            <div className="text-xs text-gray-500">{item.description}</div>
                          </div>
                        </Button>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Transparency Section */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Transparency</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {transparencyItems.map((item) => (
                      <Link key={item.href} href={item.href} onClick={() => setShowMoreMenu(false)}>
                        <Button
                          variant="outline"
                          className="h-20 w-full flex flex-col items-center justify-center space-y-2 p-4 bg-white"
                        >
                          <item.icon className="w-5 h-5" />
                          <div className="text-center">
                            <div className="font-medium text-xs">{item.title}</div>
                            <div className="text-xs text-gray-500">{item.description}</div>
                          </div>
                        </Button>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Analysis Section */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Analysis</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {analysisItems.map((item) => (
                      <Link key={item.href} href={item.href} onClick={() => setShowMoreMenu(false)}>
                        <Button
                          variant="outline"
                          className="h-20 w-full flex flex-col items-center justify-center space-y-2 p-4 bg-white"
                        >
                          <item.icon className="w-5 h-5" />
                          <div className="text-center">
                            <div className="font-medium text-xs">{item.title}</div>
                            <div className="text-xs text-gray-500">{item.description}</div>
                          </div>
                        </Button>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Other Section */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Other</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {otherItems.map((item) => (
                      <Link key={item.href} href={item.href} onClick={() => setShowMoreMenu(false)}>
                        <Button
                          variant="outline"
                          className="h-20 w-full flex flex-col items-center justify-center space-y-2 p-4 bg-white"
                        >
                          <item.icon className="w-5 h-5" />
                          <div className="text-center">
                            <div className="font-medium text-xs">{item.title}</div>
                            <div className="text-xs text-gray-500">{item.description}</div>
                          </div>
                        </Button>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Logout button at bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t">
                <Button
                  variant="destructive"
                  onClick={() => {
                    logout();
                    setShowMoreMenu(false);
                  }}
                  className="w-full"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Donation Popup */}
      <DonationPopup
        isOpen={showDonationPopup}
        onClose={() => setShowDonationPopup(false)}
        onSuccess={() => {}}
      />
    </>
  );
}