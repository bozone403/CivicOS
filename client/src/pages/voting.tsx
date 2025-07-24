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
  Share2,
  AlertTriangle
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface Bill {
  id: number;
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
  governmentVote: string;
  oppositionVote: string;
  userVotes: {
    yes: number;
    no: number;
    abstain: number;
  };
  totalVotes: number;
  userVote: 'yes' | 'no' | 'abstain' | null;
}

interface ElectoralCandidate {
  id: number;
  name: string;
  party: string;
  position: string;
  jurisdiction: string;
  bio: string;
  keyPolicies: string[];
  trustScore: string;
  imageUrl: string;
  voteStats: {
    preference: number;
    support: number;
    oppose: number;
    total: number;
  };
}

export default function Voting() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Fetch bills from API
  const { data: bills = [], isLoading: billsLoading, error: billsError } = useQuery<Bill[]>({
    queryKey: ["/api/voting/bills"],
    queryFn: () => apiRequest("/api/voting/bills", "GET"),
  });

  // Fetch electoral candidates
  const { data: candidates = [], isLoading: candidatesLoading, error: candidatesError } = useQuery<ElectoralCandidate[]>({
    queryKey: ["/api/voting/electoral/candidates"],
    queryFn: () => apiRequest("/api/voting/electoral/candidates", "GET"),
  });

  // Fetch electoral results
  const { data: electoralResults, isLoading: resultsLoading } = useQuery({
    queryKey: ["/api/voting/electoral/results"],
    queryFn: () => apiRequest("/api/voting/electoral/results", "GET"),
  });

  // Fetch electoral trends
  const { data: electoralTrends, isLoading: trendsLoading } = useQuery({
    queryKey: ["/api/voting/electoral/trends"],
    queryFn: () => apiRequest("/api/voting/electoral/trends", "GET"),
  });

  // Vote mutation for bills
  const voteMutation = useMutation({
    mutationFn: (data: { billId: number; vote: 'yes' | 'no' | 'abstain' }) => 
      apiRequest('/api/voting/bills/vote', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/voting/bills'] });
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
      queryClient.invalidateQueries({ queryKey: ['/api/voting/electoral/candidates'] });
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

  const handleBillVote = (billId: number, vote: 'yes' | 'no' | 'abstain') => {
    if (!isAuthenticated) {
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
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please log in to vote on electoral candidates.",
        variant: "destructive"
      });
      return;
    }

    electoralVoteMutation.mutate({ candidateId, voteType, reasoning });
  };

  const filteredBills = bills.filter(bill => {
    const matchesSearch = bill.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         bill.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         bill.billNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || bill.category === selectedCategory;
    const matchesStatus = selectedStatus === "all" || bill.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getVotePercentage = (votes: number, total: number) => {
    return total > 0 ? Math.round((votes / total) * 100) : 0;
  };

  const getBillVoteStats = (bill: Bill) => {
    // Ensure userVotes exists with default values
    const userVotes = bill.userVotes || { yes: 0, no: 0, abstain: 0 };
    const totalVotes = bill.totalVotes || 0;
    
    return {
      yes: userVotes.yes || 0,
      no: userVotes.no || 0,
      abstain: userVotes.abstain || 0,
      total: totalVotes
    };
  };

  const getElectoralVoteStats = (candidate: ElectoralCandidate) => {
    // Ensure voteStats exists with default values
    const voteStats = candidate.voteStats || { preference: 0, support: 0, oppose: 0, total: 0 };
    
    return {
      preference: voteStats.preference || 0,
      support: voteStats.support || 0,
      oppose: voteStats.oppose || 0,
      total: voteStats.total || 0
    };
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'passed': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (billsLoading || candidatesLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (billsError || candidatesError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error Loading Voting Data</h3>
              <p className="text-gray-600">Unable to load voting information at this time. Please try again later.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const categories = Array.from(new Set(bills.map(bill => bill.category)));
  const statuses = Array.from(new Set(bills.map(bill => bill.status)));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Democratic Voting Platform</h1>
          <p className="text-gray-600">Cast your vote on bills and electoral candidates</p>
        </div>

        <Tabs defaultValue="bills" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bills" className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Bills & Legislation</span>
            </TabsTrigger>
            <TabsTrigger value="electoral" className="flex items-center space-x-2">
              <Crown className="w-4 h-4" />
              <span>Electoral Voting</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bills" className="space-y-6">
            {/* Search and Filter */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search bills..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by status" />
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

              {/* Results Count */}
              <div className="mt-4">
                <p className="text-gray-600">
                  Showing {filteredBills.length} of {bills.length} bills
                </p>
              </div>
            </div>

            {/* Bills Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredBills.map((bill) => {
                const CategoryIcon = getCategoryIcon(bill.category);
                const { yes, no, abstain, total } = getBillVoteStats(bill);
                const yesPercentage = getVotePercentage(yes, total);
                const noPercentage = getVotePercentage(no, total);
                const abstainPercentage = getVotePercentage(abstain, total);

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
                            <Badge className={`text-xs ${getStatusColor(bill.status)}`}>
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

                        {/* Vote Results */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Vote Results:</span>
                            <span className="font-medium">{bill.totalVotes} total votes</span>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span className="text-sm">Support</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium">{yes}</span>
                                <span className="text-sm text-gray-500">({yesPercentage}%)</span>
                              </div>
                            </div>
                            <Progress value={yesPercentage} className="h-2" />
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <XCircle className="w-4 h-4 text-red-600" />
                                <span className="text-sm">Oppose</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium">{no}</span>
                                <span className="text-sm text-gray-500">({noPercentage}%)</span>
                              </div>
                            </div>
                            <Progress value={noPercentage} className="h-2" />
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <MinusCircle className="w-4 h-4 text-gray-600" />
                                <span className="text-sm">Abstain</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium">{abstain}</span>
                                <span className="text-sm text-gray-500">({abstainPercentage}%)</span>
                              </div>
                            </div>
                            <Progress value={abstainPercentage} className="h-2" />
                          </div>
                        </div>

                        {/* Voting Buttons */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant={bill.userVote === 'yes' ? 'default' : 'outline'}
                              onClick={() => handleBillVote(bill.id, 'yes')}
                              disabled={voteMutation.isPending}
                            >
                              <ThumbsUp className="w-4 h-4 mr-1" />
                              Support
                            </Button>
                            <Button
                              size="sm"
                              variant={bill.userVote === 'no' ? 'default' : 'outline'}
                              onClick={() => handleBillVote(bill.id, 'no')}
                              disabled={voteMutation.isPending}
                            >
                              <ThumbsDown className="w-4 h-4 mr-1" />
                              Oppose
                            </Button>
                            <Button
                              size="sm"
                              variant={bill.userVote === 'abstain' ? 'default' : 'outline'}
                              onClick={() => handleBillVote(bill.id, 'abstain')}
                              disabled={voteMutation.isPending}
                            >
                              <MinusCircle className="w-4 h-4 mr-1" />
                              Abstain
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredBills.length === 0 && (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No bills found</h3>
                <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="electoral" className="space-y-6">
            {/* Electoral Statistics */}
            {electoralResults && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Total Votes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">
                      {electoralResults.totalVotes || 0}
                    </div>
                    <p className="text-sm text-gray-600">Citizens participated</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">
                      {electoralTrends?.recentVotes || 0}
                    </div>
                    <p className="text-sm text-gray-600">Votes this week</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Top Candidate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-600">
                      {electoralResults?.topCandidate?.name || 'N/A'}
                    </div>
                    <p className="text-sm text-gray-600">
                      {electoralResults?.topCandidate?.totalVotes || 0} votes
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Electoral Candidates */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {candidates.map((candidate) => (
                <Card key={candidate.id} className="bg-white shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge className={`text-xs ${getPartyColor(candidate.party)}`}>
                            {candidate.party}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Trust: {candidate.trustScore}
                          </Badge>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {candidate.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {candidate.position}
                        </p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {candidate.bio}
                      </p>

                      {/* Vote Statistics */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Preference Votes:</span>
                          <span className="font-medium">{getElectoralVoteStats(candidate).preference}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Support Votes:</span>
                          <span className="font-medium">{getElectoralVoteStats(candidate).support}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Oppose Votes:</span>
                          <span className="font-medium">{getElectoralVoteStats(candidate).oppose}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm font-medium">
                          <span>Total Votes:</span>
                          <span>{getElectoralVoteStats(candidate).total}</span>
                        </div>
                      </div>

                      {/* Key Policies */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Key Policies:</h4>
                        <div className="flex flex-wrap gap-1">
                          {candidate.keyPolicies.slice(0, 3).map((policy, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {policy}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Voting Buttons */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleElectoralVote(candidate.id, 'preference')}
                            disabled={electoralVoteMutation.isPending}
                          >
                            <Star className="w-4 h-4 mr-1" />
                            Prefer
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleElectoralVote(candidate.id, 'support')}
                            disabled={electoralVoteMutation.isPending}
                          >
                            <ThumbsUp className="w-4 h-4 mr-1" />
                            Support
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleElectoralVote(candidate.id, 'oppose')}
                            disabled={electoralVoteMutation.isPending}
                          >
                            <ThumbsDown className="w-4 h-4 mr-1" />
                            Oppose
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {candidates.length === 0 && (
              <div className="text-center py-12">
                <Crown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No electoral candidates found</h3>
                <p className="text-gray-600">Electoral candidates will appear here when available.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 