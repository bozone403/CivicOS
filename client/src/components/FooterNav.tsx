import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Home, Users, MessageSquare, TrendingUp, MoreHorizontal, FileText, Crown, BookOpen, DollarSign, Eye, Building, Brain, Gavel, Shield, Scale, Search, Archive, AlertTriangle, Activity, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navItems = [
  { label: "Home", path: "/dashboard", icon: Home },
  { label: "CivicSocial", path: "/civicsocial/feed", icon: Users },
  { label: "Discussions", path: "/civicsocial/discussions", icon: MessageSquare },
  { label: "News", path: "/news", icon: TrendingUp },
  { label: "More", path: "/more", icon: MoreHorizontal },
];

const moreItems = [
  { label: "Politicians", path: "/politicians", icon: Users },
  { label: "Bills & Voting", path: "/voting", icon: FileText },
  { label: "Elections", path: "/elections", icon: Crown },
  { label: "Ledger", path: "/ledger", icon: BookOpen },
  { label: "Contact Officials", path: "/contacts", icon: Users },
  { label: "Campaign Finance", path: "/finance", icon: DollarSign },
  { label: "Lobbyist Mapping", path: "/lobbyists", icon: Eye },
  { label: "Procurement Tracker", path: "/procurement", icon: Building },
  { label: "Political Memory", path: "/memory", icon: Brain },
  { label: "Legal System", path: "/legal", icon: Gavel },
  { label: "Your Rights", path: "/rights", icon: Shield },
  { label: "Constitutional Cases", path: "/cases", icon: Scale },
  { label: "Legal Search", path: "/legal-search", icon: Search },
  { label: "Document Leaks", path: "/leaks", icon: Archive },
  { label: "FOI", path: "/foi", icon: Eye },
  { label: "Whistleblower Portal", path: "/whistleblower", icon: AlertTriangle },
  { label: "Corruption Patterns", path: "/corruption", icon: Activity },
  { label: "Pulse", path: "/pulse", icon: Activity },
  { label: "Trust Metrics", path: "/trust", icon: BarChart3 },
  { label: "Engagement Maps", path: "/maps", icon: TrendingUp },
  { label: "Manifesto", path: "/manifesto", icon: BookOpen },
];

export function FooterNav() {
  const [location] = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 flex justify-around items-center h-16 shadow-lg md:hidden">
        {navItems.map((item) =>
          item.label === "More" ? (
            <Sheet key="more" open={moreOpen} onOpenChange={setMoreOpen}>
              <SheetTrigger asChild>
                <button
                  className={cn(
                    "flex flex-col items-center justify-center px-2 py-1 focus:outline-none",
                    location === item.path ? "text-blue-600 font-bold" : "text-gray-500"
                  )}
                  aria-label={item.label}
                >
                  <item.icon className="w-6 h-6 mb-1" />
                  <span className="text-xs">{item.label}</span>
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="max-h-[70vh] overflow-y-auto rounded-t-2xl p-4">
                <div className="grid grid-cols-2 gap-4">
                  {moreItems.map((more) => (
                    <Link key={more.path} href={more.path}>
                      <button
                        className={cn(
                          "flex flex-col items-center justify-center p-3 rounded-lg bg-gray-50 hover:bg-blue-50 transition-colors w-full"
                        )}
                        aria-label={more.label}
                        onClick={() => setMoreOpen(false)}
                      >
                        <more.icon className="w-7 h-7 mb-1" />
                        <span className="text-xs font-medium">{more.label}</span>
                      </button>
                    </Link>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          ) : (
            <Link key={item.path} href={item.path}>
              <button
                className={cn(
                  "flex flex-col items-center justify-center px-2 py-1 focus:outline-none",
                  location === item.path ? "text-blue-600 font-bold" : "text-gray-500"
                )}
                aria-label={item.label}
              >
                <item.icon className="w-6 h-6 mb-1" />
                <span className="text-xs">{item.label}</span>
              </button>
            </Link>
          )
        )}
      </nav>
    </>
  );
}

export default FooterNav; 