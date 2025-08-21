import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  RefreshCw, 
  Database, 
  Users, 
  FileText, 
  Vote, 
  Scale, 
  Building2, 
  Newspaper,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PlatformHealth {
  users: number;
  social: {
    posts: number;
    comments: number;
  };
  government: {
    politicians: number;
    bills: number;
    elections: number;
    legalActs: number;
    procurement: number;
    lobbyists: number;
  };
  content: {
    news: number;
    petitions: number;
  };
  timestamp: string;
}

interface IngestionStatus {
  politicians: { success: boolean; message: string; timestamp: string };
  bills: { success: boolean; message: string; timestamp: string };
  elections: { success: boolean; message: string; timestamp: string };
  legal: { success: boolean; message: string; timestamp: string };
  procurement: { success: boolean; message: string; timestamp: string };
  lobbyists: { success: boolean; message: string; timestamp: string };
  news: { success: boolean; message: string; timestamp: string };
  petitions: { success: boolean; message: string; timestamp: string };
}

interface PlatformHealth {
  users: number;
  social: {
    posts: number;
    comments: number;
  };
  government: {
    politicians: number;
    bills: number;
    elections: number;
    legalActs: number;
    procurement: number;
    lobbyists: number;
  };
  content: {
    news: number;
    petitions: number;
  };
  timestamp: string;
}

