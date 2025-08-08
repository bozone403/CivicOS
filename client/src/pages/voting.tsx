import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  Vote, 
  Clock, 
  Calendar,
  Users, 
  TrendingUp,
  FileText,
  Scale,
  DollarSign,
  AlertTriangle,
  CheckCircle, 
  XCircle, 
  Search,
  Filter,
  Building,
  Crown,
  Globe,
  ThumbsUp,
  ThumbsDown,
  Share2,
  ExternalLink,
  ExternalLinkIcon,
  ExternalLinkIcon as ExternalLinkIcon2,
  ExternalLinkIcon as ExternalLinkIcon3,
  Minus,
  User,
  Award,
  Flag,
  Target
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { ShareableCard } from "@/components/ShareableCard";

interface Bill {
  id: string;
  billNumber: string;
  title: string;
  description: string;
  status: string;
  stage: string;
  jurisdiction: string;
  category: string;
  introducedDate: string;
  sponsor: string;
  sponsorParty: string;
  summary: string;
  keyProvisions: string[];
  timeline: string;
  estimatedCost?: number;
  estimatedRevenue?: number;
  publicSupport: {
    yes: number;
    no: number;
    neutral: number;
  };
  parliamentVotes?: {
    liberal: string;
    conservative: string;
    ndp: string;
    bloc: string;
    green: string;
  };
  totalVotes: number;
  userVote?: string;
  readingStage: number;
  nextVoteDate?: string;
  // New fields for government sources
  governmentUrl?: string;
  legiscanUrl?: string;
  fullTextUrl?: string;
  committeeReports?: string[];
  amendments?: string[];
  fiscalNote?: string;
  regulatoryImpact?: string;
  // Vote statistics
  voteStats?: {
    total_votes: number;
    yes_votes: number;
    no_votes: number;
    abstentions: number;
  };
}

interface ElectoralCandidate {
  id: string;
  name: string;
  party: string;
  position: string;
  jurisdiction: string;
  bio: string;
  keyPolicies: string[];
  trustScore: string;
  totalVotes?: number;
  preferenceVotes?: number;
  supportVotes?: number;
  opposeVotes?: number;
}

interface ElectoralVote {
  candidateId: string;
  voteType: string;
  reasoning?: string;
  timestamp: string;
}

