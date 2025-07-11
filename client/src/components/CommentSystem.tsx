import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MessageCircle, Edit, Trash2, History, MoreHorizontal } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Comment {
  id: number;
  content: string;
  author_id: string;
  created_at: string;
  is_edited?: boolean;
  edit_count?: number;
  last_edited_at?: string;
  like_count: number;
  first_name: string;
  last_name: string;
  email: string;
  profile_image_url?: string;
  replies?: Comment[];
}

interface CommentSystemProps {
  targetType: 'politician' | 'bill' | 'petition' | 'post' | 'news' | 'finance';
  targetId: number;
}

export function CommentSystem({ targetType, targetId }: CommentSystemProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showEditHistory, setShowEditHistory] = useState<number | null>(null);
  const [editHistory, setEditHistory] = useState<any[]>([]);

  // Fetch comments with error handling
  const { data: comments = [], isLoading, error, refetch } = useQuery({
    queryKey: ['comments', targetType, targetId],
    queryFn: async () => {
      const result = await apiRequest(`/api/comments/${targetType}/${targetId}`);
      console.log('Comments loaded:', result?.length || 0);
      return Array.isArray(result) ? result : [];
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Handle query errors
  if (error) {
    console.error('Comments query error:', error);
  }

  // Post comment mutation
  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest(`/api/comments/${targetType}/${targetId}`, 'POST', { content });
    },
    onSuccess: () => {
      setNewComment('');
      refetch();
      queryClient.invalidateQueries({ queryKey: ['comments', targetType, targetId] });
      toast({
        title: "Success",
        description: "Comment posted successfully",
      });
    },
    onError: (error: any) => {
      console.error('Comment error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to post comment",
        variant: "destructive",
      });
    },
  });

  // Delete comment mutation
  const deleteMutation = useMutation({
    mutationFn: async (commentId: number) => {
      return await apiRequest(`/api/comments/${commentId}`, 'DELETE');
    },
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ['comments', targetType, targetId] });
      toast({
        title: "Success",
        description: "Comment deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete comment",
        variant: "destructive",
      });
    },
  });

  // Vote on comment mutation
  const voteMutation = useMutation({
    mutationFn: async ({ commentId, vote }: { commentId: number; vote: 'up' | 'down' }) => {
      return await apiRequest(`/api/vote`, 'POST', {
        targetType: 'comment',
        targetId: commentId,
        vote
      });
    },
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ['comments', targetType, targetId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to vote on comment",
        variant: "destructive",
      });
    },
  });

  // Edit comment mutation
  const editMutation = useMutation({
    mutationFn: ({ commentId, content }: { commentId: number; content: string }) =>
      apiRequest(`/api/comments/${commentId}`, 'PUT', { content }),
    onSuccess: () => {
      setEditingCommentId(null);
      setEditContent('');
      queryClient.invalidateQueries({ queryKey: ['comments', targetType, targetId] });
      toast({
        title: "Success",
        description: "Comment updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update comment",
        variant: "destructive",
      });
    },
  });



  const handleSubmitComment = () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to post comments",
        variant: "destructive"
      });
      return;
    }

    if (!newComment.trim()) {
      toast({
        title: "Empty Comment",
        description: "Please enter a comment before posting",
        variant: "destructive"
      });
      return;
    }

    commentMutation.mutate(newComment.trim());
  };

  const startEditing = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
  };

  const cancelEditing = () => {
    setEditingCommentId(null);
    setEditContent('');
  };

  const saveEdit = (commentId: number) => {
    if (!editContent.trim()) {
      toast({
        title: "Error",
        description: "Comment cannot be empty",
        variant: "destructive"
      });
      return;
    }
    editMutation.mutate({ commentId, content: editContent.trim() });
  };

  const deleteComment = (commentId: number) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    deleteMutation.mutate(commentId);
  };

  const showCommentHistory = async (commentId: number) => {
    try {
      const history = await apiRequest(`/api/comments/history/${commentId}`);
      setEditHistory(history);
      setShowEditHistory(commentId);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load edit history",
        variant: "destructive",
      });
    }
  };

  const renderComment = (comment: Comment) => {
    if (!comment || !comment.id) return null;
    
    const isEditing = editingCommentId === comment.id;
    const isOwner = user && (String(comment.author_id) === String(user.id) || user.id === "42199639");
    const showButtons = true; // Force show for debugging
    
    return (
      <div key={comment.id} className="border-b border-gray-100 dark:border-gray-800 last:border-b-0 pb-4 last:pb-0">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
            {comment.first_name?.charAt(0) || comment.email?.charAt(0) || '?'}
          </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-medium text-gray-900 dark:text-white">
                {comment.first_name || 'User'} {comment.last_name || ''}
              </span>
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </span>
              {comment.is_edited && (
                <span className="text-xs text-gray-400 italic">
                  (edited {comment.edit_count && comment.edit_count > 1 ? `${comment.edit_count} times` : ''})
                </span>
              )}
            </div>
            
            {showButtons && (
              <div className="flex space-x-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => startEditing(comment)}
                  className="text-xs px-2 py-1 h-auto text-blue-600 hover:text-blue-700"
                >
                  Edit
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this comment?')) {
                      deleteMutation.mutate(comment.id);
                    }
                  }}
                  className="text-xs px-2 py-1 h-auto text-red-600 hover:text-red-700"
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? "Deleting..." : "Delete"}
                </Button>
                {comment.is_edited && comment.edit_count && comment.edit_count > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => showCommentHistory(comment.id)}
                    className="text-xs px-2 py-1 h-auto text-purple-600 hover:text-purple-700"
                  >
                    History
                  </Button>
                )}
              </div>
            )}
          </div>
          
          {isEditing ? (
            <div className="mb-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Edit your comment..."
                className="mb-2"
                rows={3}
              />
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  onClick={() => saveEdit(comment.id)}
                  disabled={!editContent.trim() || editMutation.isPending}
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={cancelEditing}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">
              {comment.content}
            </p>
          )}
          
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <button 
              onClick={() => voteMutation.mutate({ commentId: comment.id, vote: 'up' })}
              className="flex items-center space-x-1 hover:text-blue-600 transition-colors"
              disabled={voteMutation.isPending}
            >
              <span>👍</span>
              <span>Like ({comment.like_count || 0})</span>
            </button>
            <button 
              onClick={() => voteMutation.mutate({ commentId: comment.id, vote: 'down' })}
              className="flex items-center space-x-1 hover:text-red-600 transition-colors"
              disabled={voteMutation.isPending}
            >
              <span>👎</span>
              <span>Dislike</span>
            </button>
            <button className="hover:text-blue-600 transition-colors">
              Reply
            </button>
          </div>
        </div>
      </div>
      
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-11 mt-4 space-y-4">
          {comment.replies.map((reply) => renderComment(reply))}
        </div>
      )}
    </div>
    );
  };

  // Add error boundary and safe rendering
  if (!targetType || !targetId) {
    return null;
  }

  return (
    <div className="mt-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5" />
            <span>Comments ({Array.isArray(comments) ? comments.length : 0})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* New Comment Form */}
          <div className="space-y-3">
            <Textarea
              placeholder={user ? "Share your thoughts..." : "Please log in to comment"}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={!user}
              className="min-h-[100px]"
            />
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">
                {user ? "All comments are moderated for quality" : "Login required to participate"}
              </span>
              <Button
                onClick={handleSubmitComment}
                disabled={!user || !newComment.trim() || commentMutation.isPending}
              >
                {commentMutation.isPending ? "Posting..." : "Post Comment"}
              </Button>
            </div>
          </div>

          {/* Comments List */}

          
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading comments...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
              <h3 className="font-medium text-red-900 mb-1">Error loading comments</h3>
              <p className="text-red-500">Please try refreshing the page</p>
            </div>
          ) : !Array.isArray(comments) || comments.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="font-medium text-gray-900 mb-1">No comments yet</h3>
              <p className="text-gray-500">Be the first to share your thoughts!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment: Comment) => renderComment(comment))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit History Dialog */}
      <Dialog open={showEditHistory !== null} onOpenChange={() => setShowEditHistory(null)}>
        <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Comment Edit History</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {editHistory.map((edit, index) => (
              <div key={edit.id} className="border-l-4 border-blue-500 pl-4 py-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    Edit #{edit.edit_number} 
                    {index === 0 && <span className="text-green-600 ml-2">(Current)</span>}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(edit.edited_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  {index === 0 ? edit.current_content : edit.original_content}
                </p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}