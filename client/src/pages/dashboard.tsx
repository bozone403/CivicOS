
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnimatedCardWithIcon } from "@/components/ui/animated-card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { 
  Vote, 
  Users, 
  FileText, 
  MessageSquare, 
  Bell,
  Shield,
  TrendingUp,
  MapPin,
  BookOpen,
  Sparkles,
  Activity,
  Target,
  Award,
  Calendar
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface DashboardStats {
  activeBills: number;
  totalPoliticians: number;
  totalPetitions: number;
  platformStatus: string;
  lastUpdated: string;
}

export default function Dashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard'],
    queryFn: async () => {
      try {
        const result = await apiRequest('/api/dashboard', 'GET');
        return result.data; // Extract the data property from the response
      } catch (error) {
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-600 mb-4">Failed to load dashboard data</div>
          <div className="text-sm text-gray-600 mb-4">{error.message}</div>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  // Use only real data - no fallbacks
  const currentStats = stats || {
    activeBills: 0,
    totalPoliticians: 0,
    totalPetitions: 0,
    platformStatus: 'unknown',
    lastUpdated: new Date().toISOString()
  };

  // Only show stats that are actually available from the API
  const hasData = currentStats.activeBills > 0 || currentStats.totalPoliticians > 0 || currentStats.totalPetitions > 0;

  if (!hasData) {
    return (
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">
                Welcome back, {user?.firstName || user?.lastName || user?.email || 'Citizen'}!
              </h1>
              <p className="text-blue-100 mt-2">
                Stay engaged with Canadian democracy. Your voice matters.
              </p>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Activity className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Dashboard Data Available</h3>
          <p className="text-gray-500 mb-4">
            Dashboard statistics will appear here once data is available from the platform.
          </p>
          <Button onClick={() => window.location.reload()}>Refresh</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Welcome back, {user?.firstName || user?.lastName || user?.email || 'Citizen'}!
            </h1>
            <p className="text-blue-100 mt-2">
              Stay engaged with Canadian democracy. Your voice matters.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <div className={`w-2 h-2 rounded-full ${currentStats.platformStatus === 'operational' ? 'bg-green-300' : 'bg-red-300'}`} />
              <span className="text-sm text-blue-100">
                Platform: {currentStats.platformStatus}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-blue-200 mt-1">
              Last updated: {new Date(currentStats.lastUpdated).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnimatedCardWithIcon
          icon={<FileText className="h-4 w-4" />}
          title="Active Bills"
          description="Currently in parliament"
          value={currentStats.activeBills}
          trend="neutral"
        />
        
        <AnimatedCardWithIcon
          icon={<Users className="h-4 w-4" />}
          title="Officials"
          description="Total in database"
          value={currentStats.totalPoliticians}
          trend="up"
        />
        
        <AnimatedCardWithIcon
          icon={<Target className="h-4 w-4" />}
          title="Petitions"
          description="Available petitions"
          value={currentStats.totalPetitions}
          trend="up"
        />

        <AnimatedCardWithIcon
          icon={<Shield className="h-4 w-4" />}
          title="Platform Status"
          description="System health"
          value={currentStats.platformStatus === 'operational' ? 'Healthy' : 'Issues'}
          trend={currentStats.platformStatus === 'operational' ? 'up' : 'down'}
        />
      </div>

      {/* Platform Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Platform Status
          </CardTitle>
          <CardDescription>
            Current system status and data availability
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-lg font-semibold text-blue-600">
                {currentStats.platformStatus === 'operational' ? '✅ Operational' : '⚠️ Issues'}
              </div>
              <div className="text-sm text-muted-foreground">System Status</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Calendar className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-lg font-semibold">
                {new Date(currentStats.lastUpdated).toLocaleDateString()}
              </div>
              <div className="text-sm text-muted-foreground">Last Updated</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}