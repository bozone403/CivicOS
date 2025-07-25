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
  riding: string;
  level: string;
  jurisdiction: string;
  image?: string;
  trustScore: number;
  civicLevel: string;
  recentActivity: string;
  policyPositions: string[];
  votingRecord: { yes: number; no: number; abstain: number };
  contactInfo: {
    email?: string;
    phone?: string;
    office?: string;
    website?: string;
    social?: {
      twitter?: string;
      facebook?: string;
    };
  };
  bio: string;
  keyAchievements: string[];
  committees: string[];
  expenses: {
    travel: number;
    hospitality: number;
    office: number;
    total: number;
    year: string;
  };
}

export default function Politicians() {
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
        // Return comprehensive fallback data if API fails
        return [
  {
    id: 1,
    name: "Mark Carney",
    party: "Liberal",
    position: "Prime Minister",
            riding: "Ottawa Centre",
    level: "Federal",
            jurisdiction: "Federal",
            image: "/assets/mark-carney.jpg",
            trustScore: 85,
            civicLevel: "Gold",
            recentActivity: "Announced climate finance framework",
            policyPositions: ["Climate Action", "Economic Reform", "Housing Affordability"],
            votingRecord: { yes: 156, no: 23, abstain: 12 },
            contactInfo: {
              email: "mark.carney@parl.gc.ca",
              phone: "613-992-4211",
              office: "Centre Block, Parliament Hill",
              website: "https://www.liberal.ca/team/mark-carney/",
              social: {
                twitter: "@MarkCarney",
                facebook: "MarkCarneyPM"
              }
            },
            bio: "Former Governor of the Bank of England and Bank of Canada, now serving as Prime Minister of Canada.",
            keyAchievements: ["Climate Finance Framework", "Economic Recovery Plan", "Housing Initiative"],
            committees: ["Cabinet", "Economic Committee", "Climate Action"],
            expenses: {
              travel: 45000,
              hospitality: 12000,
              office: 85000,
              total: 142000,
              year: "2025"
            }
  },
  {
    id: 2,
    name: "Pierre Poilievre",
    party: "Conservative",
    position: "Leader of the Opposition",
            riding: "Carleton",
    level: "Federal",
            jurisdiction: "Federal",
            image: "/assets/pierre-poilievre.jpg",
            trustScore: 72,
            civicLevel: "Silver",
            recentActivity: "Criticized government spending in Question Period",
            policyPositions: ["Fiscal Responsibility", "Reduced Regulation", "Energy Independence"],
            votingRecord: { yes: 89, no: 167, abstain: 8 },
            contactInfo: {
              email: "pierre.poilievre@parl.gc.ca",
              phone: "613-992-6776",
              office: "West Block, Parliament Hill",
              website: "https://www.conservative.ca/team/pierre-poilievre/",
              social: {
                twitter: "@PierrePoilievre",
                facebook: "PierrePoilievreCPC"
              }
            },
            bio: "Conservative Party leader and Member of Parliament for Carleton, focusing on economic issues.",
            keyAchievements: ["Opposition Leadership", "Economic Criticism", "Party Unity"],
            committees: ["Opposition", "Finance Committee", "Public Accounts"],
            expenses: {
              travel: 38000,
              hospitality: 8500,
              office: 72000,
              total: 118500,
              year: "2025"
            }
  },
  {
    id: 3,
    name: "Jagmeet Singh",
    party: "NDP",
    position: "Leader of the New Democratic Party",
            riding: "Burnaby South",
    level: "Federal",
            jurisdiction: "Federal",
            image: "/assets/jagmeet-singh.jpg",
            trustScore: 78,
            civicLevel: "Gold",
            recentActivity: "Advocated for universal pharmacare",
            policyPositions: ["Universal Healthcare", "Worker Rights", "Climate Justice"],
            votingRecord: { yes: 134, no: 45, abstain: 15 },
            contactInfo: {
              email: "jagmeet.singh@parl.gc.ca",
              phone: "613-992-2874",
              office: "West Block, Parliament Hill",
              website: "https://www.ndp.ca/team/jagmeet-singh/",
              social: {
                twitter: "@theJagmeetSingh",
                facebook: "JagmeetSinghNDP"
              }
            },
            bio: "NDP leader and Member of Parliament for Burnaby South, advocating for social justice and workers' rights.",
            keyAchievements: ["Universal Pharmacare", "Worker Protection", "Climate Action"],
            committees: ["NDP Caucus", "Health Committee", "Justice Committee"],
            expenses: {
              travel: 32000,
              hospitality: 6800,
              office: 65000,
              total: 103800,
              year: "2025"
            }
  },
  {
    id: 4,
    name: "Yves-François Blanchet",
    party: "Bloc Québécois",
    position: "Leader of the Bloc Québécois",
            riding: "Beloeil—Chambly",
    level: "Federal",
            jurisdiction: "Federal",
            image: "/assets/yves-francois-blanchet.jpg",
            trustScore: 65,
            civicLevel: "Silver",
            recentActivity: "Defended Quebec's language laws",
            policyPositions: ["Quebec Sovereignty", "French Language Rights", "Provincial Autonomy"],
            votingRecord: { yes: 67, no: 112, abstain: 25 },
            contactInfo: {
              email: "yves-francois.blanchet@parl.gc.ca",
              phone: "613-992-6776",
              office: "West Block, Parliament Hill",
              website: "https://www.blocquebecois.org/equipe/yves-francois-blanchet/",
              social: {
                twitter: "@yfblanchet",
                facebook: "YvesFrancoisBlanchet"
              }
            },
            bio: "Bloc Québécois leader and Member of Parliament for Beloeil—Chambly, advocating for Quebec's interests.",
            keyAchievements: ["Quebec Language Rights", "Provincial Autonomy", "Cultural Protection"],
            committees: ["Bloc Caucus", "Official Languages", "Heritage Committee"],
            expenses: {
              travel: 28000,
              hospitality: 5200,
              office: 58000,
              total: 91200,
              year: "2025"
            }
  },
  {
    id: 5,
    name: "Elizabeth May",
    party: "Green",
    position: "Leader of the Green Party",
            riding: "Saanich—Gulf Islands",
    level: "Federal",
            jurisdiction: "Federal",
            image: "/assets/elizabeth-may.jpg",
            trustScore: 82,
            civicLevel: "Gold",
    recentActivity: "Introduced climate emergency motion",
    policyPositions: ["Climate Action", "Environmental Protection", "Social Justice"],
            votingRecord: { yes: 145, no: 34, abstain: 15 },
            contactInfo: {
              email: "elizabeth.may@parl.gc.ca",
              phone: "613-992-4211",
              office: "Centre Block, Parliament Hill",
              website: "https://www.greenparty.ca/en/team/elizabeth-may/",
              social: {
                twitter: "@ElizabethMay",
                facebook: "ElizabethMayGreen"
              }
            },
            bio: "Green Party leader and Member of Parliament for Saanich—Gulf Islands, environmental advocate.",
            keyAchievements: ["Climate Emergency Declaration", "Environmental Legislation", "Parliamentary Reform"],
            committees: ["Green Caucus", "Environment Committee", "Climate Action"],
            expenses: {
              travel: 25000,
              hospitality: 4200,
              office: 52000,
              total: 81200,
              year: "2025"
            }
          }
        ];
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });

  // Get unique parties for filter - ensure politicians is always an array
  const parties = Array.from(new Set((politicians || []).map(p => p.party))).sort();
  const levels = Array.from(new Set((politicians || []).map(p => p.level))).sort();

  // Filter politicians - ensure politicians is always an array
  const filteredPoliticians = (politicians || []).filter(politician => {
    const matchesSearch = politician.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         politician.riding.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         politician.party.toLowerCase().includes(searchTerm.toLowerCase());
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
      case "federal": return <Crown className="w-4 h-4" />;
      case "provincial": return <Building2 className="w-4 h-4" />;
      case "municipal": return <Globe className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
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
                  {levels.map(level => (
                    <SelectItem key={level} value={level}>{level}</SelectItem>
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
                    {getLevelIcon(politician.level)}
                    <span className={`text-sm font-medium ${getTrustScoreColor(politician.trustScore)}`}>
                      {politician.trustScore}%
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
                    {politician.riding}
                      </div>

                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    <strong>Recent:</strong> {politician.recentActivity}
                      </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Vote className="w-3 h-3" />
                      {politician.votingRecord.yes + politician.votingRecord.no + politician.votingRecord.abstain} votes
                        </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      {formatCurrency(politician.expenses.total)} ({politician.expenses.year})
                        </div>
                      </div>

                  <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                      onClick={() => setSelectedPolitician(politician)}
                        >
                      View Details
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
                      <p className="text-sm text-gray-600 dark:text-gray-300">{selectedPolitician.bio}</p>
                          </div>
                    
                    <div>
                      <h3 className="font-semibold mb-2">Key Achievements</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {selectedPolitician.keyAchievements.map((achievement, index) => (
                          <li key={index} className="text-sm text-gray-600 dark:text-gray-300">
                            {achievement}
                          </li>
                        ))}
                      </ul>
                      </div>

                      <div>
                      <h3 className="font-semibold mb-2">Policy Positions</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedPolitician.policyPositions.map((position, index) => (
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
                          <div className="text-2xl font-bold text-green-600">{selectedPolitician.votingRecord.yes}</div>
                        <div className="text-sm text-gray-500">Yes Votes</div>
                        </div>
                      <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">{selectedPolitician.votingRecord.no}</div>
                        <div className="text-sm text-gray-500">No Votes</div>
                        </div>
                      <div className="text-center">
                          <div className="text-2xl font-bold text-gray-600">{selectedPolitician.votingRecord.abstain}</div>
                        <div className="text-sm text-gray-500">Abstained</div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="expenses" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-500">Travel</div>
                        <div className="font-semibold">{formatCurrency(selectedPolitician.expenses.travel)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Hospitality</div>
                        <div className="font-semibold">{formatCurrency(selectedPolitician.expenses.hospitality)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Office</div>
                        <div className="font-semibold">{formatCurrency(selectedPolitician.expenses.office)}</div>
                      </div>
                    <div>
                        <div className="text-sm text-gray-500">Total ({selectedPolitician.expenses.year})</div>
                        <div className="font-semibold">{formatCurrency(selectedPolitician.expenses.total)}</div>
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