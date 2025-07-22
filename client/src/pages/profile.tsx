
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
  const { user: rawUser, isAuthenticated } = useAuth();
  const user = rawUser as any;
  const [showWelcome, setShowWelcome] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editFirstName, setEditFirstName] = useState(user?.firstName || "");
  const [editLastName, setEditLastName] = useState(user?.lastName || "");
  const [editBio, setEditBio] = useState((user as any)?.bio || "");
  const [editAvatar, setEditAvatar] = useState((user as any)?.profileImageUrl || "");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const updateProfile = useMutation({
    mutationFn: async (fields: any) => user ? apiRequest(`/api/users/${user.id}/profile`, "PATCH", fields) : Promise.reject("No user"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setEditOpen(false);
      toast({ title: "Profile updated!", description: "Your changes have been saved." });
    },
  });

  useEffect(() => {
    // Show welcome notice only for new users (e.g., just registered)
    // This could be improved by checking a query param or user context
    if (window.location.search.includes("welcome")) {
      setShowWelcome(true);
    }
  }, []);

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-bold mb-2">Loading your profile...</h2>
          <p className="text-gray-600">Please log in to view your profile.</p>
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
    <div className="min-h-screen bg-gray-50">

      
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Profile Header */}
          <div className="relative rounded-3xl shadow-2xl mb-8 overflow-hidden">
            <div className="h-40 w-full bg-gradient-to-br from-blue-500 to-purple-600" />
            <div className="absolute left-1/2 -bottom-16 transform -translate-x-1/2 flex flex-col items-center w-full">
              <Avatar className="w-32 h-32 border-4 border-white shadow-xl bg-white">
                <AvatarImage src={editAvatar || (user as any)?.profileImageUrl} />
                <AvatarFallback className="text-5xl font-bold">{user?.firstName?.[0] || user?.email?.[0] || "U"}</AvatarFallback>
              </Avatar>
              <button
                className="absolute bottom-2 right-2 bg-white border border-gray-300 rounded-full p-1 shadow hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Change avatar"
                type="button"
                tabIndex={0}
                style={{ left: 'calc(50% + 48px)' }}
              >
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13h3l8-8a2.828 2.828 0 10-4-4l-8 8v3h3z" /></svg>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      setEditAvatar(ev.target?.result as string);
                      toast({ title: "Avatar updated!", description: "Your profile picture has been changed." });
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                aria-label="Upload avatar"
              />
              <div className="mt-20 flex flex-col items-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-1">{user?.firstName} {user?.lastName}</h1>
                <p className="text-lg text-gray-500">{user?.email}</p>
                <p className="text-base text-gray-700 mt-1">{(user as any)?.bio || "No bio available."}</p>
                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="mt-4">Edit Profile</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Edit Profile</DialogTitle>
                      <DialogDescription>Update your name, bio, and avatar.</DialogDescription>
                    </DialogHeader>
                    <form className="flex flex-col gap-4" onSubmit={e => {
                      e.preventDefault();
                      updateProfile.mutate({
                        firstName: editFirstName,
                        lastName: editLastName,
                        bio: editBio,
                        profileImageUrl: editAvatar,
                      });
                    }}>
                      <div>
                        <label className="block text-sm font-medium mb-1" htmlFor="edit-firstname">First Name</label>
                        <Input id="edit-firstname" value={editFirstName} onChange={e => setEditFirstName(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1" htmlFor="edit-lastname">Last Name</label>
                        <Input id="edit-lastname" value={editLastName} onChange={e => setEditLastName(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1" htmlFor="edit-bio">Bio</label>
                        <Textarea id="edit-bio" value={editBio} onChange={e => setEditBio(e.target.value)} rows={3} />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={updateProfile.isPending}>{updateProfile.isPending ? "Saving..." : "Save"}</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>

          {/* Profile Information */}
          <Card className="md:col-span-1">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4">
                {user?.profileImageUrl ? (
                  <img 
                    src={user.profileImageUrl} 
                    alt="Profile" 
                    className="h-24 w-24 rounded-full object-cover border-4 border-civic-blue"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-full bg-civic-blue text-white flex items-center justify-center text-2xl font-bold">
                    {(user?.firstName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                  </div>
                )}
              </div>
              <CardTitle className="text-xl">
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}`
                  : user?.email?.split('@')[0] || 'User'
                }
              </CardTitle>
              <CardDescription>{user?.email}</CardDescription>
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