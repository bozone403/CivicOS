import React from "react";
import { Link, useLocation } from "wouter";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";

const navItems = [
  { label: "Feed", path: "/civicsocial/feed" },
  { label: "Profile", path: "/civicsocial/profile" },
  { label: "Friends", path: "/civicsocial/friends" },
  // Future: { label: "Messages", path: "/civicsocial/messages" },
];

export default function CivicSocialLayout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-64 p-6 border-r bg-white dark:bg-gray-900">
        <h2 className="text-2xl font-playfair mb-8">CivicSocial</h2>
        <Button
          variant="outline"
          className="mb-6 w-full font-semibold text-red-600 border-red-600 hover:bg-red-50"
          onClick={() => navigate("/dashboard")}
        >
          ← Back to CivicOS
        </Button>
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <Button
                variant={location === item.path ? "default" : "ghost"}
                className="w-full justify-start"
              >
                {item.label}
              </Button>
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
} 