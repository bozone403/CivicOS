import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  MessageCircle, 
  Reply, 
  Clock,
  Edit2,
  Trash2,
  Flag,
  Heart,
  MoreHorizontal,
  Send,
  User
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface Comment {
  id: number;
  content: string;
  userId: string;
  targetType: string;
  targetId: number;
  parentCommentId?: number;
  createdAt: string;
  updatedAt?: string;
  likeCount: number;
  dislikeCount: number;
  userVote?: 'like' | 'dislike' | null;
  canDelete: boolean;
  canEdit: boolean;
  user?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    profileImageUrl?: string;
  };
  replies?: Comment[];
}

interface CommentSystemProps {
  targetType: string;
  targetId: number;
  allowReplies?: boolean;
  allowEditing?: boolean;
  allowDeleting?: boolean;
  showUserAvatars?: boolean;
  maxDepth?: number;
}

export function CommentSystem({
  targetType,
  targetId,
  allowReplies = true,
  allowEditing = true,
  allowDeleting = true,
  showUserAvatars = true,
  maxDepth = 3
}: CommentSystemProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [newComment, setNewComment] = useState("");
  const [editingComment, setEditingComment] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");

  // Fetch comments
  const { data: comments = [], isLoading, refetch } = useQuery({
    queryKey: [`/api/social/comments/${targetType}/${targetId}`],
    queryFn: async () => {
      try {
        const response = await apiRequest(`/api/social/comments/${targetType}/${targetId}`, 'GET');
        return response || [];
      } catch (error) {
        // console.error removed for production
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest('/api/social/comments', 'POST', {
        content,
        targetType,
        targetId,
        parentCommentId: replyingTo || undefined
      });
      return response;
    },
    onSuccess: () => {
      setNewComment("");
      setReplyingTo(null);
      setReplyContent("");
      refetch();
      toast({
        title: "Comment posted!",
        description: "Your comment has been added successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to post comment",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  // Edit comment mutation
  const editCommentMutation = useMutation({
    mutationFn: async ({ commentId, content }: { commentId: number; content: string }) => {
      const response = await apiRequest(`/api/social/comments/${commentId}`, 'PUT', { content });
      return response;
    },
    onSuccess: () => {
      setEditingComment(null);
      setEditContent("");
      refetch();
      toast({
        title: "Comment updated!",
        description: "Your comment has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update comment",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      const response = await apiRequest(`/api/social/comments/${commentId}`, 'DELETE');
      return response;
    },
    onSuccess: () => {
      refetch();
      toast({
        title: "Comment deleted!",
        description: "Your comment has been removed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete comment",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  // Like/unlike comment mutation
  const likeCommentMutation = useMutation({
    mutationFn: async ({ commentId, reaction }: { commentId: number; reaction: 'like' | 'dislike' }) => {
      const response = await apiRequest(`/api/social/comments/${commentId}/like`, 'POST', { reaction });
      return response;
    },
    onSuccess: () => {
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to react to comment",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    if (replyingTo) {
      createCommentMutation.mutate(replyContent);
    } else {
      createCommentMutation.mutate(newComment);
    }
  };

  const handleEditComment = (commentId: number, currentContent: string) => {
    setEditingComment(commentId);
    setEditContent(currentContent);
  };

  const handleSaveEdit = () => {
    if (!editingComment || !editContent.trim()) return;
    editCommentMutation.mutate({ commentId: editingComment, content: editContent });
  };

  const handleDeleteComment = (commentId: number) => {
    if (confirm("Are you sure you want to delete this comment?")) {
      deleteCommentMutation.mutate(commentId);
    }
  };

  const handleReply = (commentId: number) => {
    setReplyingTo(commentId);
    setReplyContent("");
  };

  const handleLike = (commentId: number, currentReaction?: 'like' | 'dislike' | null) => {
    if (!isAuthenticated) {
      toast({
        title: "Login required",
        description: "Please log in to react to comments.",
        variant: "destructive",
      });
      return;
    }

    const newReaction = currentReaction === 'like' ? null : 'like';
    likeCommentMutation.mutate({ commentId, reaction: newReaction || 'like' });
  };

  const handleDislike = (commentId: number, currentReaction?: 'like' | 'dislike' | null) => {
    if (!isAuthenticated) {
      toast({
        title: "Login required",
        description: "Please log in to react to comments.",
        variant: "destructive",
      });
      return;
    }

    const newReaction = currentReaction === 'dislike' ? null : 'dislike';
    likeCommentMutation.mutate({ commentId, reaction: newReaction || 'dislike' });
  };

  const renderComment = (comment: Comment, depth: number = 0) => {
    if (depth > maxDepth) return null;

    const displayName = comment.user?.firstName && comment.user?.lastName 
      ? `${comment.user.firstName} ${comment.user.lastName}`
      : comment.user?.email || 'Anonymous';

    return (
      <Card key={comment.id} className={`mb-4 ${depth > 0 ? 'ml-8 border-l-2 border-gray-200' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            {showUserAvatars && (
              <Avatar className="w-8 h-8">
                <AvatarImage src={comment.user?.profileImageUrl} />
                <AvatarFallback>
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                <span className="font-medium text-sm text-gray-900">{displayName}</span>
                <Badge variant="outline" className="text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </Badge>
                {comment.updatedAt && comment.updatedAt !== comment.createdAt && (
                  <Badge variant="secondary" className="text-xs">Edited</Badge>
                )}
              </div>
              
              {editingComment === comment.id ? (
                <div className="space-y-2">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="Edit your comment..."
                    className="min-h-[80px]"
                  />
                  <div className="flex space-x-2">
                    <Button size="sm" onClick={handleSaveEdit}>
                      Save
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setEditingComment(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-700 mb-3">
                  {comment.content}
                </div>
              )}
              
              <div className="flex items-center space-x-4 text-sm">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLike(comment.id, comment.userVote)}
                  className={`flex items-center space-x-1 ${
                    comment.userVote === 'like' ? 'text-blue-600' : 'text-gray-500'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${comment.userVote === 'like' ? 'fill-current' : ''}`} />
                  <span>{comment.likeCount}</span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDislike(comment.id, comment.userVote)}
                  className={`flex items-center space-x-1 ${
                    comment.userVote === 'dislike' ? 'text-red-600' : 'text-gray-500'
                  }`}
                >
                  <span>{comment.dislikeCount}</span>
                </Button>
                
                {allowReplies && depth < maxDepth && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleReply(comment.id)}
                    className="flex items-center space-x-1 text-gray-500 hover:text-gray-700"
                  >
                    <Reply className="w-4 h-4" />
                    <span>Reply</span>
                  </Button>
                )}
                
                {(comment.canEdit || comment.canDelete) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {comment.canEdit && allowEditing && (
                        <DropdownMenuItem onClick={() => handleEditComment(comment.id, comment.content)}>
                          <Edit2 className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                      )}
                      {comment.canDelete && allowDeleting && (
                        <DropdownMenuItem 
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              
              {/* Reply form */}
              {replyingTo === comment.id && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <form onSubmit={(e) => { e.preventDefault(); handleSubmitComment(e); }}>
                    <Textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Write a reply..."
                      className="mb-2"
                    />
                    <div className="flex space-x-2">
                      <Button size="sm" type="submit" disabled={!replyContent.trim()}>
                        <Send className="w-4 h-4 mr-1" />
                        Reply
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setReplyingTo(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </div>
              )}
              
              {/* Render replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="mt-4">
                  {comment.replies.map((reply) => renderComment(reply, depth + 1))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* New comment form */}
      {isAuthenticated && (
        <form onSubmit={handleSubmitComment} className="space-y-3">
          <div className="flex items-start space-x-3">
            {showUserAvatars && (
              <Avatar className="w-8 h-8">
                <AvatarImage src={user?.profileImageUrl} />
                <AvatarFallback>
                  {user?.firstName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            )}
            
            <div className="flex-1">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="min-h-[100px] resize-none"
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-500">
                  {newComment.length}/1000 characters
                </span>
                <Button 
                  type="submit" 
                  size="sm" 
                  disabled={!newComment.trim() || createCommentMutation.isPending}
                >
                  {createCommentMutation.isPending ? (
                    <div className="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full mr-2" />
                  ) : (
                    <Send className="w-4 h-4 mr-1" />
                  )}
                  Post Comment
                </Button>
              </div>
            </div>
          </div>
        </form>
      )}
      
      {!isAuthenticated && (
        <div className="text-center py-6 bg-gray-50 rounded-lg">
          <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-600 mb-2">Please log in to comment</p>
          <Button variant="outline" size="sm">
            <User className="w-4 h-4 mr-2" />
            Login to Comment
          </Button>
        </div>
      )}

      {/* Comments list */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p>No comments yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          comments.map((comment: Comment) => renderComment(comment))
        )}
      </div>
    </div>
  );
}
