import React, { useState, useEffect } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useCivicSocialFriends, useCivicSocialAddFriend, useCivicSocialAcceptFriend, useCivicSocialRemoveFriend, useCivicSocialNotify } from "../hooks/useCivicSocial";
import { useAuth } from "../hooks/useAuth";
import { UserPlus, Users, User, Check, X, Loader2 } from "lucide-react";

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
      .catch(() => {});
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
      {/* Add Friend Card */}
      <Card className="p-6 mb-4 bg-white/90 dark:bg-slate-900/90 shadow-lg rounded-xl border border-gray-200 dark:border-slate-700 fade-in-up flex flex-col items-center">
        <div className="flex items-center gap-3 mb-4">
          <UserPlus className="w-8 h-8 text-civic-blue" />
          <div className="font-bold text-2xl text-civic-blue">Add Friends</div>
        </div>
        <form className="flex gap-2 w-full max-w-xs relative" onSubmit={handleAddFriend} aria-label="Add friend form">
          <input
            className="border rounded-lg px-3 py-2 flex-1 bg-background focus:ring-2 focus:ring-civic-blue"
            placeholder="Search users by name or email"
            value={friendId}
            onChange={e => setFriendId(e.target.value)}
            disabled={addFriendMutation.isPending}
            aria-label="Friend user ID or search"
            autoComplete="off"
          />
          <Button type="submit" size="sm" disabled={!friendId.trim() || addFriendMutation.isPending} aria-label="Send friend request" className="bg-civic-blue text-white font-bold hover:bg-civic-gold transition-colors px-4 py-2 rounded-lg">
            {addFriendMutation.isPending ? <Loader2 className="animate-spin w-4 h-4" /> : "Add Friend"}
          </Button>
          {/* Autocomplete dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 w-full bg-white border rounded shadow z-10 mt-1 max-h-48 overflow-y-auto">
              {searchResults.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-2 px-2 py-1 hover:bg-civic-blue/10 cursor-pointer"
                  onClick={() => { setFriendId(u.id); setSearchResults([]); }}
                  tabIndex={0}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { setFriendId(u.id); setSearchResults([]); } }}
                  role="option"
                  aria-selected={friendId === u.id}
                >
                  {u.profileImageUrl ? (
                    <img src={u.profileImageUrl} alt="Avatar" className="w-8 h-8 rounded-full object-cover border-2 border-civic-blue" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-civic-blue text-white flex items-center justify-center text-lg font-bold">{(u.firstName || u.email || "?")[0]}</div>
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
      {/* Pending Requests */}
      <Card className="p-6 mb-4 bg-gradient-to-br from-yellow-50 to-white/80 dark:from-yellow-900 dark:to-slate-900/80 shadow-lg rounded-xl border border-yellow-200 dark:border-yellow-700 fade-in-up">
        <div className="font-bold text-lg mb-2 text-yellow-800 dark:text-yellow-200 flex items-center gap-2"><Users className="w-5 h-5" /> Pending Friend Requests</div>
        <div className="flex flex-col gap-3">
          {pendingReceived.length === 0 && <div className="text-muted-foreground">No pending requests.</div>}
          {pendingReceived.map((req: any) => (
            <div key={req.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white/80 hover:bg-yellow-50 focus-within:bg-yellow-100 p-3 transition shadow-sm">
              <div className="flex items-center gap-3">
                {req.profileImageUrl ? (
                  <img src={req.profileImageUrl} alt="Avatar" className="w-10 h-10 rounded-full object-cover border-2 border-yellow-400" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-yellow-400 text-white flex items-center justify-center text-lg font-bold">{(req.firstName || req.email || "?")[0]}</div>
                )}
                <div>
                  <div className="font-semibold">{req.firstName || req.email || `User ${req.userId}`}</div>
                  <div className="text-xs text-muted-foreground">{req.email}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleAccept(req.userId)} disabled={acceptFriendMutation.isPending} aria-label="Accept friend request" className="bg-civic-blue text-white font-bold hover:bg-civic-gold transition-colors rounded-lg">
                  {acceptFriendMutation.isPending ? <Loader2 className="animate-spin w-4 h-4" /> : <><Check className="w-4 h-4 mr-1" />Accept</>}
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleRemove(req.userId)} disabled={removeFriendMutation.isPending} aria-label="Decline friend request" className="rounded-lg">
                  {removeFriendMutation.isPending ? <Loader2 className="animate-spin w-4 h-4" /> : <><X className="w-4 h-4 mr-1" />Decline</>}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
      {/* Friends List */}
      <Card className="p-6 mb-4 bg-white/90 dark:bg-slate-900/90 shadow-lg rounded-xl border border-gray-200 dark:border-slate-700 fade-in-up">
        <div className="font-bold text-lg mb-2 text-civic-blue flex items-center gap-2"><Users className="w-5 h-5" /> Your Friends</div>
        {isLoading && <div>Loading friends...</div>}
        {error && <div className="text-red-500">Error loading friends.</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {friends.length === 0 && <div className="text-muted-foreground col-span-2">You have no friends yet.</div>}
          {friends.map((friend: any) => (
            <Card key={friend.id} className="p-4 flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gradient-to-br from-blue-50 to-white/80 hover:bg-civic-blue/10 focus-within:bg-civic-blue/20 transition shadow-sm">
              <div className="flex items-center gap-3">
                {friend.profileImageUrl ? (
                  <img src={friend.profileImageUrl} alt="Avatar" className="w-10 h-10 rounded-full object-cover border-2 border-civic-blue" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-civic-blue text-white flex items-center justify-center text-lg font-bold">{(friend.firstName || friend.email || "?")[0]}</div>
                )}
                <div>
                  <div className="font-semibold">{friend.firstName || friend.email || `User ${friend.friendId}`}</div>
                  <div className="text-xs text-muted-foreground">{friend.email}</div>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => handleRemove(friend.friendId)} disabled={removeFriendMutation.isPending} aria-label="Unfriend" className="rounded-lg">
                {removeFriendMutation.isPending ? <Loader2 className="animate-spin w-4 h-4" /> : "Unfriend"}
              </Button>
            </Card>
          ))}
        </div>
      </Card>
      {/* Sent Requests */}
      {pendingSent.length > 0 && (
        <Card className="p-6 mb-4 bg-gradient-to-br from-blue-50 to-white/80 dark:from-blue-900 dark:to-slate-900/80 shadow-lg rounded-xl border border-blue-200 dark:border-blue-700 fade-in-up">
          <div className="font-bold text-lg mb-2 text-blue-800 dark:text-blue-200 flex items-center gap-2"><User className="w-5 h-5" /> Sent Friend Requests</div>
          <div className="flex flex-col gap-3">
            {pendingSent.map((req: any) => (
              <div key={req.id} className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white/80 hover:bg-blue-50 focus-within:bg-blue-100 p-3 transition shadow-sm">
                {req.profileImageUrl ? (
                  <img src={req.profileImageUrl} alt="Avatar" className="w-10 h-10 rounded-full object-cover border-2 border-blue-400" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-400 text-white flex items-center justify-center text-lg font-bold">{(req.firstName || req.email || "?")[0]}</div>
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