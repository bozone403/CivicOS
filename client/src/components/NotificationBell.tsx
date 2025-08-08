import React, { useState } from "react";
import { Bell, User, MessageCircle, Heart, Share2, Users } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { useAuth } from "../hooks/useAuth";
import { createCivicOsClient } from "@/lib/civicos-sdk-wrapper";
import { useLocation } from "wouter";

interface Notification {
  id: string | number;
  type: string;
  title: string;
  message: string;
  sourceModule?: string;
  sourceId?: string;
  timestamp?: string;
  createdAt?: string;
  read?: boolean;
}

export default function NotificationBell() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const client = createCivicOsClient();
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    queryFn: async () => {
      const res = await client.request({ method: 'GET', url: '/api/notifications' });
      return res as any;
    },
    enabled: !!user,
  });
  const { data: unreadData } = useQuery<{ unread: number }>({
    queryKey: ["/api/notifications/unread-count"],
    queryFn: async () => {
      const res = await client.request({ method: 'GET', url: '/api/notifications/unread-count' });
      return res as any;
    },
    enabled: !!user,
  });
  const unread = notifications.filter((n) => !n.read);
  const unreadCount = unreadData?.unread ?? unread.length;

  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      await client.request({ method: 'PATCH', url: `/api/notifications/${id}/read` });
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await client.request({ method: 'PATCH', url: `/api/notifications/read-all` });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
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
    markAllAsReadMutation.mutate();
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
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5" aria-label={`${unread.length} unread notifications`}>
            {unreadCount}
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
              href="/civicsocial/feed"
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
            {notifications.map((notif) => {
              // Determine icon
              let icon = null;
              if (notif.type === 'friend_request') icon = <User className="w-5 h-5 text-primary" aria-hidden="true" />;
              else if (notif.type === 'comment') icon = <MessageCircle className="w-5 h-5 text-primary" aria-hidden="true" />;
              else if (notif.type === 'like') icon = <Heart className="w-5 h-5 text-primary" aria-hidden="true" />;
              else if (notif.type === 'share') icon = <Share2 className="w-5 h-5 text-primary" aria-hidden="true" />;
              else if (notif.type === 'trending' || notif.title?.toLowerCase().includes('trending')) icon = <Badge className="w-5 h-5 bg-pink-100 text-pink-700">🔥</Badge>;
              else if (notif.type === 'friend') icon = <Users className="w-5 h-5 text-green-600" aria-hidden="true" />;
              // Determine link
              let link = null;
              if (notif.sourceModule === 'CivicSocial' && notif.sourceId) link = `/civicsocial/feed#post-${notif.sourceId}`;
              // Render notification
              return (
                <li
                  key={notif.id}
                  className={`p-3 flex items-start gap-2 cursor-pointer hover:bg-accent focus:bg-accent outline-none ${notif.read ? '' : 'bg-blue-50'}`}
                  tabIndex={0}
                  role="option"
                  aria-selected={!notif.read}
                  onClick={() => { handleNotificationClick(notif); if (link) navigate(link); }}
                  onKeyDown={e => handleNotificationKeyDown(e, notif)}
                >
                  <span className="flex-shrink-0 mt-1">{icon}</span>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{notif.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">{notif.message}</div>
                    <div className="text-xs text-muted-foreground mt-1">{formatTimeAgo(notif.createdAt || notif.timestamp)}</div>
                  </div>
                  {!notif.read && <span className="ml-2 w-2 h-2 rounded-full bg-primary" aria-label="Unread notification"></span>}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
} 