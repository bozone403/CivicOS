import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "../components/ui/sheet";
import { Menu } from "lucide-react";
import { useIsMobile } from "../hooks/use-mobile";

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
    <div className="flex min-h-screen bg-background">
      {/* Sidebar for md+ screens */}
      <aside className="hidden md:block w-64 p-6 border-r bg-white dark:bg-gray-900">
        <h2 className="text-2xl font-serif mb-8">CivicSocial</h2>
        {navLinks}
      </aside>
      {/* Mobile hamburger menu */}
      {isMobile && (
        <div className="fixed top-0 left-0 w-full z-40 bg-white border-b flex items-center p-3 md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open CivicSocial menu">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <span className="ml-3 text-xl font-bold">CivicSocial</span>
            <SheetContent side="left" className="w-64 p-6 bg-white dark:bg-gray-900">
              <h2 className="text-2xl font-serif mb-8">CivicSocial</h2>
              {navLinks}
            </SheetContent>
          </Sheet>
        </div>
      )}
      <main className="flex-1 p-8 pt-20 md:pt-8">{/* pt-20 for mobile header */}
        {children}
      </main>
    </div>
  );
} 