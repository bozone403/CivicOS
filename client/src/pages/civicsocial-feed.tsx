import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
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
  AtSign,
  Plus,
  Search,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  CivicSocialLayout, 
  CivicSocialHeader, 
  CivicSocialSection, 
  CivicSocialList, 
  CivicSocialEmptyState, 
  CivicSocialLoadingState, 
  CivicSocialErrorState 
} from '@/components/CivicSocialLayout';
import { 
  CivicSocialCard, 
  CivicSocialPostCard 
} from '@/components/CivicSocialCard';

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
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State management
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState('all');
  const [filterVisibility, setFilterVisibility] = useState<'all' | 'public' | 'friends' | 'private'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'trending'>('latest');
  
  // Form state
  const [postContent, setPostContent] = useState('');
  const [postType, setPostType] = useState<'post' | 'share' | 'poll' | 'event'>('post');
  const [postVisibility, setPostVisibility] = useState<'public' | 'friends' | 'private'>('public');
  const [postTags, setPostTags] = useState<string[]>([]);
  const [postLocation, setPostLocation] = useState('');
  const [postMood, setPostMood] = useState('');
  const [postImage, setPostImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Fetch social feed
  const { data: feed, isLoading, error, refetch } = useQuery({
    queryKey: ['socialFeed', selectedTab, filterVisibility, sortBy, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams({
        tab: selectedTab,
        visibility: filterVisibility,
        sort: sortBy,
        ...(searchQuery && { q: searchQuery })
      });
      
      const response = await apiRequest(`/api/social/feed?${params}`);
      return response.feed || [];
    },
    staleTime: 30000, // 30 seconds
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (postData: CreatePostData) => {
      return await apiRequest('/api/social/posts', 'POST', postData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['socialFeed'] });
      setCreatePostOpen(false);
      resetForm();
      toast({
        title: "Post created!",
        description: "Your post has been shared successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating post",
        description: error.message || "Failed to create post. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Like post mutation
  const likePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      return await apiRequest(`/api/social/posts/${postId}/like`, 'POST');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['socialFeed'] });
    }
  });

  // Comment post mutation
  const commentPostMutation = useMutation({
    mutationFn: async ({ postId, content }: { postId: number; content: string }) => {
      return await apiRequest(`/api/social/posts/${postId}/comments`, 'POST', { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['socialFeed'] });
    }
  });

  // Share post mutation
  const sharePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      return await apiRequest(`/api/social/posts/${postId}/share`, 'POST');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['socialFeed'] });
      toast({
        title: "Post shared!",
        description: "Your post has been shared successfully.",
      });
    }
  });

  // Bookmark post mutation
  const bookmarkPostMutation = useMutation({
    mutationFn: async (postId: number) => {
      return await apiRequest(`/api/social/posts/${postId}/bookmark`, 'POST');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['socialFeed'] });
    }
  });

  // Handle post creation
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) return;

    const postData: CreatePostData = {
      content: postContent,
      type: postType,
      visibility: postVisibility,
      tags: postTags,
      location: postLocation,
      mood: postMood,
      ...(imagePreview && { imageUrl: imagePreview })
    };

    createPostMutation.mutate(postData);
  };

  // Handle post interactions
  const handleLikePost = (postId: number) => {
    likePostMutation.mutate(postId);
  };

  const handleCommentPost = (postId: number) => {
    // This would typically open a comment dialog
    // For now, we'll just show a toast
    toast({
      title: "Comment feature",
      description: "Comment functionality coming soon!",
    });
  };

  const handleSharePost = (postId: number) => {
    sharePostMutation.mutate(postId);
  };

  const handleBookmarkPost = (postId: number) => {
    bookmarkPostMutation.mutate(postId);
  };

  // Handle image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPostImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Reset form
  const resetForm = () => {
    setPostContent('');
    setPostType('post');
    setPostVisibility('public');
    setPostTags([]);
    setPostLocation('');
    setPostMood('');
    setPostImage(null);
    setImagePreview(null);
  };

  // Sidebar content
  const sidebar = (
    <>
      <CivicSocialSection title="Quick Actions">
        <div className="space-y-3">
          <Button 
            onClick={() => setCreatePostOpen(true)}
            className="w-full social-button-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Post
          </Button>
          
          <Button variant="outline" className="w-full">
            <Camera className="w-4 h-4 mr-2" />
            Share Photo
          </Button>
          
          <Button variant="outline" className="w-full">
            <Video className="w-4 h-4 mr-2" />
            Share Video
          </Button>
        </div>
      </CivicSocialSection>

      <CivicSocialSection title="Trending Topics">
        <div className="space-y-2">
          {['#CanadianPolitics', '#CivicEngagement', '#Democracy', '#VotingRights'].map((tag) => (
            <div key={tag} className="flex items-center justify-between p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
              <span className="text-sm font-medium">{tag}</span>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </div>
          ))}
        </div>
      </CivicSocialSection>

      <CivicSocialSection title="Online Friends">
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted transition-colors cursor-pointer">
              <div className="social-avatar-online w-8 h-8">
                <div className="w-full h-full rounded-full bg-social-primary flex items-center justify-center text-white text-xs font-medium">
                  U{i}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">User {i}</p>
                <p className="text-xs text-muted-foreground">Online</p>
              </div>
            </div>
          ))}
        </div>
      </CivicSocialSection>
    </>
  );

  // Header content
  const header = (
    <CivicSocialHeader
      title="CivicSocial Feed"
      subtitle="Stay connected with your civic community"
      actions={
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
          <Button
            onClick={() => setCreatePostOpen(true)}
            className="social-button-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Post
          </Button>
        </div>
      }
    />
  );

  // Filter controls
  const filterControls = (
    <div className="flex flex-col sm:flex-row gap-4 p-4 bg-card border border-border rounded-lg">
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      
      <div className="flex gap-2">
        <Select value={filterVisibility} onValueChange={(value: any) => setFilterVisibility(value)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Posts</SelectItem>
            <SelectItem value="public">Public</SelectItem>
            <SelectItem value="friends">Friends</SelectItem>
            <SelectItem value="private">Private</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="latest">Latest</SelectItem>
            <SelectItem value="popular">Popular</SelectItem>
            <SelectItem value="trending">Trending</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  // Loading state
  if (isLoading) {
    return (
      <CivicSocialLayout header={header} sidebar={sidebar}>
        <CivicSocialLoadingState 
          title="Loading your feed..."
          description="We're gathering the latest posts from your civic community."
        />
      </CivicSocialLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <CivicSocialLayout header={header} sidebar={sidebar}>
        <CivicSocialErrorState
          title="Failed to load feed"
          description="We couldn't load your social feed. Please check your connection and try again."
          retry={() => refetch()}
        />
      </CivicSocialLayout>
    );
  }

  // Empty state
  if (!feed || feed.length === 0) {
    return (
      <CivicSocialLayout header={header} sidebar={sidebar}>
        <CivicSocialEmptyState
          title="No posts yet"
          description="Be the first to share something with your civic community!"
          icon={<MessageSquare className="w-8 h-8" />}
          action={
            <Button onClick={() => setCreatePostOpen(true)} className="social-button-primary">
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Post
            </Button>
          }
        />
      </CivicSocialLayout>
    );
  }

  return (
    <CivicSocialLayout header={header} sidebar={sidebar}>
      <CivicSocialSection>
        {filterControls}
      </CivicSocialSection>

      <CivicSocialSection>
        <CivicSocialList>
          {feed.map((post: SocialPost) => (
            <CivicSocialPostCard
              key={post.id}
              post={post}
              onLike={handleLikePost}
              onComment={handleCommentPost}
              onShare={handleSharePost}
              onBookmark={handleBookmarkPost}
            />
          ))}
        </CivicSocialList>
      </CivicSocialSection>

      {/* Create Post Dialog */}
      <Dialog open={createPostOpen} onOpenChange={setCreatePostOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create a New Post</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleCreatePost} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="content">What's on your mind?</Label>
              <Textarea
                id="content"
                placeholder="Share your thoughts with the civic community..."
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                className="min-h-[120px]"
                required
              />
            </div>

            {imagePreview && (
              <div className="relative">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-full rounded-lg max-h-64 object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setPostImage(null);
                    setImagePreview(null);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Post Type</Label>
                <Select value={postType} onValueChange={(value: any) => setPostType(value)}>
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

              <div className="space-y-2">
                <Label htmlFor="visibility">Visibility</Label>
                <Select value={postVisibility} onValueChange={(value: any) => setPostVisibility(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="friends">Friends</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('image-upload')?.click()}
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Add Image
              </Button>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              
              <Button
                type="button"
                variant="outline"
                size="sm"
              >
                <MapPin className="w-4 h-4 mr-2" />
                Add Location
              </Button>
              
              <Button
                type="button"
                variant="outline"
                size="sm"
              >
                <Tag className="w-4 h-4 mr-2" />
                Add Tags
              </Button>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreatePostOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="social-button-primary"
                disabled={createPostMutation.isPending || !postContent.trim()}
              >
                {createPostMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Post
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </CivicSocialLayout>
  );
}

 