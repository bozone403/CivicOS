import React, { useState } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useCivicSocialFriends, useCivicSocialAddFriend, useCivicSocialAcceptFriend, useCivicSocialRemoveFriend, useCivicSocialNotify } from "../hooks/useCivicSocial";
import { useAuth } from "../hooks/useAuth";

export default function CivicSocialFriends() {
  const { user } = useAuth();
  const token = localStorage.getItem("token") || "";
  const { data, isLoading, error } = useCivicSocialFriends(token);
  const friends = data?.friends || [];
  const pendingReceived = data?.received || [];
  const pendingSent = data?.sent || [];
  const addFriendMutation = useCivicSocialAddFriend(token);
  const acceptFriendMutation = useCivicSocialAcceptFriend(token);
  const removeFriendMutation = useCivicSocialRemoveFriend(token);
  const notifyMutation = useCivicSocialNotify(token);
  const [friendId, setFriendId] = useState("");

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
        <form className="flex gap-2 mt-2 w-full max-w-xs" onSubmit={handleAddFriend} aria-label="Add friend form">
          <input
            className="border rounded px-2 py-1 flex-1"
            placeholder="User ID to add"
            value={friendId}
            onChange={e => setFriendId(e.target.value)}
            disabled={addFriendMutation.isPending}
            aria-label="Friend user ID"
          />
          <Button type="submit" size="sm" disabled={!friendId.trim() || addFriendMutation.isPending} aria-label="Send friend request">
            {addFriendMutation.isPending ? "Sending..." : "Add Friend"}
          </Button>
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
            <div key={req.id} className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <div>{req.displayName || ((req.firstName || "") + (req.lastName ? " " + req.lastName : "") || req.email || `User ${req.userId}`)}</div>
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
            <Card key={friend.id} className="p-4 flex items-center justify-between flex-wrap gap-2">
              <div>
                <div className="font-semibold">{friend.displayName || ((friend.firstName || "") + (friend.lastName ? " " + friend.lastName : "") || friend.email || `User ${friend.friendId}`)}</div>
                <div className="text-xs text-muted-foreground">@{friend.email ? friend.email.split("@")[0] : `user${friend.friendId}`}</div>
              </div>
              <Button size="sm" variant="outline" onClick={() => handleRemove(friend.friendId)} disabled={removeFriendMutation.isPending} aria-label="Unfriend">
                {removeFriendMutation.isPending ? "Removing..." : "Unfriend"}
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
} 