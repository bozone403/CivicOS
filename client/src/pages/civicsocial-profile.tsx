import React, { useState, useRef } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useCivicSocialFeed, useCivicSocialPost, useCivicSocialLike, useCivicSocialComment, useCivicSocialNotify, useCivicSocialFriends, useCivicSocialFollow } from "../hooks/useCivicSocial";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ThumbsUp, MessageCircle, Share2, Image as ImageIcon, Edit2, Trash2, Camera, Settings, User, Award, Activity, Calendar, MapPin, Mail, Phone, Globe, Lock, Eye, EyeOff, UserPlus } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { 
  CivicSocialLayout, 
  CivicSocialHeader, 
  CivicSocialSection, 
  CivicSocialList, 
  CivicSocialEmptyState, 
  CivicSocialLoadingState,
  CivicSocialErrorState,
  CivicSocialGrid
} from "../components/CivicSocialLayout";
import { 
  CivicSocialCard, 
  CivicSocialPostCard, 
  CivicSocialProfileCard 
} from "../components/CivicSocialCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Skeleton } from "../components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import { Heart, MessageSquare } from "lucide-react";

export default function CivicSocialProfile() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { data: feed, isLoading, error } = useCivicSocialFeed();
  const { data: friendsData } = useCivicSocialFriends();
  const postMutation = useCivicSocialPost();
  const likeMutation = useCivicSocialLike();
  const commentMutation = useCivicSocialComment();
  const notifyMutation = useCivicSocialNotify();
  const [content, setContent] = useState("");
  const [openComment, setOpenComment] = useState<{ [postId: number]: boolean }>({});
  const [commentText, setCommentText] = useState<{ [postId: number]: string }>({});
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editFirstName, setEditFirstName] = useState(user?.firstName || "");
  const [editLastName, setEditLastName] = useState(user?.lastName || "");
  const [editBio, setEditBio] = useState((user as any)?.bio || "");
  const [editAvatar, setEditAvatar] = useState((user as any)?.profileImageUrl || "");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const friends = friendsData?.friends || [];
  const [activeTab, setActiveTab] = useState("posts");

  const updateProfile = useMutation({
    mutationFn: async (fields: any) => apiRequest(`/api/users/profile`, "PUT", fields),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setEditOpen(false);
      toast({ title: "Profile updated!", description: "Your changes have been saved." });
    },
  });

  const followMutation = useCivicSocialFollow();

  const handleFollow = (userId: string) => {
    followMutation.mutate({ followingId: userId }, {
      onSuccess: () => {
        toast({ title: "Followed", description: "You are now following this user!" });
      },
      onError: (error) => {
        toast({ title: "Error", description: error.message || "Failed to follow user.", variant: "destructive" });
      }
    });
  };

  // Only show posts by this user (type-safe string comparison)
  const userPosts = feed ? feed.filter((post: any) => String(post.userId) === String(user?.id)) : [];

  const displayName = user ? 
    (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : 
     user.firstName || user.lastName || user.email || "Anonymous") : 
    "Anonymous";

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !image) {
      toast({ title: "Nothing to post", description: "Add text or an image.", variant: "destructive" });
      return;
    }
    let imageUrl = null;
    if (image) {
      imageUrl = imagePreview;
    }
    postMutation.mutate({ content, imageUrl }, {
      onSuccess: () => {
        toast({ title: "Post created!", description: "Your post was added to your wall." });
        queryClient.invalidateQueries({ queryKey: ['civicSocialFeed'] });
      },
      onError: (error: any) => {
        toast({ title: "Error posting", description: error?.message || "Failed to post.", variant: "destructive" });
      },
    });
    setContent("");
    setImage(null);
    setImagePreview(null);
  };

  const handleComment = (postId: number) => {
    if (!commentText[postId]?.trim()) return;
    commentMutation.mutate(
      { postId, content: commentText[postId], userId: user?.id, displayName },
      {
        onSuccess: () => {
          setCommentText({ ...commentText, [postId]: "" });
          queryClient.invalidateQueries({ queryKey: ['civicSocialFeed'] });
        },
        onError: (error) => {
          toast({ title: "Error commenting", description: error.message || "Failed to comment.", variant: "destructive" });
        },
      }
    );
  };

  const editPostMutation = useMutation({
    mutationFn: async ({ postId, content, imageUrl }: any) => apiRequest(`/api/social/posts/${postId}`, 'PUT', { content, imageUrl }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['civicSocialFeed'] });
      toast({ title: 'Post updated', description: 'Your post has been updated.' });
    },
    onError: (error: any) => {
      toast({ title: 'Edit failed', description: error?.message || 'Could not update post.', variant: 'destructive' });
    }
  });

  const deletePostMutation = useMutation({
    mutationFn: async ({ postId }: any) => apiRequest(`/api/social/posts/${postId}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['civicSocialFeed'] });
      toast({ title: 'Post deleted', description: 'Your post has been removed.' });
    },
    onError: (error: any) => {
      toast({ title: 'Delete failed', description: error?.message || 'Could not delete post.', variant: 'destructive' });
    }
  });

  function getUserReaction(post: any) {
    return post.reactions?.find((r: any) => r.userId === user?.id)?.reaction || null;
  }

  const handleReact = (_post: any, emoji: string) => {
    // This would typically call an API to react to a post
    toast({ title: "Reaction added!", description: `You reacted with ${emoji}` });
  };

  const deletePost = async (postId: number) => {
    try {
      await apiRequest(`/api/social/posts/${postId}`, "DELETE");
      queryClient.invalidateQueries({ queryKey: ['civicSocialFeed'] });
      toast({ title: "Post deleted!", description: "Your post has been removed." });
    } catch (error: any) {
      toast({ title: "Error deleting", description: error.message || "Failed to delete post.", variant: "destructive" });
    }
  };

  function handleKeyDown(fn: () => void) {
    return (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        fn();
      }
    };
  }

  // Profile stats
  const profileStats = {
    posts: userPosts.length,
    friends: friends.length,
    civicPoints: (user as any)?.civicPoints || 0
  };

  // Header content
  const header = (
    <CivicSocialHeader
      title="My Profile"
      subtitle="Manage your civic social presence"
      actions={
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditOpen(true)}
          >
            <Edit2 className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
          <Button
            variant="outline"
            size="sm"
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      }
    />
  );

  // Sidebar content
  const sidebar = (
    <>
      <CivicSocialSection title="Profile Info">
        <CivicSocialProfileCard
          user={{
            id: user?.id || '',
            firstName: user?.firstName,
            lastName: user?.lastName,
            email: user?.email || '',
            profileImageUrl: (user as any)?.profileImageUrl,
            civicLevel: (user as any)?.civicLevel,
            bio: (user as any)?.bio,
            isOnline: true
          }}
          stats={profileStats}
          onMessage={() => toast({ title: "Message sent", description: "Your message has been sent successfully!" })}
          onFollow={() => handleFollow(user?.id || '')}
        />
      </CivicSocialSection>

      <CivicSocialSection title="Quick Actions">
        <div className="space-y-3">
          <Button 
            onClick={() => setEditOpen(true)}
            className="w-full social-button-primary"
          >
            <Edit2 className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
          
          <Button variant="outline" className="w-full">
            <Camera className="w-4 h-4 mr-2" />
            Change Photo
          </Button>
          
          <Button variant="outline" className="w-full">
            <Settings className="w-4 h-4 mr-2" />
            Privacy Settings
          </Button>
        </div>
      </CivicSocialSection>

      <CivicSocialSection title="Activity Stats">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-social-primary" />
              <span className="text-sm font-medium">Posts</span>
            </div>
            <span className="text-lg font-bold text-social-primary">{profileStats.posts}</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-social-secondary" />
              <span className="text-sm font-medium">Friends</span>
            </div>
            <span className="text-lg font-bold text-social-secondary">{profileStats.friends}</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Award className="w-4 h-4 text-social-accent" />
              <span className="text-sm font-medium">Civic Points</span>
            </div>
            <span className="text-lg font-bold text-social-accent">{profileStats.civicPoints}</span>
          </div>
        </div>
      </CivicSocialSection>
    </>
  );

  // Loading state
  if (authLoading || isLoading) {
    return (
      <CivicSocialLayout header={header} sidebar={sidebar}>
        <CivicSocialLoadingState 
          title="Loading your profile..."
          description="We're gathering your profile information and posts."
        />
      </CivicSocialLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <CivicSocialLayout header={header} sidebar={sidebar}>
        <CivicSocialErrorState
          title="Failed to load profile"
          description="We couldn't load your profile information. Please check your connection and try again."
          retry={() => window.location.reload()}
        />
      </CivicSocialLayout>
    );
  }

  return (
    <CivicSocialLayout header={header} sidebar={sidebar}>
      <CivicSocialSection>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="friends">Friends</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-6">
            <CivicSocialSection title="Create New Post">
              <CivicSocialCard>
                <form onSubmit={handlePost} className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="social-avatar w-10 h-10">
                      {imagePreview ? (
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-social-primary flex items-center justify-center text-white font-medium">
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 space-y-3">
                      <Textarea
                        placeholder="What's on your mind?"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="min-h-[100px] resize-none"
                      />
                      
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
                              setImage(null);
                              setImagePreview(null);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <ImageIcon className="w-4 h-4 mr-2" />
                            Add Image
                          </Button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                          />
                        </div>
                        
                        <Button
                          type="submit"
                          className="social-button-primary"
                          disabled={postMutation.isPending || (!content.trim() && !image)}
                        >
                          {postMutation.isPending ? (
                            <div className="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full mr-2" />
                          ) : (
                            <MessageSquare className="w-4 h-4 mr-2" />
                          )}
                          Post
                        </Button>
                      </div>
                    </div>
                  </div>
                </form>
              </CivicSocialCard>
            </CivicSocialSection>

            <CivicSocialSection title="Your Posts">
              {userPosts.length === 0 ? (
                <CivicSocialEmptyState
                  title="No posts yet"
                  description="Start sharing your civic thoughts and experiences!"
                  icon={<MessageSquare className="w-8 h-8" />}
                  action={
                    <Button onClick={() => setActiveTab("posts")} className="social-button-primary">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Create Your First Post
                    </Button>
                  }
                />
              ) : (
                <CivicSocialList>
                  {userPosts.map((post: any) => (
                    <CivicSocialPostCard
                      key={post.id}
                      post={post}
                      onLike={() => likeMutation.mutate(post.id)}
                      onComment={() => setOpenComment({ ...openComment, [post.id]: !openComment[post.id] })}
                      onShare={() => toast({ title: 'Shared', description: 'Post shared successfully!' })}
                      onBookmark={() => toast({ title: 'Bookmarked', description: 'Post added to your bookmarks!' })}
                      onEdit={() => {
                        const newContent = prompt('Edit your post:', post.content);
                        if (newContent !== null) {
                          editPostMutation.mutate({ postId: post.id, content: newContent });
                        }
                      }}
                      onDelete={() => {
                        if (confirm('Delete this post?')) {
                          deletePostMutation.mutate({ postId: post.id });
                        }
                      }}
                    />
                  ))}
                </CivicSocialList>
              )}
            </CivicSocialSection>
          </TabsContent>

          <TabsContent value="about" className="mt-6">
            <CivicSocialSection title="About Me">
              <CivicSocialCard>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="social-heading-3 text-card-foreground mb-2">Personal Information</h3>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Name:</span>
                            <span className="text-sm font-medium">{displayName}</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Email:</span>
                            <span className="text-sm font-medium">{user?.email}</span>
                          </div>
                          {(user as any)?.civicLevel && (
                            <div className="flex items-center space-x-3">
                              <Award className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">Civic Level:</span>
                              <Badge className="social-badge-primary">
                                {(user as any).civicLevel}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {(user as any)?.bio && (
                        <div>
                          <h4 className="social-heading-3 text-card-foreground mb-2">Bio</h4>
                          <p className="social-body text-muted-foreground">
                            {(user as any).bio}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h3 className="social-heading-3 text-card-foreground mb-2">Activity Summary</h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <span className="text-sm font-medium">Posts Created</span>
                            <span className="text-lg font-bold text-social-primary">{profileStats.posts}</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <span className="text-sm font-medium">Friends</span>
                            <span className="text-lg font-bold text-social-secondary">{profileStats.friends}</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <span className="text-sm font-medium">Civic Points</span>
                            <span className="text-lg font-bold text-social-accent">{profileStats.civicPoints}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CivicSocialCard>
            </CivicSocialSection>
          </TabsContent>

          <TabsContent value="friends" className="mt-6">
            <CivicSocialSection title="My Friends">
              {friends.length === 0 ? (
                <CivicSocialEmptyState
                  title="No friends yet"
                  description="Connect with other civic-minded individuals!"
                  icon={<User className="w-8 h-8" />}
                  action={
                    <Button className="social-button-primary">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Find Friends
                    </Button>
                  }
                />
              ) : (
                <CivicSocialGrid cols={3}>
                  {friends.map((friend: any) => (
                    <CivicSocialProfileCard
                      key={friend.id}
                      user={{
                        id: friend.id,
                        firstName: friend.firstName,
                        lastName: friend.lastName,
                        email: friend.email,
                        profileImageUrl: friend.profileImageUrl,
                        civicLevel: friend.civicLevel,
                        isOnline: friend.isOnline
                      }}
                      onMessage={() => toast({ title: "Message sent", description: "Your message has been sent successfully!" })}
                      onFollow={() => handleFollow(friend.id)}
                    />
                  ))}
                </CivicSocialGrid>
              )}
            </CivicSocialSection>
          </TabsContent>

          <TabsContent value="activity" className="mt-6">
            <CivicSocialSection title="Recent Activity">
              <CivicSocialEmptyState
                title="No recent activity"
                description="Your civic engagement activity will appear here."
                icon={<Activity className="w-8 h-8" />}
              />
            </CivicSocialSection>
          </TabsContent>
        </Tabs>
      </CivicSocialSection>

      {/* Edit Profile Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your profile information and preferences.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            updateProfile.mutate({
              firstName: editFirstName,
              lastName: editLastName,
              bio: editBio,
              profileImageUrl: editAvatar,
              // Grab values directly from form controls for new fields
              profileBannerUrl: (document.getElementById('profileBannerUrl') as HTMLInputElement)?.value || undefined,
              profileAccentColor: (document.getElementById('profileAccentColor') as HTMLInputElement)?.value || undefined,
              website: (document.getElementById('website') as HTMLInputElement)?.value || undefined,
              profileShowBadges: (document.getElementById('showBadges') as HTMLInputElement)?.checked,
              profileShowStats: (document.getElementById('showStats') as HTMLInputElement)?.checked,
              profileShowActivity: (document.getElementById('showActivity') as HTMLInputElement)?.checked,
              profileShowFriends: (document.getElementById('showFriends') as HTMLInputElement)?.checked
            });
          }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">First Name</label>
                <Input
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                  placeholder="First name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Last Name</label>
                <Input
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                  placeholder="Last name"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Bio</label>
              <Textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="Tell us about yourself..."
                rows={4}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Profile Image URL</label>
              <Input
                value={editAvatar}
                onChange={(e) => setEditAvatar(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="profileBannerUrl" className="text-sm font-medium">Profile Banner URL</label>
              <Input id="profileBannerUrl" placeholder="https://example.com/banner.jpg" defaultValue={(user as any)?.profileBannerUrl || ''} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="profileAccentColor" className="text-sm font-medium">Theme Accent Color</label>
                <Input id="profileAccentColor" type="color" defaultValue={(user as any)?.profileAccentColor || '#3b82f6'} />
              </div>
              <div className="space-y-2">
                <label htmlFor="website" className="text-sm font-medium">Website</label>
                <Input id="website" placeholder="https://my-site.com" defaultValue={(user as any)?.website || ''} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <input id="showBadges" type="checkbox" defaultChecked={(user as any)?.profileShowBadges ?? true} />
                <label htmlFor="showBadges" className="text-sm">Show badges</label>
              </div>
              <div className="flex items-center gap-2">
                <input id="showStats" type="checkbox" defaultChecked={(user as any)?.profileShowStats ?? true} />
                <label htmlFor="showStats" className="text-sm">Show stats</label>
              </div>
              <div className="flex items-center gap-2">
                <input id="showActivity" type="checkbox" defaultChecked={(user as any)?.profileShowActivity ?? true} />
                <label htmlFor="showActivity" className="text-sm">Show activity</label>
              </div>
              <div className="flex items-center gap-2">
                <input id="showFriends" type="checkbox" defaultChecked={(user as any)?.profileShowFriends ?? true} />
                <label htmlFor="showFriends" className="text-sm">Show friends</label>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="social-button-primary"
                disabled={updateProfile.isPending}
              >
                {updateProfile.isPending ? (
                  <div className="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full mr-2" />
                ) : (
                  <Edit2 className="w-4 h-4 mr-2" />
                )}
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </CivicSocialLayout>
  );
} 