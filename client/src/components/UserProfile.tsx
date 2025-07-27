import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  MapPin, 
  Calendar, 
  Users, 
  MessageCircle, 
  Heart, 
  Share2,
  Edit,
  Settings,
  Shield,
  Award,
  Globe,
  Building,
  Mail,
  Phone,
  ExternalLink,
  Activity
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { useParams, useNavigate } from "react-router-dom";

interface UserProfileData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImageUrl?: string;
  civicLevel: string;
  isVerified: boolean;
  createdAt: string;
  city?: string;
  province?: string;
  country?: string;
  displayName: string;
}

interface UserStats {
  postsCount: number;
  friendsCount: number;
}

interface UserProfileResponse {
  profile: UserProfileData;
  stats: UserStats;
  friendshipStatus?: string;
}

interface SocialPost {
  id: number;
  content: string;
  imageUrl?: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  likeCount: number;
  commentsCount: number;
  sharesCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
}

export function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    city: "",
    province: "",
    country: ""
  });

  // Fetch user profile
  const { data: profileData, isLoading } = useQuery<UserProfileResponse>({
    queryKey: ["userProfile", userId],
    queryFn: async () => {
      const response = await apiRequest(`/api/social/profile/${userId}`, "GET");
      return response;
    },
    enabled: !!userId,
  });

  // Fetch user's posts
  const { data: userPosts = [] } = useQuery<SocialPost[]>({
    queryKey: ["userPosts", userId],
    queryFn: async () => {
      const response = await apiRequest(`/api/social/posts?userId=${userId}`, "GET");
      return response?.posts || [];
    },
    enabled: !!userId && isAuthenticated,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof editForm) => {
      return apiRequest("/api/social/profile", "PUT", data);
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      setIsEditMode(false);
      queryClient.invalidateQueries({ queryKey: ["userProfile", userId] });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Friend actions mutation
  const friendActionMutation = useMutation({
    mutationFn: async (action: string) => {
      return apiRequest("/api/social/friends", "POST", {
        friendId: userId,
        action
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile", userId] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });

  // Initialize edit form when profile data loads
  useEffect(() => {
    if (profileData?.profile) {
      setEditForm({
        firstName: profileData.profile.firstName,
        lastName: profileData.profile.lastName,
        city: profileData.profile.city || "",
        province: profileData.profile.province || "",
        country: profileData.profile.country || ""
      });
    }
  }, [profileData]);

  const handleUpdateProfile = () => {
    updateProfileMutation.mutate(editForm);
  };

  const handleFriendAction = (action: string) => {
    friendActionMutation.mutate(action);
  };

  const isOwnProfile = currentUser?.id === userId;
  const canEdit = isOwnProfile && isAuthenticated;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">User Not Found</h3>
          <p className="text-muted-foreground">The user you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const { profile, stats, friendshipStatus } = profileData;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader className="relative">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.profileImageUrl} />
                <AvatarFallback className="text-lg">
                  {profile.firstName?.[0]}{profile.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl font-bold">{profile.displayName}</h1>
                  {profile.isVerified && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <Shield className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                  <Badge variant="outline">
                    <Award className="h-3 w-3 mr-1" />
                    {profile.civicLevel}
                  </Badge>
                </div>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  {profile.city && (
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {profile.city}, {profile.province}
                    </div>
                  )}
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Member since {formatDistanceToNow(new Date(profile.createdAt))} ago
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {canEdit ? (
                <Button
                  variant="outline"
                  onClick={() => setIsEditMode(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              ) : isAuthenticated && !isOwnProfile ? (
                <div className="flex space-x-2">
                  {friendshipStatus === "accepted" ? (
                    <Button variant="outline" disabled>
                      <Users className="h-4 w-4 mr-2" />
                      Friends
                    </Button>
                  ) : friendshipStatus === "pending" ? (
                    <Button variant="outline" disabled>
                      Request Sent
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleFriendAction("send_request")}
                      disabled={friendActionMutation.isPending}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Add Friend
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/messages/${userId}`)}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.postsCount}</div>
              <div className="text-sm text-muted-foreground">Posts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.friendsCount}</div>
              <div className="text-sm text-muted-foreground">Friends</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{profile.civicLevel}</div>
              <div className="text-sm text-muted-foreground">Civic Level</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Content Tabs */}
      <Tabs defaultValue="posts" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-4">
          {userPosts.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">No Posts Yet</h3>
                  <p className="text-muted-foreground">
                    {isOwnProfile ? "Share your thoughts with the community!" : "This user hasn't posted anything yet."}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {userPosts.map((post) => (
                <Card key={post.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={profile.profileImageUrl} />
                        <AvatarFallback>
                          {profile.firstName?.[0]}{profile.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold">{profile.displayName}</span>
                            <span className="text-sm text-muted-foreground">
                              {formatDistanceToNow(new Date(post.createdAt))} ago
                            </span>
                          </div>
                        </div>
                        <p className="text-sm">{post.content}</p>
                        {post.imageUrl && (
                          <img 
                            src={post.imageUrl} 
                            alt="Post" 
                            className="rounded-lg max-w-full h-auto"
                          />
                        )}
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <button className="flex items-center space-x-1 hover:text-primary">
                            <Heart className="h-4 w-4" />
                            <span>{post.likeCount}</span>
                          </button>
                          <button className="flex items-center space-x-1 hover:text-primary">
                            <MessageCircle className="h-4 w-4" />
                            <span>{post.commentsCount}</span>
                          </button>
                          <button className="flex items-center space-x-1 hover:text-primary">
                            <Share2 className="h-4 w-4" />
                            <span>{post.sharesCount}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="about" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Location</Label>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {profile.city && profile.province 
                        ? `${profile.city}, ${profile.province}, ${profile.country}`
                        : "Not specified"
                      }
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Member Since</Label>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{new Date(profile.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Civic Level</Label>
                  <div className="flex items-center space-x-2">
                    <Award className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.civicLevel}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Verification</Label>
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.isVerified ? "Verified" : "Not verified"}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold">Activity Tracking</h3>
                <p className="text-muted-foreground">
                  Activity tracking will be available soon.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditMode} onOpenChange={setIsEditMode}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={editForm.firstName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={editForm.lastName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={editForm.city}
                onChange={(e) => setEditForm(prev => ({ ...prev, city: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="province">Province</Label>
                <Input
                  id="province"
                  value={editForm.province}
                  onChange={(e) => setEditForm(prev => ({ ...prev, province: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={editForm.country}
                  onChange={(e) => setEditForm(prev => ({ ...prev, country: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsEditMode(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateProfile}
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 