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
  Heart,
  MoreHorizontal,
  HelpCircle,
  Shield,
  BookOpen,
  TrendingUp,
  MapPin
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import DonationPopup from "@/components/DonationPopup";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

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
  const { user: rawUser, logout } = useAuth();
  const user = rawUser as any;
  const [showDonationPopup, setShowDonationPopup] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

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

  // Essential mobile navigation items
  const mobileNavItems = [
    { title: "Feed", href: "/civicsocial/feed", icon: Home },
    { title: "Vote", href: "/voting", icon: Vote },
    { title: "Politicians", href: "/politicians", icon: Users },
    { title: "News", href: "/news", icon: FileText },
  ];

  // More menu items
  const moreMenuItems = [
    { title: "Support", href: "/support", icon: HelpCircle, description: "Get help and contact us" },
    { title: "Legal", href: "/legal", icon: BookOpen, description: "Legal documents and cases" },
    { title: "Elections", href: "/elections", icon: TrendingUp, description: "Election information" },
    { title: "Maps", href: "/maps", icon: MapPin, description: "Interactive political maps" },
    { title: "Settings", href: "/settings", icon: Settings, description: "Account settings" },
    { title: "Profile", href: "/profile", icon: User, description: "Your profile" },
  ];

  return (
    <>
      {/* Bottom Navigation Toolbar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg md:hidden">
        <div className="flex items-center justify-around px-2 py-2">
          {mobileNavItems.map((item) => (
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
            <SheetContent side="bottom" className="h-[80vh]">
              <SheetHeader>
                <SheetTitle className="text-left">More Options</SheetTitle>
              </SheetHeader>
              <div className="grid grid-cols-2 gap-4 mt-6">
                {moreMenuItems.map((item) => (
                  <Link key={item.href} href={item.href} onClick={() => setShowMoreMenu(false)}>
                    <Button
                      variant="outline"
                      className="h-20 w-full flex flex-col items-center justify-center space-y-2 p-4"
                    >
                      <item.icon className="w-6 h-6" />
                      <div className="text-center">
                        <div className="font-medium text-sm">{item.title}</div>
                        <div className="text-xs text-gray-500">{item.description}</div>
                      </div>
                    </Button>
                  </Link>
                ))}
              </div>
              
              {/* Logout button at bottom */}
              <div className="mt-6 pt-4 border-t">
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
        onSuccess={() => setShowDonationPopup(false)}
      />
    </>
  );
}