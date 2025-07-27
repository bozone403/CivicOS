import React, { useState, useRef } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useCivicSocialFeed, useCivicSocialPost, useCivicSocialLike, useCivicSocialComment, useCivicSocialNotify, useCivicSocialFriends } from "../hooks/useCivicSocial";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ThumbsUp, MessageCircle, Share2, Image as ImageIcon, Edit2, Trash2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
// import { PostCard } from "./civicsocial-feed";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Skeleton } from "../components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import { Heart, MessageSquare } from "lucide-react";

export default function CivicSocialProfile() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { data: feed, isLoading, error } = useCivicSocialFeed();
  const { data: friendsData } = useCivicSocialFriends();
  const postMutation = useCivicSocialPost();
  const likeMutation = useCivicSocialLike();
  const commentMutation = useCivicSocialComment();
  const notifyMutation = useCivicSocialNotify();
  const [content, setContent] = useState("");
  const [openComment, setOpenComment] = useState<{ [postId: number]: boolean }>({});
  const [commentText, setCommentText] = useState<{ [postId: number]: string }>({});
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editFirstName, setEditFirstName] = useState(user?.firstName || "");
  const [editLastName, setEditLastName] = useState(user?.lastName || "");
  const [editBio, setEditBio] = useState((user as any)?.bio || "");
  const [editAvatar, setEditAvatar] = useState((user as any)?.profileImageUrl || "");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const friends = friendsData?.friends || [];
  const [activeTab, setActiveTab] = useState("posts");

  const updateProfile = useMutation({
    mutationFn: async (fields: any) => apiRequest(`/api/users/profile`, "PUT", fields),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setEditOpen(false);
      toast({ title: "Profile updated!", description: "Your changes have been saved." });
    },
  });

  // Only show posts by this user (type-safe string comparison)
  const userPosts = feed ? feed.filter((post: any) => String(post.userId) === String(user?.id)) : [];

  const displayName = user ? 
    (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : 
     user.firstName || user.lastName || user.email || "Anonymous") : 
    "Anonymous";

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !image) return;
    let imageUrl = null;
    if (image) {
      imageUrl = imagePreview;
    }
    postMutation.mutate({ content, userId: user?.id, displayName, imageUrl }, {
      onSuccess: () => {
        toast({ title: "Post created!", description: "Your post was added to your wall." });
        queryClient.invalidateQueries({ queryKey: ['civicSocialFeed'] });
      },
      onError: (error) => {
        toast({ title: "Error posting", description: error.message || "Failed to post.", variant: "destructive" });
      },
    });
    setContent("");
    setImage(null);
    setImagePreview(null);
  };

  const handleComment = (postId: number) => {
    if (!commentText[postId]?.trim()) return;
    commentMutation.mutate(
      { postId, content: commentText[postId], userId: user?.id, displayName },
      {
        onSuccess: () => {
          setCommentText({ ...commentText, [postId]: "" });
          setOpenComment({ ...openComment, [postId]: false });
          queryClient.invalidateQueries({ queryKey: ['civicSocialFeed'] });
        },
        onError: (error) => {
          toast({ title: "Error commenting", description: error.message || "Failed to comment.", variant: "destructive" });
        },
      }
    );
  };

  // Helper: get user's reaction for a post
  function getUserReaction(post: any) {
    if (!post.reactions) return null;
    for (const emoji in post.reactions) {
      if (post.reactions[emoji].includes(user?.id)) return emoji;
    }
    return null;
  }

  // Handle react (add/change/remove)
  const handleReact = (post: any, emoji: string) => {
    const current = getUserReaction(post);
    if (current === emoji) {
      likeMutation.mutate({ postId: post.id, reaction: emoji });
    } else {
      likeMutation.mutate({ postId: post.id, reaction: emoji });
    }
  };

  const deletePost = async (postId: number) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await fetch(`/api/social/posts/${postId}`, {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('civicos-jwt')}`,
        },
      });
      toast({ title: "Post deleted", description: "Your post was removed." });
      queryClient.invalidateQueries({ queryKey: ['civicSocialFeed'] });
    } catch (err) {
      toast({ title: "Error deleting post", description: "Failed to delete post.", variant: "destructive" });
    }
  };

  function handleKeyDown(fn: () => void) {
    return (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        fn();
      }
    };
  }

  if (authLoading || isLoading) {
    // Facebook-style loading skeletons
    return (
      <div className="w-full max-w-3xl mx-auto flex flex-col gap-6">
        {/* Cover Skeleton */}
        <div className="relative w-full h-56 md:h-64 bg-gradient-to-r from-blue-600 to-purple-700 rounded-b-3xl shadow-lg overflow-hidden mb-8">
          <Skeleton className="absolute inset-0 w-full h-full" />
          <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-1/2 flex flex-col items-center">
            <Skeleton className="w-32 h-32 rounded-full border-4 border-white shadow-xl bg-white" />
            <div className="mt-4 flex flex-col items-center">
              <Skeleton className="h-8 w-48 rounded mb-2" />
              <Skeleton className="h-5 w-32 rounded mb-1" />
              <Skeleton className="h-5 w-64 rounded mb-2" />
              <Skeleton className="h-8 w-32 rounded" />
            </div>
          </div>
        </div>
        {/* Tabs Skeleton */}
        <div className="flex w-full justify-center gap-2 bg-white rounded-xl shadow mb-6">
          <Skeleton className="h-10 w-24 rounded-full" />
          <Skeleton className="h-10 w-24 rounded-full" />
          <Skeleton className="h-10 w-24 rounded-full" />
          <Skeleton className="h-10 w-24 rounded-full" />
        </div>
        {/* Post Composer Skeleton */}
        <Card className="p-4 mb-4 flex items-start gap-3 bg-white shadow-lg rounded-xl border border-gray-200 fade-in-up">
          <Skeleton className="w-12 h-12 rounded-full" />
          <div className="flex-1 flex flex-col gap-2">
            <Skeleton className="h-10 w-full rounded-lg mb-2" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20 rounded-full" />
              <Skeleton className="h-8 w-20 rounded-full" />
            </div>
          </div>
        </Card>
        {/* Posts Skeleton */}
        {[1,2,3].map((i) => (
          <Card key={i} className="p-4 flex items-start gap-3 bg-white shadow-lg rounded-xl border border-gray-200 fade-in-up">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div className="flex-1 flex flex-col gap-2">
              <Skeleton className="h-6 w-1/2 rounded" />
              <Skeleton className="h-4 w-1/3 rounded" />
              <Skeleton className="h-10 w-full rounded-lg mt-2" />
              <div className="flex gap-2 mt-2">
                <Skeleton className="h-8 w-16 rounded-full" />
                <Skeleton className="h-8 w-16 rounded-full" />
                <Skeleton className="h-8 w-16 rounded-full" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }
  if (!user) return <div className="text-center text-muted-foreground">Login to view your profile.</div>;

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6">
      {/* Facebook-style Cover and Profile Header */}
      <div className="relative w-full h-56 md:h-64 bg-gradient-to-r from-blue-600 to-purple-700 rounded-b-3xl shadow-lg overflow-hidden mb-8">
        {/* Cover photo (placeholder gradient) */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-blue-700 to-purple-700 opacity-90" />
        {/* Large Avatar */}
        <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-1/2 flex flex-col items-center">
          <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl bg-white overflow-hidden">
            {(user as any)?.profileImageUrl ? (
              <img src={(user as any)?.profileImageUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-5xl font-bold bg-blue-600 text-white">
                {displayName[0]}
              </div>
            )}
          </div>
          <div className="mt-4 flex flex-col items-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{displayName}</h1>
            <p className="text-base md:text-lg text-gray-600">@{user?.email?.split("@")[0]}</p>
            <p className="text-base text-gray-700 mt-1">{(user as any)?.bio || "No bio available."}</p>
            <Button size="sm" variant="outline" className="mt-2 focus:ring-2 focus:ring-blue-400" onClick={() => setEditOpen(true)} onKeyDown={handleKeyDown(() => setEditOpen(true))} aria-label="Edit Profile" tabIndex={0}>Edit Profile</Button>
          </div>
        </div>
      </div>
      {/* Tabs for Wall, About, Friends, Photos */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex w-full justify-center gap-2 bg-white rounded-xl shadow mb-6">
          <TabsTrigger value="posts" className="px-6 py-2 font-semibold focus:ring-2 focus:ring-blue-400" tabIndex={0} aria-label="Posts" onKeyDown={handleKeyDown(() => setActiveTab("posts"))}>Posts</TabsTrigger>
          <TabsTrigger value="about" className="px-6 py-2 font-semibold focus:ring-2 focus:ring-blue-400" tabIndex={0} aria-label="About" onKeyDown={handleKeyDown(() => setActiveTab("about"))}>About</TabsTrigger>
          <TabsTrigger value="friends" className="px-6 py-2 font-semibold focus:ring-2 focus:ring-blue-400" tabIndex={0} aria-label="Friends" onKeyDown={handleKeyDown(() => setActiveTab("friends"))}>Friends</TabsTrigger>
          <TabsTrigger value="photos" className="px-6 py-2 font-semibold focus:ring-2 focus:ring-blue-400" tabIndex={0} aria-label="Photos" onKeyDown={handleKeyDown(() => setActiveTab("photos"))}>Photos</TabsTrigger>
        </TabsList>
        <TabsContent value="posts">
          {/* Post Composer and Wall */}
          <Card className="p-4 mb-4 flex items-start gap-3 bg-white shadow-lg rounded-xl border border-gray-200 fade-in-up">
            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center font-bold text-2xl text-white shadow-md">
              {displayName[0]}
            </div>
            <form className="flex-1 flex flex-col gap-2" onSubmit={handlePost} aria-label="Post composer">
              <textarea
                className="flex-1 border rounded-lg px-3 py-2 bg-gray-50 resize-none text-base focus:ring-2 focus:ring-blue-500"
                placeholder={isAuthenticated ? "What's on your mind?" : "Login to post"}
                value={content}
                onChange={e => setContent(e.target.value)}
                disabled={postMutation.isPending || !isAuthenticated}
                aria-label="Post content"
                rows={2}
                maxLength={500}
                style={{ minHeight: 48 }}
              />
              <div className="flex items-center gap-2 mt-1">
                <label className="cursor-pointer flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors">
                  <ImageIcon className="w-5 h-5" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={postMutation.isPending || !isAuthenticated}
                    aria-label="Upload image"
                    className="hidden"
                  />
                  <span className="text-xs">Image</span>
                </label>
                {imagePreview && (
                  <div className="flex items-center gap-2">
                    <img src={imagePreview} alt="Preview" className="w-16 h-16 object-cover rounded border" />
                    <Button type="button" size="sm" variant="outline" onClick={() => { setImage(null); setImagePreview(null); }}>Remove</Button>
                  </div>
                )}
                <Button type="submit" disabled={(!content.trim() && !image) || postMutation.isPending || !isAuthenticated} aria-label="Submit post" className="ml-auto px-6 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors">
                  {postMutation.isPending ? "Posting..." : "Post"}
                </Button>
              </div>
              {postMutation.error && (
                <div className="text-xs text-red-500 mt-2" role="alert">Error posting. Try again.</div>
              )}
            </form>
          </Card>
          <div className="flex flex-col gap-4">
            {userPosts && userPosts.length === 0 && <div className="text-muted-foreground">No posts yet.</div>}
            {userPosts && userPosts.map((post: any) => (
              <Card key={post.id} className="mb-4">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={post.user?.profileImageUrl} />
                      <AvatarFallback className="bg-blue-600 text-white">
                        {post.user?.firstName?.[0] || post.user?.email?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold">
                          {post.user?.firstName} {post.user?.lastName}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-800 mb-3">{post.content}</p>
                      {post.imageUrl && (
                        <img src={post.imageUrl} alt="Post" className="rounded-lg max-w-full h-auto mb-3" />
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <button className="flex items-center gap-1 hover:text-blue-600">
                          <Heart className="w-4 h-4" />
                          {post.likesCount || 0}
                        </button>
                        <button className="flex items-center gap-1 hover:text-blue-600">
                          <MessageSquare className="w-4 h-4" />
                          {post.commentsCount || 0}
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="about">
          <Card className="p-6 bg-white shadow rounded-xl border border-gray-200">
            <h2 className="text-xl font-bold mb-2">About</h2>
            <p className="text-gray-700">{(user as any)?.bio || "No bio available."}</p>
            <div className="mt-4">
              <span className="block text-sm text-gray-500">Email:</span>
              <span className="block text-base font-medium text-gray-800">{user?.email}</span>
            </div>
          </Card>
        </TabsContent>
        <TabsContent value="friends">
          <Card className="p-6 bg-white shadow rounded-xl border border-gray-200">
            <h2 className="text-xl font-bold mb-2">Friends</h2>
            <div className="flex flex-wrap gap-4 mt-2">
              {friends.length === 0 && <span className="text-gray-500">No friends yet.</span>}
              {friends.map((f: any) => (
                <div key={f.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                    {f.firstName?.[0] || f.email?.[0] || "U"}
                  </div>
                  <span className="font-medium text-sm">{f.firstName || f.email}</span>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
        <TabsContent value="photos">
          <Card className="p-6 bg-white shadow rounded-xl border border-gray-200">
            <h2 className="text-xl font-bold mb-2">Photos</h2>
            <span className="text-gray-500">No photos yet.</span>
          </Card>
        </TabsContent>
      </Tabs>
      {/* Edit Profile Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline" className="text-blue-700 bg-white/80 hover:bg-white">Edit Profile</Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>Update your display name and bio for CivicSocial.</DialogDescription>
          </DialogHeader>
          <form className="flex flex-col gap-4" onSubmit={e => {
            e.preventDefault();
            updateProfile.mutate({
              firstName: editFirstName,
              lastName: editLastName,
              bio: editBio,
              profileImageUrl: editAvatar,
            });
          }}>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="edit-name">First Name</label>
              <Input id="edit-name" value={editFirstName} onChange={e => setEditFirstName(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="edit-lastname">Last Name</label>
              <Input id="edit-lastname" value={editLastName} onChange={e => setEditLastName(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="edit-bio">Bio</label>
              <Textarea id="edit-bio" value={editBio} onChange={e => setEditBio(e.target.value)} rows={3} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={updateProfile.isPending}>{updateProfile.isPending ? "Saving..." : "Save"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 