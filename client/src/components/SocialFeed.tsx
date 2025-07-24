import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  MessageCircle, 
  Heart, 
  Share2, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Reply,
  Send,
  Image as ImageIcon,
  Smile
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface SocialPost {
  id: number;
  content: string;
  imageUrl?: string;
  type: string;
  originalItemId?: number;
  originalItemType?: string;
  comment?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  likeCount: number;
  commentCount: number;
  isLiked?: boolean;
}

interface SocialComment {
  id: number;
  content: string;
  parentCommentId?: number;
  createdAt: string;
  updatedAt: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  likeCount: number;
  isLiked?: boolean;
}

export function SocialFeed() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [newPostContent, setNewPostContent] = useState("");
  const [newCommentContent, setNewCommentContent] = useState("");
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<SocialPost | null>(null);
  const [editingComment, setEditingComment] = useState<SocialComment | null>(null);
  const [replyToComment, setReplyToComment] = useState<SocialComment | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch social posts
  const { data: posts = [], isLoading } = useQuery<SocialPost[]>({
    queryKey: ["/api/social/posts"],
    queryFn: () => apiRequest("/api/social/posts", "GET"),
    enabled: isAuthenticated,
  });

  // Fetch comments for selected post
  const { data: comments = [] } = useQuery<SocialComment[]>({
    queryKey: ["/api/social/posts", selectedPost?.id, "comments"],
    queryFn: () => apiRequest(`/api/social/posts/${selectedPost?.id}/comments`, "GET"),
    enabled: !!selectedPost && isAuthenticated,
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (data: { content: string; imageUrl?: string }) => {
      return apiRequest("/api/social/posts", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social/posts"] });
      setNewPostContent("");
      setImageUrl("");
      setIsCreatePostOpen(false);
      toast({
        title: "Post created!",
        description: "Your post has been shared successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating post",
        description: error.message || "Failed to create post. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update post mutation
  const updatePostMutation = useMutation({
    mutationFn: async ({ postId, data }: { postId: number; data: { content: string; imageUrl?: string } }) => {
      return apiRequest(`/api/social/posts/${postId}`, "PUT", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social/posts"] });
      setEditingPost(null);
      toast({
        title: "Post updated!",
        description: "Your post has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating post",
        description: error.message || "Failed to update post. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      return apiRequest(`/api/social/posts/${postId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social/posts"] });
      toast({
        title: "Post deleted!",
        description: "Your post has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting post",
        description: error.message || "Failed to delete post. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: async ({ postId, content, parentCommentId }: { postId: number; content: string; parentCommentId?: number }) => {
      return apiRequest(`/api/social/posts/${postId}/comments`, "POST", { content, parentCommentId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social/posts", selectedPost?.id, "comments"] });
      setNewCommentContent("");
      setReplyToComment(null);
      toast({
        title: "Comment posted!",
        description: "Your comment has been posted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error posting comment",
        description: error.message || "Failed to post comment. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update comment mutation
  const updateCommentMutation = useMutation({
    mutationFn: async ({ commentId, content }: { commentId: number; content: string }) => {
      return apiRequest(`/api/social/comments/${commentId}`, "PUT", { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social/posts", selectedPost?.id, "comments"] });
      setEditingComment(null);
      toast({
        title: "Comment updated!",
        description: "Your comment has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating comment",
        description: error.message || "Failed to update comment. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      return apiRequest(`/api/social/comments/${commentId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social/posts", selectedPost?.id, "comments"] });
      toast({
        title: "Comment deleted!",
        description: "Your comment has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting comment",
        description: error.message || "Failed to delete comment. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Like/unlike mutation
  const likeMutation = useMutation({
    mutationFn: async ({ postId, commentId }: { postId?: number; commentId?: number }) => {
      return apiRequest("/api/social/like", "POST", { postId, commentId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social/posts"] });
      if (selectedPost) {
        queryClient.invalidateQueries({ queryKey: ["/api/social/posts", selectedPost.id, "comments"] });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to like/unlike. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreatePost = () => {
    if (!newPostContent.trim() && !imageUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter some content or an image URL.",
        variant: "destructive",
      });
      return;
    }
    createPostMutation.mutate({ content: newPostContent, imageUrl: imageUrl || undefined });
  };

  const handleUpdatePost = (post: SocialPost) => {
    if (!editingPost) return;
    updatePostMutation.mutate({
      postId: post.id,
      data: { content: editingPost.content, imageUrl: editingPost.imageUrl }
    });
  };

  const handleDeletePost = (postId: number) => {
    if (confirm("Are you sure you want to delete this post?")) {
      deletePostMutation.mutate(postId);
    }
  };

  const handleCreateComment = () => {
    if (!selectedPost || !newCommentContent.trim()) return;
    createCommentMutation.mutate({
      postId: selectedPost.id,
      content: newCommentContent,
      parentCommentId: replyToComment?.id
    });
  };

  const handleUpdateComment = (comment: SocialComment) => {
    if (!editingComment) return;
    updateCommentMutation.mutate({
      commentId: comment.id,
      content: editingComment.content
    });
  };

  const handleDeleteComment = (commentId: number) => {
    if (confirm("Are you sure you want to delete this comment?")) {
      deleteCommentMutation.mutate(commentId);
    }
  };

  const handleLike = (postId?: number, commentId?: number) => {
    likeMutation.mutate({ postId, commentId });
  };

  const getUserDisplayName = (post: SocialPost) => {
    if (post.firstName && post.lastName) {
      return `${post.firstName} ${post.lastName}`;
    }
    return post.userId;
  };

  const getUserInitials = (post: SocialPost) => {
    if (post.firstName && post.lastName) {
      return `${post.firstName[0]}${post.lastName[0]}`;
    }
    return post.userId.substring(0, 2).toUpperCase();
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Sign in to view the social feed</h3>
              <p className="text-gray-600">Join the conversation and connect with other citizens.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">CivicSocial Feed</h1>
        <p className="text-gray-600">Share your thoughts and engage with the community</p>
      </div>

      {/* Create Post */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.profileImageUrl} />
              <AvatarFallback>
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                placeholder="What's on your mind?"
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                className="min-h-[100px] resize-none"
                ref={textareaRef}
              />
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCreatePostOpen(true)}
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Add Image
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                  >
                    <Smile className="w-4 h-4 mr-2" />
                    Emoji
                  </Button>
                </div>
                <Button
                  onClick={handleCreatePost}
                  disabled={createPostMutation.isPending || (!newPostContent.trim() && !imageUrl.trim())}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Post
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts Feed */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="animate-pulse space-y-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                <p className="text-gray-600">Be the first to share something!</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          posts.map((post) => (
            <Card key={post.id}>
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={post.profileImageUrl} />
                      <AvatarFallback>{getUserInitials(post)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-900">{getUserDisplayName(post)}</p>
                      <p className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  {post.userId === user?.id && (
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingPost(post)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePost(post.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                {post.content && (
                  <p className="text-gray-900 mb-4">{post.content}</p>
                )}
                
                {post.imageUrl && (
                  <img 
                    src={post.imageUrl} 
                    alt="Post image" 
                    className="w-full h-64 object-cover rounded-lg mb-4"
                  />
                )}

                {post.type === 'share' && post.comment && (
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <p className="text-sm text-gray-600">{post.comment}</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLike(post.id)}
                      className={post.isLiked ? "text-red-500" : ""}
                    >
                      <Heart className={`w-4 h-4 mr-2 ${post.isLiked ? "fill-current" : ""}`} />
                      {post.likeCount}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedPost(post);
                        setIsCommentDialogOpen(true);
                      }}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      {post.commentCount}
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Post Dialog */}
      <Dialog open={isCreatePostOpen} onOpenChange={setIsCreatePostOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="What's on your mind?"
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              className="min-h-[120px]"
            />
            <div className="space-y-2">
              <label className="text-sm font-medium">Image URL (optional)</label>
              <input
                type="url"
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreatePostOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreatePost}>
                Post
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Comments Dialog */}
      <Dialog open={isCommentDialogOpen} onOpenChange={setIsCommentDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Comments</DialogTitle>
          </DialogHeader>
          
          {selectedPost && (
            <div className="space-y-4">
              {/* Post preview */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={selectedPost.profileImageUrl} />
                      <AvatarFallback>{getUserInitials(selectedPost)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{getUserDisplayName(selectedPost)}</p>
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(selectedPost.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  {selectedPost.content && <p className="text-sm">{selectedPost.content}</p>}
                </CardContent>
              </Card>

              {/* Comments */}
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-3">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={comment.profileImageUrl} />
                      <AvatarFallback>
                        {comment.firstName?.[0]}{comment.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-sm">
                            {comment.firstName && comment.lastName 
                              ? `${comment.firstName} ${comment.lastName}` 
                              : comment.userId}
                          </p>
                          {comment.userId === user?.id && (
                            <div className="flex items-center space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingComment(comment)}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteComment(comment.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                        {editingComment?.id === comment.id ? (
                          <div className="space-y-2">
                            <Textarea
                              value={editingComment.content}
                              onChange={(e) => setEditingComment({ ...editingComment, content: e.target.value })}
                              className="min-h-[80px]"
                            />
                            <div className="flex space-x-2">
                              <Button size="sm" onClick={() => handleUpdateComment(comment)}>
                                Save
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingComment(null)}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm">{comment.content}</p>
                            <div className="flex items-center space-x-4 mt-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleLike(undefined, comment.id)}
                                className={comment.isLiked ? "text-red-500" : ""}
                              >
                                <Heart className={`w-3 h-3 mr-1 ${comment.isLiked ? "fill-current" : ""}`} />
                                {comment.likeCount}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setReplyToComment(comment)}
                              >
                                <Reply className="w-3 h-3 mr-1" />
                                Reply
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add comment */}
              <div className="space-y-2">
                {replyToComment && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-600">
                      Replying to {replyToComment.firstName && replyToComment.lastName 
                        ? `${replyToComment.firstName} ${replyToComment.lastName}` 
                        : replyToComment.userId}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReplyToComment(null)}
                    >
                      Cancel reply
                    </Button>
                  </div>
                )}
                <div className="flex space-x-2">
                  <Textarea
                    placeholder={replyToComment ? "Write a reply..." : "Write a comment..."}
                    value={newCommentContent}
                    onChange={(e) => setNewCommentContent(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleCreateComment}
                    disabled={!newCommentContent.trim()}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 