import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Users, 
  MapPin, 
  Shield, 
  Trophy, 
  Zap, 
  Star, 
  Filter,
  X,
  UserPlus,
  MessageCircle,
  Eye,
  TrendingUp,
  Award,
  Calendar,
  Globe,
  Briefcase,
  GraduationCap,
  Flag,
  Heart,
  Activity
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  profileImageUrl?: string;
  bio?: string;
  city?: string;
  province?: string;
  civicLevel?: string;
  trustScore?: number;
  civicPoints?: number;
  isVerified?: boolean;
  occupation?: string;
  education?: string;
  politicalAffiliation?: string;
  interests?: string[];
  createdAt?: string;
  profileVisibility?: string;
}

interface SearchFilters {
  location?: string;
  civicLevel?: string;
  verificationStatus?: string;
  sortBy?: string;
  interests?: string[];
}

interface SearchResult {
  users: User[];
  total: number;
  query: string;
  limit: number;
  offset: number;
}

export default function UserSearch() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('search');
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Debounce search query
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Search users
  const { data: searchResults, isLoading: isSearching } = useQuery<SearchResult>({
    queryKey: ['user-search', debouncedQuery, filters],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        return { users: [], total: 0, query: '', limit: 20, offset: 0 };
      }

             const params = new URLSearchParams({
         q: debouncedQuery,
         limit: '20',
         ...Object.fromEntries(
           Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
         )
       });

      const response = await apiRequest(`/api/users/search?${params}`, 'GET');
      return response;
    },
    enabled: !!debouncedQuery && debouncedQuery.length >= 2,
  });

  // Get popular users (for suggestions)
  const { data: popularUsers } = useQuery<User[]>({
    queryKey: ['popular-users'],
    queryFn: async () => {
      const response = await apiRequest('/api/users/popular', 'GET');
      return response.users || [];
    },
    enabled: activeTab === 'discover',
  });

  // Get recent activity users
  const { data: recentActivityUsers } = useQuery<User[]>({
    queryKey: ['recent-activity-users'],
    queryFn: async () => {
      const response = await apiRequest('/api/users/recent-activity', 'GET');
      return response.users || [];
    },
    enabled: activeTab === 'discover',
  });

  // Add friend mutation
  const addFriendMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest('/api/social/friends', 'POST', {
        friendId: userId,
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
    mutationFn: async (userId: string) => {
      return apiRequest('/api/social/messages', 'POST', {
        recipientId: userId,
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedQuery(searchQuery);
  };

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const getDisplayName = (user: User) => {
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

  const getTrustScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const UserCard = ({ user, showActions = true }: { user: User; showActions?: boolean }) => (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedUser(user)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="w-12 h-12">
            <AvatarImage src={user.profileImageUrl} />
            <AvatarFallback className="bg-blue-600">
              {getDisplayName(user)[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg truncate">{getDisplayName(user)}</h3>
                             {user.isVerified && (
                 <Badge variant="secondary">
                   <Shield className="w-3 h-3 mr-1" />
                   Verified
                 </Badge>
               )}
               <Badge className={`text-xs ${getCivicLevelColor(user.civicLevel || '')}`}>
                 {user.civicLevel || 'Registered'}
               </Badge>
            </div>
            
            {user.occupation && (
              <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                <Briefcase className="w-3 h-3" />
                {user.occupation}
              </p>
            )}
            
            {user.city && user.province && (
              <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {user.city}, {user.province}
              </p>
            )}
            
            {user.bio && (
              <p className="text-sm text-gray-700 line-clamp-2">{user.bio}</p>
            )}
            
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
              <span className={`flex items-center gap-1 ${getTrustScoreColor(user.trustScore || 0)}`}>
                <Shield className="w-3 h-3" />
                {user.trustScore || 0}% trust
              </span>
              <span className="flex items-center gap-1">
                <Trophy className="w-3 h-3" />
                {user.civicPoints || 0} points
              </span>
              {user.createdAt && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
          
          {showActions && currentUser?.id !== user.id && (
            <div className="flex flex-col gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  addFriendMutation.mutate(user.id);
                }}
              >
                <UserPlus className="w-3 h-3 mr-1" />
                Add
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  messageUserMutation.mutate(user.id);
                }}
              >
                <MessageCircle className="w-3 h-3 mr-1" />
                Message
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Find Civic Citizens</h1>
        <p className="text-gray-600">Discover and connect with engaged citizens in your community</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="search">Search Users</TabsTrigger>
          <TabsTrigger value="discover">Discover</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-6">
          {/* Search Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Search Users
              </CardTitle>
              <CardDescription>
                Find users by name, email, location, or interests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search by name, email, location, or interests..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <Button type="submit" disabled={isSearching}>
                    {isSearching ? 'Searching...' : 'Search'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                  </Button>
                </div>

                {showFilters && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg bg-gray-50">
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        placeholder="City or Province"
                        value={filters.location || ''}
                        onChange={(e) => handleFilterChange('location', e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="civicLevel">Civic Level</Label>
                      <Select
                        value={filters.civicLevel || ''}
                        onValueChange={(value) => handleFilterChange('civicLevel', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Any level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Any level</SelectItem>
                          <SelectItem value="champion">Champion</SelectItem>
                          <SelectItem value="expert">Expert</SelectItem>
                          <SelectItem value="advocate">Advocate</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="registered">Registered</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="verification">Verification</Label>
                      <Select
                        value={filters.verificationStatus || ''}
                        onValueChange={(value) => handleFilterChange('verificationStatus', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Any status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Any status</SelectItem>
                          <SelectItem value="verified">Verified only</SelectItem>
                          <SelectItem value="unverified">Unverified only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="sortBy">Sort By</Label>
                      <Select
                        value={filters.sortBy || ''}
                        onValueChange={(value) => handleFilterChange('sortBy', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Relevance" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="relevance">Relevance</SelectItem>
                          <SelectItem value="trust_score">Trust Score</SelectItem>
                          <SelectItem value="civic_points">Civic Points</SelectItem>
                          <SelectItem value="recent">Recently Active</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {Object.keys(filters).some(key => filters[key as keyof SearchFilters]) && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Active filters:</span>
                    {Object.entries(filters).map(([key, value]) => (
                      value && (
                        <Badge key={key} variant="secondary" className="text-xs">
                          {key}: {value}
                          <X
                            className="w-3 h-3 ml-1 cursor-pointer"
                            onClick={() => handleFilterChange(key as keyof SearchFilters, '')}
                          />
                        </Badge>
                      )
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="text-xs"
                    >
                      Clear all
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Search Results */}
          {debouncedQuery && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  Search Results
                  {searchResults && (
                    <span className="text-sm font-normal text-gray-600 ml-2">
                      ({searchResults.total} users found)
                    </span>
                  )}
                </h2>
              </div>

              {isSearching ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Searching users...</p>
                </div>
              ) : searchResults?.users.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No users found</h3>
                    <p className="text-gray-600">
                      Try adjusting your search terms or filters to find more users.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {searchResults?.users.map((user) => (
                    <UserCard key={user.id} user={user} />
                  ))}
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="discover" className="space-y-6">
          {/* Popular Users */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Popular Users
              </CardTitle>
              <CardDescription>
                Most engaged and trusted citizens on the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              {popularUsers?.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No popular users found</p>
              ) : (
                <div className="grid gap-4">
                  {popularUsers?.map((user) => (
                    <UserCard key={user.id} user={user} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Recently Active
              </CardTitle>
              <CardDescription>
                Users who have been active recently
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivityUsers?.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No recent activity found</p>
              ) : (
                <div className="grid gap-4">
                  {recentActivityUsers?.map((user) => (
                    <UserCard key={user.id} user={user} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* User Detail Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Profile</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={selectedUser.profileImageUrl} />
                  <AvatarFallback className="text-xl bg-blue-600">
                    {getDisplayName(selectedUser)[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{getDisplayName(selectedUser)}</h3>
                  <div className="flex items-center gap-2 mt-1">
                                         {selectedUser.isVerified && (
                       <Badge variant="secondary">
                         <Shield className="w-3 h-3 mr-1" />
                         Verified
                       </Badge>
                     )}
                     <Badge className={getCivicLevelColor(selectedUser.civicLevel || '')}>
                       {selectedUser.civicLevel || 'Registered'}
                     </Badge>
                  </div>
                </div>
              </div>

              {selectedUser.bio && (
                <p className="text-gray-700">{selectedUser.bio}</p>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                {selectedUser.occupation && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-gray-500" />
                    <span>{selectedUser.occupation}</span>
                  </div>
                )}
                
                {selectedUser.education && (
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-gray-500" />
                    <span>{selectedUser.education}</span>
                  </div>
                )}
                
                {selectedUser.city && selectedUser.province && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span>{selectedUser.city}, {selectedUser.province}</span>
                  </div>
                )}
                
                {selectedUser.politicalAffiliation && (
                  <div className="flex items-center gap-2">
                    <Flag className="w-4 h-4 text-gray-500" />
                    <span>{selectedUser.politicalAffiliation}</span>
                  </div>
                )}
              </div>

              {selectedUser.interests && selectedUser.interests.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Interests</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.interests.map((interest, index) => (
                      <Badge key={index} variant="secondary">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className={`flex items-center gap-1 ${getTrustScoreColor(selectedUser.trustScore || 0)}`}>
                    <Shield className="w-4 h-4" />
                    {selectedUser.trustScore || 0}% trust
                  </span>
                  <span className="flex items-center gap-1">
                    <Trophy className="w-4 h-4" />
                    {selectedUser.civicPoints || 0} points
                  </span>
                </div>
                
                {currentUser?.id !== selectedUser.id && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        addFriendMutation.mutate(selectedUser.id);
                        setSelectedUser(null);
                      }}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Friend
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        messageUserMutation.mutate(selectedUser.id);
                        setSelectedUser(null);
                      }}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Message
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 