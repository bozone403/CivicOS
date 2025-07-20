import React, { useState } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useCivicSocialFeed, useCivicSocialPost, useCivicSocialLike, useCivicSocialComment, useCivicSocialNotify } from "../hooks/useCivicSocial";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/use-toast";

export default function CivicSocialFeed() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const token = localStorage.getItem("token") || "";
  const { data: feed, isLoading, error } = useCivicSocialFeed(token);
  const postMutation = useCivicSocialPost(token);
  const likeMutation = useCivicSocialLike(token);
  const commentMutation = useCivicSocialComment(token);
  const notifyMutation = useCivicSocialNotify(token);
  const [content, setContent] = useState("");
  const [openComment, setOpenComment] = useState<{ [postId: number]: boolean }>({});
  const [commentText, setCommentText] = useState<{ [postId: number]: string }>({});
  const { toast } = useToast();
  const [shareModal, setShareModal] = useState<{ open: boolean; post?: any }>({ open: false });
  const [shareComment, setShareComment] = useState("");

  const displayName = user ? (user.firstName || "") + (user.lastName ? " " + user.lastName : "") || user.email || "Anonymous" : "Anonymous";

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    postMutation.mutate({ content, userId: user?.id, displayName });
    setContent("");
  };

  const handleLike = (postId: number) => {
    const post = feed?.find((p: any) => p.id === postId);
    likeMutation.mutate(postId, {
      onSuccess: () => {
        if (post && user?.id !== post.userId) {
          notifyMutation.mutate({
            userId: post.userId,
            type: "like",
            title: "Your post was liked",
            message: `${displayName} liked your post.`,
            link: `/civicsocial/feed#post-${postId}`,
          });
        }
      },
    });
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

  if (authLoading) return <div>Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <Card className="p-4 mb-4">
        <form className="flex gap-2 items-center" onSubmit={handlePost} aria-label="Post composer">
          <input
            className="flex-1 border rounded px-3 py-2 mr-2 bg-background"
            placeholder={isAuthenticated ? "What's on your mind?" : "Login to post"}
            value={content}
            onChange={e => setContent(e.target.value)}
            disabled={postMutation.isPending || !isAuthenticated}
            aria-label="Post content"
          />
          <Button type="submit" disabled={!content.trim() || postMutation.isPending || !isAuthenticated} aria-label="Submit post">
            {postMutation.isPending ? "Posting..." : "Post"}
          </Button>
        </form>
        {postMutation.error && (
          <div className="text-xs text-red-500 mt-2" role="alert">Error posting. Try again.</div>
        )}
      </Card>
      {isLoading && <div>Loading feed...</div>}
      {error && <div className="text-red-500">Error loading feed.</div>}
      <div className="flex flex-col gap-4">
        {feed && feed.length === 0 && <div className="text-muted-foreground">No posts yet.</div>}
        {feed && feed.map((post: any) => (
          <Card key={post.id} className="p-4 md:p-6 flex flex-col gap-2 md:gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-lg">
                {post.displayName ? post.displayName[0] : "?"}
              </div>
              <div className="font-semibold">{post.displayName || `User ${post.userId}`}</div>
            </div>
            <div className="text-sm mt-1 break-words">{post.content || <span className="italic text-muted-foreground">(no content)</span>}</div>
            {post.type === "share" && (
              <div className="text-xs mt-2 text-muted-foreground">Shared {post.originalItemType} #{post.originalItemId}: {post.comment}</div>
            )}
            <div className="flex gap-2 md:gap-4 mt-3 items-center flex-wrap">
              <Button size="sm" variant="ghost" onClick={() => handleLike(post.id)} disabled={likeMutation.isPending} aria-label="Like post">
                👍 {post.likesCount || 0}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setOpenComment({ ...openComment, [post.id]: !openComment[post.id] })} aria-label="Comment on post">
                💬 {post.commentsCount || 0}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => handleShare(post)} aria-label="Share post">
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