import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { config } from "@/lib/config";

function getToken() {
  return localStorage.getItem('civicos-jwt') || '';
}

const API_BASE = config.apiUrl;

// Post shape:
// {
//   id: number,
//   userId: number,
//   content: string,
//   createdAt: string,
//   likesCount: number,
//   commentsCount: number,
//   comments: Array<{ id: number, userId: number, content: string, createdAt: string }>
// }
export function useCivicSocialFeed() {
  return useQuery({
    queryKey: ["civicSocialFeed"],
    queryFn: async () => {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/social/feed`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch feed");
      const data = await res.json();
      // Assume backend returns comments and counts
      return data.feed;
    },
  });
}

// Stub: create post
export function useCivicSocialPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (post: any) => {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/social/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(post),
      });
      if (!res.ok) throw new Error("Failed to create post");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["civicSocialFeed"] }),
  });
}

// Stub: add comment
export function useCivicSocialComment() {
  return useMutation({
    mutationFn: async ({ postId, ...comment }: any) => {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/social/posts/${postId}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(comment),
      });
      if (!res.ok) throw new Error("Failed to add comment");
      return res.json();
    },
  });
}

// Like/react to post with emoji
export function useCivicSocialLike() {
  const queryClient = useQueryClient();
  return useMutation({
    // Accepts: ({ postId, reaction })
    mutationFn: async ({ postId, reaction }: { postId: number, reaction: string }) => {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/social/posts/${postId}/like`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reaction }),
      });
      if (!res.ok) throw new Error("Failed to react to post");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["civicSocialFeed"] }),
  });
}

// Stub: friends
export function useCivicSocialFriends() {
  return useQuery({
    queryKey: ["civicSocialFriends"],
    queryFn: async () => {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/social/friends`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch friends");
      return res.json();
    },
  });
}

// Add friend mutation
// Usage: const addFriend = useCivicSocialAddFriend(token); addFriend.mutate({ friendId: 2 })
export function useCivicSocialAddFriend() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ friendId }: { friendId: number }) => {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/social/friends`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ friendId }),
      });
      if (!res.ok) throw new Error("Failed to send friend request");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["civicSocialFriends"] }),
  });
}

// Accept friend request
export function useCivicSocialAcceptFriend() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ friendId }: { friendId: number }) => {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/social/friends`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ friendId, action: "accept" }),
      });
      if (!res.ok) throw new Error("Failed to accept friend request");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["civicSocialFriends"] }),
  });
}

// Remove/unfriend
export function useCivicSocialRemoveFriend() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ friendId }: { friendId: number }) => {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/social/friends`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ friendId, action: "remove" }),
      });
      if (!res.ok) throw new Error("Failed to remove friend");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["civicSocialFriends"] }),
  });
}

// Create notification
export function useCivicSocialNotify() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (notification: { userId: string | number; type: string; title: string; message: string; link?: string }) => {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/notifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(notification),
      });
      if (!res.ok) throw new Error("Failed to send notification");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/notifications"] }),
  });
} 