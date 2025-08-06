import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Users, 
  UserPlus, 
  UserCheck, 
  UserX, 
  Search,
  MessageCircle,
  MapPin,
  Award,
  Shield,
  Calendar,
  Check,
  X,
  MoreHorizontal
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { useLocation } from "wouter";

interface Friend {
  id: number;
  userId: string;
  friendId: string;
  status: string;
  createdAt: string;
  friend: {
    id: string;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
    civicLevel: string;
    isVerified: boolean;
  };
}

interface UserSearchResult {
  id: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
  civicLevel: string;
  isVerified: boolean;
  displayName: string;
  isFriend: boolean;
  friendStatus?: string;
}

export function FriendsManager() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState("friends");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  // Fetch friends
  const { data: friends = [] } = useQuery<Friend[]>({
    queryKey: ["friends", "accepted"],
    queryFn: async () => {
      const response = await apiRequest("/api/social/friends?status=accepted", "GET");
      return response?.friends || [];
    },
    enabled: isAuthenticated,
  });

  // Fetch pending friend requests
  const { data: pendingRequests = [] } = useQuery<Friend[]>({
    queryKey: ["friends", "pending"],
    queryFn: async () => {
      const response = await apiRequest("/api/social/friends?status=pending", "GET");
      return response?.friends || [];
    },
    enabled: isAuthenticated,
  });

  // Search users
  const { data: searchResults = [] } = useQuery<UserSearchResult[]>({
    queryKey: ["userSearch", searchQuery],
    queryFn: async () => {
      const response = await apiRequest(`/api/social/users/search?q=${searchQuery}`, "GET");
      return response?.users || [];
    },
    enabled: searchQuery.length >= 2 && isAuthenticated,
  });

  // Friend actions mutation
  const friendActionMutation = useMutation({
    mutationFn: async (data: { friendId: string; action: string }) => {
      return apiRequest("/api/social/friends", "POST", data);
    },
    onSuccess: (_, variables) => {
      const action = variables.action;
      let message = "";
      
      switch (action) {
        case "send_request":
          message = "Friend request sent!";
          break;
        case "accept_request":
          message = "Friend request accepted!";
          break;
        case "decline_request":
          message = "Friend request declined.";
          break;
        case "remove_friend":
          message = "Friend removed.";
          break;
        default:
          message = "Action completed successfully.";
      }
      
      toast({
        title: "Success",
        description: message,
      });
      
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["userSearch"] });
    },
    onError: () => {
      toast({
        title: "Action Failed",
        description: "Failed to perform friend action. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFriendAction = (friendId: string, action: string) => {
    friendActionMutation.mutate({ friendId, action });
  };

  const getUserInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`;
  };

  const getFriendStatusBadge = (status: string) => {
    switch (status) {
      case "accepted":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Friends</Badge>;
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      default:
        return null;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">Sign In Required</h3>
          <p className="text-muted-foreground">Please sign in to manage friends.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Friends</h1>
          <p className="text-muted-foreground">
            Connect with other civic-minded individuals
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSearch(!showSearch)}
          >
            <Search className="h-4 w-4 mr-2" />
            Find People
          </Button>
        </div>
      </div>

      {/* Search Section */}
      {showSearch && (
        <Card>
          <CardHeader>
            <CardTitle>Find People</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.profileImageUrl} />
                        <AvatarFallback>
                          {getUserInitials(user.firstName, user.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{user.displayName}</span>
                          {user.isVerified && (
                            <Badge variant="secondary" className="text-xs">
                              <Shield className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {user.civicLevel}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>Location not specified</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {user.isFriend ? (
                        <Badge variant="secondary">Already Friends</Badge>
                      ) : user.friendStatus === "pending" ? (
                        <Badge variant="outline">Request Sent</Badge>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleFriendAction(user.id, "send_request")}
                          disabled={friendActionMutation.isPending}
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          Add Friend
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLocation(`/profile/${user.id}`)}
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Friends Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="friends">
            Friends ({friends.length})
          </TabsTrigger>
          <TabsTrigger value="requests">
            Requests ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="suggestions">
            Suggestions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="space-y-4">
          {friends.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">No Friends Yet</h3>
                  <p className="text-muted-foreground">
                    Start connecting with other civic-minded individuals!
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() => setShowSearch(true)}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Find People
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-2">
                {friends.map((friend) => (
                  <Card key={friend.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={friend.friend.profileImageUrl} />
                            <AvatarFallback>
                              {getUserInitials(friend.friend.firstName, friend.friend.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">
                                {friend.friend.firstName} {friend.friend.lastName}
                              </span>
                              {friend.friend.isVerified && (
                                <Badge variant="secondary" className="text-xs">
                                  <Shield className="h-3 w-3 mr-1" />
                                  Verified
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs">
                                {friend.friend.civicLevel}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>Friends since {formatDistanceToNow(new Date(friend.createdAt))} ago</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setLocation(`/messages/${friend.friendId}`)}
                          >
                            <MessageCircle className="h-4 w-4 mr-1" />
                            Message
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setLocation(`/profile/${friend.friendId}`)}
                          >
                            View Profile
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFriendAction(friend.friendId, "remove_friend")}
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          {pendingRequests.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">No Pending Requests</h3>
                  <p className="text-muted-foreground">
                    You're all caught up on friend requests!
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-2">
                {pendingRequests.map((request) => (
                  <Card key={request.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={request.friend.profileImageUrl} />
                            <AvatarFallback>
                              {getUserInitials(request.friend.firstName, request.friend.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">
                                {request.friend.firstName} {request.friend.lastName}
                              </span>
                              {request.friend.isVerified && (
                                <Badge variant="secondary" className="text-xs">
                                  <Shield className="h-3 w-3 mr-1" />
                                  Verified
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs">
                                {request.friend.civicLevel}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>Requested {formatDistanceToNow(new Date(request.createdAt))} ago</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleFriendAction(request.friendId, "accept_request")}
                            disabled={friendActionMutation.isPending}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Accept
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleFriendAction(request.friendId, "decline_request")}
                            disabled={friendActionMutation.isPending}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Decline
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-4">
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold">Friend Suggestions</h3>
                <p className="text-muted-foreground">
                  Friend suggestions will be available soon based on your civic activities.
                </p>
                <Button
                  className="mt-4"
                  onClick={() => setShowSearch(true)}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search for People
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 