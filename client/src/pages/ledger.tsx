import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Download, AlertCircle, Vote, FileText, Calendar, TrendingUp } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useLocation } from "wouter";

interface CivicLedgerData {
  summary: {
    totalVotes: number;
    totalPetitions: number;
    totalActivities: number;
    totalPoints: number;
  };
  votes: Array<{
    id: number;
    itemId: number;
    itemType: string;
    voteValue: number;
    reasoning: string | null;
    timestamp: string;
  }>;
  petitions: Array<{
    id: number;
    petitionId: number;
    signedAt: string;
    petition: {
      title: string;
      description: string;
      currentSignatures: number;
      targetSignatures: number;
    };
  }>;
  activities: Array<{
    id: number;
    activityType: string;
    entityId: number;
    entityType: string;
    pointsEarned: number;
    details: any;
    createdAt: string;
  }>;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function Ledger() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, authLoading, navigate]);

  const { data, isLoading } = useQuery<CivicLedgerData>({
    queryKey: ["/api/civic-ledger"],
    enabled: isAuthenticated,
  });

  // Remove the fallbackLedgerData array and replace with API data only
  // const fallbackLedgerData = [
  //   {
  //     id: 1,
  //     activityType: 'vote',
  //     entityId: 1,
  //     entityType: 'bill',
  //     pointsEarned: 10,
  //     details: 'Supported the Climate Action Act.',
  //     createdAt: '2024-07-01',
  //   },
  //   {
  //     id: 2,
  //     activityType: 'petition',
  //     entityId: 2,
  //     entityType: 'petition',
  //     pointsEarned: 5,
  //     details: 'Environmental impact petition.',
  //     createdAt: '2024-06-15',
  //   }
  // ];

  // Use API data only. If no data, show fallback UI.
  const ledgerData = data && data.activities && data.activities.length > 0 ? data.activities : [];

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'vote': return <Vote className="h-4 w-4" />;
      case 'petition': return <FileText className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const getActivityColor = (activityType: string) => {
    switch (activityType) {
      case 'vote': return 'bg-green-100 text-green-800';
      case 'petition': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Civic Ledger</h1>
          <p className="text-gray-600">Loading your civic ledger...</p>
        </div>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your civic ledger...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  // If ledgerData is empty, show a fallback UI
  if (!ledgerData || ledgerData.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-5xl mb-4">📉</div>
          <h2 className="text-xl font-bold mb-2">No ledger data available</h2>
          <p className="text-gray-600">No civic engagement activities found. Participate in the platform to see your history here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
      <main className="container mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Civic Ledger</h1>
          <p className="text-gray-600">Complete history of your democratic participation and civic engagement</p>
        </div>

        {data?.summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{data.summary.totalActivities}</p>
                <p className="text-sm text-gray-600">Total Actions</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Vote className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{data.summary.totalVotes}</p>
                <p className="text-sm text-gray-600">Votes Cast</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <FileText className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{data.summary.totalPetitions}</p>
                <p className="text-sm text-gray-600">Petitions Signed</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Shield className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{data.summary.totalPoints}</p>
                <p className="text-sm text-gray-600">Civic Points</p>
              </CardContent>
            </Card>
          </div>
        )}

        <Card className="mb-8 bg-civic-green text-white">
          <CardContent className="p-6">
            <div className="flex items-start">
              <Shield className="text-2xl mr-4 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold mb-2">Cryptographic Security</h3>
                <p className="text-sm opacity-90">
                  Every vote is secured with a unique verification ID and block hash. 
                  This ensures your votes cannot be tampered with or deleted.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {ledgerData.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Civic Activity</h3>
              <p className="text-center text-muted-foreground mt-8">
                You haven&apos;t participated in any civic activities yet. Visit the Active Legislation page to start voting.
              </p>
              <Button className="bg-civic-blue hover:bg-blue-700">
                View Active Bills
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {ledgerData.map((activity) => (
              <Card key={activity.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <Badge className={`mr-2 flex items-center ${getActivityColor(activity.activityType)}`}>
                          {getActivityIcon(activity.activityType)}
                          <span className="ml-1">{activity.activityType}</span>
                        </Badge>
                        <h3 className="font-semibold text-gray-900">{activity.details}</h3>
                      </div>
                      <div className="flex items-center text-sm text-gray-500 space-x-4">
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(activity.createdAt)}
                        </span>
                        <span className="flex items-center text-green-600">
                          <Shield className="h-4 w-4 mr-1" />
                          +{activity.pointsEarned} points
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 mt-4 lg:mt-0">
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        Receipt
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}