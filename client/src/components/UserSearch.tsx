import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  UserPlus, 
  Users, 
  MapPin, 
  Star, 
  MessageSquare,
  Filter,
  X,
  User,
  Check,
  Clock,
  TrendingUp,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Settings,
  Activity,
  Award,
  Shield,
  Globe,
  Building,
  Home,
  Briefcase,
  GraduationCap,
  Calendar,
  Phone,
  Mail,
  ExternalLink,
  Eye,
  EyeOff,
  Camera,
  Video,
  Link,
  BarChart3,
  Zap,
  Star as StarIcon,
  TrendingDown,
  Users as GroupIcon,
  Hash,
  AtSign,
  Send,
  UserCheck,
  UserX,
  UserMinus,
  UserPlus as AddUserIcon,
  MessageCircle as ChatIcon,
  Heart as LikeIcon,
  Share,
  Bookmark,
  Flag,
  Edit,
  Trash2,
  Settings as SettingsIcon,
  Activity as ActivityIcon,
  Zap as ZapIcon,
  Award as AwardIcon,
  Star as StarIcon2,
  TrendingDown as TrendingDownIcon,
  Users as GroupIcon2,
  Hash as HashIcon,
  AtSign as AtSignIcon
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  profileImageUrl?: string;
  bio?: string;
  location?: string;
  civicLevel?: string;
  isVerified?: boolean;
  trustScore?: string;
  joinedAt?: string;
  displayName: string;
  stats?: {
    posts: number;
    friends: number;
    activities: number;
  };
  friendship?: {
    isFriend: boolean;
    pendingRequest: boolean;
    receivedRequest: boolean;
    canSendRequest: boolean;
  };
  username?: string; // Added for username
}

interface SearchParams {
  q: string;
  location: string;
  interests: string;
  civicLevel: string;
}

