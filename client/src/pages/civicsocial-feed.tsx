import React, { useState } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useCivicSocialFeed, useCivicSocialPost, useCivicSocialLike, useCivicSocialComment, useCivicSocialNotify, useCivicSocialFriends, useCivicSocialAddFriend } from "../hooks/useCivicSocial";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Picker from '@emoji-mart/react';
import emojiData from '@emoji-mart/data';
import { UserPlus, ThumbsUp, MessageCircle, Share2, Image as ImageIcon, Trash2 } from "lucide-react";
import PropTypes from "prop-types";
import { Skeleton } from "../components/ui/skeleton";

export default function CivicSocialFeed() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { data: feed, isLoading, error } = useCivicSocialFeed();
  const postMutation = useCivicSocialPost();
  const likeMutation = useCivicSocialLike();
  const commentMutation = useCivicSocialComment();
  const notifyMutation = useCivicSocialNotify();
  const addFriendMutation = useCivicSocialAddFriend();
  const [content, setContent] = useState("");
  const [openComment, setOpenComment] = useState<{ [postId: number]: boolean }>({});
  const [commentText, setCommentText] = useState<{ [postId: number]: string }>({});
  const { toast } = useToast();
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [feedFilter, setFeedFilter] = useState<'everyone' | 'friends'>('everyone');
  const { data: friendsData } = useCivicSocialFriends();
  const friends = friendsData?.friends || [];
  const [emojiPickerOpen, setEmojiPickerOpen] = useState<{ [postId: number]: boolean }>({});
  const queryClient = useQueryClient();

  // Welcome popup state
  const [showWelcomePopup, setShowWelcomePopup] = useState(() => {
    const hasSeenWelcome = localStorage.getItem('civicos-civicsocial-welcome');
    return !hasSeenWelcome;
  });

  const handleWelcomeClose = () => {
    localStorage.setItem('civicos-civicsocial-welcome', 'true');
    setShowWelcomePopup(false);
  };

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
      // Upload image to backend or cloud (stub: use a fake URL for now)
      imageUrl = imagePreview;
    }
    postMutation.mutate({ content, userId: user?.id, displayName, imageUrl }, {
      onSuccess: () => {
        toast({ title: "Post created!", description: "Your post was added to the feed." });
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
      // Remove reaction (toggle off)
      likeMutation.mutate({ postId: post.id, reaction: emoji });
    } else {
      // Add/change reaction
      likeMutation.mutate({ postId: post.id, reaction: emoji });
    }
    setEmojiPickerOpen({ ...emojiPickerOpen, [post.id]: false });
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

  if (authLoading || isLoading) {
    // Facebook-style loading skeletons
    return (
      <div className="w-full max-w-3xl mx-auto flex flex-col gap-6">
        <div className="sticky top-16 z-30 bg-white border-b border-gray-200 flex justify-center gap-2 py-2 shadow-sm mb-2">
          <Skeleton className="h-8 w-32 rounded-full" />
          <Skeleton className="h-8 w-32 rounded-full" />
        </div>
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
        {[1,2,3,4].map((i) => (
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

  // Filter feed based on toggle
  let filteredFeed = feed;
  if (feedFilter === 'friends' && feed && friends.length > 0) {
    const friendIds = new Set(friends.map((f: any) => f.id));
    filteredFeed = feed.filter((post: any) => friendIds.has(post.userId));
  }

  return (
    <>
      {/* Welcome Popup */}
      {showWelcomePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👋</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to CivicSocial!</h2>
              <p className="text-gray-600 mb-6">
                Connect with other verified citizens, share your thoughts on civic issues, and stay informed about democracy in action. This is your secure space for civic engagement.
              </p>
              <div className="flex flex-col gap-3">
                <Button 
                  onClick={handleWelcomeClose}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl"
                >
                  Get Started
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleWelcomeClose}
                  className="w-full border-gray-300 text-gray-600 hover:bg-gray-50 py-3 rounded-xl"
                >
                  Maybe Later
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="w-full max-w-3xl mx-auto flex flex-col gap-6">
        {/* Sticky Feed Filter Bar */}
        <div className="sticky top-16 z-30 bg-white border-b border-gray-200 flex justify-center gap-2 py-2 shadow-sm mb-2">
        <Button
          variant={feedFilter === 'everyone' ? 'default' : 'outline'}
          onClick={() => setFeedFilter('everyone')}
          size="sm"
          className="rounded-full px-6 font-semibold"
        >
          Everyone
        </Button>
        <Button
          variant={feedFilter === 'friends' ? 'default' : 'outline'}
          onClick={() => setFeedFilter('friends')}
          size="sm"
          className="rounded-full px-6 font-semibold"
        >
          Friends Only
        </Button>
      </div>
      {/* Facebook-style Post Composer */}
      <Card className="p-4 mb-4 flex items-start gap-3 bg-white shadow-lg rounded-xl border border-gray-200 fade-in-up">
        <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center font-bold text-2xl text-white shadow-md">
          {user?.firstName ? user.firstName[0] : (user?.email ? user.email[0] : "?")}
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
      {/* Facebook-style Feed */}
      <div className="flex flex-col gap-4">
        {filteredFeed && filteredFeed.length === 0 && <div className="text-muted-foreground">No posts yet.</div>}
        {filteredFeed && filteredFeed.map((post: any) => (
          <CivicSocialPostCard
            key={post.id}
            post={post}
            user={user}
            onReact={handleReact}
            onComment={handleComment}
            onDelete={deletePost}
            openComment={openComment}
            setOpenComment={setOpenComment}
            commentText={commentText}
            setCommentText={setCommentText}
            commentMutation={commentMutation}
            toast={toast}
            showWallLink={true}
          />
        ))}
      </div>
    </div>
    </>
  );
}

export function CivicSocialPostCard({ post, user, onReact, onComment, onDelete, openComment, setOpenComment, commentText, setCommentText, commentMutation, toast, showWallLink }: any) {
  // Collect all unique emojis used in reactions
  const allEmojis = Object.keys(post.reactions || {});

  // Helper for keyboard accessibility
  function handleKeyDown(fn: () => void) {
    return (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        fn();
      }
    };
  }

  // Get display name for post
  const getDisplayName = (post: any) => {
    if (post.displayName) return post.displayName;
    if (post.email) return post.email.split('@')[0];
    return `User ${post.userId}`;
  };

  return (
    <Card className={`flex gap-4 p-4 md:p-6 bg-white shadow-md rounded-xl border border-gray-200 fade-in-up hover:shadow-xl transition-shadow duration-200`} role="article" tabIndex={0} aria-label={post.type === "share" ? `Shared ${post.originalItemType}` : "Post"}>
      {/* Avatar */}
      <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center font-bold text-2xl text-white shadow-md mt-1">
        {getDisplayName(post)[0] || "?"}
      </div>
      {/* Post Content */}
      <div className="flex-1 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="font-bold text-base">{getDisplayName(post)}</span>
          <span className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleString()}</span>
          {user?.id === post.userId && (
            <Button size="icon" variant="ghost" aria-label="Delete post" onClick={() => onDelete(post.id)} onKeyDown={handleKeyDown(() => onDelete(post.id))} className="ml-auto text-red-600 hover:bg-red-100 focus:ring-2 focus:ring-red-400" tabIndex={0}>
              <Trash2 className="w-5 h-5" />
            </Button>
          )}
          {showWallLink && (
            <a href={`/civicsocial-profile`} className="ml-2 text-xs text-blue-600 underline hover:text-blue-800 focus:ring-2 focus:ring-blue-400" tabIndex={0} aria-label="View on Wall">View on Wall</a>
          )}
        </div>
        {post.imageUrl && (
          <img src={post.imageUrl} alt="Post attachment" className="w-full max-h-64 object-contain rounded border mb-2" />
        )}
        <div className="text-base mt-1 break-words prose dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content || ""}</ReactMarkdown>
        </div>
        {/* Facebook-style Reactions Bar */}
        <div className="flex gap-2 items-center text-sm mt-2">
          {allEmojis.length > 0 && (
            <div className="flex gap-1">
              {allEmojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => onReact(post, emoji)}
                  onKeyDown={handleKeyDown(() => onReact(post, emoji))}
                  aria-label={`React with ${emoji}`}
                  className={`rounded-full px-2 py-1 text-lg font-bold shadow-sm border border-gray-200 bg-blue-50 hover:bg-blue-100 focus:ring-2 focus:ring-blue-400 transition-all ${post.reactions[emoji].includes(user?.id) ? "bg-blue-600 text-white" : ""}`}
                  tabIndex={0}
                >
                  {emoji} <span className="text-xs font-semibold ml-1">{post.reactions[emoji].length}</span>
                </button>
              ))}
            </div>
          )}
          {/* Add/Change reaction button */}
          <button
            onClick={() => onReact(post, "👍")}
            onKeyDown={handleKeyDown(() => onReact(post, "👍"))}
            aria-label={post.reactions && post.reactions["👍"] && post.reactions["👍"].includes(user?.id) ? "Remove Like" : "Like"}
            className={`ml-2 rounded-full px-3 py-1 text-base font-bold border border-gray-200 bg-gray-50 hover:bg-blue-50 focus:ring-2 focus:ring-blue-400 transition-all ${post.reactions && post.reactions["👍"] && post.reactions["👍"].includes(user?.id) ? "bg-blue-600 text-white" : ""}`}
            tabIndex={0}
          >
            👍 Like
          </button>
        </div>
        {/* Comments and Share Bar */}
        <div className="flex gap-4 items-center text-sm text-gray-500 mt-2">
          <Button size="sm" variant="ghost" onClick={() => setOpenComment({ ...openComment, [post.id]: !openComment[post.id] })} onKeyDown={handleKeyDown(() => setOpenComment({ ...openComment, [post.id]: !openComment[post.id] }))} aria-label="Comment" className="rounded-full px-4 py-1 hover:bg-blue-50 focus:ring-2 focus:ring-blue-400" tabIndex={0}>
            <MessageCircle className="w-4 h-4 mr-1" /> Comment {post.commentsCount || 0}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => toast({ title: "Share coming soon!" })} onKeyDown={handleKeyDown(() => toast({ title: "Share coming soon!" }))} aria-label="Share" className="rounded-full px-4 py-1 hover:bg-blue-50 focus:ring-2 focus:ring-blue-400" tabIndex={0}>
            <Share2 className="w-4 h-4 mr-1" /> Share {post.sharesCount || 0}
          </Button>
        </div>
        {/* Comment box */}
        {openComment[post.id] && (
          <div className="mt-2 flex gap-2 items-center">
            <input
              className="flex-1 border rounded px-2 py-1"
              placeholder="Write a comment..."
              value={commentText[post.id] || ""}
              onChange={e => setCommentText({ ...commentText, [post.id]: e.target.value })}
              disabled={commentMutation.isPending}
              aria-label="Comment content"
              tabIndex={0}
              onKeyDown={e => { if (e.key === "Enter" && commentText[post.id]?.trim()) onComment(post.id); }}
            />
            <Button size="sm" onClick={() => onComment(post.id)} onKeyDown={handleKeyDown(() => onComment(post.id))} disabled={!commentText[post.id]?.trim() || commentMutation.isPending} aria-label="Submit comment" className="rounded-full px-4 py-1 bg-blue-600 text-white font-bold hover:bg-blue-700 focus:ring-2 focus:ring-blue-400" tabIndex={0}>
              {commentMutation.isPending ? "Posting..." : "Comment"}
            </Button>
          </div>
        )}
        {/* Comments */}
        {post.comments && post.comments.length > 0 && (
          <div className="mt-3 border-t pt-2">
            {post.comments.map((c: any) => (
              <div key={c.id} className="text-xs mb-1 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center font-bold text-sm">
                  {getDisplayName(c)[0] || "?"}
                </div>
                <span className="font-semibold">{getDisplayName(c)}:</span> {c.content}
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
CivicSocialPostCard.propTypes = {
  post: PropTypes.object.isRequired,
  user: PropTypes.object,
  onReact: PropTypes.func.isRequired,
  onComment: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  openComment: PropTypes.object.isRequired,
  setOpenComment: PropTypes.func.isRequired,
  commentText: PropTypes.object.isRequired,
  setCommentText: PropTypes.func.isRequired,
  commentMutation: PropTypes.object.isRequired,
  toast: PropTypes.func.isRequired,
  showWallLink: PropTypes.bool,
}; 