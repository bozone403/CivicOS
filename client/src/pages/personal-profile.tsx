import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Zap, Vote, MessageSquare, FileText, Users, Plus, Heart, Share, MessageCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

// Add UserStats interface
interface UserStats {
  trustScore?: number;
  civicLevel?: number;
  civicPoints?: number;
  voteCount?: number;
  discussionCount?: number;
  petitionCount?: number;
  contactCount?: number;
  recentActivity?: Array<{ description: string; date: string }>;
}

interface Post {
  id: string;
  content: string;
  userId: string;
  createdAt: string;
  likes: number;
  comments: number;
  shares: number;
  user: {
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  };
}

export default function PersonalProfile() {
  const { user: rawUser, isAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Extract userId from URL path
  const pathParts = location.split('/');
  const userIdFromUrl = pathParts[pathParts.length - 1];
  const isOwnProfile = !userIdFromUrl || userIdFromUrl === 'profile' || userIdFromUrl === rawUser?.id;
  
  // Use the URL userId or fall back to current user
  const targetUserId = isOwnProfile ? rawUser?.id : userIdFromUrl;
  
  // Fetch user data based on targetUserId
  const { data: profileUser, isLoading: isLoadingUser } = useQuery({
    queryKey: ['user-profile', targetUserId],
    queryFn: async () => {
      if (isOwnProfile) {
        return rawUser;
      } else {
        // Fetch other user's profile data
        const response = await apiRequest(`/api/social/users/${targetUserId}`, 'GET');
        return response;
      }
    },
    enabled: !!targetUserId,
  });
  
  const user = profileUser || rawUser;
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");

  // Fetch user's posts
  const { data: userPosts, isLoading: isLoadingPosts } = useQuery({
    queryKey: ['user-posts', targetUserId],
    queryFn: async () => {
      const response = await apiRequest(`/api/social/posts?userId=${targetUserId}`, 'GET');
      return response.posts || [];
    },
    enabled: !!targetUserId,
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (content: string) => {
      // Check if user is authenticated
      if (!isAuthenticated || !rawUser) {
        throw new Error("Please log in to create posts");
      }
      
      console.log('Sending post request with token:', localStorage.getItem('civicos-jwt') ? 'exists' : 'missing');
      
      const response = await apiRequest('/api/social/posts', 'POST', { 
        content,
        type: 'post',
        visibility: 'public',
        tags: []
      });
      
      console.log('Post response:', response);
      return response;
    },
    onSuccess: (data) => {
      console.log('Post created successfully:', data);
      setNewPostContent("");
      setShowCreatePost(false);
      queryClient.invalidateQueries({ queryKey: ['user-posts', targetUserId] });
      toast({
        title: "Post created!",
        description: "Your post has been shared with the community.",
      });
    },
    onError: (error: any) => {
      console.error('Post creation error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        isAuthenticated,
        rawUser: rawUser?.id,
        token: localStorage.getItem('civicos-jwt') ? 'exists' : 'missing'
      });
      toast({
        title: "Failed to create post",
        description: error.message || "Please check your connection and try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreatePost = () => {
    if (!newPostContent.trim()) {
      toast({
        title: "Empty post",
        description: "Please write something to share.",
        variant: "destructive",
      });
      return;
    }
    
    // Debug logging
    console.log('Creating post with:', {
      isAuthenticated,
      rawUser: rawUser?.id,
      content: newPostContent,
      token: localStorage.getItem('civicos-jwt') ? 'exists' : 'missing'
    });
    
    createPostMutation.mutate(newPostContent);
  };

  if (isLoadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-bold mb-2">Loading profile...</h2>
          <p className="text-gray-600">Fetching user information...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">User not found</h2>
          <p className="text-gray-600">The user you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => setLocation('/dashboard')} className="mt-4">
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Use UserStats as the generic type
  const { data: userStats } = useQuery<UserStats>({
    queryKey: ['/api/user/stats'],
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          {/* Cover Photo */}
          <div className="h-48 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 relative">
            <div className="absolute inset-0 bg-black bg-opacity-20"></div>
          </div>
          
          {/* Profile Info */}
          <div className="relative px-6 pb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end space-y-4 sm:space-y-0 sm:space-x-6">
              {/* Avatar */}
              <div className="relative -mt-16">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-4xl font-bold border-4 border-white shadow-lg">
                  {user?.profileImageUrl ? (
                    <img 
                      src={user.profileImageUrl} 
                      alt="Profile" 
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    user?.firstName?.[0] || user?.email?.[0] || "U"
                  )}
                </div>
              </div>
              
              {/* Name and Bio */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-4 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {user?.firstName && user?.lastName 
                      ? `${user.firstName} ${user.lastName}`
                      : (user?.email?.split('@')[0] || 'User')
                    }
                  </h1>
                  <Badge variant="outline" className="text-xs">
                    ID: {user?.id}
                  </Badge>
                  {isAuthenticated ? (
                    <Badge className="bg-green-100 text-green-800">
                      ✓ Logged In
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      ⚠ Not Logged In
                    </Badge>
                  )}
                </div>
                <p className="text-gray-600 mb-2">{user?.email}</p>
                <p className="text-gray-700">
                  {user?.bio || "No bio yet. Visit settings to add one!"}
                </p>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2">
                {isOwnProfile && (
                  <>
                    {!isAuthenticated ? (
                      <Button 
                        variant="outline" 
                        onClick={() => setLocation('/auth')}
                        className="flex items-center gap-2"
                      >
                        <MessageSquare className="h-4 w-4" />
                        Login to Post
                      </Button>
                    ) : (
                      <>
                        <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
                          <DialogTrigger asChild>
                            <Button className="flex items-center gap-2">
                              <Plus className="h-4 w-4" />
                              Create Post
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Create a Post</DialogTitle>
                              <DialogDescription>Share something with the CivicOS community</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <Textarea
                                value={newPostContent}
                                onChange={(e) => setNewPostContent(e.target.value)}
                                placeholder="What's on your mind?"
                                rows={4}
                              />
                            </div>
                            <div className="flex justify-end space-x-2 mt-6">
                              <Button variant="outline" onClick={() => setShowCreatePost(false)}>
                                Cancel
                              </Button>
                              <Button 
                                onClick={handleCreatePost}
                                disabled={createPostMutation.isPending}
                              >
                                {createPostMutation.isPending ? 'Posting...' : 'Post'}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            console.log('Auth Debug:', {
                              isAuthenticated,
                              rawUser: rawUser?.id,
                              token: localStorage.getItem('civicos-jwt') ? 'exists' : 'missing'
                            });
                            toast({
                              title: "Debug Info",
                              description: "Check browser console for authentication details",
                            });
                          }}
                        >
                          Debug Auth
                        </Button>
                      </>
                    )}
                  </>
                )}
                <Button 
                  variant="outline"
                  onClick={() => setLocation('/settings')}
                >
                  Settings
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {/* Profile Stats */}
          <Card className="bg-white shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span>Profile Stats</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Trust Score</span>
                <Badge variant="secondary">{userStats?.trustScore || '100.00'}%</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Civic Level</span>
                <div className="flex items-center space-x-1">
                  <Trophy className="h-4 w-4 text-amber-600" />
                  <span className="font-medium">{userStats?.civicLevel || 1}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Civic Points</span>
                <div className="flex items-center space-x-1">
                  <Zap className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">{userStats?.civicPoints || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Stats */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Civic Engagement</CardTitle>
              <CardDescription>Your participation in democratic processes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Vote className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Votes Cast</span>
                    </div>
                    <span className="font-medium">{userStats?.voteCount || 0}</span>
                  </div>
                  <Progress value={(userStats?.voteCount || 0) * 10} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">Discussions</span>
                    </div>
                    <span className="font-medium">{userStats?.discussionCount || 0}</span>
                  </div>
                  <Progress value={(userStats?.discussionCount || 0) * 5} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-purple-600" />
                      <span className="text-sm">Petitions Signed</span>
                    </div>
                    <span className="font-medium">{userStats?.petitionCount || 0}</span>
                  </div>
                  <Progress value={(userStats?.petitionCount || 0) * 15} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-orange-600" />
                      <span className="text-sm">Contacts Made</span>
                    </div>
                    <span className="font-medium">{userStats?.contactCount || 0}</span>
                  </div>
                  <Progress value={(userStats?.contactCount || 0) * 20} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User's Posts */}
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <span>{isOwnProfile ? 'Your Posts' : `${user?.firstName || 'User'}'s Posts`}</span>
            </CardTitle>
            <CardDescription>
              {isOwnProfile ? 'Your recent activity and posts' : 'Recent posts and activity'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingPosts ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading posts...</p>
              </div>
            ) : userPosts && userPosts.length > 0 ? (
              <div className="space-y-4">
                {userPosts.map((post: Post) => (
                  <div key={post.id} className="border rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={post.user.profileImageUrl} />
                        <AvatarFallback>
                          {post.user.firstName?.[0] || post.user.lastName?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-semibold">
                            {post.user.firstName} {post.user.lastName}
                          </span>
                          <span className="text-sm text-gray-500">
                            {new Date(post.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-700 mb-3">{post.content}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Heart className="h-4 w-4" />
                            <span>{post.likes}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MessageCircle className="h-4 w-4" />
                            <span>{post.comments}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Share className="h-4 w-4" />
                            <span>{post.shares}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {isOwnProfile ? 'No posts yet' : 'No posts found'}
                </h3>
                <p className="text-gray-600">
                  {isOwnProfile 
                    ? 'Start sharing your civic thoughts with the community!' 
                    : 'This user hasn\'t posted anything yet.'
                  }
                </p>
                {isOwnProfile && (
                  <Button 
                    onClick={() => setShowCreatePost(true)}
                    className="mt-4"
                  >
                    Create Your First Post
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 