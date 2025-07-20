import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

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
export function useCivicSocialFeed(token: string) {
  return useQuery({
    queryKey: ["civicSocialFeed"],
    queryFn: async () => {
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
export function useCivicSocialPost(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (post: any) => {
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
export function useCivicSocialComment(token: string) {
  return useMutation({
    mutationFn: async ({ postId, ...comment }: any) => {
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

// Stub: like/unlike post
export function useCivicSocialLike(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (postId: number) => {
      const res = await fetch(`${API_BASE}/api/social/posts/${postId}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to like/unlike post");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["civicSocialFeed"] }),
  });
}

// Stub: friends
export function useCivicSocialFriends(token: string) {
  return useQuery({
    queryKey: ["civicSocialFriends"],
    queryFn: async () => {
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
export function useCivicSocialAddFriend(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ friendId }: { friendId: number }) => {
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
export function useCivicSocialAcceptFriend(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ friendId }: { friendId: number }) => {
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
export function useCivicSocialRemoveFriend(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ friendId }: { friendId: number }) => {
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
export function useCivicSocialNotify(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (notification: { userId: string | number; type: string; title: string; message: string; link?: string }) => {
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