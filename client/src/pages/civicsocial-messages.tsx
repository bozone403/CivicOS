import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { 
  MessageCircle, 
  Send, 
  Search, 
  MoreVertical,
  Phone,
  Video,
  Image,
  Paperclip,
  Smile,
  UserPlus,
  Settings,
  Users,
  Heart,
  Share2
} from "lucide-react";

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  timestamp: string;
  isRead: boolean;
  sender?: {
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
    email: string;
  };
}

interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  participant?: {
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
    email: string;
    isOnline: boolean;
  };
}

export default function CivicSocialMessages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showNewConversation, setShowNewConversation] = useState(false);

  // Fetch conversations
  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ['/api/social/conversations'],
    queryFn: () => Promise.resolve([
      {
        id: "1",
        participants: ["user1", "user2"],
        lastMessage: {
          id: "msg1",
          content: "Hey! How's the CivicOS platform working for you?",
          senderId: "user2",
          receiverId: "user1",
          timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          isRead: false
        },
        unreadCount: 1,
        participant: {
          firstName: "Sarah",
          lastName: "Johnson",
          profileImageUrl: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
          email: "sarah.johnson@email.com",
          isOnline: true
        }
      },
      {
        id: "2",
        participants: ["user1", "user3"],
        lastMessage: {
          id: "msg2",
          content: "The voting system is really impressive!",
          senderId: "user1",
          receiverId: "user3",
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          isRead: true
        },
        unreadCount: 0,
        participant: {
          firstName: "Michael",
          lastName: "Chen",
          profileImageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
          email: "michael.chen@email.com",
          isOnline: false
        }
      },
      {
        id: "3",
        participants: ["user1", "user4"],
        lastMessage: {
          id: "msg3",
          content: "Have you seen the latest political news?",
          senderId: "user4",
          receiverId: "user1",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          isRead: false
        },
        unreadCount: 1,
        participant: {
          firstName: "Emma",
          lastName: "Davis",
          profileImageUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
          email: "emma.davis@email.com",
          isOnline: true
        }
      }
    ]),
    staleTime: Infinity,
  });

  // Fetch messages for selected conversation
  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ['/api/social/messages', selectedConversation],
    queryFn: () => Promise.resolve([
      {
        id: "msg1",
        content: "Hey! How's the CivicOS platform working for you?",
        senderId: "user2",
        receiverId: "user1",
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        isRead: false,
        sender: {
          firstName: "Sarah",
          lastName: "Johnson",
          profileImageUrl: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
          email: "sarah.johnson@email.com"
        }
      },
      {
        id: "msg2",
        content: "It's amazing! The voting system is really intuitive.",
        senderId: "user1",
        receiverId: "user2",
        timestamp: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
        isRead: true
      },
      {
        id: "msg3",
        content: "I love how transparent everything is. The politician profiles are so detailed!",
        senderId: "user2",
        receiverId: "user1",
        timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
        isRead: false
      },
      {
        id: "msg4",
        content: "Exactly! And the CivicSocial feature makes it feel like a real community.",
        senderId: "user1",
        receiverId: "user2",
        timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
        isRead: true
      },
      {
        id: "msg5",
        content: "Have you tried the parallel voting system yet?",
        senderId: "user2",
        receiverId: "user1",
        timestamp: new Date(Date.now() - 1000 * 60 * 1).toISOString(),
        isRead: false
      }
    ]),
    enabled: !!selectedConversation,
    staleTime: Infinity,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => 
      apiRequest('/api/social/messages', 'POST', {
        content,
        receiverId: selectedConversation,
        conversationId: selectedConversation
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/social/messages', selectedConversation] });
      queryClient.invalidateQueries({ queryKey: ['/api/social/conversations'] });
      setNewMessage("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send message",
        description: error.message || "Please try again",
        variant: "destructive"
      });
    }
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;
    
    sendMessageMutation.mutate(newMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredConversations = conversations.filter(conv => 
    conv.participant?.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.participant?.lastName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedConversationData = conversations.find(conv => conv.id === selectedConversation);

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Conversations Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Messages</h2>
            <Dialog open={showNewConversation} onOpenChange={setShowNewConversation}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <UserPlus className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New Conversation</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input placeholder="Search users..." />
                  {/* User list would go here */}
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          <div className="space-y-1 p-2">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => setSelectedConversation(conversation.id)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedConversation === conversation.id
                    ? "bg-blue-50 border border-blue-200"
                    : "hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={conversation.participant?.profileImageUrl} />
                      <AvatarFallback>
                        {conversation.participant?.firstName?.[0]}{conversation.participant?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    {conversation.participant?.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm truncate">
                        {conversation.participant?.firstName} {conversation.participant?.lastName}
                      </h3>
                      {conversation.lastMessage && (
                        <span className="text-xs text-gray-500">
                          {new Date(conversation.lastMessage.timestamp).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {conversation.lastMessage?.content}
                    </p>
                    {conversation.unreadCount > 0 && (
                      <Badge variant="secondary" className="mt-1">
                        {conversation.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Messages Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center space-x-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={selectedConversationData?.participant?.profileImageUrl} />
                  <AvatarFallback>
                    {selectedConversationData?.participant?.firstName?.[0]}{selectedConversationData?.participant?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold">
                    {selectedConversationData?.participant?.firstName} {selectedConversationData?.participant?.lastName}
                  </h3>
                  <div className="flex items-center space-x-2">
                    {selectedConversationData?.participant?.isOnline ? (
                      <>
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <span className="text-sm text-green-600">Online</span>
                      </>
                    ) : (
                      <span className="text-sm text-gray-500">Offline</span>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="ghost">
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Video className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => {
                  const isOwnMessage = message.senderId === user?.id;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        {!isOwnMessage && (
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={message.sender?.profileImageUrl} />
                            <AvatarFallback>
                              {message.sender?.firstName?.[0]}{message.sender?.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={`px-4 py-2 rounded-lg ${
                            isOwnMessage
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {new Date(message.timestamp).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-center space-x-2">
                <Button size="sm" variant="ghost">
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost">
                  <Image className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost">
                  <Smile className="w-4 h-4" />
                </Button>
                <div className="flex-1">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full"
                  />
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  size="sm"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No conversation selected</h3>
              <p className="text-gray-500">Choose a conversation from the sidebar to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 