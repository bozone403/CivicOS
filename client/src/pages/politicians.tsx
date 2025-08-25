import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  MapPin, 
  Mail, 
  Phone, 
  ExternalLink, 
  TrendingUp, 
  TrendingDown, 
  Users,
  Vote,
  Calendar,
  DollarSign,
  Crown,
  Building2,
  Globe,
  Heart,
  Share2,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Star,
  Award,
  Shield
} from "lucide-react";

interface Politician {
  id: number;
  name: string;
  party: string;
  position: string;
  riding: string | null;
  level?: string;
  jurisdiction?: string;
  image?: string | null;
  trustScore?: number;
  civicLevel?: string;
  recentActivity?: string;
  policyPositions?: string[];
  votingRecord: Record<string, any>;
  contactInfo: Record<string, any>;
  bio?: string;
  keyAchievements?: string[];
  committees?: string[];
  expenses?: Record<string, any>;
  // Real API fields
  partyAffiliation?: string | null;
  constituency: string;
  electionDate?: string | null;
  termStart?: string | null;
  termEnd?: string | null;
  isIncumbent: boolean;
  biography?: string | null;
  socialMedia: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export default function Politicians() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [partyFilter, setPartyFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [selectedPolitician, setSelectedPolitician] = useState<Politician | null>(null);

  // Fetch politicians from comprehensive data service
  const { data: politicians = [], isLoading, error } = useQuery<Politician[]>({
    queryKey: ['/api/politicians'],
    queryFn: async () => {
      try {
        const result = await apiRequest('/api/politicians', 'GET');
        // Handle wrapped API response format
        if (result && typeof result === 'object' && 'data' in result) {
          return Array.isArray(result.data) ? result.data : [];
        }
        // Fallback for direct array response
        return Array.isArray(result) ? result : [];
      } catch (error) {
        console.error('Failed to fetch politicians:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  // Get unique parties for filter - ensure politicians is always an array
  const parties = Array.from(new Set((politicians || []).map(p => p.party))).sort();
  const levels = Array.from(new Set((politicians || []).map(p => p.level))).sort();

  // Filter politicians - ensure politicians is always an array
  const filteredPoliticians = (politicians || []).filter(politician => {
    const matchesSearch = politician.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         politician.party.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (politician.riding && politician.riding.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesParty = partyFilter === "all" || politician.party === partyFilter;
    const matchesLevel = levelFilter === "all" || politician.level === levelFilter;
    
    return matchesSearch && matchesParty && matchesLevel;
  });

  const getPartyColor = (party: string) => {
    switch (party.toLowerCase()) {
      case "liberal": return "bg-red-100 text-red-800 border-red-300";
      case "conservative": return "bg-blue-100 text-blue-800 border-blue-300";
      case "ndp": return "bg-orange-100 text-orange-800 border-orange-300";
      case "bloc québécois": return "bg-cyan-100 text-cyan-800 border-cyan-300";
      case "green": return "bg-green-100 text-green-800 border-green-300";
      case "progressive conservative": return "bg-purple-100 text-purple-800 border-purple-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case "federal": return <Crown className="w-4 h-4 text-yellow-600" />;
      case "provincial": return <Building2 className="w-4 h-4 text-blue-600" />;
      case "municipal": return <MapPin className="w-4 h-4 text-green-600" />;
      default: return <Users className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTrustScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto"></div>
            <p className="text-lg font-medium text-slate-600 dark:text-slate-400">
              Loading politician data...
            </p>
                </div>
        </main>
            </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center space-y-4">
            <p className="text-lg font-medium text-red-600">
              Failed to load politician data
            </p>
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Canadian Politicians
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Track your elected representatives across all levels of government - accurate as of July 2025
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                placeholder="Search by name, riding, or party..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
            </div>
            <Select value={partyFilter} onValueChange={setPartyFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Filter by party" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Parties</SelectItem>
                {parties.map(party => (
                  <SelectItem key={party} value={party}>{party}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Filter by level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  {Array.from(new Set(politicians.map(p => p.level).filter(Boolean))).map((level) => (
                      <SelectItem key={level} value={level!}>{level}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs">
              {filteredPoliticians.length} politicians found
            </Badge>
            <Badge variant="outline" className="text-xs">
              Updated July 2025
            </Badge>
          </div>
        </div>

        {/* Politicians Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPoliticians.map((politician) => (
            <Card key={politician.id} className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{politician.name}</CardTitle>
                    <CardDescription className="text-sm mt-1">
                      {politician.position}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1">
                    {getLevelIcon(politician.level || "")}
                    <span className={`text-sm font-medium ${getTrustScoreColor(politician.trustScore || 0)}`}>
                      {politician.trustScore || 0}%
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge className={getPartyColor(politician.party)}>
                    {politician.party}
                  </Badge>
                          <Badge variant="outline" className="text-xs">
                            {politician.level}
                          </Badge>
                    </div>
                  </CardHeader>
              
                  <CardContent>
                    <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <MapPin className="w-4 h-4 mr-2" />
                    {politician.riding || politician.constituency || "N/A"}
                      </div>

                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    <strong>Recent:</strong> {politician.recentActivity || "No recent activity"}
                      </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Vote className="w-3 h-3" />
                      {(politician.votingRecord?.yes || 0) + (politician.votingRecord?.no || 0) + (politician.votingRecord?.abstain || 0)} votes
                        </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      {formatCurrency(politician.expenses?.total || 0)} ({politician.expenses?.year || "N/A"})
                        </div>
                      </div>

                  <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                      onClick={() => setSelectedPolitician(politician)}
                        >
                      View Details
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const shareUrl = `${window.location.origin}/politicians?id=${politician.id}`;
                            const shareText = `Check out ${politician.name} (${politician.party}) on CivicOS`;
                            
                            if (navigator.share) {
                              navigator.share({
                                title: politician.name,
                                text: shareText,
                                url: shareUrl,
                              });
                            } else {
                              navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
                              toast({
                                title: "Link copied!",
                                description: "Politician profile link has been copied to your clipboard.",
                              });
                            }
                          }}
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                    {politician.contactInfo.email && (
                      <Button size="sm" variant="outline" className="px-3">
                        <Mail className="w-4 h-4" />
                        </Button>
                    )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

        {filteredPoliticians.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No politicians found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Try adjusting your search criteria or filters.
            </p>
          </div>
        )}

        {/* Detailed View Modal/Sidebar could go here */}
            {selectedPolitician && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-2xl font-bold">{selectedPolitician.name}</h2>
                    <p className="text-gray-600 dark:text-gray-300">{selectedPolitician.position}</p>
                  </div>
                  <Button variant="outline" onClick={() => setSelectedPolitician(null)}>
                    Close
                  </Button>
                    </div>

                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="voting">Voting</TabsTrigger>
                    <TabsTrigger value="expenses">Expenses</TabsTrigger>
                    <TabsTrigger value="contact">Contact</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4">
                      <div>
                      <h3 className="font-semibold mb-2">Biography</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{selectedPolitician.bio || "No biography available."}</p>
                          </div>
                    
                    <div>
                      <h3 className="font-semibold mb-2">Key Achievements</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {selectedPolitician.keyAchievements?.map((achievement, index) => (
                          <li key={index} className="text-sm text-gray-600 dark:text-gray-300">
                            {achievement}
                          </li>
                        ))}
                      </ul>
                      </div>

                      <div>
                      <h3 className="font-semibold mb-2">Policy Positions</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedPolitician.policyPositions?.map((position, index) => (
                          <Badge key={index} variant="outline">
                            {position}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="voting" className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{selectedPolitician.votingRecord?.yes || 0}</div>
                        <div className="text-sm text-gray-500">Yes Votes</div>
                        </div>
                      <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">{selectedPolitician.votingRecord?.no || 0}</div>
                        <div className="text-sm text-gray-500">No Votes</div>
                        </div>
                      <div className="text-center">
                          <div className="text-2xl font-bold text-gray-600">{selectedPolitician.votingRecord?.abstain || 0}</div>
                        <div className="text-sm text-gray-500">Abstained</div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="expenses" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-500">Travel</div>
                        <div className="font-semibold">{formatCurrency(selectedPolitician.expenses?.travel || 0)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Hospitality</div>
                        <div className="font-semibold">{formatCurrency(selectedPolitician.expenses?.hospitality || 0)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Office</div>
                        <div className="font-semibold">{formatCurrency(selectedPolitician.expenses?.office || 0)}</div>
                      </div>
                    <div>
                        <div className="text-sm text-gray-500">Total ({selectedPolitician.expenses?.year || "N/A"})</div>
                        <div className="font-semibold">{formatCurrency(selectedPolitician.expenses?.total || 0)}</div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="contact" className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      {selectedPolitician.contactInfo.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          <a href={`mailto:${selectedPolitician.contactInfo.email}`} className="text-blue-600 hover:underline">
                            {selectedPolitician.contactInfo.email}
                          </a>
                        </div>
                      )}
                      {selectedPolitician.contactInfo.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          <a href={`tel:${selectedPolitician.contactInfo.phone}`} className="text-blue-600 hover:underline">
                            {selectedPolitician.contactInfo.phone}
                          </a>
                        </div>
                      )}
                      {selectedPolitician.contactInfo.office && (
                        <div className="flex items-start gap-2">
                          <Building2 className="w-4 h-4 mt-1" />
                          <div className="text-sm">{selectedPolitician.contactInfo.office}</div>
                        </div>
                      )}
                      {selectedPolitician.contactInfo.website && (
                        <div className="flex items-center gap-2">
                          <ExternalLink className="w-4 h-4" />
                          <a href={selectedPolitician.contactInfo.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            Official Website
                          </a>
                      </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
            )}
      </main>
    </div>
  );
}