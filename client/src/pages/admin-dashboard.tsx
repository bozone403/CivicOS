import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  FileText, 
  MessageSquare, 
  Bell, 
  Newspaper, 
  Vote, 
  Settings, 
  RefreshCw, 
  Shield, 
  Activity,
  TrendingUp,
  Database,
  UserCheck,
  Flag,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface AdminSummary {
  users: number;
  posts: number;
  comments: number;
  notifications: number;
  news: number;
  votes: number;
}

interface IngestionStatus {
  users: number;
  politicians: number;
  legalActs: number;
  legalCases: number;
}

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');

  // Check if user has admin permissions
  const { data: hasAdminAccess, isLoading: checkingAccess } = useQuery({
    queryKey: ['admin-access'],
    queryFn: async () => {
      try {
        await apiRequest('/api/admin/summary', 'GET');
        return true;
      } catch (error) {
        return false;
      }
    },
    enabled: isAuthenticated,
  });

  // Fetch admin summary data
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['admin-summary'],
    queryFn: async (): Promise<AdminSummary> => {
      const response = await apiRequest('/api/admin/summary', 'GET');
      return response.summary;
    },
    enabled: hasAdminAccess,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch ingestion status
  const { data: ingestionStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['ingestion-status'],
    queryFn: async (): Promise<IngestionStatus> => {
      const response = await apiRequest('/api/admin/ingestion/status', 'GET');
      return response;
    },
    enabled: hasAdminAccess,
    refetchInterval: 60000, // Refresh every minute
  });

  // Data refresh mutations
  const refreshNewsMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/admin/refresh/news', 'POST');
    },
    onSuccess: () => {
      toast({
        title: "News refreshed",
        description: "News feeds have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['news'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to refresh news",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const refreshParliamentMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/admin/refresh/parliament', 'POST');
    },
    onSuccess: () => {
      toast({
        title: "Parliament data refreshed",
        description: "Parliament members and votes have been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['politicians'] });
      queryClient.invalidateQueries({ queryKey: ['bills'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to refresh parliament data",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const refreshLegalMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/admin/refresh/legal', 'POST');
    },
    onSuccess: () => {
      toast({
        title: "Legal data refreshed",
        description: "Legal acts and cases have been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['legal'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to refresh legal data",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const refreshProcurementMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/admin/refresh/procurement', 'POST');
    },
    onSuccess: () => {
      toast({
        title: "Procurement data refreshed",
        description: "Procurement contracts have been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['procurement'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to refresh procurement data",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const refreshLobbyistsMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/admin/refresh/lobbyists', 'POST');
    },
    onSuccess: () => {
      toast({
        title: "Lobbyist data refreshed",
        description: "Lobbyist organizations have been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['lobbyists'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to refresh lobbyist data",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  // Loading state
  if (checkingAccess || summaryLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Access denied
  if (!hasAdminAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          <Alert className="mt-20">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Access denied. You do not have permission to view the admin dashboard.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage your CivicOS platform and monitor system health</p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary?.users?.toLocaleString() || '0'}</div>
              <p className="text-xs text-muted-foreground">Registered users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Content</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {((summary?.posts || 0) + (summary?.comments || 0)).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {summary?.posts || 0} posts, {summary?.comments || 0} comments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">News Articles</CardTitle>
              <Newspaper className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary?.news?.toLocaleString() || '0'}</div>
              <p className="text-xs text-muted-foreground">Published articles</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Votes</CardTitle>
              <Vote className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary?.votes?.toLocaleString() || '0'}</div>
              <p className="text-xs text-muted-foreground">User votes cast</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="data">Data Management</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="moderation">Moderation</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>System Status</span>
                </CardTitle>
                <CardDescription>
                  Current platform health and data ingestion status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {ingestionStatus?.users?.toLocaleString() || '0'}
                    </div>
                    <div className="text-sm text-gray-600">Users</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {ingestionStatus?.politicians?.toLocaleString() || '0'}
                    </div>
                    <div className="text-sm text-gray-600">Politicians</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {ingestionStatus?.legalActs?.toLocaleString() || '0'}
                    </div>
                    <div className="text-sm text-gray-600">Legal Acts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {ingestionStatus?.legalCases?.toLocaleString() || '0'}
                    </div>
                    <div className="text-sm text-gray-600">Legal Cases</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Management Tab */}
          <TabsContent value="data" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5" />
                  <span>Data Ingestion</span>
                </CardTitle>
                <CardDescription>
                  Manually trigger data updates from external sources
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    onClick={() => refreshNewsMutation.mutate()}
                    disabled={refreshNewsMutation.isPending}
                    className="w-full"
                  >
                    {refreshNewsMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Newspaper className="h-4 w-4 mr-2" />
                    )}
                    Refresh News
                  </Button>

                  <Button
                    onClick={() => refreshParliamentMutation.mutate()}
                    disabled={refreshParliamentMutation.isPending}
                    className="w-full"
                  >
                    {refreshParliamentMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Vote className="h-4 w-4 mr-2" />
                    )}
                    Refresh Parliament Data
                  </Button>

                  <Button
                    onClick={() => refreshLegalMutation.mutate()}
                    disabled={refreshLegalMutation.isPending}
                    className="w-full"
                  >
                    {refreshLegalMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <FileText className="h-4 w-4 mr-2" />
                    )}
                    Refresh Legal Data
                  </Button>

                  <Button
                    onClick={() => refreshProcurementMutation.mutate()}
                    disabled={refreshProcurementMutation.isPending}
                    className="w-full"
                  >
                    {refreshProcurementMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Database className="h-4 w-4 mr-2" />
                    )}
                    Refresh Procurement
                  </Button>

                  <Button
                    onClick={() => refreshLobbyistsMutation.mutate()}
                    disabled={refreshLobbyistsMutation.isPending}
                    className="w-full"
                  >
                    {refreshLobbyistsMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Users className="h-4 w-4 mr-2" />
                    )}
                    Refresh Lobbyists
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Management Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <UserCheck className="h-5 w-5" />
                  <span>User Management</span>
                </CardTitle>
                <CardDescription>
                  Manage user accounts, permissions, and verification
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>User management features coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Moderation Tab */}
          <TabsContent value="moderation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Flag className="h-5 w-5" />
                  <span>Content Moderation</span>
                </CardTitle>
                <CardDescription>
                  Review and moderate user-generated content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Flag className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>Content moderation features coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Platform Analytics</span>
                </CardTitle>
                <CardDescription>
                  View detailed platform usage and performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>Analytics dashboard coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
