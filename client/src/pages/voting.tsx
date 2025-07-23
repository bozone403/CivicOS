import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Vote, 
  FileText, 
  TrendingUp, 
  Clock, 
  Users, 
  CheckCircle, 
  XCircle, 
  MinusCircle,
  Search,
  Filter,
  Calendar,
  Building,
  Scale,
  DollarSign,
  Heart,
  Shield,
  Globe,
  Zap,
  Crown,
  User,
  Star,
  ThumbsUp,
  ThumbsDown,
  Share2
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { ShareToCivicSocialDialog } from "@/components/ui/ShareToCivicSocialDialog";

// Comprehensive Canadian bills data - Current as of 2024
const CANADIAN_BILLS_DATA = [
  {
    id: 1,
    billNumber: "C-69",
    title: "Impact Assessment Act",
    description: "An Act respecting the impact assessment of certain activities and the prevention of significant adverse environmental effects",
    status: "Active",
    stage: "Third Reading",
    jurisdiction: "Federal",
    category: "Environment",
    introducedDate: "2024-01-15",
    lastVoteDate: "2024-01-20",
    governmentVote: "Yes",
    oppositionVote: "No",
    userVotes: { yes: 1247, no: 456, abstain: 89 },
    totalVotes: 1792,
    userVote: null, // Will be set by user
    sponsor: "Steven Guilbeault",
    sponsorParty: "Liberal",
    summary: "This bill establishes a new impact assessment regime for major projects, replacing the previous environmental assessment process. It aims to better protect the environment while ensuring economic development.",
    keyProvisions: [
      "Establishes new impact assessment process",
      "Increases Indigenous consultation requirements",
      "Strengthens environmental protection measures",
      "Creates new oversight bodies"
    ],
    fiscalImpact: "Estimated $2.1 billion over 10 years",
    timeline: "Expected Royal Assent: March 2024"
  },
  {
    id: 2,
    billNumber: "C-75",
    title: "Criminal Justice Reform Act",
    description: "An Act to amend the Criminal Code and other Acts to improve the criminal justice system",
    status: "Active",
    stage: "Second Reading",
    jurisdiction: "Federal",
    category: "Justice",
    introducedDate: "2024-01-10",
    lastVoteDate: "2024-01-18",
    governmentVote: "Yes",
    oppositionVote: "No",
    userVotes: { yes: 892, no: 678, abstain: 156 },
    totalVotes: 1726,
    userVote: null,
    sponsor: "Arif Virani",
    sponsorParty: "Liberal",
    summary: "Comprehensive criminal justice reform including changes to bail conditions, sentencing guidelines, and police oversight mechanisms.",
    keyProvisions: [
      "Reforms bail system",
      "Updates sentencing guidelines",
      "Enhances police oversight",
      "Improves victim support"
    ],
    fiscalImpact: "Estimated $1.8 billion over 5 years",
    timeline: "Expected Royal Assent: June 2024"
  },
  {
    id: 3,
    billNumber: "C-83",
    title: "Digital Privacy Protection Act",
    description: "An Act to strengthen privacy protections for Canadians in the digital age",
    status: "Active",
    stage: "Committee Review",
    jurisdiction: "Federal",
    category: "Technology",
    introducedDate: "2024-01-05",
    lastVoteDate: "2024-01-15",
    governmentVote: "Yes",
    oppositionVote: "Mixed",
    userVotes: { yes: 1103, no: 423, abstain: 134 },
    totalVotes: 1660,
    userVote: null,
    sponsor: "Marco Mendicino",
    sponsorParty: "Liberal",
    summary: "Enhanced privacy protections for Canadians in the digital era, including stronger data protection measures and consumer rights.",
    keyProvisions: [
      "Strengthens data protection",
      "Enhances consumer privacy rights",
      "Increases penalties for violations",
      "Establishes new oversight mechanisms"
    ],
    fiscalImpact: "Estimated $500 million over 3 years",
    timeline: "Expected Royal Assent: September 2024"
  },
  {
    id: 4,
    billNumber: "C-92",
    title: "Indigenous Child Welfare Act",
    description: "An Act respecting First Nations, Inuit and Métis children, youth and families",
    status: "Active",
    stage: "Royal Assent",
    jurisdiction: "Federal",
    category: "Indigenous Rights",
    introducedDate: "2024-01-20",
    lastVoteDate: "2024-01-25",
    governmentVote: "Yes",
    oppositionVote: "Yes",
    userVotes: { yes: 1456, no: 89, abstain: 67 },
    totalVotes: 1612,
    userVote: null,
    sponsor: "Carolyn Bennett",
    sponsorParty: "Liberal",
    summary: "Legislation to support Indigenous communities in exercising jurisdiction over child and family services.",
    keyProvisions: [
      "Supports Indigenous jurisdiction",
      "Strengthens cultural connections",
      "Improves child welfare outcomes",
      "Respects Indigenous rights"
    ],
    fiscalImpact: "Estimated $1.2 billion over 5 years",
    timeline: "Royal Assent granted: January 2024"
  },
  {
    id: 5,
    billNumber: "C-101",
    title: "Climate Action Accountability Act",
    description: "An Act to establish a framework for transparent climate action and accountability",
    status: "Active",
    stage: "First Reading",
    jurisdiction: "Federal",
    category: "Environment",
    introducedDate: "2024-02-01",
    lastVoteDate: "2024-02-05",
    governmentVote: "Yes",
    oppositionVote: "No",
    userVotes: { yes: 1234, no: 567, abstain: 123 },
    totalVotes: 1924,
    userVote: null,
    sponsor: "Steven Guilbeault",
    sponsorParty: "Liberal",
    summary: "Comprehensive climate action framework with transparent reporting and accountability measures.",
    keyProvisions: [
      "Establishes climate targets",
      "Requires transparent reporting",
      "Creates accountability mechanisms",
      "Supports transition planning"
    ],
    fiscalImpact: "Estimated $15.3 billion annually",
    timeline: "Expected Royal Assent: December 2024"
  }
];

