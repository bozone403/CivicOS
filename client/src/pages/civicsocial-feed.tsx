import React, { useState } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useCivicSocialFeed, useCivicSocialPost, useCivicSocialLike, useCivicSocialComment, useCivicSocialNotify, useCivicSocialFriends, useCivicSocialAddFriend } from "../hooks/useCivicSocial";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/use-toast";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Picker from '@emoji-mart/react';
import emojiData from '@emoji-mart/data';
import { UserPlus } from "lucide-react";

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
  const [shareModal, setShareModal] = useState<{ open: boolean; post?: any }>({ open: false });
  const [shareComment, setShareComment] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [feedFilter, setFeedFilter] = useState<'everyone' | 'friends'>('everyone');
  const { data: friendsData } = useCivicSocialFriends();
  const friends = friendsData?.friends || [];
  const [emojiPickerOpen, setEmojiPickerOpen] = useState<{ [postId: number]: boolean }>({});

  const displayName = user ? (user.firstName || "") + (user.lastName ? " " + user.lastName : "") || user.email || "Anonymous" : "Anonymous";

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
      // TODO: Implement real image upload endpoint
      imageUrl = imagePreview;
    }
    postMutation.mutate({ content, userId: user?.id, displayName, image: imageUrl });
    setContent("");
    setImage(null);
    setImagePreview(null);
  };

  const handleComment = (postId: number) => {
    if (!commentText[postId]?.trim()) return;
    const post = feed?.find((p: any) => p.id === postId);
    commentMutation.mutate(
      { postId, content: commentText[postId], userId: user?.id, displayName },
      {
        onSuccess: () => {
          if (post && user?.id !== post.userId) {
            notifyMutation.mutate({
              userId: post.userId,
              type: "comment",
              title: "New comment on your post",
              message: `${displayName} commented on your post: "${commentText[postId]}"`,
              link: `/civicsocial/feed#post-${postId}`,
            });
          }
        },
      }
    );
    setCommentText({ ...commentText, [postId]: "" });
    setOpenComment({ ...openComment, [postId]: false });
  };

  const handleShare = (post: any) => {
    setShareModal({ open: true, post });
    setShareComment("");
  };

  const handleShareSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareModal.post) return;
    postMutation.mutate(
      {
        type: "share",
        originalItemId: shareModal.post.id,
        originalItemType: "post",
        comment: shareComment,
        userId: user?.id,
        displayName,
      },
      {
        onSuccess: () => {
          setShareModal({ open: false });
          setShareComment("");
          toast({ title: "Post shared!", description: "Your share was added to the feed." });
          if (shareModal.post && user?.id !== shareModal.post.userId) {
            notifyMutation.mutate({
              userId: shareModal.post.userId,
              type: "share",
              title: "Your post was shared",
              message: `${displayName} shared your post!`,
              link: `/civicsocial/feed#post-${shareModal.post.id}`,
            });
          }
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

  // Helper: get friend status for a userId
  function getFriendStatus(userId: string) {
    if (!user || user.id === userId) return null;
    if (friends.some((f: any) => f.friendId === userId || f.userId === userId)) return "Friend";
    if (friendsData?.sent?.some((req: any) => req.friendId === userId)) return "Pending";
    if (friendsData?.received?.some((req: any) => req.userId === userId)) return "Requested";
    return null;
  }

  // Helper: get original content URL for shares
  function getOriginalUrl(post: any) {
    if (post.originalItemType === "petition") return `/petitions?id=${post.originalItemId}`;
    if (post.originalItemType === "bill") return `/voting?id=${post.originalItemId}`;
    if (post.originalItemType === "news") return `/news?id=${post.originalItemId}`;
    return null;
  }

  if (authLoading) return <div>Loading...</div>;

  // Filter feed based on toggle
  let filteredFeed = feed;
  if (feedFilter === 'friends' && feed && friends.length > 0) {
    const friendIds = new Set(friends.map((f: any) => f.id));
    filteredFeed = feed.filter((post: any) => friendIds.has(post.userId));
  }

  // Helper: get suggested friends (users in the feed who are not friends or self)
  const suggestedFriends = filteredFeed
    ? Array.from(new Set(filteredFeed.map((p: any) => p.userId)))
        .filter(uid => uid !== user?.id && !friends.some((f: any) => f.friendId === uid || f.userId === uid))
        .slice(0, 5)
    : [];

  // Helper: get trending posts (top 3 by engagement)
  const trendingPosts = filteredFeed
    ? [...filteredFeed]
        .sort((a, b) => {
          const aEngagement = (Object.values(a.reactions || {}).reduce((acc: number, users) => acc + (Array.isArray(users) ? users.length : 0), 0) + (a.commentsCount || 0) + (a.sharesCount || 0));
          const bEngagement = (Object.values(b.reactions || {}).reduce((acc: number, users) => acc + (Array.isArray(users) ? users.length : 0), 0) + (b.commentsCount || 0) + (b.sharesCount || 0));
          return bEngagement - aEngagement;
        })
        .slice(0, 3)
    : [];

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6" role="feed" aria-label="CivicSocial feed">
      {/* Feed filter toggle */}
      <div className="flex justify-end mb-2 gap-2">
        <Button
          variant={feedFilter === 'everyone' ? 'default' : 'outline'}
          onClick={() => setFeedFilter('everyone')}
          size="sm"
        >
          Everyone
        </Button>
        <Button
          variant={feedFilter === 'friends' ? 'default' : 'outline'}
          onClick={() => setFeedFilter('friends')}
          size="sm"
        >
          Friends Only
        </Button>
      </div>
      {suggestedFriends.length > 0 && (
        <Card className="mb-4 p-3 flex flex-col gap-2 bg-yellow-50 border-yellow-200">
          <div className="font-semibold text-yellow-900 flex items-center gap-2 mb-1">
            <UserPlus className="w-4 h-4" /> Suggested Friends
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestedFriends.map(uid => {
              const isPending = friendsData?.sent?.some((req: any) => req.friendId === uid);
              return (
                <div key={String(uid)} className="flex items-center gap-2 bg-white rounded px-2 py-1 border border-yellow-100">
                  <span className="font-medium text-sm">User {String(uid).slice(0, 6)}</span>
                  {isPending ? (
                    <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium">Pending</span>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      disabled={addFriendMutation.isPending}
                      onClick={() => {
                        addFriendMutation.mutate(
                          { friendId: Number(uid) },
                          {
                            onSuccess: () => {
                              toast({ title: "Friend request sent!", description: "Your request was sent." });
                              notifyMutation.mutate({
                                userId: String(uid),
                                type: "friend_request",
                                title: "New Friend Request",
                                message: `${user?.firstName || user?.email || "A user"} sent you a friend request.`,
                              });
                            },
                          }
                        );
                      }}
                    >
                      Add Friend
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}
      {trendingPosts.length > 0 && (
        <Card className="mb-4 p-3 flex flex-col gap-2 bg-pink-50 border-pink-200">
          <div className="font-semibold text-pink-900 flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 text-xs font-bold animate-pulse">Trending</span>
            Trending Posts
          </div>
          <div className="flex flex-col gap-2">
            {trendingPosts.map(post => (
              <Card key={post.id} className="p-3 bg-white border border-pink-100 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center font-bold text-base">
                    {post.displayName ? post.displayName[0] : "?"}
                  </div>
                  <span className="font-medium text-sm">{post.displayName || `User ${post.userId}`}</span>
                  <span className="ml-2 text-xs text-gray-500">{new Date(post.createdAt).toLocaleString()}</span>
                </div>
                <div className="text-xs text-gray-700 line-clamp-2">{post.content?.slice(0, 100)}</div>
                <div className="flex gap-3 text-xs text-gray-500 mt-1">
                  <span>👍 {Object.values(post.reactions || {}).reduce((acc: number, users) => acc + (Array.isArray(users) ? users.length : 0), 0)}</span>
                  <span>💬 {post.commentsCount || 0}</span>
                  <span>🔄 {post.sharesCount || 0}</span>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      )}
      <Card className="p-4 mb-4">
        <form className="flex flex-col gap-2" onSubmit={handlePost} aria-label="Post composer">
          <div className="flex gap-2 items-center">
            <input
              className="flex-1 border rounded px-3 py-2 mr-2 bg-background"
              placeholder={isAuthenticated ? "What's on your mind? (Markdown supported)" : "Login to post"}
              value={content}
              onChange={e => setContent(e.target.value)}
              disabled={postMutation.isPending || !isAuthenticated}
              aria-label="Post content"
            />
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              disabled={postMutation.isPending || !isAuthenticated}
              aria-label="Upload image"
            />
            <Button type="submit" disabled={(!content.trim() && !image) || postMutation.isPending || !isAuthenticated} aria-label="Submit post">
              {postMutation.isPending ? "Posting..." : "Post"}
            </Button>
          </div>
          {imagePreview && (
            <div className="mt-2 flex items-center gap-2">
              <img src={imagePreview} alt="Preview" className="w-24 h-24 object-cover rounded border" />
              <Button type="button" size="sm" variant="outline" onClick={() => { setImage(null); setImagePreview(null); }}>Remove</Button>
            </div>
          )}
          {postMutation.error && (
            <div className="text-xs text-red-500 mt-2" role="alert">Error posting. Try again.</div>
          )}
        </form>
      </Card>
      {isLoading && <div>Loading feed...</div>}
      {error && <div className="text-red-500">Error loading feed.</div>}
      <div className="flex flex-col gap-4">
        {filteredFeed && filteredFeed.length === 0 && <div className="text-muted-foreground">No posts yet.</div>}
        {filteredFeed && filteredFeed.map((post: any) => (
          <Card key={post.id} className={`p-4 md:p-6 flex flex-col gap-2 md:gap-3 ${post.type === "share" ? "bg-blue-50 border-blue-200" : ""} md:rounded-lg md:shadow-sm md:border md:bg-white`} role="article" tabIndex={0} aria-label={post.type === "share" ? `Shared ${post.originalItemType}` : "Post"}>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-lg">
                {post.displayName ? post.displayName[0] : "?"}
              </div>
              <div className="font-semibold">{post.displayName || `User ${post.userId}`}
                {(() => {
                  const status = getFriendStatus(post.userId);
                  if (!status) return null;
                  if (status === "Friend") return <span className="ml-2 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">Friend</span>;
                  if (status === "Pending") return <span className="ml-2 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium">Pending</span>;
                  if (status === "Requested") return <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">Requested</span>;
                  return null;
                })()}
              </div>
              {(Object.values(post.reactions || {}).reduce((acc: number, users) => acc + (Array.isArray(users) ? users.length : 0), 0) > 10 || (post.commentsCount || 0) > 5) && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 text-xs font-bold animate-pulse">Trending</span>
              )}
              <span className="ml-2 text-xs text-gray-500">{new Date(post.createdAt).toLocaleString()}</span>
            </div>
            {post.image && (
              <img src={post.image} alt="Post attachment" className="w-full max-h-64 object-contain rounded border mb-2" />
            )}
            <div className="text-sm mt-1 break-words prose dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content || ""}</ReactMarkdown>
            </div>
            {post.type === "share" && (
              <div className="rounded-lg border border-blue-200 bg-blue-100 p-3 mt-2 flex flex-col gap-2">
                <div className="text-xs text-blue-900 font-semibold mb-1">Shared {post.originalItemType?.charAt(0).toUpperCase() + post.originalItemType?.slice(1)} #{post.originalItemId}</div>
                {post.comment && <div className="text-sm text-blue-900 mb-1">{post.comment}</div>}
                <Button
                  asChild
                  size="sm"
                  variant="secondary"
                  className="w-fit"
                  tabIndex={0}
                  aria-label="View original content"
                >
                  <a href={getOriginalUrl(post) || undefined} target="_blank" rel="noopener noreferrer" tabIndex={-1}>View original</a>
                </Button>
              </div>
            )}
            {(post.reactions || post.commentsCount || post.sharesCount) && (
              <div className="flex gap-4 items-center text-xs text-gray-500 mt-1">
                {post.reactions && Object.keys(post.reactions).length > 0 && (
                  <span>
                    {Object.values(post.reactions).reduce((acc: number, users) => acc + (Array.isArray(users) ? users.length : 0), 0)} Reactions
                  </span>
                )}
                {typeof post.commentsCount === 'number' && post.commentsCount > 0 && (
                  <span>{post.commentsCount} Comments</span>
                )}
                {typeof post.sharesCount === 'number' && post.sharesCount > 0 && (
                  <span>{post.sharesCount} Shares</span>
                )}
              </div>
            )}
            <div className="flex gap-2 md:gap-4 mt-3 items-center flex-wrap">
              {/* Render all reactions for this post */}
              {post.reactions && Object.keys(post.reactions).length > 0 && (
                <div className="flex gap-1 items-center">
                  {Object.entries(post.reactions).map(([emoji, users]) => {
                    if (!Array.isArray(users)) return null; // type guard
                    return (
                      <Button
                        key={emoji}
                        size="sm"
                        variant={getUserReaction(post) === emoji ? "default" : "ghost"}
                        onClick={() => handleReact(post, emoji)}
                        aria-label={`React with ${emoji}`}
                        className={getUserReaction(post) === emoji ? "border-2 border-blue-500" : ""}
                      >
                        {emoji} {users.length}
                      </Button>
                    );
                  })}
                </div>
              )}
              {/* Emoji picker trigger */}
              <div className="relative">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEmojiPickerOpen({ ...emojiPickerOpen, [post.id]: !emojiPickerOpen[post.id] })}
                  aria-label={getUserReaction(post) ? "Change reaction" : "Add reaction"}
                  tabIndex={0}
                >
                  {getUserReaction(post) ? "Change Reaction" : "Add Reaction"}
                </Button>
                {emojiPickerOpen[post.id] && (
                  <div className="absolute z-50 mt-2">
                    <Picker
                      data={emojiData}
                      onEmojiSelect={(emoji: any) => handleReact(post, emoji.native)}
                      theme="light"
                      previewPosition="none"
                      perLine={8}
                      maxFrequentRows={1}
                      searchPosition="none"
                      skinTonePosition="none"
                      emojiButtonSize={32}
                      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                    />
                  </div>
                )}
              </div>
              <Button size="sm" variant="ghost" onClick={() => setOpenComment({ ...openComment, [post.id]: !openComment[post.id] })} aria-label="Comment on post">
                💬 {post.commentsCount || 0}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => handleShare(post)} aria-label="Share post" tabIndex={0}>
                🔄 Share
              </Button>
            </div>
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
                />
                <Button size="sm" onClick={() => handleComment(post.id)} disabled={!commentText[post.id]?.trim() || commentMutation.isPending} aria-label="Submit comment">
                  {commentMutation.isPending ? "Posting..." : "Comment"}
                </Button>
              </div>
            )}
            {post.comments && post.comments.length > 0 && (
              <div className="mt-3 border-t pt-2">
                {post.comments.map((c: any) => (
                  <div key={c.id} className="text-xs mb-1 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center font-bold text-sm">
                      {c.displayName ? c.displayName[0] : "?"}
                    </div>
                    <span className="font-semibold">{c.displayName || `User ${c.userId}`}:</span> {c.content}
                  </div>
                ))}
              </div>
            )}
            <div className="text-xs text-muted-foreground mt-2">{new Date(post.createdAt).toLocaleString()}</div>
          </Card>
        ))}
      </div>
      {/* Share Modal */}
      {shareModal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-label="Share post modal">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-2">
            <h2 className="text-lg font-bold mb-2">Share Post</h2>
            <div className="mb-2 text-sm text-muted-foreground">Original: {shareModal.post?.content}</div>
            <form onSubmit={handleShareSubmit} className="flex flex-col gap-2">
              <textarea
                className="border rounded px-3 py-2"
                placeholder="Add a comment (optional)"
                value={shareComment}
                onChange={e => setShareComment(e.target.value)}
                rows={3}
                aria-label="Share comment"
              />
              <div className="flex gap-2 justify-end mt-2">
                <Button type="button" variant="outline" onClick={() => setShareModal({ open: false })} aria-label="Cancel share">
                  Cancel
                </Button>
                <Button type="submit" disabled={postMutation.isPending} aria-label="Submit share">
                  {postMutation.isPending ? "Sharing..." : "Share"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 