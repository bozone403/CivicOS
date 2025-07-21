import React, { useState, useEffect } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useCivicSocialFriends, useCivicSocialAddFriend, useCivicSocialAcceptFriend, useCivicSocialRemoveFriend, useCivicSocialNotify } from "../hooks/useCivicSocial";
import { useAuth } from "../hooks/useAuth";

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
  const [friendId, setFriendId] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    if (friendId.length < 2) {
      setSearchResults([]);
      return;
    }
    let cancelled = false;
    setSearchLoading(true);
    setSearchError(null);
    fetch(`/api/users/search?q=${encodeURIComponent(friendId)}`)
      .then(res => res.json())
      .then(data => {
        if (!cancelled) {
          setSearchResults(data.users || []);
          setSearchLoading(false);
        }
      })
      .catch(() => {
        // Handle error if needed, but 'err' is unused
      });
    return () => { cancelled = true; };
  }, [friendId]);

  const handleAddFriend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendId.trim()) return;
    addFriendMutation.mutate(
      { friendId: Number(friendId) },
      {
        onSuccess: () => {
          notifyMutation.mutate({
            userId: friendId,
            type: "friend_request",
            title: "New Friend Request",
            message: `${user?.firstName || user?.email || "A user"} sent you a friend request.`,
          });
        },
      }
    );
    setFriendId("");
  };

  const handleAccept = (friendId: number) => {
    acceptFriendMutation.mutate(
      { friendId },
      {
        onSuccess: () => {
          notifyMutation.mutate({
            userId: friendId,
            type: "friend_accept",
            title: "Friend Request Accepted",
            message: `${user?.firstName || user?.email || "A user"} accepted your friend request!`,
          });
        },
      }
    );
  };

  const handleRemove = (friendId: number) => {
    removeFriendMutation.mutate({ friendId });
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <Card className="p-4 mb-4 flex flex-col items-center">
        <div className="font-bold text-lg mb-1">Your Friends</div>
        <form className="flex gap-2 mt-2 w-full max-w-xs relative" onSubmit={handleAddFriend} aria-label="Add friend form">
          <input
            className="border rounded px-2 py-1 flex-1"
            placeholder="Search users by name or email"
            value={friendId}
            onChange={e => setFriendId(e.target.value)}
            disabled={addFriendMutation.isPending}
            aria-label="Friend user ID or search"
            autoComplete="off"
          />
          <Button type="submit" size="sm" disabled={!friendId.trim() || addFriendMutation.isPending} aria-label="Send friend request">
            {addFriendMutation.isPending ? "Sending..." : "Add Friend"}
          </Button>
          {/* Autocomplete dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 w-full bg-white border rounded shadow z-10 mt-1 max-h-48 overflow-y-auto">
              {searchResults.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-2 px-2 py-1 hover:bg-gray-100 cursor-pointer"
                  onClick={() => { setFriendId(u.id); setSearchResults([]); }}
                  tabIndex={0}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { setFriendId(u.id); setSearchResults([]); } }}
                  role="option"
                  aria-selected={friendId === u.id}
                >
                  {u.profileImageUrl ? (
                    <img src={u.profileImageUrl} alt="Avatar" className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold">{(u.firstName || u.email || "?")[0]}</div>
                  )}
                  <span className="font-medium">{u.firstName || u.email || u.id}</span>
                  <span className="text-xs text-muted-foreground">{u.email}</span>
                </div>
              ))}
            </div>
          )}
          {searchLoading && <div className="absolute top-full left-0 w-full bg-white border rounded shadow z-10 mt-1 p-2 text-xs">Searching...</div>}
          {searchError && <div className="absolute top-full left-0 w-full bg-white border rounded shadow z-10 mt-1 p-2 text-xs text-red-500">{searchError}</div>}
        </form>
        {addFriendMutation.error && (
          <div className="text-xs text-red-500 mt-2" role="alert">Error sending request.</div>
        )}
      </Card>
      <Card className="p-4 mb-4">
        <div className="font-bold mb-2">Pending Friend Requests</div>
        <div className="flex flex-col gap-2">
          {pendingReceived.length === 0 && <div className="text-muted-foreground">No pending requests.</div>}
          {pendingReceived.map((req: any) => (
            <div key={req.id} className="flex items-center justify-between mb-2 flex-wrap gap-2 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 focus-within:bg-gray-100 p-2 transition">
              <div className="flex items-center gap-3">
                {req.profileImageUrl ? (
                  <img src={req.profileImageUrl} alt="Avatar" className="w-8 h-8 rounded-full object-cover border" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-base font-bold">{(req.firstName || req.email || "?")[0]}</div>
                )}
                <div>
                  <div className="font-semibold">{req.firstName || req.email || `User ${req.userId}`}</div>
                  <div className="text-xs text-muted-foreground">{req.email}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleAccept(req.userId)} disabled={acceptFriendMutation.isPending} aria-label="Accept friend request">
                  {acceptFriendMutation.isPending ? "Accepting..." : "Accept"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleRemove(req.userId)} disabled={removeFriendMutation.isPending} aria-label="Decline friend request">
                  {removeFriendMutation.isPending ? "Declining..." : "Decline"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
      {isLoading && <div>Loading friends...</div>}
      {error && <div className="text-red-500">Error loading friends.</div>}
      <div className="flex flex-col gap-4">
        {friends.length === 0 && <div className="text-muted-foreground">You have no friends yet.</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {friends.map((friend: any) => (
            <Card key={friend.id} className="p-4 flex items-center justify-between flex-wrap gap-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 focus-within:bg-gray-100 transition">
              <div className="flex items-center gap-3">
                {friend.profileImageUrl ? (
                  <img src={friend.profileImageUrl} alt="Avatar" className="w-8 h-8 rounded-full object-cover border" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-base font-bold">{(friend.firstName || friend.email || "?")[0]}</div>
                )}
                <div>
                  <div className="font-semibold">{friend.firstName || friend.email || `User ${friend.friendId}`}</div>
                  <div className="text-xs text-muted-foreground">{friend.email}</div>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => handleRemove(friend.friendId)} disabled={removeFriendMutation.isPending} aria-label="Unfriend">
                {removeFriendMutation.isPending ? "Removing..." : "Unfriend"}
              </Button>
            </Card>
          ))}
        </div>
      </div>
      {pendingSent.length > 0 && (
        <Card className="p-4 mb-4">
          <div className="font-bold mb-2">Sent Friend Requests</div>
          <div className="flex flex-col gap-2">
            {pendingSent.map((req: any) => (
              <div key={req.id} className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 focus-within:bg-gray-100 p-2 transition">
                {req.profileImageUrl ? (
                  <img src={req.profileImageUrl} alt="Avatar" className="w-8 h-8 rounded-full object-cover border" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-base font-bold">{(req.firstName || req.email || "?")[0]}</div>
                )}
                <div>
                  <div className="font-semibold">{req.firstName || req.email || `User ${req.friendId}`}</div>
                  <div className="text-xs text-muted-foreground">{req.email}</div>
                </div>
                <span className="ml-auto text-xs text-blue-500 font-medium">Pending</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
} 