export default function UserSearch() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchParams, setSearchParams] = useState<SearchParams>({
    q: '',
    location: '',
    interests: '',
    civicLevel: ''
  });
  const [activeTab, setActiveTab] = useState('search');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Search users query
  const { data: searchResults, isLoading: isLoadingSearch } = useQuery({
    queryKey: ['users/search', searchParams],
    queryFn: async () => {
      const params = new URLSearchParams({
        q: searchParams.q,
        location: searchParams.location,
        interests: searchParams.interests,
        civicLevel: searchParams.civicLevel
      });
      const response = await apiRequest(`/api/users/search?${params}`, 'GET');
      return response.users || [];
    },
    enabled: searchParams.q.length > 0 || searchParams.location.length > 0 || searchParams.civicLevel.length > 0
  });

  // User suggestions query
  const { data: suggestions = [] } = useQuery({
    queryKey: ['users/suggestions'],
    queryFn: async () => {
      const response = await apiRequest('/api/users/suggestions', 'GET');
      return response.suggestions || [];
    }
  });

  // Friend request mutation
  const friendRequestMutation = useMutation({
    mutationFn: async ({ friendId, action }: { friendId: string; action: 'send' | 'accept' | 'reject' | 'remove' }) => {
      return apiRequest('/api/social/friends', 'POST', { friendId, action });
    },
    onSuccess: (_, variables) => {
      const action = variables.action;
      const actionText = {
        send: 'Friend request sent',
        accept: 'Friend request accepted',
        reject: 'Friend request rejected',
        remove: 'Friend removed'
      }[action];
      
      toast({
        title: "Success",
        description: actionText,
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['users/search'] });
      queryClient.invalidateQueries({ queryKey: ['users/suggestions'] });
      queryClient.invalidateQueries({ queryKey: ['social/friends'] });
    },
    onError: (error: any) => {
      toast({
        title: "Action Failed",
        description: error.message || "Failed to perform action.",
        variant: "destructive",
      });
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ recipientId, content }: { recipientId: string; content: string }) => {
      return apiRequest('/api/social/messages', 'POST', { recipientId, content });
    },
    onSuccess: () => {
      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully.",
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

  const handleSearch = () => {
    // Trigger search by updating query key
    queryClient.invalidateQueries({ queryKey: ['users/search', searchParams] });
  };

  const handleFriendAction = (userId: string, action: 'send' | 'accept' | 'reject' | 'remove') => {
    friendRequestMutation.mutate({ friendId: userId, action });
  };

  const handleSendMessage = (userId: string, content: string) => {
    sendMessageMutation.mutate({ recipientId: userId, content });
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

  const UserCard = ({ user }: { user: User }) => (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.profileImageUrl} alt={user.displayName} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg font-semibold">
              {user.displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {user.displayName}
              </h3>
              {user.isVerified && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  <Check className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
            
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-sm text-gray-500">@{user.username || 'user'}</span>
              {user.civicLevel && (
                <Badge variant="outline" className={getCivicLevelColor(user.civicLevel)}>
                  {user.civicLevel}
                </Badge>
              )}
            </div>
            
            {user.bio && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {user.bio}
              </p>
            )}
            
            {user.location && (
              <div className="flex items-center text-sm text-gray-500 mb-3">
                <MapPin className="w-4 h-4 mr-1" />
                {user.location}
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>Joined {user.joinedAt ? formatTimeAgo(user.joinedAt) : 'recently'}</span>
                {user.stats && (
                  <>
                    <span>{user.stats.posts} posts</span>
                    <span>{user.stats.friends} friends</span>
                  </>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFriendAction(user.id, 'send')}
                  disabled={user.friendship?.isFriend || user.friendship?.pendingRequest}
                >
                  {user.friendship?.isFriend ? (
                    <>
                      <UserCheck className="w-4 h-4 mr-1" />
                      Friends
                    </>
                  ) : user.friendship?.pendingRequest ? (
                    <>
                      <Clock className="w-4 h-4 mr-1" />
                      Pending
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-1" />
                      Add Friend
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSendMessage(user.id, 'Hello! I found you on CivicOS.')}
                >
                  <MessageSquare className="w-4 h-4 mr-1" />
                  Message
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const profileUrl = user.username ? `/civicsocial/profile/${user.username}` : `/profile/${user.id}`;
                    window.open(profileUrl, '_blank');
                  }}
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  View Profile
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Find People</h1>
        <p className="text-gray-600">Connect with fellow citizens and build your civic network</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="search">Search Users</TabsTrigger>
          <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
          <TabsTrigger value="recent">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="mt-6">
          {/* Search Form */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Search Users</CardTitle>
              <CardDescription>Find people by name, location, or interests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="search-name">Name or Email</Label>
                  <Input
                    id="search-name"
                    placeholder="Search by name or email..."
                    value={searchParams.q}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, q: e.target.value }))}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                
                <div>
                  <Label htmlFor="search-location">Location</Label>
                  <Input
                    id="search-location"
                    placeholder="City, province, or riding..."
                    value={searchParams.location}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, location: e.target.value }))}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                
                <div>
                  <Label htmlFor="search-level">Civic Level</Label>
                  <Select 
                    value={searchParams.civicLevel} 
                    onValueChange={(value) => setSearchParams(prev => ({ ...prev, civicLevel: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any level</SelectItem>
                      <SelectItem value="Registered">Registered</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Advocate">Advocate</SelectItem>
                      <SelectItem value="Expert">Expert</SelectItem>
                      <SelectItem value="Champion">Champion</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end">
                  <Button onClick={handleSearch} className="w-full">
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search Results */}
          {isLoadingSearch ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Searching users...</p>
            </div>
          ) : searchResults?.length === 0 && (searchParams.q || searchParams.location || searchParams.civicLevel) ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No users found</h3>
                <p className="text-gray-600">
                  Try adjusting your search criteria or browse suggestions instead.
                </p>
              </CardContent>
            </Card>
          ) : searchResults?.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Search Results ({searchResults.length})</h3>
                <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </Button>
              </div>
              
              {searchResults.map((user: User) => (
                <UserCard key={user.id} user={user} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Start searching</h3>
                <p className="text-gray-600">
                  Enter a name, location, or civic level to find users.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="suggestions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>People You May Know</CardTitle>
              <CardDescription>Users with similar interests or location</CardDescription>
            </CardHeader>
            <CardContent>
              {suggestions.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No suggestions yet</h3>
                  <p className="text-gray-600">
                    Complete your profile to get personalized suggestions.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {suggestions.map((user: User) => (
                    <UserCard key={user.id} user={user} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Recent user activity and engagement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No recent activity</h3>
                <p className="text-gray-600">
                  Activity feed will appear here as users engage with the platform.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* User Detail Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Profile</DialogTitle>
            <DialogDescription>
              View user profile details and manage friendship status.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={selectedUser.profileImageUrl} />
                  <AvatarFallback className="bg-blue-600 text-lg">
                    {selectedUser.displayName[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-semibold">{selectedUser.displayName}</h3>
                    {selectedUser.isVerified && (
                      <Badge variant="secondary">
                        <Star className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                    <Badge className={getCivicLevelColor(selectedUser.civicLevel || '')}>
                      {selectedUser.civicLevel || 'Registered'}
                    </Badge>
                  </div>
                  
                  {selectedUser.location && (
                    <div className="flex items-center gap-1 text-gray-600 mb-2">
                      <MapPin className="w-4 h-4" />
                      {selectedUser.location}
                    </div>
                  )}
                  
                  {selectedUser.stats && (
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{selectedUser.stats.posts} posts</span>
                      <span>{selectedUser.stats.friends} friends</span>
                      <span>{selectedUser.stats.activities} activities</span>
                    </div>
                  )}
                </div>
              </div>
              
              <Separator />
              
              <div className="flex gap-2">
                {selectedUser.friendship && (
                  <>
                    {selectedUser.friendship.isFriend ? (
                      <Button variant="outline" disabled>
                        <UserCheck className="w-4 h-4 mr-2" />
                        Friends
                      </Button>
                    ) : selectedUser.friendship.pendingRequest ? (
                      <Button variant="outline" disabled>
                        <Clock className="w-4 h-4 mr-2" />
                        Request Sent
                      </Button>
                    ) : selectedUser.friendship.receivedRequest ? (
                      <>
                        <Button 
                          onClick={() => handleFriendAction(selectedUser.id, 'accept')}
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Accept Request
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => handleFriendAction(selectedUser.id, 'reject')}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Decline
                        </Button>
                      </>
                    ) : selectedUser.friendship.canSendRequest ? (
                      <Button 
                        onClick={() => handleFriendAction(selectedUser.id, 'send')}
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add Friend
                      </Button>
                    ) : null}
                  </>
                )}
                
                <Button variant="outline">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
                
                <Button variant="outline">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Profile
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 