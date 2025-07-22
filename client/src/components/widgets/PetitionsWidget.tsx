import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FileText, Users, Target, Clock, TrendingUp, AlertCircle, Share2 } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useCivicSocialPost } from "@/hooks/useCivicSocial";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { useState } from "react";
import { ShareToCivicSocialDialog } from "@/components/ui/ShareToCivicSocialDialog";

interface Petition {
  id: number;
  title: string;
  description: string;
  targetSignatures: number;
  currentSignatures: number;
  status: 'active' | 'closed' | 'successful' | 'failed';
  category: string;
  creator: {
    name: string;
    verified: boolean;
  };
  createdAt: string;
  deadlineDate?: string;
  targetOfficial?: string;
  impact: 'local' | 'provincial' | 'federal';
  urgency: 'low' | 'medium' | 'high';
  recentActivity: {
    signaturesLast24h: number;
    trending: boolean;
  };
}

interface UserSignature {
  petitionId: number;
  signedAt: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
}

// Add PetitionStats interface for type safety
interface PetitionStats {
  totalSignatures: number;
}

const MOCK_DASHBOARD = false;

export default function PetitionsWidget({ liveData = true }: { liveData?: boolean }) {
  if (MOCK_DASHBOARD) {
    const petitions = [
      { id: 1, title: 'Demo Petition 1', description: 'A demo petition', targetSignatures: 1000, currentSignatures: 500, status: 'active', category: 'Demo', creator: { name: 'Jane Doe', verified: true }, createdAt: '', impact: 'federal', urgency: 'high', recentActivity: { signaturesLast24h: 10, trending: true } },
      { id: 2, title: 'Demo Petition 2', description: 'Another demo petition', targetSignatures: 500, currentSignatures: 250, status: 'active', category: 'Demo', creator: { name: 'John Smith', verified: false }, createdAt: '', impact: 'provincial', urgency: 'medium', recentActivity: { signaturesLast24h: 5, trending: false } },
    ];
    const petitionStats = { totalSignatures: 750 };
    return (
      <Card className="h-96 flex flex-col">
        <CardHeader className="pb-3 flex-shrink-0">
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-sm sm:text-base">Active Petitions (Demo)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {petitions.map((p) => (
              <div key={p.id} className="border rounded-lg p-3">
                <div className="font-bold">{p.title}</div>
                <div className="text-xs text-gray-600">{p.category} • {p.impact}</div>
                <div className="text-xs text-gray-500">Signatures: {p.currentSignatures}/{p.targetSignatures}</div>
                <div className="text-xs text-gray-400">Trending: {p.recentActivity.trending ? 'Yes' : 'No'}</div>
              </div>
            ))}
            <div className="mt-2 text-xs text-gray-700">Total Signatures: {petitionStats.totalSignatures}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { data: petitions = [], isLoading: petitionsLoading } = useQuery<Petition[]>({
    queryKey: ['/api/petitions'],
    refetchInterval: 180000, // Refresh every 3 minutes
    select: (data) => data.slice(0, 6), // Show latest 6 petitions
  });

  const { data: userSignatures = [], isLoading: signaturesLoading } = useQuery<UserSignature[]>({
    queryKey: ['/api/petitions/user-signatures'],
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  // Use PetitionStats as the generic type
  const { data: petitionStats } = useQuery<PetitionStats>({
    queryKey: ['/api/petitions/stats'],
    refetchInterval: 300000,
  });

  // Fallback data when API returns empty
  const fallbackPetitions: Petition[] = [
    {
      id: 1,
      title: 'Strengthen Climate Action Targets',
      description: 'Petition to increase Canada\'s carbon reduction targets and implement stronger climate policies',
      targetSignatures: 50000,
      currentSignatures: 42350,
      status: 'active',
      category: 'Environment',
      creator: { name: 'Climate Action Canada', verified: true },
      createdAt: '2024-01-10T00:00:00Z',
      deadlineDate: '2024-03-15T00:00:00Z',
      targetOfficial: 'Justin Trudeau',
      impact: 'federal',
      urgency: 'high',
      recentActivity: { signaturesLast24h: 245, trending: true }
    },
    {
      id: 2,
      title: 'Improve Healthcare Access in Rural Areas',
      description: 'Petition to increase healthcare funding and services in rural and remote communities',
      targetSignatures: 25000,
      currentSignatures: 18750,
      status: 'active',
      category: 'Healthcare',
      creator: { name: 'Rural Health Coalition', verified: true },
      createdAt: '2024-01-12T00:00:00Z',
      deadlineDate: '2024-04-20T00:00:00Z',
      targetOfficial: 'Jean-Yves Duclos',
      impact: 'federal',
      urgency: 'medium',
      recentActivity: { signaturesLast24h: 89, trending: false }
    },
    {
      id: 3,
      title: 'Support Small Business Recovery',
      description: 'Petition for additional financial support and tax relief for small businesses affected by economic challenges',
      targetSignatures: 15000,
      currentSignatures: 12340,
      status: 'active',
      category: 'Economy',
      creator: { name: 'Canadian Small Business Alliance', verified: false },
      createdAt: '2024-01-14T00:00:00Z',
      deadlineDate: '2024-05-10T00:00:00Z',
      targetOfficial: 'Chrystia Freeland',
      impact: 'federal',
      urgency: 'medium',
      recentActivity: { signaturesLast24h: 156, trending: true }
    },
    {
      id: 4,
      title: 'Protect Indigenous Land Rights',
      description: 'Petition to strengthen legal protections for Indigenous land rights and treaty obligations',
      targetSignatures: 35000,
      currentSignatures: 28920,
      status: 'active',
      category: 'Indigenous Rights',
      creator: { name: 'Indigenous Rights Network', verified: true },
      createdAt: '2024-01-08T00:00:00Z',
      deadlineDate: '2024-02-28T00:00:00Z',
      targetOfficial: 'Marc Miller',
      impact: 'federal',
      urgency: 'high',
      recentActivity: { signaturesLast24h: 312, trending: true }
    }
  ];

  const fallbackPetitionStats = { totalSignatures: 102360 };

  // Use liveData to determine whether to use real data or fallback
  const displayPetitions = liveData && petitions.length > 0 ? petitions : fallbackPetitions;
  const displayPetitionStats = petitionStats || fallbackPetitionStats;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'successful': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'closed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'federal': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'provincial': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'local': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getUserSignature = (petitionId: number) => {
    return userSignatures.find(sig => sig.petitionId === petitionId);
  };

  const isActive = (petition: Petition) => {
    return petition.status === 'active' && (!petition.deadlineDate || new Date(petition.deadlineDate) > new Date());
  };

  const { user } = useAuth();
  const civicSocialPost = useCivicSocialPost();
  const { toast } = useToast();
  const [shareDialog, setShareDialog] = useState<{ open: boolean; petition?: Petition }>({ open: false });
  const [shareComment, setShareComment] = useState("");

  if (petitionsLoading && signaturesLoading) {
    return (
      <Card className="h-96">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Active Petitions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-96 flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-sm sm:text-base">Active Petitions</span>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <Badge variant="outline" className="text-xs px-1 sm:px-2">
              {displayPetitions.filter(p => p.status === 'active').length} Active
            </Badge>
            {displayPetitionStats && (
              <Badge variant="secondary" className="text-xs px-1 sm:px-2">
                {displayPetitionStats.totalSignatures || 0} Signatures
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto pr-2">
        <div className="space-y-3">
          {/* Show petitions with fallback data */}
          {displayPetitions.map((petition) => {
                const userSignature = getUserSignature(petition.id);
                const progress = calculateProgress(petition.currentSignatures, petition.targetSignatures);
                
                return (
                  <div key={petition.id} className="border rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge variant="secondary" className="text-xs">{petition.category}</Badge>
                          <Badge className={`text-xs ${getStatusColor(petition.status)}`}>
                            {petition.status}
                          </Badge>
                          <Badge className={`text-xs ${getImpactColor(petition.impact)}`}>
                            {petition.impact}
                          </Badge>
                          {petition.recentActivity?.trending && (
                            <TrendingUp className="h-3 w-3 text-orange-500" />
                          )}
                        </div>
                        <h4 className="font-medium text-sm mb-1 line-clamp-2">{petition.title}</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                          {petition.description}
                        </p>
                      </div>
                    </div>

                    {/* Creator & Target */}
                    <div className="flex items-center space-x-4 mb-2 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Users className="h-3 w-3" />
                        <span>{petition.creator?.name || 'Unknown'}</span>
                        {petition.creator?.verified && <span className="text-green-500">✓</span>}
                      </div>
                      {petition.targetOfficial && (
                        <div className="flex items-center space-x-1">
                          <Target className="h-3 w-3" />
                          <span>{petition.targetOfficial}</span>
                        </div>
                      )}
                    </div>

                    {/* Progress */}
                    <div className="space-y-1 mb-2">
                      <Progress value={progress} className="h-1.5" />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{petition.currentSignatures.toLocaleString()} signatures</span>
                        <span>{Math.round(progress)}% of goal</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <TrendingUp className="h-3 w-3" />
                        <span>+{petition.recentActivity?.signaturesLast24h || 0} today</span>
                        {petition.deadlineDate && (
                          <>
                            <span>•</span>
                            <Clock className="h-3 w-3" />
                            <span>{new Date(petition.deadlineDate).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                      
                      {userSignature ? (
                        <Badge variant="secondary" className="text-xs">
                          Signed
                        </Badge>
                      ) : isActive(petition) ? (
                        <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
                          Sign
                        </Button>
                      ) : (
                        <span className="text-xs text-gray-400">Closed</span>
                      )}
                    </div>

                    {/* Share to CivicSocial button */}
                    <ShareToCivicSocialDialog
                      trigger={
                        <Button variant="outline" size="sm" className="mt-2">
                          <Share2 className="h-4 w-4 mr-1" />
                          Share to CivicSocial
                        </Button>
                      }
                      itemType="petition"
                      itemId={petition.id}
                      title={petition.title}
                      summary={petition.description}
                    />
                  </div>
                );
              })}
        </div>

        <div className="mt-4 pt-3 border-t">
          <Link href="/petitions">
            <Button variant="outline" size="sm" className="w-full">
              <FileText className="h-4 w-4 mr-2" />
              View All Petitions
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}