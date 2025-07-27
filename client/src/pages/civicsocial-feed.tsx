import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  MessageSquare, 
  Heart, 
  Share2, 
  MoreHorizontal, 
  Image as ImageIcon,
  MapPin,
  Tag,
  Smile,
  Send,
  Filter,
  TrendingUp,
  Users,
  Globe,
  Lock,
  Eye,
  EyeOff,
  Camera,
  Video,
  Link,
  BarChart3,
  Calendar,
  Clock,
  UserPlus,
  MessageCircle,
  ThumbsUp,
  MessageCircle as CommentIcon,
  Share,
  Bookmark,
  Flag,
  Edit,
  Trash2,
  Settings,
  Activity,
  Zap,
  Award,
  Star,
  TrendingDown,
  Users as GroupIcon,
  Hash,
  AtSign
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface SocialPost {
  id: number;
  userId: string;
  content: string;
  imageUrl?: string;
  type: 'post' | 'share' | 'poll' | 'event';
  visibility: 'public' | 'friends' | 'private';
  tags: string[];
  location?: string;
  mood?: string;
  originalItemId?: number;
  originalItemType?: string;
  comment?: string;
  createdAt: string;
  updatedAt: string;
  // User info
  user?: {
    id: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
    civicLevel?: string;
    isVerified?: boolean;
  };
  // Engagement stats
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
}

interface CreatePostData {
  content: string;
  imageUrl?: string;
  type: 'post' | 'share' | 'poll' | 'event';
  visibility: 'public' | 'friends' | 'private';
  tags: string[];
  location?: string;
  mood?: string;
}

