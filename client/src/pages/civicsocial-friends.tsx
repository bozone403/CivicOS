import React, { useState, useEffect } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useCivicSocialFriends, useCivicSocialAddFriend, useCivicSocialAcceptFriend, useCivicSocialRemoveFriend, useCivicSocialNotify } from "../hooks/useCivicSocial";
import { useAuth } from "../hooks/useAuth";
import { UserPlus, Users, User, Check, X, Loader2, Search, UserCheck, UserX } from "lucide-react";
import { authRequest } from "../lib/queryClient";

interface SearchUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImageUrl?: string;
  civicPoints?: number;
}

export default function CivicSocialFriends() {
  const { user } = useAuth();
  const { data, isLoading, error } = useCivicSocialFriends();
  const friends = data?.friends || [];
  const pendingReceived = data?.received || [];
  const pendingSent = data?.sent || [];
  const addFriendMutation = useCivicSocialAddFriend();
  const acceptFriendMutation = useCivicSocialAcceptFriend();
  const removeFriendMutation = useCivicSocialRemoveFriend();
  const notifyMutation = useCivicSocialNotify();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);

  // Search users when query changes
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    const searchUsers = async () => {
      setSearchLoading(true);
      setSearchError(null);
      
      try {
        const data = await authRequest(`/api/users/search?q=${encodeURIComponent(searchQuery)}`, 'GET');
        if (data.users) {
          // Filter out current user and existing friends
          const filteredUsers = data.users.filter((searchUser: SearchUser) => {
            const isCurrentUser = searchUser.id === user?.id;
            const isAlreadyFriend = friends.some((friend: any) => friend.id === searchUser.id);
            const isPendingSent = pendingSent.some((request: any) => request.friendId === searchUser.id);
            const isPendingReceived = pendingReceived.some((request: any) => request.userId === searchUser.id);
            
            return !isCurrentUser && !isAlreadyFriend && !isPendingSent && !isPendingReceived;
          });
          setSearchResults(filteredUsers);
        }
      } catch (error) {
        setSearchError('Failed to search users');
        // console.error removed for production
      } finally {
        setSearchLoading(false);
      }
    };

    const timeoutId = setTimeout(searchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, friends, pendingSent, pendingReceived, user?.id]);

  const handleAddFriend = async (userId: string) => {
    try {
      await addFriendMutation.mutateAsync({ friendId: parseInt(userId) });
      
      // Send notification
      notifyMutation.mutate({
        userId,
        type: "friend_request",
        title: "New Friend Request",
        message: `${user?.firstName || user?.email || "A user"} sent you a friend request.`,
      });
      
      // Clear search
      setSearchQuery("");
      setSearchResults([]);
      setSelectedUser(null);
    } catch (error) {
      // console.error removed for production
    }
  };

  const handleAccept = async (friendId: string) => {
    try {
      await acceptFriendMutation.mutateAsync({ friendId: parseInt(friendId) });
      
      // Send notification
      notifyMutation.mutate({
        userId: friendId,
        type: "friend_accept",
        title: "Friend Request Accepted",
        message: `${user?.firstName || user?.email || "A user"} accepted your friend request!`,
      });
    } catch (error) {
      // console.error removed for production
    }
  };

  const handleRemove = async (friendId: string) => {
    try {
      await removeFriendMutation.mutateAsync({ friendId: parseInt(friendId) });
    } catch (error) {
      // console.error removed for production
    }
  };

  const getFriendStatus = (userId: string) => {
    if (friends.some((friend: any) => friend.id === userId)) return 'friend';
    if (pendingSent.some((request: any) => request.friendId === userId)) return 'pending-sent';
    if (pendingReceived.some((request: any) => request.userId === userId)) return 'pending-received';
    return 'none';
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      {/* Add Friend Card */}
      <Card className="p-6 mb-4 bg-white/90 dark:bg-slate-900/90 shadow-lg rounded-xl border border-gray-200 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-4">
          <UserPlus className="w-8 h-8 text-civic-blue" />
          <div className="font-bold text-2xl text-civic-blue">Add Friends</div>
        </div>
        
        <div className="relative">
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-civic-blue"
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={addFriendMutation.isPending}
              />
            </div>
          </div>

          {/* Search Results */}
          {searchQuery.length >= 2 && (
            <div className="absolute z-10 w-full bg-white dark:bg-slate-800 border rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {searchLoading ? (
                <div className="p-4 text-center">
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  <p className="text-sm text-gray-500">Searching...</p>
                </div>
              ) : searchError ? (
                <div className="p-4 text-center text-red-500">
                  <p className="text-sm">{searchError}</p>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="py-2">
                  {searchResults.map((searchUser) => (
                    <div key={searchUser.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-slate-700">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-civic-blue rounded-full flex items-center justify-center text-white font-bold">
                          {searchUser.firstName?.[0]}{searchUser.lastName?.[0]}
                        </div>
                        <div>
                          <p className="font-medium">{searchUser.firstName} {searchUser.lastName}</p>
                          <p className="text-sm text-gray-500">{searchUser.email}</p>
                          {searchUser.civicPoints && (
                            <p className="text-xs text-civic-gold">Civic Points: {searchUser.civicPoints}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddFriend(searchUser.id)}
                        disabled={addFriendMutation.isPending}
                        className="bg-civic-blue hover:bg-civic-gold"
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        Add Friend
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  <p className="text-sm">No users found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Friend Requests Received */}
      {pendingReceived.length > 0 && (
        <Card className="p-6 bg-white/90 dark:bg-slate-900/90 shadow-lg rounded-xl border border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <UserCheck className="w-6 h-6 text-green-600" />
            <h3 className="font-bold text-xl text-green-600">Friend Requests ({pendingReceived.length})</h3>
          </div>
          <div className="space-y-3">
            {pendingReceived.map((request: any) => (
              <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
                    {request.user?.firstName?.[0] || request.user?.lastName?.[0] || request.user?.email?.[0] || 'U'}
                  </div>
                  <div>
                    <p className="font-medium">
                      {request.user?.firstName && request.user?.lastName 
                        ? `${request.user.firstName} ${request.user.lastName}` 
                        : (request.user?.firstName || request.user?.lastName || request.user?.email || 'Unknown User')}
                    </p>
                    <p className="text-sm text-gray-500">{request.user?.email || 'No email'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleAccept(request.userId)}
                    disabled={acceptFriendMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRemove(request.userId)}
                    disabled={removeFriendMutation.isPending}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Pending Sent Requests */}
      {pendingSent.length > 0 && (
        <Card className="p-6 bg-white/90 dark:bg-slate-900/90 shadow-lg rounded-xl border border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <UserX className="w-6 h-6 text-yellow-600" />
            <h3 className="font-bold text-xl text-yellow-600">Pending Requests ({pendingSent.length})</h3>
          </div>
          <div className="space-y-3">
            {pendingSent.map((request: any) => (
              <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-600 rounded-full flex items-center justify-center text-white font-bold">
                    {request.friend?.firstName?.[0] || request.friend?.lastName?.[0] || request.friend?.email?.[0] || 'U'}
                  </div>
                  <div>
                    <p className="font-medium">
                      {request.friend?.firstName && request.friend?.lastName 
                        ? `${request.friend.firstName} ${request.friend.lastName}` 
                        : (request.friend?.firstName || request.friend?.lastName || request.friend?.email || 'Unknown User')}
                    </p>
                    <p className="text-sm text-gray-500">{request.friend?.email || 'No email'}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRemove(request.friendId)}
                  disabled={removeFriendMutation.isPending}
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Current Friends */}
      <Card className="p-6 bg-white/90 dark:bg-slate-900/90 shadow-lg rounded-xl border border-gray-200 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-4">
          <Users className="w-6 h-6 text-civic-blue" />
          <h3 className="font-bold text-xl text-civic-blue">My Friends ({friends.length})</h3>
        </div>
        {friends.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No friends yet. Start by searching for users above!</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {friends.map((friend: any) => (
              <div key={friend.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-civic-blue rounded-full flex items-center justify-center text-white font-bold">
                    {friend.firstName?.[0] || friend.lastName?.[0] || friend.email?.[0] || 'U'}
                  </div>
                  <div>
                    <p className="font-medium">
                      {friend.firstName && friend.lastName 
                        ? `${friend.firstName} ${friend.lastName}` 
                        : (friend.firstName || friend.lastName || friend.email || 'Unknown User')}
                    </p>
                    <p className="text-sm text-gray-500">{friend.email || 'No email'}</p>
                    {friend.civicPoints && (
                      <p className="text-xs text-civic-gold">Civic Points: {friend.civicPoints}</p>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRemove(friend.id)}
                  disabled={removeFriendMutation.isPending}
                  className="text-red-600 hover:text-red-700"
                >
                  <UserX className="w-4 h-4 mr-1" />
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
} 