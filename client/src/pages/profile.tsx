
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Zap, Vote, MessageSquare, FileText, Users } from "lucide-react";
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

export default function Profile() {
  const { user: rawUser, isAuthenticated, updateProfile } = useAuth();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
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
  const [showWelcome, setShowWelcome] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update form state when user data changes
  useEffect(() => {
    if (user) {
      setEditFirstName(user.firstName || "");
      setEditLastName(user.lastName || "");
      setEditBio(user.bio || "");
      setEditAvatar(user.profileImageUrl || "");
    }
  }, [user]);

  useEffect(() => {
    // Show welcome notice only for new users (e.g., just registered)
    // This could be improved by checking a query param or user context
    if (window.location.search.includes("welcome")) {
      setShowWelcome(true);
    }
  }, []);

  const handleSaveProfile = async () => {
    try {
      await updateProfile({
        firstName: editFirstName,
        lastName: editLastName,
        bio: editBio,
        profileImageUrl: editAvatar
      });
      setEditOpen(false);
    } catch (error) {
      // Error is handled by updateProfile function
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-bold mb-2">Loading your profile...</h2>
          <p className="text-gray-600">Please log in to view profiles.</p>
        </div>
      </div>
    );
  }

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

  if (showWelcome) {
    return (
      <Card className="max-w-xl mx-auto mt-12 p-6 bg-yellow-50 border-yellow-400 text-center">
        <CardContent>
          <h2 className="text-2xl font-bold mb-2">Welcome to CivicOS Beta!</h2>
          <p className="mb-4 text-gray-700">
            Your feedback and participation are crucial! The more people who join, the faster we can improve and unlock full civic intelligence for everyone.
          </p>
          <Button
            className="mb-2"
            onClick={() => {
              navigator.clipboard.writeText(window.location.origin);
              toast({ title: "Link copied!", description: "Share CivicOS with your friends and help us grow." });
            }}
          >
            Invite Friends
          </Button>
          <div className="text-xs text-gray-500 mt-2">
            Exposure is key—spread the word and help build a better civic future!
          </div>
        </CardContent>
      </Card>
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
                  {isOwnProfile && (
                    <Dialog open={editOpen} onOpenChange={setEditOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          Edit Profile
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Edit Profile</DialogTitle>
                          <DialogDescription>Update your profile information</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">First Name</label>
                            <Input
                              value={editFirstName}
                              onChange={(e) => setEditFirstName(e.target.value)}
                              placeholder="First name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Last Name</label>
                            <Input
                              value={editLastName}
                              onChange={(e) => setEditLastName(e.target.value)}
                              placeholder="Last name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Bio</label>
                            <Textarea
                              value={editBio}
                              onChange={(e) => setEditBio(e.target.value)}
                              placeholder="Tell us about yourself..."
                              rows={3}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Profile Picture URL</label>
                            <Input
                              value={editAvatar}
                              onChange={(e) => setEditAvatar(e.target.value)}
                              placeholder="https://example.com/image.jpg"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end space-x-2 mt-6">
                          <Button variant="outline" onClick={() => setEditOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleSaveProfile}>
                            Save Changes
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
                <p className="text-gray-600 mb-2">{user?.email}</p>
                <p className="text-gray-700">
                  {user?.bio || "No bio yet. Click 'Edit Profile' to add one!"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
                      <span className="text-sm">Representatives Contacted</span>
                    </div>
                    <span className="font-medium">{userStats?.contactCount || 0}</span>
                  </div>
                  <Progress value={(userStats?.contactCount || 0) * 20} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest civic engagement activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(userStats?.recentActivity?.length || 0) > 0 ? (
                  (userStats?.recentActivity || []).map((activity: any, index: number) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="h-8 w-8 bg-civic-blue rounded-full flex items-center justify-center">
                        <Vote className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">{activity.description}</p>
                        <p className="text-sm text-gray-600">{activity.date}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">Start engaging with civic activities to see your activity here!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}