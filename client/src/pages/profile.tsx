
import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Trophy, 
  Zap, 
  Vote, 
  MessageSquare, 
  FileText, 
  Users, 
  Edit, 
  Camera, 
  Globe, 
  MapPin, 
  Briefcase, 
  GraduationCap,
  Heart,
  Flag,
  Shield,
  Eye,
  EyeOff,
  Palette,
  Settings,
  UserPlus,
  MessageCircle,
  Calendar,
  Award,
  TrendingUp,
  Activity,
  BookOpen,
  Target,
  Star
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  bio?: string;
  website?: string;
  socialLinks?: Record<string, string>;
  interests?: string[];
  politicalAffiliation?: string;
  occupation?: string;
  education?: string;
  profileImageUrl?: string;
  profileBannerUrl?: string;
  profileTheme?: string;
  profileAccentColor?: string;
  profileVisibility?: string;
  profileBioVisibility?: string;
  profileCompletionPercentage?: number;
  civicLevel?: string;
  trustScore?: number;
  civicPoints?: number;
  city?: string;
  province?: string;
  federalRiding?: string;
  provincialRiding?: string;
  isVerified?: boolean;
  verificationLevel?: string;
  createdAt?: string;
  // Activity stats
  voteCount?: number;
  petitionCount?: number;
  discussionCount?: number;
  contactCount?: number;
  // Social stats
  friendsCount?: number;
  postsCount?: number;
  profileViews?: number;
  // Recent activity
  recentActivity?: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    data?: any;
  }>;
}

interface ProfileStats {
  totalVotes: number;
  totalPetitions: number;
  totalDiscussions: number;
  totalContacts: number;
  civicPoints: number;
  trustScore: number;
  civicLevel: string;
  achievementCount: number;
  streakDays: number;
}

