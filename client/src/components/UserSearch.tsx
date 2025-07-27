import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Search, UserPlus, MapPin, Award, Shield, ExternalLink } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../hooks/useAuth';
import { useLocation } from 'wouter';

interface User {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  location: string;
  civicLevel: string;
  trustScore: number;
  civicPoints: number;
  memberSince: string;
}

interface UserSearchResponse {
  users: User[];
  total: number;
  query: string;
  limit: number;
  offset: number;
}

export function UserSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const { data: searchResults, isLoading, refetch } = useQuery<UserSearchResponse>({
    queryKey: ['user-search', searchQuery, isAuthenticated],
    queryFn: async () => {
      if (!searchQuery.trim() || searchQuery.length < 2) {
        return { users: [], total: 0, query: searchQuery, limit: 20, offset: 0 };
      }
      
      // Use the correct social API endpoint
      const response = await apiRequest(`/api/social/users/search?q=${encodeURIComponent(searchQuery)}`, 'GET');
      return response;
    },
    enabled: false, // Don't auto-fetch, only on button click
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      toast({
        title: "Search Error",
        description: "Please enter at least 2 characters to search",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      await refetch();
    } catch (error) {
      toast({
        title: "Search Failed",
        description: "Failed to search for users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddFriend = async (userId: string, userName: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to add friends.",
        variant: "destructive",
      });
      return;
    }

    try {
      await apiRequest('/api/friends/request', 'POST', { friendId: userId });
      toast({
        title: "Friend Request Sent",
        description: `Friend request sent to ${userName}`,
      });
    } catch (error) {
      toast({
        title: "Request Failed",
        description: "Failed to send friend request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getCivicLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'champion':
        return 'bg-purple-500';
      case 'expert':
        return 'bg-blue-500';
      case 'advocate':
        return 'bg-green-500';
      case 'active':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTrustScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Search by name, email, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button 
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
            >
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults && searchResults.users.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Found {searchResults.total} user{searchResults.total !== 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {searchResults.users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>
                        {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{user.name}</h3>
                        <Badge className={getCivicLevelColor(user.civicLevel)}>
                          {user.civicLevel}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          ID: {user.id}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {user.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Award className="h-4 w-4" />
                          {user.civicPoints} points
                        </div>
                        <div className="flex items-center gap-1">
                          <Shield className={`h-4 w-4 ${getTrustScoreColor(user.trustScore)}`} />
                          Trust: {user.trustScore}%
                        </div>
                      </div>
                      
                      <div className="text-xs text-muted-foreground mt-1">
                        Member since {user.memberSince}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setLocation(`/profile/${user.id}`)}
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View Profile
                    </Button>
                    <Button
                      onClick={() => handleAddFriend(user.id, user.name)}
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <UserPlus className="h-4 w-4" />
                      Add Friend
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {searchResults && searchResults.users.length === 0 && searchQuery && !isLoading && (
        <Card>
          <CardContent className="text-center py-8">
            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No users found</h3>
            <p className="text-muted-foreground">
              Try searching with different terms or check your spelling.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Searching for users...</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 