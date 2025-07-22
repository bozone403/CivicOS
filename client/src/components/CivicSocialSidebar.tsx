import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Home, User, Users, Bell, Settings, ChevronLeft, ChevronRight, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Feed", path: "/civicsocial/feed", icon: Home },
  { label: "Wall", path: "/civicsocial/profile", icon: User },
  { label: "Discussions", path: "/civicsocial/discussions", icon: MessageCircle },
  { label: "Friends", path: "/civicsocial/friends", icon: Users },
  { label: "Notifications", path: "/notifications", icon: Bell },
  { label: "Settings", path: "/settings", icon: Settings },
];

export function CivicSocialSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = React.useState(false);
  const displayName = user ? (user.firstName || "") + (user.lastName ? " " + user.lastName : "") || user.email || "User" : "User";
  return (
    <aside className={cn(
      "bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out shadow-lg z-30",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* User Profile */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-100">
        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xl">
          {user?.firstName?.[0] || user?.email?.[0] || "U"}
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900 truncate">{displayName}</div>
            <div className="text-xs text-gray-500">CivicSocial</div>
          </div>
        )}
        <button
          className="ml-auto p-1 rounded hover:bg-gray-100"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="w-5 h-5 text-gray-400" /> : <ChevronLeft className="w-5 h-5 text-gray-400" />}
        </button>
      </div>
      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 py-4">
        {navItems.map((item) => (
          <Link key={item.path} href={item.path}>
            <button
              className={cn(
                "flex items-center gap-3 px-4 py-2 w-full text-left font-medium text-gray-700 hover:bg-blue-50 transition-all",
                location === item.path && "bg-blue-100 text-blue-700 font-bold"
              )}
              tabIndex={0}
            >
              <item.icon className="w-5 h-5" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          </Link>
        ))}
      </nav>
      {/* Attribution */}
      {!collapsed && (
        <div className="mt-auto p-4 text-xs text-gray-400 border-t border-gray-100">
          CivicSocial &copy; 2025
        </div>
      )}
    </aside>
  );
} 