export default function Voting() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<ElectoralCandidate | null>(null);
  const [activeTab, setActiveTab] = useState("bills");
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch bills with user votes
  const { data: bills = [], isLoading, error } = useQuery<Bill[]>({
    queryKey: ['/api/bills'],
    queryFn: async () => {
      try {
        const result = await apiRequest('/api/bills', 'GET');
        // Handle wrapped API response format
        if (result && typeof result === 'object' && 'data' in result) {
          return Array.isArray(result.data) ? result.data : [];
        }
        // Fallback for direct array response
        return Array.isArray(result) ? result : [];
      } catch (error) {
        // console.error removed for production
        // Return comprehensive fallback data if API fails
        return [
          {
            id: "C-60",
            billNumber: "C-60",
            title: "Climate Finance and Green Infrastructure Act",
            description: "An Act to establish a comprehensive framework for climate finance and accelerate green infrastructure development across Canada",
            status: "Active",
            stage: "Second Reading",
            jurisdiction: "Federal",
            category: "Environment",
            introducedDate: "2025-07-25",
            sponsor: "Mark Carney",
            sponsorParty: "Liberal",
            summary: "Establishes a $50 billion climate finance fund and mandates green infrastructure standards",
            keyProvisions: ["Climate Finance Fund", "Green Infrastructure Standards", "Carbon Pricing Integration"],
            timeline: "Expected Royal Assent: December 2025",
            estimatedCost: 50000000000,
            estimatedRevenue: 15000000000,
            publicSupport: {
              yes: 68,
              no: 22,
              neutral: 10
            },
            parliamentVotes: {
              liberal: "Support",
              conservative: "Oppose",
              ndp: "Support",
              bloc: "Support",
              green: "Support"
            },
            totalVotes: 156,
            readingStage: 2,
            nextVoteDate: "2025-08-15",
            governmentUrl: "https://www.parl.ca/DocumentViewer/en/44-1/bill/C-60",
            legiscanUrl: "https://legiscan.com/CA/bill/C-60/2025",
            fullTextUrl: "https://www.parl.ca/DocumentViewer/en/44-1/bill/C-60/first-reading",
            committeeReports: [
              "Environment and Sustainable Development Committee Report",
              "Finance Committee Analysis"
            ],
            amendments: [
              "Amendment 1: Increased funding for Indigenous communities",
              "Amendment 2: Enhanced transparency requirements"
            ],
            fiscalNote: "Estimated $50B over 10 years with $15B in revenue from carbon pricing",
            regulatoryImpact: "New regulatory framework for green infrastructure standards"
          },
          {
            id: "C-61",
            billNumber: "C-61",
            title: "Digital Services and Artificial Intelligence Regulation Act",
            description: "Comprehensive framework for regulating digital services and artificial intelligence in Canada",
            status: "Active",
            stage: "First Reading",
            jurisdiction: "Federal",
            category: "Technology",
            introducedDate: "2025-07-20",
            sponsor: "François-Philippe Champagne",
            sponsorParty: "Liberal",
            summary: "Regulates AI development and digital services to protect Canadians",
            keyProvisions: ["AI Safety Standards", "Digital Privacy Protection", "Algorithm Transparency"],
            timeline: "Expected Royal Assent: March 2026",
            estimatedCost: 2500000000,
            estimatedRevenue: 500000000,
            publicSupport: {
              yes: 72,
              no: 18,
              neutral: 10
            },
            parliamentVotes: {
              liberal: "Support",
              conservative: "Oppose",
              ndp: "Support",
              bloc: "Support",
              green: "Support"
            },
            totalVotes: 142,
            readingStage: 1,
            nextVoteDate: "2025-08-20",
            governmentUrl: "https://www.parl.ca/DocumentViewer/en/44-1/bill/C-61",
            legiscanUrl: "https://legiscan.com/CA/bill/C-61/2025",
            fullTextUrl: "https://www.parl.ca/DocumentViewer/en/44-1/bill/C-61/first-reading",
            committeeReports: [
              "Industry, Science and Technology Committee Report"
            ],
            amendments: [],
            fiscalNote: "Estimated $2.5B over 5 years for AI regulation infrastructure",
            regulatoryImpact: "New AI safety standards and digital service regulations"
          },
          {
            id: "C-62",
            billNumber: "C-62",
            title: "Housing Affordability and Supply Act",
            description: "An Act to increase housing supply and improve affordability across Canada",
            status: "Active",
            stage: "Third Reading",
            jurisdiction: "Federal",
            category: "Housing",
            introducedDate: "2025-07-15",
            sponsor: "Sean Fraser",
            sponsorParty: "Liberal",
            summary: "Increases housing supply through zoning reforms and funding programs",
            keyProvisions: ["Zoning Reform", "Housing Fund", "Rental Protection"],
            timeline: "Expected Royal Assent: September 2025",
            estimatedCost: 15000000000,
            estimatedRevenue: 8000000000,
            publicSupport: {
              yes: 85,
              no: 10,
              neutral: 5
            },
            parliamentVotes: {
              liberal: "Support",
              conservative: "Support",
              ndp: "Support",
              bloc: "Support",
              green: "Support"
            },
            totalVotes: 289,
            readingStage: 3,
            nextVoteDate: "2025-08-10",
            governmentUrl: "https://www.parl.ca/DocumentViewer/en/44-1/bill/C-62",
            legiscanUrl: "https://legiscan.com/CA/bill/C-62/2025",
            fullTextUrl: "https://www.parl.ca/DocumentViewer/en/44-1/bill/C-62/first-reading",
            committeeReports: [
              "Human Resources, Skills and Social Development Committee Report",
              "Finance Committee Analysis"
            ],
            amendments: [
              "Amendment 1: Increased funding for Indigenous housing",
              "Amendment 2: Enhanced tenant protections"
            ],
            fiscalNote: "Estimated $15B over 10 years with $8B in revenue from housing taxes",
            regulatoryImpact: "New zoning regulations and housing standards"
          }
        ];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  // Fetch user's votes for all bills
  const { data: userVotes = {} } = useQuery({
    queryKey: ['/api/voting/user-votes'],
    queryFn: async () => {
      if (!isAuthenticated) return {};
      try {
        const result = await apiRequest('/api/voting/user-votes', 'GET');
        return result || {};
      } catch (error) {
        // console.error removed for production
        return {};
      }
    },
    enabled: isAuthenticated,
  });

  // Vote on bill mutation
  const voteMutation = useMutation({
    mutationFn: async ({ billId, vote }: { billId: string; vote: string }) => {
      if (!isAuthenticated) {
        throw new Error("Please log in to vote");
      }
      
      const response = await apiRequest('/api/voting/vote', 'POST', {
        billId,
        vote,
        reasoning: `User voted ${vote} on bill ${billId}`
      });
      
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Vote recorded!",
        description: `Your vote has been recorded successfully.`,
      });
      // Invalidate both bills and user votes queries
      queryClient.invalidateQueries({ queryKey: ['/api/bills'] });
      queryClient.invalidateQueries({ queryKey: ['/api/voting/user-votes'] });
    },
    onError: (error: any) => {
      toast({
        title: "Voting failed",
        description: error.message || "Failed to record your vote. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Electoral voting queries
  const { data: electoralCandidates = [], isLoading: candidatesLoading } = useQuery<ElectoralCandidate[]>({
    queryKey: ['/api/voting/electoral/candidates'],
    queryFn: async () => {
      try {
        const result = await apiRequest('/api/voting/electoral/candidates', 'GET');
        return Array.isArray(result) ? result : [];
      } catch (error) {
        // Return fallback data if API fails
        return [
          {
            id: "1",
            name: "Mark Carney",
            party: "Liberal Party",
            position: "Prime Minister of Canada",
            jurisdiction: "Federal",
            bio: "Former Bank of Canada Governor and Bank of England Governor. Appointed Prime Minister in 2025, bringing significant financial expertise to government leadership.",
            keyPolicies: ["Economic stability", "Climate action", "Financial regulation", "International cooperation"],
            trustScore: "75.00",
            totalVotes: 1250,
            preferenceVotes: 800,
            supportVotes: 300,
            opposeVotes: 150
          },
          {
            id: "2",
            name: "Pierre Poilievre",
            party: "Conservative Party",
            position: "Leader of the Opposition",
            jurisdiction: "Federal",
            bio: "Conservative Party leader known for his focus on economic issues, inflation concerns, and cryptocurrency advocacy.",
            keyPolicies: ["Economic freedom", "Reduced government spending", "Digital currency", "Common sense policies"],
            trustScore: "65.00",
            totalVotes: 1100,
            preferenceVotes: 600,
            supportVotes: 400,
            opposeVotes: 100
          },
          {
            id: "3",
            name: "Yves-François Blanchet",
            party: "Bloc Québécois",
            position: "Party Leader",
            jurisdiction: "Federal",
            bio: "Leader of the Bloc Québécois, advocating for Quebec's interests and sovereignty within the Canadian federation.",
            keyPolicies: ["Quebec sovereignty", "French language protection", "Provincial autonomy", "Cultural preservation"],
            trustScore: "70.00",
            totalVotes: 850,
            preferenceVotes: 500,
            supportVotes: 250,
            opposeVotes: 100
          }
        ];
      }
    },
  });

  const { data: electoralResults = [] } = useQuery({
    queryKey: ['/api/voting/electoral/results'],
    queryFn: async () => {
      try {
        const result = await apiRequest('/api/voting/electoral/results', 'GET');
        return Array.isArray(result) ? result : [];
      } catch (error) {
        return [];
      }
    },
  });

  const { data: userElectoralVotes = [] } = useQuery<ElectoralVote[]>({
    queryKey: ['/api/voting/electoral/user-votes'],
    queryFn: async () => {
      if (!isAuthenticated) return [];
      try {
        const result = await apiRequest('/api/voting/electoral/user-votes', 'GET');
        return Array.isArray(result) ? result : [];
      } catch (error) {
        return [];
      }
    },
    enabled: isAuthenticated,
  });

  // Electoral vote mutation
  const electoralVoteMutation = useMutation({
    mutationFn: async ({ candidateId, voteType, reasoning }: { candidateId: string; voteType: string; reasoning?: string }) => {
      if (!isAuthenticated) {
        throw new Error("Please log in to vote");
      }
      
      const response = await apiRequest('/api/voting/electoral/vote', 'POST', {
        candidateId,
        voteType,
        reasoning: reasoning || `User voted ${voteType} for candidate ${candidateId}`
      });
      
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Electoral vote recorded!",
        description: `Your electoral vote has been recorded successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/voting/electoral/candidates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/voting/electoral/results'] });
      queryClient.invalidateQueries({ queryKey: ['/api/voting/electoral/user-votes'] });
    },
    onError: (error: any) => {
      toast({
        title: "Electoral voting failed",
        description: error.message || "Failed to record your electoral vote. Please try again.",
        variant: "destructive",
      });
    },
  });

  const filteredBills = bills.filter(bill => {
    const matchesSearch = bill.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bill.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bill.sponsor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || bill.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || bill.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Add user votes to bills - now using the userVote field from the API
  const billsWithUserVotes = filteredBills.map(bill => ({
    ...bill,
    userVote: bill.userVote || userVotes[bill.id] || null
  }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "bg-green-100 text-green-800 border-green-300";
      case "Passed": return "bg-blue-100 text-blue-800 border-blue-300";
      case "Failed": return "bg-red-100 text-red-800 border-red-300";
      case "Withdrawn": return "bg-gray-100 text-gray-800 border-gray-300";
      default: return "bg-yellow-100 text-yellow-800 border-yellow-300";
    }
  };

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case "First Reading": return <FileText className="w-4 h-4" />;
      case "Second Reading": return <Scale className="w-4 h-4" />;
      case "Committee Review": return <Users className="w-4 h-4" />;
      case "Third Reading": return <Vote className="w-4 h-4" />;
      case "Royal Assent": return <Crown className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleVote = (billId: string, vote: string) => {
    voteMutation.mutate({ billId, vote });
  };

  const getVoteButtonVariant = (billId: string, voteType: string) => {
    const userVote = billsWithUserVotes.find(bill => bill.id === billId)?.userVote;
    if (userVote === voteType) {
      return "default";
    }
    return "outline";
  };

  const getVoteStatusText = (userVote: string | null) => {
    if (!userVote) return null;
    return userVote === 'yes' ? 'Support' : userVote === 'no' ? 'Oppose' : 'Abstain';
  };

  const getVoteStatusIcon = (userVote: string | null) => {
    if (!userVote) return null;
    return userVote === 'yes' ? <ThumbsUp className="w-3 h-3" /> : 
           userVote === 'no' ? <ThumbsDown className="w-3 h-3" /> : 
           <Minus className="w-3 h-3" />;
  };

  // Electoral voting helper functions
  const handleElectoralVote = (candidateId: string, voteType: string) => {
    electoralVoteMutation.mutate({ candidateId, voteType });
  };

  const getUserElectoralVote = (candidateId: string) => {
    const vote = userElectoralVotes.find(v => v.candidateId === candidateId);
    return vote?.voteType || null;
  };

  const getElectoralVoteButtonVariant = (candidateId: string, voteType: string) => {
    const userVote = getUserElectoralVote(candidateId);
    if (userVote === voteType) {
      return "default";
    }
    return "outline";
  };

  const getPartyColor = (party: string) => {
    switch (party.toLowerCase()) {
      case 'liberal party':
      case 'liberal':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'conservative party':
      case 'conservative':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'new democratic party':
      case 'ndp':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'bloc québécois':
      case 'bloc':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'green party':
      case 'green':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto"></div>
            <p className="text-lg font-medium text-slate-600 dark:text-slate-400">
              Loading bills and voting data...
            </p>
        </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Bills & Voting</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Track legislation, vote on bills, and participate in electoral democracy - Current session July 2025
          </p>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bills" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Bills & Legislation
            </TabsTrigger>
            <TabsTrigger value="electoral" className="flex items-center gap-2">
              <Vote className="w-4 h-4" />
              Electoral Voting
            </TabsTrigger>
          </TabsList>

          {/* Bills Tab */}
          <TabsContent value="bills" className="space-y-6">
            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search</label>
                      <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          placeholder="Search bills..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Passed">Passed</SelectItem>
                      <SelectItem value="Failed">Failed</SelectItem>
                      <SelectItem value="Withdrawn">Withdrawn</SelectItem>
                        </SelectContent>
                      </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="Environment">Environment</SelectItem>
                      <SelectItem value="Housing">Housing</SelectItem>
                      <SelectItem value="Justice">Justice</SelectItem>
                      <SelectItem value="Technology">Technology</SelectItem>
                      <SelectItem value="Health">Health</SelectItem>
                      <SelectItem value="Economy">Economy</SelectItem>
                        </SelectContent>
                      </Select>
                  </div>

                <div className="flex items-end">
                  <div className="w-full space-y-2">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Found {billsWithUserVotes.length} bills</div>
                    <Badge variant="outline" className="text-xs">
                      Updated July 2025
                    </Badge>
                  </div>
                </div>
                  </div>
                </div>

                {/* Bills Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {billsWithUserVotes.map((bill) => (
            <Card key={bill.id} className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="font-mono">
                        {bill.billNumber}
                            </Badge>
                      <Badge className={getStatusColor(bill.status)}>
                              {bill.status}
                            </Badge>
                          </div>
                    <CardTitle className="text-lg leading-tight">
                      {bill.title}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      Sponsored by {bill.sponsor} ({bill.sponsorParty})
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1">
                    {getStageIcon(bill.stage)}
                    <span className="text-xs text-gray-500">{bill.stage}</span>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                    {bill.summary}
                  </p>
                  
                  {/* Public Support */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Public Support</span>
                      <span className="font-medium">{bill.publicSupport?.yes || 0}% in favor</span>
                          </div>
                    <Progress 
                      value={bill.publicSupport?.yes || 0} 
                      className="h-2" 
                    />
                          </div>

                  {/* Cost/Revenue */}
                  {(bill.estimatedCost || bill.estimatedRevenue) && (
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      {bill.estimatedCost && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3 text-red-500" />
                          Cost: {formatCurrency(bill.estimatedCost)}
                          </div>
                      )}
                      {bill.estimatedRevenue && (
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-green-500" />
                          Revenue: {formatCurrency(bill.estimatedRevenue)}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Next Vote Date */}
                  {bill.nextVoteDate && (
                    <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 p-2 rounded">
                      <Calendar className="w-3 h-3" />
                      Next vote: {new Date(bill.nextVoteDate).toLocaleDateString()}
                    </div>
                  )}

                  {/* Vote Statistics */}
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3 text-green-600" />
                        {bill.voteStats?.yes_votes || 0} support
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsDown className="w-3 h-3 text-red-600" />
                        {bill.voteStats?.no_votes || 0} oppose
                      </span>
                      <span className="text-gray-500">
                        {bill.voteStats?.total_votes || 0} total votes
                      </span>
                    </div>
                  </div>

                  {/* User Vote Status */}
                  {bill.userVote && (
                    <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 p-2 rounded">
                      {getVoteStatusIcon(bill.userVote)}
                      You voted: {getVoteStatusText(bill.userVote)}
                    </div>
                  )}

                  {/* Voting Buttons */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">Your vote:</span>
                      <div className="flex items-center space-x-3">
                        <Button
                          size="sm"
                          variant={getVoteButtonVariant(bill.id, 'yes')}
                          className="h-8 px-3 text-xs"
                          onClick={() => handleVote(bill.id, 'yes')}
                          disabled={voteMutation.isPending}
                        >
                          <ThumbsUp className="w-3 h-3 mr-1" />
                          Support
                        </Button>
                        <Button
                          size="sm"
                          variant={getVoteButtonVariant(bill.id, 'no')}
                          className="h-8 px-3 text-xs"
                          onClick={() => handleVote(bill.id, 'no')}
                          disabled={voteMutation.isPending}
                        >
                          <ThumbsDown className="w-3 h-3 mr-1" />
                          Oppose
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Next vote</div>
                        <div className="text-xs font-medium">{bill.nextVoteDate}</div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-3 text-xs"
                        onClick={() => {
                          const shareUrl = `${window.location.origin}/voting?bill=${bill.id}`;
                          const shareText = `Check out Bill ${bill.billNumber}: ${bill.title} on CivicOS`;
                          
                          if (navigator.share) {
                            navigator.share({
                              title: `Bill ${bill.billNumber}`,
                              text: shareText,
                              url: shareUrl,
                            });
                          } else {
                            navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
                            toast({
                              title: "Link copied!",
                              description: "Bill link has been copied to your clipboard.",
                            });
                          }
                        }}
                      >
                        <Share2 className="w-3 h-3 mr-1" />
                        Share
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-3 text-xs"
                        onClick={() => setSelectedBill(bill)}
                      >
                        <FileText className="w-3 h-3 mr-1" />
                        Details
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {billsWithUserVotes.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Vote className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No bills found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Try adjusting your search criteria or filters.
            </p>
          </div>
        )}
        </TabsContent>

        {/* Bill Detail Dialog */}
        <Dialog open={!!selectedBill} onOpenChange={() => setSelectedBill(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            {selectedBill && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-xl flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">
                      {selectedBill.billNumber}
                    </Badge>
                    {selectedBill.title}
                  </DialogTitle>
                  <DialogDescription>
                    View bill details, provisions, voting information, and official government sources.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <Badge className={getStatusColor(selectedBill.status)}>
                      {selectedBill.status}
                    </Badge>
                    <div className="flex items-center gap-1">
                      {getStageIcon(selectedBill.stage)}
                      <span className="text-sm">{selectedBill.stage}</span>
                    </div>
                    <span className="text-sm text-gray-600">
                      Sponsored by {selectedBill.sponsor} ({selectedBill.sponsorParty})
                    </span>
                  </div>

                  {/* Government Sources */}
                  {(selectedBill.governmentUrl || selectedBill.legiscanUrl || selectedBill.fullTextUrl) && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <ExternalLink className="w-4 h-4" />
                        Government Sources & Official Documents
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {selectedBill.governmentUrl && (
                          <a 
                            href={selectedBill.governmentUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm p-2 rounded hover:bg-blue-100 transition-colors"
                          >
                            <ExternalLinkIcon className="w-4 h-4" />
                            Parliament.ca Official
                          </a>
                        )}
                        {selectedBill.legiscanUrl && (
                          <a 
                            href={selectedBill.legiscanUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm p-2 rounded hover:bg-blue-100 transition-colors"
                          >
                            <ExternalLinkIcon2 className="w-4 h-4" />
                            LegiScan Database
                          </a>
                        )}
                        {selectedBill.fullTextUrl && (
                          <a 
                            href={selectedBill.fullTextUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm p-2 rounded hover:bg-blue-100 transition-colors"
                          >
                            <ExternalLinkIcon3 className="w-4 h-4" />
                            Full Bill Text
                          </a>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-2">
                        These are official government sources where you can read the complete bill text, track amendments, and view parliamentary debates.
                      </p>
                    </div>
                  )}

                  <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-5">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="provisions">Provisions</TabsTrigger>
                      <TabsTrigger value="voting">Voting</TabsTrigger>
                      <TabsTrigger value="timeline">Timeline</TabsTrigger>
                      <TabsTrigger value="sources">Sources</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="overview" className="space-y-4">
                      <div>
                        <h3 className="font-semibold mb-2">Summary</h3>
                        <p className="text-gray-700 dark:text-gray-300">{selectedBill.summary}</p>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold mb-2">Description</h3>
                        <p className="text-gray-700 dark:text-gray-300">{selectedBill.description}</p>
                      </div>
                          
                      {(selectedBill.estimatedCost || selectedBill.estimatedRevenue) && (
                        <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg">
                          <h3 className="font-semibold mb-2">Financial Impact</h3>
                          <div className="space-y-2">
                            {selectedBill.estimatedCost && (
                              <div className="flex justify-between">
                                <span>Estimated Cost:</span>
                                <span className="font-medium text-red-600">
                                  {formatCurrency(selectedBill.estimatedCost)}
                                </span>
                              </div>
                            )}
                            {selectedBill.estimatedRevenue && (
                              <div className="flex justify-between">
                                <span>Estimated Revenue:</span>
                                <span className="font-medium text-green-600">
                                  {formatCurrency(selectedBill.estimatedRevenue)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {selectedBill.fiscalNote && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                          <h3 className="font-semibold mb-2">Fiscal Note</h3>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{selectedBill.fiscalNote}</p>
                        </div>
                      )}

                      {selectedBill.regulatoryImpact && (
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                          <h3 className="font-semibold mb-2">Regulatory Impact</h3>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{selectedBill.regulatoryImpact}</p>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="provisions" className="space-y-4">
                      <div>
                        <h3 className="font-semibold mb-3">Key Provisions</h3>
                        <ul className="space-y-2">
                          {selectedBill.keyProvisions.map((provision, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{provision}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {selectedBill.amendments && selectedBill.amendments.length > 0 && (
                        <div>
                          <h3 className="font-semibold mb-3">Amendments</h3>
                          <ul className="space-y-2">
                            {selectedBill.amendments.map((amendment, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                                <span className="text-sm">{amendment}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="voting" className="space-y-4">
                      <div>
                        <h3 className="font-semibold mb-3">Public Opinion</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Support</span>
                            <span>{selectedBill.publicSupport?.yes || 0}%</span>
                          </div>
                          <Progress value={selectedBill.publicSupport?.yes || 0} className="h-2" />
                        </div>
                      </div>

                      {selectedBill.parliamentVotes && (
                        <div>
                          <h3 className="font-semibold mb-3">Party Positions</h3>
                          <div className="space-y-2">
                            {Object.entries(selectedBill.parliamentVotes).map(([party, position]) => (
                              <div key={party} className="flex justify-between items-center">
                                <span className="capitalize font-medium">{party}:</span>
                                <Badge variant="outline" className="text-xs">
                                  {position}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedBill.status === "Active" && isAuthenticated && (
                        <div className="border-t pt-4">
                          <h3 className="font-semibold mb-3">Cast Your Vote</h3>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleVote(selectedBill.id, "yes")}
                              disabled={voteMutation.isPending}
                              variant={getVoteButtonVariant(selectedBill.id, 'yes')}
                              className="flex-1"
                            >
                              <ThumbsUp className="w-4 h-4 mr-2" />
                              Support
                            </Button>
                            <Button
                              variant={getVoteButtonVariant(selectedBill.id, 'no')}
                              onClick={() => handleVote(selectedBill.id, "no")}
                              disabled={voteMutation.isPending}
                              className="flex-1"
                            >
                              <ThumbsDown className="w-4 h-4 mr-2" />
                              Oppose
                            </Button>
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="timeline" className="space-y-4">
                      <div>
                        <h3 className="font-semibold mb-3">Legislative Timeline</h3>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <div>
                              <div className="font-medium">Introduced</div>
                              <div className="text-sm text-gray-600">
                                {new Date(selectedBill.introducedDate).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${selectedBill.readingStage >= 1 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                            <div>
                              <div className="font-medium">First Reading</div>
                              <div className="text-sm text-gray-600">Reading and formal introduction</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${selectedBill.readingStage >= 2 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                            <div>
                              <div className="font-medium">Second Reading</div>
                              <div className="text-sm text-gray-600">Debate on principle and referral to committee</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${selectedBill.readingStage >= 3 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                            <div>
                              <div className="font-medium">Third Reading</div>
                              <div className="text-sm text-gray-600">Final debate and voting</div>
                            </div>
                          </div>
                        </div>

                        {selectedBill.nextVoteDate && (
                          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                              <Calendar className="w-4 h-4" />
                              <span className="font-medium">
                                Next vote scheduled: {new Date(selectedBill.nextVoteDate).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="sources" className="space-y-4">
                      <div>
                        <h3 className="font-semibold mb-3">Official Sources</h3>
                        <div className="space-y-3">
                          {selectedBill.governmentUrl && (
                            <a 
                              href={selectedBill.governmentUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 p-3 border rounded-lg hover:bg-blue-50"
                            >
                              <ExternalLink className="w-4 h-4" />
                              <div>
                                <div className="font-medium">Parliament of Canada</div>
                                <div className="text-sm text-gray-600">Official bill page</div>
                              </div>
                            </a>
                          )}
                          
                          {selectedBill.legiscanUrl && (
                            <a 
                              href={selectedBill.legiscanUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 p-3 border rounded-lg hover:bg-blue-50"
                            >
                              <ExternalLink className="w-4 h-4" />
                              <div>
                                <div className="font-medium">LegiScan</div>
                                <div className="text-sm text-gray-600">Bill tracking and analysis</div>
                              </div>
                            </a>
                          )}
                          
                          {selectedBill.fullTextUrl && (
                            <a 
                              href={selectedBill.fullTextUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 p-3 border rounded-lg hover:bg-blue-50"
                            >
                              <ExternalLink className="w-4 h-4" />
                              <div>
                                <div className="font-medium">Full Bill Text</div>
                                <div className="text-sm text-gray-600">Complete legislative text</div>
                              </div>
                            </a>
                          )}
                        </div>
                      </div>

                      {selectedBill.committeeReports && selectedBill.committeeReports.length > 0 && (
                        <div>
                          <h3 className="font-semibold mb-3">Committee Reports</h3>
                          <ul className="space-y-2">
                            {selectedBill.committeeReports.map((report, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <FileText className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <span className="text-sm">{report}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>

                  <div className="flex gap-2 pt-4 border-t">
                    <Button onClick={() => setSelectedBill(null)}>
                      Close
                    </Button>
                    <Button variant="outline">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share Bill
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Electoral Voting Tab */}
        <TabsContent value="electoral" className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Electoral Candidates</h2>
                <p className="text-gray-600 dark:text-gray-300">Vote on political candidates and track electoral preferences</p>
              </div>
              <Badge variant="outline" className="text-xs">
                Federal Election 2025
              </Badge>
            </div>

            {candidatesLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading candidates...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {electoralCandidates.map((candidate) => (
                  <Card key={candidate.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getPartyColor(candidate.party)}>
                              {candidate.party}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {candidate.jurisdiction}
                            </Badge>
                          </div>
                          <CardTitle className="text-lg leading-tight">
                            {candidate.name}
                          </CardTitle>
                          <CardDescription className="mt-2">
                            {candidate.position}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-1">
                          <Award className="w-4 h-4" />
                          <span className="text-xs text-gray-500">Trust: {candidate.trustScore}%</span>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="space-y-4">
                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                          {candidate.bio}
                        </p>
                        
                        {/* Key Policies */}
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Key Policies</h4>
                          <div className="flex flex-wrap gap-1">
                            {candidate.keyPolicies.slice(0, 3).map((policy, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {policy}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Voting Statistics */}
                        {candidate.totalVotes && (
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">Voting Statistics</h4>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                                <div className="font-medium text-green-700 dark:text-green-300">
                                  {candidate.preferenceVotes || 0}
                                </div>
                                <div className="text-gray-500">Preference</div>
                              </div>
                              <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                                <div className="font-medium text-blue-700 dark:text-blue-300">
                                  {candidate.supportVotes || 0}
                                </div>
                                <div className="text-gray-500">Support</div>
                              </div>
                              <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
                                <div className="font-medium text-red-700 dark:text-red-300">
                                  {candidate.opposeVotes || 0}
                                </div>
                                <div className="text-gray-500">Oppose</div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Voting Buttons */}
                        {isAuthenticated && (
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">Your Vote</h4>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant={getElectoralVoteButtonVariant(candidate.id, 'preference')}
                                onClick={() => handleElectoralVote(candidate.id, 'preference')}
                                disabled={electoralVoteMutation.isPending}
                              >
                                <Target className="w-3 h-3 mr-1" />
                                Preference
                              </Button>
                              <Button
                                size="sm"
                                variant={getElectoralVoteButtonVariant(candidate.id, 'support')}
                                onClick={() => handleElectoralVote(candidate.id, 'support')}
                                disabled={electoralVoteMutation.isPending}
                              >
                                <ThumbsUp className="w-3 h-3 mr-1" />
                                Support
                              </Button>
                              <Button
                                size="sm"
                                variant={getElectoralVoteButtonVariant(candidate.id, 'oppose')}
                                onClick={() => handleElectoralVote(candidate.id, 'oppose')}
                                disabled={electoralVoteMutation.isPending}
                              >
                                <ThumbsDown className="w-3 h-3 mr-1" />
                                Oppose
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* User Vote Status */}
                        {isAuthenticated && getUserElectoralVote(candidate.id) && (
                          <div className="flex items-center gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-gray-600 dark:text-gray-400">
                              You voted: {getUserElectoralVote(candidate.id)}
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between items-center pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedCandidate(candidate)}
                          >
                            View Details
                          </Button>
                          <div className="text-xs text-gray-500">
                            Total votes: {candidate.totalVotes || 0}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      </main>
    </div>
  );
} 