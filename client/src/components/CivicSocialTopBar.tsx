import React, { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Bell, Search, ChevronDown } from "lucide-react";

export function CivicSocialTopBar() {
  const { user } = useAuth();
  const displayName = user ? (user.firstName || "") + (user.lastName ? " " + user.lastName : "") || user.email || "User" : "User";
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      setNotifOpen(false);
    }
    if (notifOpen || userMenuOpen) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [notifOpen, userMenuOpen]);

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-200 flex items-center px-4 h-16 shadow-sm">
      {/* Search */}
      <div className="flex-1 flex items-center">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Search CivicSocial..."
            className="w-full rounded-full border border-gray-300 bg-gray-100 px-4 py-2 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Search CivicSocial"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        </div>
      </div>
      {/* Notifications */}
      <div className="relative">
        <button
          className="ml-4 p-2 rounded-full hover:bg-blue-50 relative"
          aria-label="Notifications"
          onClick={() => setNotifOpen((o) => !o)}
        >
          <Bell className="w-6 h-6 text-blue-600" />
          <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold">3</span>
        </button>
        {notifOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-xl p-4 z-50">
            <div className="font-bold mb-2">Notifications</div>
            <div>No new notifications.</div>
          </div>
        )}
      </div>
      {/* User Menu */}
      <div
        className="ml-4 flex items-center gap-2 cursor-pointer select-none relative"
        tabIndex={0}
        aria-label="User menu"
        onClick={() => setUserMenuOpen((o) => !o)}
        ref={userMenuRef}
      >
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
          {user?.firstName?.[0] || user?.email?.[0] || "U"}
        </div>
        <span className="hidden sm:block font-medium text-gray-800 text-sm">{displayName}</span>
        <ChevronDown className="w-4 h-4 text-gray-400" />
        {userMenuOpen && (
          <div className="absolute right-0 mt-10 w-48 bg-white shadow-lg rounded-xl p-4 z-50">
            <button className="w-full text-left py-2 hover:bg-blue-50 rounded" onClick={() => window.location.href = '/profile'}>Profile</button>
            <button className="w-full text-left py-2 hover:bg-blue-50 rounded" onClick={() => window.location.href = '/settings'}>Settings</button>
            <button className="w-full text-left py-2 hover:bg-blue-50 rounded" onClick={() => { localStorage.removeItem('civicos-jwt'); window.location.href = '/auth'; }}>Logout</button>
          </div>
        )}
      </div>
    </header>
  );
} 