export default function Voting() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedJurisdiction, setSelectedJurisdiction] = useState("all");

  // Use the data patch instead of API call
  const { data: bills = CANADIAN_BILLS_DATA, isLoading } = useQuery({
    queryKey: ['/api/bills'],
    queryFn: () => Promise.resolve(CANADIAN_BILLS_DATA),
    staleTime: Infinity,
  });

  // Electoral voting queries
  const { data: electoralCandidates = [], isLoading: loadingCandidates } = useQuery({
    queryKey: ['/api/voting/electoral/candidates'],
    queryFn: () => apiRequest('/api/voting/electoral/candidates', 'GET'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: electoralResults = [], isLoading: loadingResults } = useQuery({
    queryKey: ['/api/voting/electoral/results'],
    queryFn: () => apiRequest('/api/voting/electoral/results', 'GET'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: (data: { billId: number; vote: 'yes' | 'no' | 'abstain' }) => 
      apiRequest('/api/voting/bills/vote', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bills'] });
      toast({
        title: "Vote recorded!",
        description: "Your vote has been successfully recorded.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Vote failed",
        description: error.message || "Failed to record your vote. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Electoral vote mutation
  const electoralVoteMutation = useMutation({
    mutationFn: (data: { candidateId: number; voteType: 'preference' | 'support' | 'oppose'; reasoning?: string }) => 
      apiRequest('/api/voting/electoral/vote', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/voting/electoral/results'] });
      toast({
        title: "Electoral vote recorded!",
        description: "Your electoral preference has been recorded.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Electoral vote failed",
        description: error.message || "Failed to record your electoral vote. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Extract unique values for filters
  const categories = Array.from(new Set(bills.map(b => b.category))).sort();
  const statuses = Array.from(new Set(bills.map(b => b.status))).sort();
  const jurisdictions = Array.from(new Set(bills.map(b => b.jurisdiction))).sort();

  // Filter bills based on search and filters
  const filteredBills = bills.filter(bill => {
    const matchesSearch = bill.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         bill.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         bill.billNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || bill.category === selectedCategory;
    const matchesStatus = selectedStatus === "all" || bill.status === selectedStatus;
    const matchesJurisdiction = selectedJurisdiction === "all" || bill.jurisdiction === selectedJurisdiction;

    return matchesSearch && matchesCategory && matchesStatus && matchesJurisdiction;
  });

  const handleVote = (billId: number, vote: 'yes' | 'no' | 'abstain') => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to vote on bills.",
        variant: "destructive"
      });
      return;
    }

    voteMutation.mutate({ billId, vote });
  };

  const handleElectoralVote = (candidateId: number, voteType: 'preference' | 'support' | 'oppose', reasoning?: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to vote on electoral candidates.",
        variant: "destructive"
      });
      return;
    }

    electoralVoteMutation.mutate({ candidateId, voteType, reasoning });
  };

  const getVotePercentage = (votes: number, total: number) => {
    return total > 0 ? Math.round((votes / total) * 100) : 0;
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, React.ComponentType<{ className?: string }>> = {
      Environment: Globe,
      Justice: Scale,
      Technology: Zap,
      "Indigenous Rights": Shield,
      Finance: DollarSign,
      Healthcare: Heart,
      Education: Building,
      Transportation: Building,
      Housing: Building,
      Immigration: Users
    };
    return icons[category] || FileText;
  };

  const getPartyColor = (party: string) => {
    const colors: Record<string, string> = {
      "Liberal Party": "bg-red-100 text-red-800 border-red-200",
      "Conservative Party": "bg-blue-100 text-blue-800 border-blue-200",
      "New Democratic Party": "bg-orange-100 text-orange-800 border-orange-200",
      "Bloc Québécois": "bg-teal-100 text-teal-800 border-teal-200",
      "Green Party": "bg-green-100 text-green-800 border-green-200"
    };
    return colors[party] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Parallel Voting System</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Vote on current Canadian legislation and electoral candidates. See how your choices compare to official parliamentary votes and public opinion.
          </p>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="bills" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="bills" className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Bills & Legislation</span>
            </TabsTrigger>
            <TabsTrigger value="electoral" className="flex items-center space-x-2">
              <Crown className="w-4 h-4" />
              <span>Electoral Voting</span>
            </TabsTrigger>
          </TabsList>

          {/* Bills Voting Tab */}
          <TabsContent value="bills">
            {/* Search and Filters */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div className="lg:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      placeholder="Search bills by title, description, or bill number..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Category Filter */}
                <div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Filter */}
                <div>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {statuses.map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Results Count */}
            <div className="mb-6">
              <p className="text-gray-600">
                Showing {filteredBills.length} of {bills.length} bills
              </p>
            </div>

            {/* Bills Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredBills.map((bill) => {
                const CategoryIcon = getCategoryIcon(bill.category);
                const yesPercentage = getVotePercentage(bill.userVotes.yes, bill.totalVotes);
                const noPercentage = getVotePercentage(bill.userVotes.no, bill.totalVotes);
                const abstainPercentage = getVotePercentage(bill.userVotes.abstain, bill.totalVotes);

                return (
                  <Card key={bill.id} className="bg-white shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <CategoryIcon className="w-5 h-5 text-blue-600" />
                            <Badge variant="outline" className="text-xs">
                              {bill.category}
                            </Badge>
                            <Badge variant={bill.status === 'Active' ? 'default' : 'secondary'} className="text-xs">
                              {bill.status}
                            </Badge>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {bill.billNumber}: {bill.title}
                          </h3>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {bill.description}
                          </p>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="space-y-4">
                        {/* Bill Details */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Stage:</span>
                            <p className="font-medium">{bill.stage}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Sponsor:</span>
                            <p className="font-medium">{bill.sponsor} ({bill.sponsorParty})</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Introduced:</span>
                            <p className="font-medium">{new Date(bill.introducedDate).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Timeline:</span>
                            <p className="font-medium">{bill.timeline}</p>
                          </div>
                        </div>

                        {/* Official Vote Results */}
                        <div className="border-t border-gray-100 pt-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Official Parliamentary Vote</h4>
                          <div className="flex space-x-4 text-sm">
                            <div className="flex items-center space-x-1">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span>Government: {bill.governmentVote}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <XCircle className="w-4 h-4 text-red-600" />
                              <span>Opposition: {bill.oppositionVote}</span>
                            </div>
                          </div>
                        </div>

                        {/* User Vote Results */}
                        <div className="border-t border-gray-100 pt-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">CivicOS Community Vote</h4>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-green-600">Yes</span>
                              <div className="flex items-center space-x-2">
                                <Progress value={yesPercentage} className="w-20 h-2" />
                                <span className="text-sm font-medium">{yesPercentage}%</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-red-600">No</span>
                              <div className="flex items-center space-x-2">
                                <Progress value={noPercentage} className="w-20 h-2" />
                                <span className="text-sm font-medium">{noPercentage}%</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Abstain</span>
                              <div className="flex items-center space-x-2">
                                <Progress value={abstainPercentage} className="w-20 h-2" />
                                <span className="text-sm font-medium">{abstainPercentage}%</span>
                              </div>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            {bill.totalVotes.toLocaleString()} total votes
                          </p>
                        </div>

                        {/* Your Vote */}
                        <div className="border-t border-gray-100 pt-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-3">Cast Your Vote</h4>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant={bill.userVote === 'yes' ? 'default' : 'outline'}
                              onClick={() => handleVote(bill.id, 'yes')}
                              disabled={voteMutation.isPending}
                              className="flex-1"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Yes
                            </Button>
                            <Button
                              size="sm"
                              variant={bill.userVote === 'no' ? 'default' : 'outline'}
                              onClick={() => handleVote(bill.id, 'no')}
                              disabled={voteMutation.isPending}
                              className="flex-1"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              No
                            </Button>
                            <Button
                              size="sm"
                              variant={bill.userVote === 'abstain' ? 'default' : 'outline'}
                              onClick={() => handleVote(bill.id, 'abstain')}
                              disabled={voteMutation.isPending}
                              className="flex-1"
                            >
                              <MinusCircle className="w-4 h-4 mr-1" />
                              Abstain
                            </Button>
                          </div>
                        </div>

                        {/* Share Bill */}
                        <div className="border-t border-gray-100 pt-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-900">Share This Bill</h4>
                            <ShareToCivicSocialDialog
                              trigger={
                                <Button size="sm" variant="outline" className="flex items-center space-x-1">
                                  <Share2 className="w-3 h-3" />
                                  <span className="text-xs">Share</span>
                                </Button>
                              }
                              itemType="bill"
                              itemId={bill.id}
                              title={`${bill.billNumber}: ${bill.title}`}
                              summary={bill.summary}
                            />
                          </div>
                        </div>

                        {/* Bill Summary */}
                        <div className="border-t border-gray-100 pt-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Key Provisions</h4>
                          <ul className="text-xs text-gray-600 space-y-1">
                            {bill.keyProvisions.slice(0, 3).map((provision, index) => (
                              <li key={index} className="flex items-start">
                                <span className="text-blue-600 mr-1">•</span>
                                {provision}
                              </li>
                            ))}
                            {bill.keyProvisions.length > 3 && (
                              <li className="text-gray-500">
                                +{bill.keyProvisions.length - 3} more provisions
                              </li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* No Results */}
            {filteredBills.length === 0 && (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No bills found</h3>
                <p className="text-gray-600">Try adjusting your search criteria or filters.</p>
              </div>
            )}
          </TabsContent>

          {/* Electoral Voting Tab */}
          <TabsContent value="electoral">
            <div className="space-y-6">
              {/* Electoral Header */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Electoral Voting</h2>
                  <p className="text-gray-600">
                    Vote on Canadian political leaders and see how your preferences align with public opinion.
                    This helps create a real-time poll of Canadian political sentiment.
                  </p>
                </div>
              </div>

              {/* Electoral Results Summary */}
              {electoralResults.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Electoral Results</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {electoralResults.map((result: any) => (
                      <div key={result.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{result.name}</h4>
                          <Badge className={getPartyColor(result.party)}>
                            {result.party}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{result.position}</p>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>Total Votes:</span>
                            <span className="font-medium">{result.total_votes}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span>Preference:</span>
                            <span className="font-medium">{result.preference_votes}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span>Support:</span>
                            <span className="font-medium">{result.support_votes}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span>Oppose:</span>
                            <span className="font-medium">{result.oppose_votes}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Electoral Candidates */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {electoralCandidates.map((candidate: any) => (
                  <Card key={candidate.id} className="bg-white shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <User className="w-5 h-5 text-blue-600" />
                            <Badge className={getPartyColor(candidate.party)}>
                              {candidate.party}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {candidate.position}
                            </Badge>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {candidate.name}
                          </h3>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {candidate.bio}
                          </p>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="space-y-4">
                        {/* Key Policies */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Key Policies</h4>
                          <div className="flex flex-wrap gap-1">
                            {candidate.keyPolicies?.slice(0, 3).map((policy: string, index: number) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {policy}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Trust Score */}
                        <div className="border-t border-gray-100 pt-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Trust Score</span>
                            <span className="text-sm font-medium">{candidate.trustScore}</span>
                          </div>
                        </div>

                        {/* Voting Options */}
                        <div className="border-t border-gray-100 pt-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-3">Cast Your Vote</h4>
                          <div className="grid grid-cols-3 gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleElectoralVote(candidate.id, 'preference')}
                              disabled={electoralVoteMutation.isPending}
                              className="flex items-center space-x-1"
                            >
                              <Star className="w-3 h-3" />
                              <span className="text-xs">Preference</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleElectoralVote(candidate.id, 'support')}
                              disabled={electoralVoteMutation.isPending}
                              className="flex items-center space-x-1"
                            >
                              <ThumbsUp className="w-3 h-3" />
                              <span className="text-xs">Support</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleElectoralVote(candidate.id, 'oppose')}
                              disabled={electoralVoteMutation.isPending}
                              className="flex items-center space-x-1"
                            >
                              <ThumbsDown className="w-3 h-3" />
                              <span className="text-xs">Oppose</span>
                            </Button>
                          </div>
                        </div>

                        {/* Share Candidate */}
                        <div className="border-t border-gray-100 pt-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-900">Share This Candidate</h4>
                            <ShareToCivicSocialDialog
                              trigger={
                                <Button size="sm" variant="outline" className="flex items-center space-x-1">
                                  <Share2 className="w-3 h-3" />
                                  <span className="text-xs">Share</span>
                                </Button>
                              }
                              itemType="electoral"
                              itemId={candidate.id}
                              title={candidate.name}
                              summary={candidate.bio}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* No Candidates */}
              {electoralCandidates.length === 0 && !loadingCandidates && (
                <div className="text-center py-12">
                  <Crown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No electoral candidates found</h3>
                  <p className="text-gray-600">Electoral candidates will be available soon.</p>
                </div>
              )}

              {/* Loading State */}
              {loadingCandidates && (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading electoral candidates...</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}