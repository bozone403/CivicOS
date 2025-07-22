import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "../components/ui/sheet";
import { Menu } from "lucide-react";
import { useIsMobile } from "../hooks/use-mobile";
import { CivicSocialSidebar } from "../components/CivicSocialSidebar";
import { CivicSocialTopBar } from "../components/CivicSocialTopBar";

const navItems = [
  { label: "Feed", path: "/civicsocial/feed" },
  { label: "Profile", path: "/civicsocial/profile" },
  { label: "Friends", path: "/civicsocial/friends" },
  // Future: { label: "Messages", path: "/civicsocial/messages" },
];

export default function CivicSocialLayout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  const navLinks = (
    <nav className="flex flex-col gap-2">
      <Button
        variant="outline"
        className="mb-6 w-full font-semibold text-red-600 border-red-600 hover:bg-red-50"
        onClick={() => navigate("/dashboard")}
      >
        ← Back to CivicOS
      </Button>
      {navItems.map((item) => (
        <Link key={item.path} href={item.path}>
          <Button
            variant={location === item.path ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setOpen(false)}
          >
            {item.label}
          </Button>
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-gray-100">
      <CivicSocialSidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <CivicSocialTopBar />
        <main className="flex-1 flex flex-col items-center px-2 sm:px-4 md:px-8 pt-20 md:pt-8 w-full max-w-3xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
} 