import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Calendar, 
  MapPin, 
  Mail, 
  Globe, 
  Share2, 
  Users, 
  MessageSquare,
  Heart,
  Activity,
  Award,
  Star,
  ExternalLink
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { UnifiedSocialPost } from '@/components/UnifiedSocialPost';
import { useCivicSocialFollow } from '@/hooks/useCivicSocial';

interface UserProfile {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email: string;
  bio?: string;
  profileImageUrl?: string;
  civicLevel?: string;
  isVerified?: boolean;
  location?: string;
  joinDate: string;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  civicPoints: number;
  achievements: Array<{
    id: number;
    name: string;
    description: string;
    icon: string;
    earnedAt: string;
  }>;
}

interface SocialPost {
  id: number;
  content: string;
  imageUrl?: string;
  type: string;
  visibility: string;
  tags: string[];
  location?: string;
  mood?: string;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isLiked: boolean;
  user: {
    id: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
  };
}

export default function PublicProfile() {
  const [location] = useLocation();
  const [, navigate] = useLocation();
  const username = location.split('/').pop(); // Extract username from URL
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('posts');
  const followMutation = useCivicSocialFollow();

  // Fetch user profile
  const { data: profile, isLoading: isLoadingProfile } = useQuery<UserProfile>({
    queryKey: ['user-profile', username],
    queryFn: async () => {
      const response = await apiRequest(`/api/users/profile/${username}`, 'GET');
      return response.profile;
    },
    enabled: !!username,
  });

  // Fetch user posts
  const { data: posts, isLoading: isLoadingPosts } = useQuery<SocialPost[]>({
    queryKey: ['user-posts', username],
    queryFn: async () => {
      const response = await apiRequest(`/api/social/posts/user/${username}`, 'GET');
      return response.posts || [];
    },
    enabled: !!username,
  });

  // Fetch user achievements
  const { data: achievements } = useQuery({
    queryKey: ['user-achievements', username],
    queryFn: async () => {
      const response = await apiRequest(`/api/users/${username}/achievements`, 'GET');
      return response.achievements || [];
    },
    enabled: !!username,
  });

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/profile/${username}`;
    const shareText = `Check out ${profile?.firstName || profile?.username}'s profile on CivicOS`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${profile?.firstName || profile?.username}'s Profile`,
          text: shareText,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        toast({
          title: "Link copied!",
          description: "Profile link has been copied to your clipboard.",
        });
      }
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const getDisplayName = () => {
    if (profile?.firstName && profile?.lastName) {
      return `${profile.firstName} ${profile.lastName}`;
    }
    if (profile?.firstName) return profile.firstName;
    if (profile?.username) return profile.username;
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoadingProfile) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-12">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Profile Not Found</h2>
          <p className="text-gray-600">The user profile you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Profile Header */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src={profile.profileImageUrl} />
                <AvatarFallback className="bg-blue-600 text-2xl">
                  {getDisplayName()[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold">{getDisplayName()}</h1>
                  {profile.isVerified && (
                    <Badge variant="secondary">
                      <Star className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                  <Badge className={`text-xs ${getCivicLevelColor(profile.civicLevel || '')}`}>
                    {profile.civicLevel || 'Registered'}
                  </Badge>
                </div>
                
                <p className="text-gray-600">@{profile.username}</p>
                
                {profile.bio && (
                  <p className="text-gray-700 max-w-md">{profile.bio}</p>
                )}
                
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  {profile.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {profile.location}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Joined {formatDate(profile.joinDate)}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Share Profile
              </Button>
              {currentUser?.id !== profile.id && (
                <>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => navigate(`/civicsocial/messages?recipientId=${encodeURIComponent(profile.id)}`)}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => followMutation.mutate({ followingId: profile.id }, {
                      onSuccess: () => toast({ title: 'Followed', description: `You are now following @${profile.username}` }),
                      onError: (e: any) => toast({ title: 'Follow failed', description: e?.message || 'Could not follow user', variant: 'destructive' })
                    })}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Follow
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{profile.postsCount}</div>
            <div className="text-sm text-gray-600">Posts</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{profile.followersCount}</div>
            <div className="text-sm text-gray-600">Followers</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{profile.followingCount}</div>
            <div className="text-sm text-gray-600">Following</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{profile.civicPoints}</div>
            <div className="text-sm text-gray-600">Civic Points</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-6">
          <div className="space-y-6">
            {/* Create Post (if viewing own profile) */}
            {currentUser?.id === profile.id && (
              <UnifiedSocialPost 
                placeholder={`What's on your mind, ${profile.firstName || profile.username}?`}
                onPostCreated={() => {
                  // Refetch posts
                  window.location.reload();
                }}
              />
            )}

            {/* Posts List */}
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
                    {currentUser?.id === profile.id 
                      ? "Share your first post to get started!"
                      : `${profile.firstName || profile.username} hasn't posted anything yet.`
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {posts?.map((post) => (
                  <Card key={post.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={post.user.profileImageUrl} />
                          <AvatarFallback className="bg-blue-600">
                            {post.user.firstName?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold">
                              {post.user.firstName} {post.user.lastName}
                            </span>
                            <span className="text-sm text-gray-500">
                              {formatDate(post.createdAt)}
                            </span>
                          </div>
                          
                          <p className="text-gray-800 mb-3">{post.content}</p>
                          
                          {post.imageUrl && (
                            <img 
                              src={post.imageUrl} 
                              alt="Post" 
                              className="rounded-lg max-w-full h-auto mb-3"
                            />
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
                            <button className="flex items-center gap-1 hover:text-blue-600">
                              <Share2 className="w-4 h-4" />
                              {post.sharesCount || 0}
                            </button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements?.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="p-8 text-center">
                  <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No achievements yet</h3>
                  <p className="text-gray-600">
                    Keep engaging with civic activities to earn achievements!
                  </p>
                </CardContent>
              </Card>
            ) : (
              achievements?.map((achievement: any) => (
                <Card key={achievement.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Award className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{achievement.name}</h4>
                        <p className="text-sm text-gray-600">{achievement.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Earned {formatDate(achievement.earnedAt)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <Card>
            <CardContent className="p-8 text-center">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Activity Feed</h3>
              <p className="text-gray-600">
                Recent civic engagement activity will appear here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 