export default function Profile() {
  const { user: currentUser, isAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Extract userId from URL path
  const pathParts = location.split('/');
  const userIdFromUrl = pathParts[pathParts.length - 1];
  const isOwnProfile = !userIdFromUrl || userIdFromUrl === 'profile' || userIdFromUrl === currentUser?.id || location === '/profile';
  const targetUserId = isOwnProfile ? currentUser?.id : userIdFromUrl;

  // State for editing
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch user profile data
  const { data: profileUser, isLoading: isLoadingUser } = useQuery({
    queryKey: ['user-profile', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return null;
      const response = await apiRequest(`/api/users/${targetUserId}/profile`, 'GET');
      return response;
    },
    enabled: !!targetUserId,
  });

  // Fetch user stats
  const { data: userStats } = useQuery({
    queryKey: ['user-stats', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return null;
      const response = await apiRequest(`/api/users/${targetUserId}/stats`, 'GET');
      return response;
    },
    enabled: !!targetUserId,
  });

  // Fetch user activity
  const { data: userActivity } = useQuery({
    queryKey: ['user-activity', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return null;
      const response = await apiRequest(`/api/users/${targetUserId}/activity`, 'GET');
      return response;
    },
    enabled: !!targetUserId,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<UserProfile>) => {
      return apiRequest(`/api/users/${targetUserId}/profile`, 'PUT', updates);
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['user-profile', targetUserId] });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile.",
        variant: "destructive",
      });
    },
  });

  // Add friend mutation
  const addFriendMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/social/friends', 'POST', {
        friendId: targetUserId,
        action: 'send'
      });
    },
    onSuccess: () => {
      toast({
        title: "Friend Request Sent",
        description: "Your friend request has been sent.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Request Failed",
        description: error.message || "Failed to send friend request.",
        variant: "destructive",
      });
    },
  });

  // Message user mutation
  const messageUserMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/social/messages', 'POST', {
        recipientId: targetUserId,
        content: "Hello! I'd like to connect with you on CivicOS."
      });
    },
    onSuccess: () => {
      toast({
        title: "Message Sent",
        description: "Your message has been sent.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Message Failed",
        description: error.message || "Failed to send message.",
        variant: "destructive",
      });
    },
  });

  // Handle profile update
  const handleProfileUpdate = () => {
    updateProfileMutation.mutate(editForm);
  };

  // Handle image upload
  const handleImageUpload = async (file: File, type: 'profile' | 'banner') => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', type);

    try {
      const response = await apiRequest(`/api/users/${targetUserId}/upload-image`, 'POST', formData);
      queryClient.invalidateQueries({ queryKey: ['user-profile', targetUserId] });
      toast({
        title: "Image Updated",
        description: "Your profile image has been updated.",
      });
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload image.",
        variant: "destructive",
      });
    }
  };

  // Get display name
  const getDisplayName = (user: UserProfile | null) => {
    if (!user) return "Loading...";
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
    if (user.firstName) return user.firstName;
    if (user.email) return user.email.split('@')[0];
    return "Anonymous User";
  };

  // Get civic level color
  const getCivicLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'champion': return 'bg-purple-500';
      case 'expert': return 'bg-blue-500';
      case 'advocate': return 'bg-green-500';
      case 'active': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  // Get trust score color
  const getTrustScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoadingUser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-64 bg-gray-200 rounded-lg"></div>
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">User Not Found</h3>
              <p className="text-gray-600">The user profile you're looking for doesn't exist.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Profile Header */}
      <div className="relative mb-8">
        {/* Banner Image */}
        <div className="h-64 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg relative overflow-hidden">
          {profileUser.profileBannerUrl && (
            <img 
              src={profileUser.profileBannerUrl} 
              alt="Profile Banner"
              className="w-full h-full object-cover"
            />
          )}
          {isOwnProfile && (
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-4 right-4"
              onClick={() => document.getElementById('banner-upload')?.click()}
            >
              <Camera className="w-4 h-4 mr-2" />
              Change Banner
            </Button>
          )}
          <input
            id="banner-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageUpload(file, 'banner');
            }}
          />
        </div>

        {/* Profile Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
          <div className="flex items-end gap-6">
            {/* Profile Avatar */}
            <div className="relative">
              <Avatar className="w-32 h-32 border-4 border-white">
                <AvatarImage src={profileUser.profileImageUrl} />
                <AvatarFallback className="text-3xl bg-blue-600">
                  {getDisplayName(profileUser)[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {isOwnProfile && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                  onClick={() => document.getElementById('profile-upload')?.click()}
                >
                  <Camera className="w-4 h-4" />
                </Button>
              )}
              <input
                id="profile-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file, 'profile');
                }}
              />
            </div>

            {/* Profile Details */}
            <div className="flex-1 text-white">
              <div className="flex items-center gap-4 mb-2">
                <h1 className="text-3xl font-bold">{getDisplayName(profileUser)}</h1>
                {profileUser.isVerified && (
                  <Badge variant="secondary" className="bg-green-500">
                    <Shield className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
                <Badge className={getCivicLevelColor(profileUser.civicLevel)}>
                  {profileUser.civicLevel}
                </Badge>
              </div>
              
              {profileUser.occupation && (
                <p className="text-lg opacity-90 mb-1">
                  <Briefcase className="w-4 h-4 inline mr-2" />
                  {profileUser.occupation}
                </p>
              )}
              
              {profileUser.city && profileUser.province && (
                <p className="text-lg opacity-90 mb-1">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  {profileUser.city}, {profileUser.province}
                </p>
              )}

              {profileUser.bio && (
                <p className="text-lg opacity-90 mt-2 max-w-2xl">
                  {profileUser.bio}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {isOwnProfile ? (
                <Button onClick={() => setIsEditing(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              ) : (
                <>
                  <Button onClick={() => addFriendMutation.mutate()}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Friend
                  </Button>
                  <Button variant="outline" onClick={() => messageUserMutation.mutate()}>
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="social">Social</TabsTrigger>
              <TabsTrigger value="civic">Civic</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Profile Completion */}
              {isOwnProfile && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Profile Completion
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Profile Complete</span>
                        <span className="text-sm text-gray-600">{profileUser.profileCompletionPercentage}%</span>
                      </div>
                      <Progress value={profileUser.profileCompletionPercentage} className="h-2" />
                      <p className="text-xs text-gray-600">
                        Complete your profile to unlock more features and increase your civic impact score.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* About Section */}
              <Card>
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {profileUser.bio ? (
                    <p className="text-gray-700">{profileUser.bio}</p>
                  ) : (
                    <p className="text-gray-500 italic">No bio added yet.</p>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {profileUser.occupation && (
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{profileUser.occupation}</span>
                      </div>
                    )}
                    
                    {profileUser.education && (
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{profileUser.education}</span>
                      </div>
                    )}
                    
                    {profileUser.website && (
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-gray-500" />
                        <a href={profileUser.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                          {profileUser.website}
                        </a>
                      </div>
                    )}
                    
                    {profileUser.politicalAffiliation && (
                      <div className="flex items-center gap-2">
                        <Flag className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{profileUser.politicalAffiliation}</span>
                      </div>
                    )}
                  </div>

                                     {profileUser.interests && profileUser.interests.length > 0 && (
                     <div>
                       <h4 className="font-medium mb-2">Interests</h4>
                       <div className="flex flex-wrap gap-2">
                         {profileUser.interests.map((interest: string, index: number) => (
                           <Badge key={index} variant="secondary">
                             {interest}
                           </Badge>
                         ))}
                       </div>
                     </div>
                   )}
                </CardContent>
              </Card>

              {/* Civic Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Civic Engagement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{userStats?.totalVotes || 0}</div>
                      <div className="text-sm text-gray-600">Votes Cast</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{userStats?.totalPetitions || 0}</div>
                      <div className="text-sm text-gray-600">Petitions Signed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{userStats?.totalDiscussions || 0}</div>
                      <div className="text-sm text-gray-600">Discussions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{userStats?.totalContacts || 0}</div>
                      <div className="text-sm text-gray-600">Contacts</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  {userActivity && userActivity.length > 0 ? (
                    <div className="space-y-4">
                      {userActivity.map((activity: any) => (
                        <div key={activity.id} className="flex items-center gap-4 p-3 border rounded-lg">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Activity className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{activity.description}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(activity.timestamp).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No recent activity</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="social" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Social Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{profileUser.friendsCount || 0}</div>
                      <div className="text-sm text-gray-600">Friends</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{profileUser.postsCount || 0}</div>
                      <div className="text-sm text-gray-600">Posts</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{profileUser.profileViews || 0}</div>
                      <div className="text-sm text-gray-600">Profile Views</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{userStats?.streakDays || 0}</div>
                      <div className="text-sm text-gray-600">Day Streak</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="civic" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Civic Achievements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Trophy className="w-6 h-6 text-yellow-500" />
                        <div>
                          <p className="font-medium">Civic Points</p>
                          <p className="text-sm text-gray-600">Earned through engagement</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-yellow-600">{userStats?.civicPoints || 0}</p>
                        <p className="text-sm text-gray-600">points</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Shield className="w-6 h-6 text-green-500" />
                        <div>
                          <p className="font-medium">Trust Score</p>
                          <p className="text-sm text-gray-600">Based on verification</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-2xl font-bold ${getTrustScoreColor(userStats?.trustScore || 0)}`}>
                          {userStats?.trustScore || 0}%
                        </p>
                        <p className="text-sm text-gray-600">trust</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Award className="w-6 h-6 text-purple-500" />
                        <div>
                          <p className="font-medium">Achievements</p>
                          <p className="text-sm text-gray-600">Badges earned</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-purple-600">{userStats?.achievementCount || 0}</p>
                        <p className="text-sm text-gray-600">badges</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Member Since</span>
                                 <span className="text-sm font-medium">
                   {profileUser.createdAt ? new Date(profileUser.createdAt as string).toLocaleDateString() : 'Unknown'}
                 </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Verification</span>
                <Badge variant={profileUser.isVerified ? "default" : "secondary"}>
                  {profileUser.verificationLevel || 'Unverified'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Profile Visibility</span>
                <Badge variant="outline">
                  {profileUser.profileVisibility || 'Public'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Social Links */}
          {profileUser.socialLinks && Object.keys(profileUser.socialLinks).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Social Links</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(profileUser.socialLinks || {}).map(([platform, url]) => (
                    <a
                      key={platform}
                      href={url as string}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                    >
                      <Globe className="w-4 h-4" />
                      {platform}
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your profile information and customize your appearance.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={editForm.firstName || profileUser.firstName || ''}
                  onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={editForm.lastName || profileUser.lastName || ''}
                  onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell us about yourself..."
                value={editForm.bio || profileUser.bio || ''}
                onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="occupation">Occupation</Label>
                <Input
                  id="occupation"
                  value={editForm.occupation || profileUser.occupation || ''}
                  onChange={(e) => setEditForm({...editForm, occupation: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="education">Education</Label>
                <Input
                  id="education"
                  value={editForm.education || profileUser.education || ''}
                  onChange={(e) => setEditForm({...editForm, education: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={editForm.city || profileUser.city || ''}
                  onChange={(e) => setEditForm({...editForm, city: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="province">Province</Label>
                <Input
                  id="province"
                  value={editForm.province || profileUser.province || ''}
                  onChange={(e) => setEditForm({...editForm, province: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                placeholder="https://yourwebsite.com"
                value={editForm.website || profileUser.website || ''}
                onChange={(e) => setEditForm({...editForm, website: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="politicalAffiliation">Political Affiliation (Optional)</Label>
              <Input
                id="politicalAffiliation"
                placeholder="e.g., Liberal, Conservative, Independent"
                value={editForm.politicalAffiliation || profileUser.politicalAffiliation || ''}
                onChange={(e) => setEditForm({...editForm, politicalAffiliation: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="profileVisibility">Profile Visibility</Label>
              <Select
                value={editForm.profileVisibility || profileUser.profileVisibility || 'public'}
                onValueChange={(value) => setEditForm({...editForm, profileVisibility: value})}
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

            <div className="flex gap-2">
              <Button onClick={handleProfileUpdate} disabled={updateProfileMutation.isPending}>
                {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}