interface IngestionStatus {
  politicians: { success: boolean; message: string; timestamp: string };
  bills: { success: boolean; message: string; timestamp: string };
  elections: { success: boolean; message: string; timestamp: string };
  legal: { success: boolean; message: string; timestamp: string };
  procurement: { success: boolean; message: string; timestamp: string };
  lobbyists: { success: boolean; message: string; timestamp: string };
  news: { success: boolean; message: string; timestamp: string };
  petitions: { success: boolean; message: string; timestamp: string };
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isRunningIngestion, setIsRunningIngestion] = useState(false);

  // Fetch platform health metrics
  const { data: platformHealth, isLoading: healthLoading } = useQuery<PlatformHealth>({
    queryKey: ['/api/admin/health'],
    queryFn: () => apiRequest('/api/admin/health', 'GET'),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch ingestion status
  const { data: ingestionStatus, isLoading: statusLoading } = useQuery<IngestionStatus>({
    queryKey: ['/api/admin/ingestion/status'],
    queryFn: () => apiRequest('/api/admin/ingestion/status', 'GET'),
    refetchInterval: 60000, // Refresh every minute
  });

  // Comprehensive data ingestion mutation
  const runFullIngestionMutation = useMutation({
    mutationFn: async () => {
      setIsRunningIngestion(true);
      return await apiRequest('/api/admin/refresh/all', 'POST');
    },
    onSuccess: () => {
      toast({
        title: "Data Ingestion Complete",
        description: "All data sources have been refreshed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/health'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ingestion/status'] });
    },
    onError: (error: any) => {
      toast({
        title: "Ingestion Failed",
        description: error.message || "Failed to run comprehensive data ingestion",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsRunningIngestion(false);
    },
  });

  // Individual data source refresh mutations
  const refreshPoliticiansMutation = useMutation({
    mutationFn: () => apiRequest('/api/admin/refresh/politicians', 'POST'),
    onSuccess: () => {
      toast({ title: "Politicians refreshed!", description: "Politician data has been updated." });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/health'] });
    },
  });

  const refreshBillsMutation = useMutation({
    mutationFn: () => apiRequest('/api/admin/refresh/parliament', 'POST'),
    onSuccess: () => {
      toast({ title: "Bills refreshed!", description: "Bill and voting data has been updated." });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/health'] });
    },
  });

  const refreshElectionsMutation = useMutation({
    mutationFn: () => apiRequest('/api/admin/refresh/elections', 'POST'),
    onSuccess: () => {
      toast({ title: "Elections refreshed!", description: "Election data has been updated." });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/health'] });
    },
  });

  const refreshLegalMutation = useMutation({
    mutationFn: () => apiRequest('/api/admin/refresh/legal', 'POST'),
    onSuccess: () => {
      toast({ title: "Legal data refreshed!", description: "Legal acts and cases have been updated." });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/health'] });
    },
  });

  const refreshProcurementMutation = useMutation({
    mutationFn: () => apiRequest('/api/admin/refresh/procurement', 'POST'),
    onSuccess: () => {
      toast({ title: "Procurement refreshed!", description: "Procurement contract data has been updated." });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/health'] });
    },
  });

  const refreshLobbyistsMutation = useMutation({
    mutationFn: () => apiRequest('/api/admin/refresh/lobbyists', 'POST'),
    onSuccess: () => {
      toast({ title: "Lobbyists refreshed!", description: "Lobbyist organization data has been updated." });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/health'] });
    },
  });

  const refreshNewsMutation = useMutation({
    mutationFn: () => apiRequest('/api/admin/refresh/news', 'POST'),
    onSuccess: () => {
      toast({ title: "News refreshed!", description: "News articles have been updated." });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/health'] });
    },
  });

  const refreshPetitionsMutation = useMutation({
    mutationFn: () => apiRequest('/api/admin/refresh/petitions', 'POST'),
    onSuccess: () => {
      toast({ title: "Petitions refreshed!", description: "Petition data has been updated." });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/health'] });
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Please log in to view the admin dashboard.
      </div>
    );
  }

  if (healthLoading || statusLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const currentHealth = platformHealth || {
    users: 0,
    social: { posts: 0, comments: 0 },
    government: { politicians: 0, bills: 0, elections: 0, legalActs: 0, procurement: 0, lobbyists: 0 },
    content: { news: 0, petitions: 0 },
    timestamp: new Date().toISOString()
  };

  const currentStatus = ingestionStatus || {
    politicians: { success: false, message: 'Unknown', timestamp: '' },
    bills: { success: false, message: 'Unknown', timestamp: '' },
    elections: { success: false, message: 'Unknown', timestamp: '' },
    legal: { success: false, message: 'Unknown', timestamp: '' },
    procurement: { success: false, message: 'Unknown', timestamp: '' },
    lobbyists: { success: false, message: 'Unknown', timestamp: '' },
    news: { success: false, message: 'Unknown', timestamp: '' },
    petitions: { success: false, message: 'Unknown', timestamp: '' }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertTriangle className="h-4 w-4 text-red-600" />;
  };

  const getStatusColor = (success: boolean) => {
    return success ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Monitor and manage CivicOS platform data and operations</p>
        </div>

        {/* Platform Health Overview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Platform Health Overview</span>
            </CardTitle>
            <CardDescription>
              Current platform statistics and data counts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{currentHealth.users}</div>
                <div className="text-sm text-gray-600">Registered Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{currentHealth.government.politicians}</div>
                <div className="text-sm text-gray-600">Politicians</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{currentHealth.government.bills}</div>
                <div className="text-sm text-gray-600">Active Bills</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{currentHealth.content.news}</div>
                <div className="text-sm text-gray-600">News Articles</div>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500 text-center">
              Last updated: {new Date(currentHealth.timestamp).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        {/* Comprehensive Data Ingestion */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>Comprehensive Data Ingestion</span>
            </CardTitle>
            <CardDescription>
              Refresh all data sources with current government information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Run Full Data Ingestion</h4>
                  <p className="text-sm text-gray-600">
                    Refresh all data sources: politicians, bills, elections, legal, procurement, lobbyists, news, and petitions
                  </p>
                </div>
                <Button
                  onClick={() => runFullIngestionMutation.mutate()}
                  disabled={isRunningIngestion || runFullIngestionMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isRunningIngestion || runFullIngestionMutation.isPending ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Running...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Run Full Ingestion
                    </>
                  )}
                </Button>
              </div>
              
              {runFullIngestionMutation.isError && (
                <Alert variant="destructive">
                  <AlertDescription>
                    Failed to run comprehensive ingestion: {runFullIngestionMutation.error?.message}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Individual Data Source Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <RefreshCw className="h-5 w-5" />
              <span>Individual Data Source Controls</span>
            </CardTitle>
            <CardDescription>
              Refresh specific data sources individually
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button
                onClick={() => refreshPoliticiansMutation.mutate()}
                disabled={refreshPoliticiansMutation.isPending}
                variant="outline"
                className="h-auto p-4 flex-col space-y-2"
              >
                <Users className="h-6 w-6" />
                <span>Refresh Politicians</span>
                {refreshPoliticiansMutation.isPending && <LoadingSpinner size="sm" />}
              </Button>

              <Button
                onClick={() => refreshBillsMutation.mutate()}
                disabled={refreshBillsMutation.isPending}
                variant="outline"
                className="h-auto p-4 flex-col space-y-2"
              >
                <FileText className="h-6 w-6" />
                <span>Refresh Bills & Votes</span>
                {refreshBillsMutation.isPending && <LoadingSpinner size="sm" />}
              </Button>

              <Button
                onClick={() => refreshElectionsMutation.mutate()}
                disabled={refreshElectionsMutation.isPending}
                variant="outline"
                className="h-auto p-4 flex-col space-y-2"
              >
                <Vote className="h-6 w-6" />
                <span>Refresh Elections</span>
                {refreshElectionsMutation.isPending && <LoadingSpinner size="sm" />}
              </Button>

              <Button
                onClick={() => refreshLegalMutation.mutate()}
                disabled={refreshLegalMutation.isPending}
                variant="outline"
                className="h-auto p-4 flex-col space-y-2"
              >
                <Scale className="h-6 w-6" />
                <span>Refresh Legal Data</span>
                {refreshLegalMutation.isPending && <LoadingSpinner size="sm" />}
              </Button>

              <Button
                onClick={() => refreshProcurementMutation.mutate()}
                disabled={refreshProcurementMutation.isPending}
                variant="outline"
                className="h-auto p-4 flex-col space-y-2"
              >
                <Building2 className="h-6 w-6" />
                <span>Refresh Procurement</span>
                {refreshProcurementMutation.isPending && <LoadingSpinner size="sm" />}
              </Button>

              <Button
                onClick={() => refreshLobbyistsMutation.mutate()}
                disabled={refreshLobbyistsMutation.isPending}
                variant="outline"
                className="h-auto p-4 flex-col space-y-2"
              >
                <TrendingUp className="h-6 w-6" />
                <span>Refresh Lobbyists</span>
                {refreshLobbyistsMutation.isPending && <LoadingSpinner size="sm" />}
              </Button>

              <Button
                onClick={() => refreshNewsMutation.mutate()}
                disabled={refreshNewsMutation.isPending}
                variant="outline"
                className="h-auto p-4 flex-col space-y-2"
              >
                <Newspaper className="h-6 w-6" />
                <span>Refresh News</span>
                {refreshNewsMutation.isPending && <LoadingSpinner size="sm" />}
              </Button>

              <Button
                onClick={() => refreshPetitionsMutation.mutate()}
                disabled={refreshPetitionsMutation.isPending}
                variant="outline"
                className="h-auto p-4 flex-col space-y-2"
              >
                <FileText className="h-6 w-6" />
                <span>Refresh Petitions</span>
                {refreshPetitionsMutation.isPending && <LoadingSpinner size="sm" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Data Source Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5" />
              <span>Data Source Status</span>
            </CardTitle>
            <CardDescription>
              Current status of all data sources and last refresh times
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(currentStatus).map(([key, status]) => (
                <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(status.success)}
                    <div>
                      <div className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                      <div className="text-sm text-gray-600">{status.message}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${getStatusColor(status.success)}`}>
                      {status.success ? 'Healthy' : 'Issues Detected'}
                    </div>
                    {status.timestamp && (
                      <div className="text-xs text-gray-500">
                        {new Date(status.timestamp).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
