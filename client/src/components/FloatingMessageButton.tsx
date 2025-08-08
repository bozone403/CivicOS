import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle } from 'lucide-react';
import { MessagingSystem } from './MessagingSystem';
import { useQuery } from '@tanstack/react-query';
import { authRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';

export function FloatingMessageButton() {
  const [isMessagingOpen, setIsMessagingOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();

  // Fetch unread message count
  const { data: unreadData } = useQuery({
    queryKey: ['/api/messages/unread/count'],
    queryFn: () => authRequest('/api/messages/unread/count', 'GET'),
    enabled: isAuthenticated,
    refetchInterval: 30000, // Check every 30 seconds
  });

  const unreadCount = unreadData?.unreadCount || 0;

  if (!isAuthenticated) return null;

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 left-6 z-40">
        <Button
          onClick={() => setIsMessagingOpen(true)}
          className="h-14 w-14 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 relative border border-white/20"
          size="icon"
          title="Messages"
        >
          <MessageCircle className="h-6 w-6" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </div>
      
      {/* Messaging System - Now handled by routing */}
      {isMessagingOpen && (
        <div className="fixed inset-0 z-50 bg-black/40">
          <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-[720px] bg-white rounded-xl shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Messages</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMessagingOpen(false)}
            >
              Close
            </Button>
            </div>
            <MessagingSystem />
          </div>
        </div>
      )}
    </>
  );
} 