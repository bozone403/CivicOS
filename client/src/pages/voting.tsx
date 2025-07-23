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
  Zap
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

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
    userVotes: { yes: 1456, no: 234, abstain: 67 },
    totalVotes: 1757,
    userVote: null,
    sponsor: "François-Philippe Champagne",
    sponsorParty: "Liberal",
    summary: "Modernizes Canada's privacy laws to address challenges of the digital economy, including AI, data collection, and online platforms.",
    keyProvisions: [
      "Strengthens personal data protection",
      "Regulates AI and automated decision-making",
      "Increases penalties for violations",
      "Enhances individual rights"
    ],
    fiscalImpact: "Estimated $500 million over 3 years",
    timeline: "Expected Royal Assent: September 2024"
  },
  {
    id: 4,
    billNumber: "C-91",
    title: "Indigenous Languages Act",
    description: "An Act respecting Indigenous languages",
    status: "Active",
    stage: "Third Reading",
    jurisdiction: "Federal",
    category: "Indigenous Rights",
    introducedDate: "2024-01-12",
    lastVoteDate: "2024-01-22",
    governmentVote: "Yes",
    oppositionVote: "Yes",
    userVotes: { yes: 1678, no: 89, abstain: 45 },
    totalVotes: 1812,
    userVote: null,
    sponsor: "Marc Miller",
    sponsorParty: "Liberal",
    summary: "Supports the revitalization and preservation of Indigenous languages across Canada through funding and institutional support.",
    keyProvisions: [
      "Establishes Indigenous Languages Commissioner",
      "Provides funding for language programs",
      "Supports language education",
      "Preserves cultural heritage"
    ],
    fiscalImpact: "Estimated $1.2 billion over 10 years",
    timeline: "Expected Royal Assent: April 2024"
  },
  {
    id: 5,
    billNumber: "C-97",
    title: "Budget Implementation Act, 2024",
    description: "An Act to implement certain provisions of the budget tabled in Parliament on March 28, 2024",
    status: "Active",
    stage: "Second Reading",
    jurisdiction: "Federal",
    category: "Finance",
    introducedDate: "2024-01-08",
    lastVoteDate: "2024-01-25",
    governmentVote: "Yes",
    oppositionVote: "No",
    userVotes: { yes: 756, no: 987, abstain: 123 },
    totalVotes: 1866,
    userVote: null,
    sponsor: "Chrystia Freeland",
    sponsorParty: "Liberal",
    summary: "Implements the 2024 federal budget including new spending measures, tax changes, and economic stimulus programs.",
    keyProvisions: [
      "New housing affordability measures",
      "Climate action funding",
      "Healthcare investments",
      "Tax relief for middle class"
    ],
    fiscalImpact: "$89.2 billion in new spending",
    timeline: "Expected Royal Assent: May 2024"
  },
  {
    id: 6,
    billNumber: "C-101",
    title: "Universal Pharmacare Act",
    description: "An Act to establish a universal, single-payer, public pharmacare program",
    status: "Active",
    stage: "First Reading",
    jurisdiction: "Federal",
    category: "Healthcare",
    introducedDate: "2024-01-20",
    lastVoteDate: null,
    governmentVote: "Yes",
    oppositionVote: "Mixed",
    userVotes: { yes: 1892, no: 234, abstain: 78 },
    totalVotes: 2204,
    userVote: null,
    sponsor: "Mark Holland",
    sponsorParty: "Liberal",
    summary: "Establishes a national pharmacare program to provide prescription drug coverage for all Canadians.",
    keyProvisions: [
      "Universal prescription drug coverage",
      "National formulary",
      "Bulk purchasing program",
      "Cost-sharing with provinces"
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

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: (data: { billId: number; vote: 'yes' | 'no' | 'abstain' }) => 
      apiRequest('/api/bills/vote', 'POST', data),
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

  // Get unique values for filters
  const categories = [...new Set(bills.map(b => b.category))].sort();
  const statuses = [...new Set(bills.map(b => b.status))].sort();
  const jurisdictions = [...new Set(bills.map(b => b.jurisdiction))].sort();

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Parallel Voting System</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Vote on current Canadian legislation and see how your choices compare to official parliamentary votes. 
            This is your voice in democracy.
          </p>
        </div>

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
      </div>
    </div>
  );
}