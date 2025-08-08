import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { config } from "@/lib/config";

function getToken() {
  return localStorage.getItem('civicos-jwt') || '';
}

// Normalize base to avoid double slashes
const API_BASE = config.apiUrl.replace(/\/+$/, "");

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
      // Backend returns { success: true, feed: [...] }
      return data.success ? (data.feed || []) : [];
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
      // Sanitize payload to match server schema
      const payload: any = {
        content: String(post?.content ?? '').trim(),
        type: post?.type || 'text',
        visibility: post?.visibility || 'public',
      };
      if (post?.imageUrl && typeof post.imageUrl === 'string') {
        payload.imageUrl = post.imageUrl;
      }
      const res = await fetch(`${API_BASE}/api/social/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.message || data?.error || 'Failed to create post';
        throw new Error(msg);
      }
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["civicSocialFeed"] }),
  });
}

// Add comment
export function useCivicSocialComment() {
  const queryClient = useQueryClient();
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["civicSocialFeed"] }),
  });
}

// Like/react to post with emoji
export function useCivicSocialLike() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, reaction = "like" }: any) => {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/social/posts/${postId}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reaction }),
      });
      if (!res.ok) throw new Error("Failed to like post");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["civicSocialFeed"] }),
  });
}

// Friends system
export function useCivicSocialFriends() {
  return useQuery({
    queryKey: ["civicSocialFriends"],
    queryFn: async () => {
      const token = getToken();
      if (!token) {
        throw new Error("Authentication required");
      }
      
      const res = await fetch(`${API_BASE}/api/social/friends`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('civicos-jwt');
          throw new Error("Authentication required");
        }
        throw new Error("Failed to fetch friends");
      }
      
      const data = await res.json();
      return data.success ? data : { friends: [], received: [], sent: [] };
    },
    retry: (failureCount, error) => {
      if (error.message === "Authentication required") {
        return false;
      }
      return failureCount < 3;
    },
  });
}

// Add friend
export function useCivicSocialAddFriend() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ friendId }: any) => {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/social/friends`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ friendId }),
      });
      if (!res.ok) throw new Error("Failed to add friend");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["civicSocialFriends"] }),
  });
}

// Accept friend request
export function useCivicSocialAcceptFriend() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ friendId }: any) => {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/social/friends/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ friendId }),
      });
      if (!res.ok) throw new Error("Failed to accept friend request");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["civicSocialFriends"] }),
  });
}

// Remove friend
export function useCivicSocialRemoveFriend() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ friendId }: any) => {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/social/friends/remove`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ friendId }),
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
      if (!token) {
        throw new Error("Authentication required");
      }
      
      const res = await fetch(`${API_BASE}/api/social/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('civicos-jwt');
          throw new Error("Authentication required");
        }
        throw new Error("Failed to fetch conversations");
      }
      
      const data = await res.json();
      return data.success ? (data.conversations || []) : [];
    },
    retry: (failureCount, error) => {
      if (error.message === "Authentication required") {
        return false;
      }
      return failureCount < 3;
    },
  });
}

// Messages for a conversation
export function useCivicSocialMessages(conversationId: string) {
  return useQuery({
    queryKey: ["civicSocialMessages", conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      
      const token = getToken();
      if (!token) {
        throw new Error("Authentication required");
      }
      
      const res = await fetch(`${API_BASE}/api/social/messages/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('civicos-jwt');
          throw new Error("Authentication required");
        }
        throw new Error("Failed to fetch messages");
      }
      
      const data = await res.json();
      return data.success ? (data.messages || []) : [];
    },
    enabled: !!conversationId,
    retry: (failureCount, error) => {
      if (error.message === "Authentication required") {
        return false;
      }
      return failureCount < 3;
    },
  });
}

// Send message
export function useCivicSocialSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ recipientId, content }: any) => {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/social/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ recipientId, content }),
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
    mutationFn: async ({ userId, type, title, message }: any) => {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/social/notifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, type, title, message }),
      });
      if (!res.ok) throw new Error("Failed to send notification");
      return res.json();
    },
  });
}

// Follow/Unfollow system
export function useCivicSocialFollow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ followingId }: any) => {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/social/follow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ followingId }),
      });
      if (!res.ok) throw new Error("Failed to follow user");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["civicSocialFeed"] });
      queryClient.invalidateQueries({ queryKey: ["civicSocialFriends"] });
    },
  });
}

export function useCivicSocialUnfollow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ followingId }: any) => {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/social/unfollow`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ followingId }),
      });
      if (!res.ok) throw new Error("Failed to unfollow user");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["civicSocialFeed"] });
      queryClient.invalidateQueries({ queryKey: ["civicSocialFriends"] });
    },
  });
}

// User search
export function useCivicSocialUserSearch(query: string) {
  return useQuery({
    queryKey: ["civicSocialUserSearch", query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      
      const token = getToken();
      if (!token) {
        throw new Error("Authentication required");
      }
      
      const res = await fetch(`${API_BASE}/api/social/users/search?q=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('civicos-jwt');
          throw new Error("Authentication required");
        }
        throw new Error("Failed to search users");
      }
      
      const data = await res.json();
      return data.success ? (data.users || []) : [];
    },
    enabled: !!query && query.length >= 2,
    retry: (failureCount, error) => {
      if (error.message === "Authentication required") {
        return false;
      }
      return failureCount < 3;
    },
  });
}

// Followers/Following
export function useCivicSocialFollowers(userId: string) {
  return useQuery({
    queryKey: ["civicSocialFollowers", userId],
    queryFn: async () => {
      const token = getToken();
      if (!token) {
        throw new Error("Authentication required");
      }
      
      const res = await fetch(`${API_BASE}/api/social/followers/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('civicos-jwt');
          throw new Error("Authentication required");
        }
        throw new Error("Failed to fetch followers");
      }
      
      const data = await res.json();
      return data.success ? (data.followers || []) : [];
    },
    enabled: !!userId,
    retry: (failureCount, error) => {
      if (error.message === "Authentication required") {
        return false;
      }
      return failureCount < 3;
    },
  });
}

export function useCivicSocialFollowing(userId: string) {
  return useQuery({
    queryKey: ["civicSocialFollowing", userId],
    queryFn: async () => {
      const token = getToken();
      if (!token) {
        throw new Error("Authentication required");
      }
      
      const res = await fetch(`${API_BASE}/api/social/following/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('civicos-jwt');
          throw new Error("Authentication required");
        }
        throw new Error("Failed to fetch following");
      }
      
      const data = await res.json();
      return data.success ? (data.following || []) : [];
    },
    enabled: !!userId,
    retry: (failureCount, error) => {
      if (error.message === "Authentication required") {
        return false;
      }
      return failureCount < 3;
    },
  });
} 