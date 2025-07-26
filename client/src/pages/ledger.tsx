import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Download, AlertCircle, Vote, FileText, Calendar, TrendingUp, AlertTriangle } from "lucide-react";
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

// Fallback ledger data
const fallbackLedgerData: CivicLedgerData = {
  summary: {
    totalVotes: 12,
    totalPetitions: 8,
    totalActivities: 20,
    totalPoints: 245
  },
  votes: [
    {
      id: 1,
      itemId: 101,
      itemType: "bill",
      voteValue: 1,
      reasoning: "Supported the Climate Action Act for environmental protection",
      timestamp: "2024-12-15T10:30:00Z"
    },
    {
      id: 2,
      itemId: 102,
      itemType: "bill",
      voteValue: -1,
      reasoning: "Opposed the Budget Bill due to concerns about spending priorities",
      timestamp: "2024-12-10T14:20:00Z"
    }
  ],
  petitions: [
    {
      id: 1,
      petitionId: 101,
      signedAt: "2024-12-01T09:15:00Z",
      petition: {
        title: "Universal Pharmacare Now",
        description: "Petition calling for immediate implementation of universal pharmacare",
        currentSignatures: 87650,
        targetSignatures: 100000
      }
    },
    {
      id: 2,
      petitionId: 102,
      signedAt: "2024-11-25T16:45:00Z",
      petition: {
        title: "Climate Emergency Declaration",
        description: "Petition demanding federal climate emergency declaration",
        currentSignatures: 92340,
        targetSignatures: 75000
      }
    }
  ],
  activities: [
    {
      id: 1,
      activityType: 'vote',
      entityId: 101,
      entityType: 'bill',
      pointsEarned: 10,
      details: 'Supported the Climate Action Act.',
      createdAt: '2024-12-15T10:30:00Z'
    },
    {
      id: 2,
      activityType: 'petition',
      entityId: 101,
      entityType: 'petition',
      pointsEarned: 5,
      details: 'Signed Universal Pharmacare petition.',
      createdAt: '2024-12-01T09:15:00Z'
    },
    {
      id: 3,
      activityType: 'vote',
      entityId: 102,
      entityType: 'bill',
      pointsEarned: 10,
      details: 'Opposed the Budget Bill.',
      createdAt: '2024-12-10T14:20:00Z'
    },
    {
      id: 4,
      activityType: 'petition',
      entityId: 102,
      entityType: 'petition',
      pointsEarned: 5,
      details: 'Signed Climate Emergency petition.',
      createdAt: '2024-11-25T16:45:00Z'
    }
  ]
};

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

  const { data, isLoading, error } = useQuery<CivicLedgerData>({
    queryKey: ["/api/civic-ledger"],
    queryFn: async () => {
      try {
        const response = await apiRequest("/api/civic-ledger", "GET");
        return response;
      } catch (error) {
        // console.error removed for production
        return fallbackLedgerData;
      }
    },
    enabled: isAuthenticated,
    retry: 1,
  });

  // Use API data or fallback data
  const ledgerData = data || fallbackLedgerData;

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
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getVoteColor = (voteValue: number) => {
    switch (voteValue) {
      case 1: return 'bg-green-100 text-green-800';
      case -1: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getVoteText = (voteValue: number) => {
    switch (voteValue) {
      case 1: return 'SUPPORTED';
      case -1: return 'OPPOSED';
      default: return 'ABSTAINED';
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Shield className="w-12 h-12 mx-auto mb-4 text-gray-400 animate-pulse" />
          <p className="text-gray-600">Loading authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
          <h2 className="text-xl font-bold mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-4">Please log in to view your civic ledger</p>
          <Button onClick={() => navigate('/auth')}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
        <div className="container mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Shield className="w-12 h-12 mx-auto mb-4 text-gray-400 animate-pulse" />
              <p className="text-gray-600">Loading your civic ledger...</p>
            </div>
          </div>
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
          {error && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                <AlertTriangle className="inline w-4 h-4 mr-1" />
                Showing sample data due to connection issues.
              </p>
            </div>
          )}
        </div>

        {ledgerData.summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{ledgerData.summary.totalActivities}</p>
                <p className="text-sm text-gray-600">Total Actions</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Vote className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{ledgerData.summary.totalVotes}</p>
                <p className="text-sm text-gray-600">Votes Cast</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <FileText className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{ledgerData.summary.totalPetitions}</p>
                <p className="text-sm text-gray-600">Petitions Signed</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Shield className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{ledgerData.summary.totalPoints}</p>
                <p className="text-sm text-gray-600">Civic Points</p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Votes */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Recent Votes</h2>
                <Badge variant="outline">{ledgerData.votes.length} votes</Badge>
              </div>
              <div className="space-y-4">
                {ledgerData.votes.map((vote) => (
                  <div key={vote.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Vote className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">Bill #{vote.itemId}</span>
                        <Badge className={getVoteColor(vote.voteValue)}>
                          {getVoteText(vote.voteValue)}
                        </Badge>
                      </div>
                      {vote.reasoning && (
                        <p className="text-sm text-gray-600 mt-1">{vote.reasoning}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        {formatDate(vote.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Petitions */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Signed Petitions</h2>
                <Badge variant="outline">{ledgerData.petitions.length} petitions</Badge>
              </div>
              <div className="space-y-4">
                {ledgerData.petitions.map((petition) => (
                  <div key={petition.id} className="p-4 border rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <FileText className="w-4 h-4 text-purple-500" />
                      <span className="font-medium">{petition.petition.title}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {petition.petition.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>
                        {petition.petition.currentSignatures.toLocaleString()} / {petition.petition.targetSignatures.toLocaleString()} signatures
                      </span>
                      <span>{formatDate(petition.signedAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Timeline */}
        <Card className="mt-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Activity Timeline</h2>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
            </div>
            <div className="space-y-4">
              {ledgerData.activities.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <div className={`p-2 rounded-full ${getActivityColor(activity.activityType)}`}>
                    {getActivityIcon(activity.activityType)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium">{activity.details}</span>
                      <Badge className={getActivityColor(activity.activityType)}>
                        +{activity.pointsEarned} points
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500">
                      {formatDate(activity.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}