export default function CivicSocialFeed() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState('all');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPost, setNewPost] = useState<CreatePostData>({
    content: '',
    type: 'post',
    visibility: 'public',
    tags: [],
  });
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    visibility: 'all',
    sortBy: 'recent',
  });

  // Fetch social posts
  const { data: posts, isLoading: isLoadingPosts } = useQuery<SocialPost[]>({
    queryKey: ['social-posts', activeTab, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        tab: activeTab,
        ...filters
      });
      const response = await apiRequest(`/api/social/posts?${params}`, 'GET');
      return response.posts || [];
    },
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (postData: CreatePostData) => {
      // Check if user is authenticated
      if (!currentUser) {
        throw new Error("Please log in to create posts");
      }
      
      return apiRequest('/api/social/posts', 'POST', postData);
    },
    onSuccess: () => {
      toast({
        title: "Post Created",
        description: "Your post has been published successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['social-posts'] });
      setShowCreatePost(false);
      setNewPost({
        content: '',
        type: 'post',
        visibility: 'public',
        tags: [],
      });
    },
    onError: (error: any) => {
      console.error('Post creation error:', error);
      toast({
        title: "Post Failed",
        description: error.message || "Failed to create post. Please check your connection and try again.",
        variant: "destructive",
      });
    },
  });

  // Like post mutation
  const likePostMutation = useMutation({
    mutationFn: async ({ postId, action }: { postId: number; action: 'like' | 'unlike' }) => {
      return apiRequest(`/api/social/posts/${postId}/like`, 'POST', { action });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-posts'] });
    },
    onError: (error: any) => {
      toast({
        title: "Action Failed",
        description: error.message || "Failed to perform action.",
        variant: "destructive",
      });
    },
  });

  // Comment on post mutation
  const commentPostMutation = useMutation({
    mutationFn: async ({ postId, content }: { postId: number; content: string }) => {
      return apiRequest(`/api/social/posts/${postId}/comments`, 'POST', { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-posts'] });
      toast({
        title: "Comment Added",
        description: "Your comment has been posted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Comment Failed",
        description: error.message || "Failed to post comment.",
        variant: "destructive",
      });
    },
  });

  // Share post mutation
  const sharePostMutation = useMutation({
    mutationFn: async ({ postId, comment }: { postId: number; comment?: string }) => {
      return apiRequest(`/api/social/posts/${postId}/share`, 'POST', { comment });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-posts'] });
      toast({
        title: "Post Shared",
        description: "Your post has been shared successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Share Failed",
        description: error.message || "Failed to share post.",
        variant: "destructive",
      });
    },
  });

  // Bookmark post mutation
  const bookmarkPostMutation = useMutation({
    mutationFn: async ({ postId, action }: { postId: number; action: 'bookmark' | 'unbookmark' }) => {
      return apiRequest(`/api/social/posts/${postId}/bookmark`, 'POST', { action });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-posts'] });
    },
    onError: (error: any) => {
      toast({
        title: "Bookmark Failed",
        description: error.message || "Failed to bookmark post.",
        variant: "destructive",
      });
    },
  });

  const handleCreatePost = () => {
    if (!newPost.content.trim()) {
      toast({
        title: "Post Required",
        description: "Please enter some content for your post.",
        variant: "destructive",
      });
      return;
    }

    createPostMutation.mutate(newPost);
  };

  const handleLikePost = (post: SocialPost) => {
    likePostMutation.mutate({
      postId: post.id,
      action: post.isLiked ? 'unlike' : 'like'
    });
  };

  const handleComment = (postId: number, content: string) => {
    if (!content.trim()) return;
    commentPostMutation.mutate({ postId, content });
  };

  const handleShare = (post: SocialPost) => {
    sharePostMutation.mutate({ postId: post.id });
  };

  const handleBookmark = (post: SocialPost) => {
    bookmarkPostMutation.mutate({
      postId: post.id,
      action: post.isBookmarked ? 'unbookmark' : 'bookmark'
    });
  };

  const getDisplayName = (user: any) => {
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
    if (user.firstName) return user.firstName;
    if (user.email) return user.email.split('@')[0];
    return 'Anonymous User';
  };

  const getCivicLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'champion': return 'bg-purple-500';
      case 'expert': return 'bg-blue-500';
      case 'advocate': return 'bg-green-500';
      case 'active': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const PostCard = ({ post }: { post: SocialPost }) => (
    <Card className="mb-6 hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        {/* Post Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={post.user?.profileImageUrl} />
              <AvatarFallback className="bg-blue-600">
                {getDisplayName(post.user)[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{getDisplayName(post.user)}</h3>
                {post.user?.isVerified && (
                  <Badge variant="secondary">
                    <Star className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
                <Badge className={`text-xs ${getCivicLevelColor(post.user?.civicLevel || '')}`}>
                  {post.user?.civicLevel || 'Registered'}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-3 h-3" />
                {formatTimeAgo(post.createdAt)}
                {post.visibility !== 'public' && (
                  <>
                    <span>•</span>
                    <Globe className="w-3 h-3" />
                    {post.visibility}
                  </>
                )}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>

        {/* Post Content */}
        <div className="mb-4">
          <p className="text-gray-900 whitespace-pre-wrap">{post.content}</p>
          
          {post.imageUrl && (
            <div className="mt-4">
              <img 
                src={post.imageUrl} 
                alt="Post image" 
                className="rounded-lg max-w-full h-auto"
              />
            </div>
          )}

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {post.tags.map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  <Hash className="w-3 h-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Location and Mood */}
          <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
            {post.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {post.location}
              </div>
            )}
            {post.mood && (
              <div className="flex items-center gap-1">
                <Smile className="w-3 h-3" />
                {post.mood}
              </div>
            )}
          </div>
        </div>

        {/* Engagement Stats */}
        <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-4">
            <span>{post.likesCount} likes</span>
            <span>{post.commentsCount} comments</span>
            <span>{post.sharesCount} shares</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleLikePost(post)}
            className={post.isLiked ? 'text-red-600' : ''}
          >
            <Heart className={`w-4 h-4 mr-2 ${post.isLiked ? 'fill-current' : ''}`} />
            Like
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedPost(post)}
          >
            <CommentIcon className="w-4 h-4 mr-2" />
            Comment
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleShare(post)}
          >
            <Share className="w-4 h-4 mr-2" />
            Share
          </Button>
          
          <Button variant="ghost" size="sm" onClick={() => handleBookmark(post)}>
            <Bookmark className="w-4 h-4 mr-2" />
            {post.isBookmarked ? 'Saved' : 'Save'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">CivicSocial Feed</h1>
        <p className="text-gray-600">Connect with fellow citizens and share your civic engagement</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed */}
        <div className="lg:col-span-2">
          {/* Create Post Button */}
          <div className="mb-6">
            {!currentUser ? (
              <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-yellow-600" />
                      <span className="text-yellow-800">Login to create posts</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.location.href = '/auth'}
                    >
                      Login
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Button 
                onClick={() => setShowCreatePost(true)}
                className="w-full sm:w-auto"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Create Post
              </Button>
            )}
          </div>

          {/* Feed Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All Posts</TabsTrigger>
              <TabsTrigger value="friends">Friends</TabsTrigger>
              <TabsTrigger value="trending">Trending</TabsTrigger>
              <TabsTrigger value="my-posts">My Posts</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              {isLoadingPosts ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading posts...</p>
                </div>
              ) : posts?.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                    <p className="text-gray-600">
                      Be the first to share your civic thoughts and experiences!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div>
                  {posts?.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="friends" className="mt-6">
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Friends' Posts</h3>
                <p className="text-gray-600">
                  Posts from your friends will appear here.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="trending" className="mt-6">
              <div className="text-center py-8">
                <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Trending Posts</h3>
                <p className="text-gray-600">
                  Most popular and engaging posts will appear here.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="my-posts" className="mt-6">
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">My Posts</h3>
                <p className="text-gray-600">
                  Your posts will appear here.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Posts Created</span>
                <span className="text-sm font-medium">0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Likes Given</span>
                <span className="text-sm font-medium">0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Comments Made</span>
                <span className="text-sm font-medium">0</span>
              </div>
            </CardContent>
          </Card>

          {/* Trending Topics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Trending Topics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">#CivicEngagement</span>
                  <Badge variant="secondary">Hot</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">#LocalPolitics</span>
                  <Badge variant="secondary">Trending</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">#CommunityAction</span>
                  <Badge variant="secondary">New</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Post Dialog */}
      <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Post</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                placeholder="What's on your mind?"
                value={newPost.content}
                onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Post Type</Label>
                <Select
                  value={newPost.type}
                  onValueChange={(value: 'post' | 'share' | 'poll' | 'event') => 
                    setNewPost({...newPost, type: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="post">Post</SelectItem>
                    <SelectItem value="share">Share</SelectItem>
                    <SelectItem value="poll">Poll</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="visibility">Visibility</Label>
                <Select
                  value={newPost.visibility}
                  onValueChange={(value: 'public' | 'friends' | 'private') => 
                    setNewPost({...newPost, visibility: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="friends">Friends Only</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                placeholder="civic, politics, community"
                value={newPost.tags.join(', ')}
                onChange={(e) => setNewPost({
                  ...newPost, 
                  tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location">Location (optional)</Label>
                <Input
                  id="location"
                  placeholder="City, Province"
                  value={newPost.location || ''}
                  onChange={(e) => setNewPost({...newPost, location: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="mood">Mood (optional)</Label>
                <Input
                  id="mood"
                  placeholder="Happy, Concerned, Excited"
                  value={newPost.mood || ''}
                  onChange={(e) => setNewPost({...newPost, mood: e.target.value})}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreatePost} disabled={createPostMutation.isPending}>
                {createPostMutation.isPending ? 'Creating...' : 'Create Post'}
              </Button>
              <Button variant="outline" onClick={() => setShowCreatePost(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Post Detail Dialog */}
      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Post Details</DialogTitle>
          </DialogHeader>
          {selectedPost && (
            <div className="space-y-4">
              <PostCard post={selectedPost} />
              
              {/* Comments Section */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-4">Comments</h4>
                <div className="space-y-4">
                  {/* Comment input */}
                  <div className="flex gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={currentUser?.profileImageUrl} />
                      <AvatarFallback className="bg-blue-600 text-xs">
                        {getDisplayName(currentUser)[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Input
                        placeholder="Write a comment..."
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                            handleComment(selectedPost.id, e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Comments list */}
                  <div className="text-center py-4 text-gray-500">
                    No comments yet. Be the first to comment!
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

 