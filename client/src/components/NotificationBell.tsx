import React, { useState } from "react";
import { Bell, User, MessageCircle, Heart, Share2, Users } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { useAuth } from "../hooks/useAuth";
import { apiRequest } from "../lib/queryClient";
import { useLocation } from "wouter";

interface Notification {
  id: string | number;
  type: string;
  title: string;
  message: string;
  timestamp?: string;
  createdAt?: string;
  read?: boolean;
}

export default function NotificationBell() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });
  const unread = notifications.filter((n) => !n.read);

  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/notifications/${id}/read`, "POST");
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  // Keyboard navigation for bell and dropdown
  function handleBellKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" || e.key === " ") {
      setOpen((prev) => !prev);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  function handleNotificationKeyDown(e: React.KeyboardEvent<HTMLLIElement>, notif: Notification) {
    if (e.key === "Enter" || e.key === " ") {
      handleNotificationClick(notif);
    }
  }

  function handleNotificationClick(notif: Notification) {
    if (!notif.read) markAsReadMutation.mutate(Number(notif.id));
    // Optionally navigate or show details
  }

  function markAllAsRead() {
    unread.forEach((n) => markAsReadMutation.mutate(Number(n.id)));
  }

  function formatTimeAgo(dateString?: string) {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  }

  return (
    <div className="relative" tabIndex={0} aria-label="Notification bell" onKeyDown={handleBellKeyDown}>
      <button
        className="relative p-2 rounded-full hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label="Open notifications"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="sr-only">Open notifications</span>
        <Bell className="w-6 h-6" aria-hidden="true" />
        {unread.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5" aria-label={`${unread.length} unread notifications`}>
            {unread.length}
          </span>
        )}
      </button>
      {open && (
        <div
          className="absolute right-0 mt-2 w-80 max-w-xs bg-white border rounded shadow-lg z-50 focus:outline-none"
          role="menu"
          aria-label="Notifications dropdown"
          tabIndex={-1}
        >
          <div className="p-2 border-b flex items-center justify-between">
            <span className="font-semibold">Notifications</span>
            <button
              className="text-xs text-primary underline focus:outline-none"
              onClick={markAllAsRead}
              aria-label="Mark all as read"
            >
              Mark all as read
            </button>
          </div>
          <div className="p-2 border-b flex items-center justify-center">
            <a
              href="/civicsocial"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              tabIndex={0}
              aria-label="Go to CivicSocial"
            >
              <Users className="w-4 h-4" />
              CivicSocial
            </a>
          </div>
          <ul className="max-h-72 overflow-y-auto divide-y" role="listbox">
            {notifications.length === 0 && (
              <li className="p-4 text-center text-muted-foreground" role="option" aria-disabled="true">
                No notifications.
              </li>
            )}
            {notifications.map((notif) => (
              <li
                key={notif.id}
                className={`p-3 flex items-start gap-2 cursor-pointer hover:bg-accent focus:bg-accent outline-none ${notif.read ? '' : 'bg-blue-50'}`}
                tabIndex={0}
                role="option"
                aria-selected={!notif.read}
                onClick={() => handleNotificationClick(notif)}
                onKeyDown={e => handleNotificationKeyDown(e, notif)}
              >
                <span className="flex-shrink-0 mt-1">
                  {notif.type === 'friend_request' && <User className="w-5 h-5 text-primary" aria-hidden="true" />}
                  {notif.type === 'comment' && <MessageCircle className="w-5 h-5 text-primary" aria-hidden="true" />}
                  {notif.type === 'like' && <Heart className="w-5 h-5 text-primary" aria-hidden="true" />}
                  {notif.type === 'share' && <Share2 className="w-5 h-5 text-primary" aria-hidden="true" />}
                </span>
                <div className="flex-1">
                  <div className="text-sm">{notif.message}</div>
                  <div className="text-xs text-muted-foreground mt-1">{formatTimeAgo(notif.createdAt || notif.timestamp)}</div>
                </div>
                {!notif.read && <span className="ml-2 w-2 h-2 rounded-full bg-primary" aria-label="Unread notification"></span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 