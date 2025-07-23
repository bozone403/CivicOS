
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
  totalVotes: number;
  activeBills: number;
  politiciansTracked: number;
  petitionsSigned: number;
  civicPoints: number;
  trustScore: number;
  recentActivity: Array<{
    id: string;
    type: string;
    title: string;
    timestamp: string;
    icon: string;
  }>;
}

export default function Dashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
    queryFn: async () => {
      console.log('🔍 Dashboard API call starting...');
      console.log('🔍 User:', user);
      console.log('🔍 Token:', localStorage.getItem('civicos-jwt'));
      
      try {
        const result = await apiRequest('/api/dashboard/stats', 'GET');
        console.log('✅ Dashboard API call successful:', result);
        return result;
      } catch (error) {
        console.error('❌ Dashboard API call failed:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  // Debug logging
  console.log('Dashboard Debug:', { user, isLoading, error, stats });

  if (isLoading) {
    console.log('Dashboard is loading...');
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    console.log('Dashboard error:', error);
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

  const currentStats = stats || {
    totalVotes: 0,
    activeBills: 0,
    politiciansTracked: 0,
    petitionsSigned: 0,
    civicPoints: 0,
    trustScore: 100,
    recentActivity: []
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Welcome back, {user?.firstName || 'Citizen'}!
            </h1>
            <p className="text-blue-100 mt-2">
              Stay engaged with Canadian democracy. Your voice matters.
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{currentStats.civicPoints}</div>
            <div className="text-blue-100 text-sm">Civic Points</div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnimatedCardWithIcon
          icon={<Vote className="h-4 w-4" />}
          title="Total Votes"
          description="Bills and petitions voted on"
          value={currentStats.totalVotes}
          trend="up"
        />
        
        <AnimatedCardWithIcon
          icon={<FileText className="h-4 w-4" />}
          title="Active Bills"
          description="Currently in parliament"
          value={currentStats.activeBills}
          trend="neutral"
        />
        
        <AnimatedCardWithIcon
          icon={<Users className="h-4 w-4" />}
          title="Politicians Tracked"
          description="Representatives you follow"
          value={currentStats.politiciansTracked}
          trend="up"
        />
        
        <AnimatedCardWithIcon
          icon={<Target className="h-4 w-4" />}
          title="Petitions Signed"
          description="Causes you support"
          value={currentStats.petitionsSigned}
          trend="up"
        />
      </div>

      {/* Trust Score & Achievements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              Trust Score & Achievements
            </CardTitle>
            <CardDescription>
              Your civic engagement level and recent achievements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {currentStats.trustScore}%
                </div>
                <div className="text-sm text-muted-foreground">Trust Score</div>
              </div>
              <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-600 rounded-full transition-all duration-500"
                  style={{ width: `${currentStats.trustScore}%` }}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Award className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-lg font-semibold">Level {Math.floor(currentStats.civicPoints / 100) + 1}</div>
                <div className="text-sm text-muted-foreground">Civic Champion</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Sparkles className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="text-lg font-semibold">{Math.floor(currentStats.civicPoints / 50)}</div>
                <div className="text-sm text-muted-foreground">Badges Earned</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Your latest civic engagement activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentStats.recentActivity.length > 0 ? (
                currentStats.recentActivity.map((activity, index) => (
                  <div 
                    key={activity.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      {activity.icon === 'vote' && <Vote className="h-4 w-4 text-blue-600" />}
                      {activity.icon === 'petition' && <Target className="h-4 w-4 text-green-600" />}
                      {activity.icon === 'comment' && <MessageSquare className="h-4 w-4 text-purple-600" />}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{activity.title}</div>
                      <div className="text-xs text-muted-foreground">{activity.timestamp}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No recent activity</p>
                  <p className="text-sm">Start engaging to see your activity here</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Jump into civic engagement activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Vote className="h-6 w-6" />
              <span>Vote on Bills</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Users className="h-6 w-6" />
              <span>Track Politicians</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <FileText className="h-6 w-6" />
              <span>Read News</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <MessageSquare className="h-6 w-6" />
              <span>Join Discussion</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}