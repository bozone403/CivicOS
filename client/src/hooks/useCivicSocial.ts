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
      if (!token) {
        throw new Error("Authentication required");
      }
      
      const res = await fetch(`${API_BASE}/api/social/feed`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          // Clear invalid token
          localStorage.removeItem('civicos-jwt');
          throw new Error("Authentication required");
        }
        throw new Error("Failed to fetch feed");
      }
      
      const data = await res.json();
      // Backend returns { feed: [...] }
      return data.feed || [];
    },
    retry: (failureCount, error) => {
      // Don't retry authentication errors
      if (error.message === "Authentication required") {
        return false;
      }
      return failureCount < 3;
    },
  });
}

// Create post
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

// Add comment
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

// Friends
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
        body: JSON.stringify({ friendId, action: "send" }),
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

// Conversations
export function useCivicSocialConversations() {
  return useQuery({
    queryKey: ["civicSocialConversations"],
    queryFn: async () => {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/social/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch conversations");
      return res.json();
    },
  });
}

// Messages for a conversation
export function useCivicSocialMessages(conversationId: string) {
  return useQuery({
    queryKey: ["civicSocialMessages", conversationId],
    queryFn: async () => {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/social/messages/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
    enabled: !!conversationId,
  });
}

// Send message
export function useCivicSocialSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ content, receiverId }: { content: string; receiverId: string }) => {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/social/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content, receiverId }),
      });
      if (!res.ok) throw new Error("Failed to send message");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["civicSocialConversations"] });
      queryClient.invalidateQueries({ queryKey: ["civicSocialMessages"] });
    },
  });
}

// Notifications
export function useCivicSocialNotify() {
  return useMutation({
    mutationFn: async (notification: any) => {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/social/notifications`, {
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
  });
}

// Follow functionality
export function useCivicSocialFollow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/social/follow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error("Failed to follow user");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["civicSocialFriends"] });
      queryClient.invalidateQueries({ queryKey: ["civicSocialFeed"] });
    },
  });
}

export function useCivicSocialUnfollow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/social/follow/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to unfollow user");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["civicSocialFriends"] });
      queryClient.invalidateQueries({ queryKey: ["civicSocialFeed"] });
    },
  });
}

export function useCivicSocialFollowers(userId: string) {
  return useQuery({
    queryKey: ["civicSocialFollowers", userId],
    queryFn: async () => {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/social/followers/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch followers");
      const data = await res.json();
      return data.followers || [];
    },
    enabled: !!userId,
  });
}

export function useCivicSocialFollowing(userId: string) {
  return useQuery({
    queryKey: ["civicSocialFollowing", userId],
    queryFn: async () => {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/social/following/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch following");
      const data = await res.json();
      return data.following || [];
    },
    enabled: !!userId,
  });
} 