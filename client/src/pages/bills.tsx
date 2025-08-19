import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Vote, 
  Clock, 
  Calendar,
  Users, 
  TrendingUp,
  FileText,
  Scale,
  DollarSign,
  Search,
  Filter,
  Building,
  Crown,
  Globe,
  ThumbsUp,
  ThumbsDown,
  Share2,
  ExternalLink,
  Minus,
  User,
  Award,
  Flag,
  Target,
  Eye,
  MessageSquare
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { VotingButtons } from '@/components/VotingButtons';
import { InteractiveContent } from '@/components/InteractiveContent';

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
  governmentUrl?: string;
  legiscanUrl?: string;
  fullTextUrl?: string;
  committeeReports?: string[];
  amendments?: string[];
  fiscalNote?: string;
  regulatoryImpact?: string;
  voteStats?: {
    total_votes: number;
    yes_votes: number;
    no_votes: number;
    abstentions: number;
  };
}

export default function Bills() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [jurisdictionFilter, setJurisdictionFilter] = useState('all');
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  // Fetch bills data
  const { data: bills = [], isLoading, error } = useQuery({
    queryKey: ['/api/bills'],
    queryFn: async (): Promise<Bill[]> => {
      try {
        const response = await apiRequest('/api/bills', 'GET');
        return response || [];
      } catch (error) {
        console.error('Failed to fetch bills:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Filter bills based on search and filters
  const filteredBills = bills.filter(bill => {
    const matchesSearch = bill.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bill.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bill.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bill.sponsor?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || bill.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || bill.category === categoryFilter;
    const matchesJurisdiction = jurisdictionFilter === 'all' || bill.jurisdiction === jurisdictionFilter;
    
    return matchesSearch && matchesStatus && matchesCategory && matchesJurisdiction;
  });

  // Get unique values for filters
  const statuses = [...new Set(bills.map(bill => bill.status))].filter(Boolean);
  const categories = [...new Set(bills.map(bill => bill.category))].filter(Boolean);
  const jurisdictions = [...new Set(bills.map(bill => bill.jurisdiction))].filter(Boolean);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'introduced': return 'bg-blue-100 text-blue-800';
      case 'passed': return 'bg-green-100 text-green-800';
      case 'defeated': return 'bg-red-100 text-red-800';
      case 'amended': return 'bg-yellow-100 text-yellow-800';
      case 'referred': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage?.toLowerCase()) {
      case 'first reading': return 'bg-blue-100 text-blue-800';
      case 'second reading': return 'bg-yellow-100 text-yellow-800';
      case 'third reading': return 'bg-green-100 text-green-800';
      case 'committee': return 'bg-purple-100 text-purple-800';
      case 'royal assent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-CA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const calculateSupportPercentage = (support: any) => {
    if (!support || !support.yes || !support.no) return 0;
    const total = support.yes + support.no + (support.neutral || 0);
    return total > 0 ? Math.round((support.yes / total) * 100) : 0;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-20">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Failed to Load Bills</h1>
            <p className="text-gray-600 mb-6">Unable to fetch bills data. Please try again later.</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bills & Legislation</h1>
          <p className="text-gray-600">Track and vote on current bills in Parliament and provincial legislatures</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search bills by title, number, or sponsor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {statuses.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={jurisdictionFilter} onValueChange={setJurisdictionFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by jurisdiction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Jurisdictions</SelectItem>
                {jurisdictions.map(jurisdiction => (
                  <SelectItem key={jurisdiction} value={jurisdiction}>{jurisdiction}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {filteredBills.length} of {bills.length} bills
            </p>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">Active filters: </span>
              {statusFilter !== 'all' && <Badge variant="secondary">{statusFilter}</Badge>}
              {categoryFilter !== 'all' && <Badge variant="secondary">{categoryFilter}</Badge>}
              {jurisdictionFilter !== 'all' && <Badge variant="secondary">{jurisdictionFilter}</Badge>}
            </div>
          </div>
        </div>

        {/* Bills Grid */}
        {filteredBills.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Bills Found</h2>
            <p className="text-gray-600">Try adjusting your search terms or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBills.map((bill) => (
              <Card key={bill.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg leading-tight mb-2">{bill.title}</CardTitle>
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant="outline" className="font-mono">{bill.billNumber}</Badge>
                        <Badge className={getStatusColor(bill.status)}>{bill.status}</Badge>
                        <Badge className={getStageColor(bill.stage)}>{bill.stage}</Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Bill Summary */}
                  <div>
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {bill.summary || bill.description || 'No summary available'}
                    </p>
                  </div>

                  {/* Sponsor Info */}
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {bill.sponsor} {bill.sponsorParty && `(${bill.sponsorParty})`}
                    </span>
                  </div>

                  {/* Dates */}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Introduced: {formatDate(bill.introducedDate)}</span>
                    </div>
                    {bill.nextVoteDate && (
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>Next vote: {formatDate(bill.nextVoteDate)}</span>
                      </div>
                    )}
                  </div>

                  {/* Public Support */}
                  {bill.publicSupport && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Public Support</span>
                        <span className="font-medium">{calculateSupportPercentage(bill.publicSupport)}%</span>
                      </div>
                      <Progress value={calculateSupportPercentage(bill.publicSupport)} className="h-2" />
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Yes: {bill.publicSupport.yes}</span>
                        <span>No: {bill.publicSupport.no}</span>
                        <span>Neutral: {bill.publicSupport.neutral || 0}</span>
                      </div>
                    </div>
                  )}

                  {/* Vote Stats */}
                  {bill.voteStats && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm font-medium text-gray-700 mb-2">Parliament Votes</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex justify-between">
                          <span>Yes:</span>
                          <span className="font-medium text-green-600">{bill.voteStats.yes_votes}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>No:</span>
                          <span className="font-medium text-red-600">{bill.voteStats.no_votes}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Abstain:</span>
                          <span className="font-medium text-gray-600">{bill.voteStats.abstentions}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total:</span>
                          <span className="font-medium">{bill.voteStats.total_votes}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2">
                    <VotingButtons 
                      targetType="bill" 
                      targetId={bill.id} 
                      size="sm" 
                    />
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedBill(bill)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Details
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (bill.governmentUrl) {
                            window.open(bill.governmentUrl, '_blank');
                          } else {
                            toast({
                              title: "No link available",
                              description: "Government link not available for this bill.",
                            });
                          }
                        }}
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Source
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Bill Detail Modal */}
        {selectedBill && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold">{selectedBill.title}</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedBill(null)}
                  >
                    ×
                  </Button>
                </div>

                <div className="space-y-6">
                  {/* Bill Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold mb-2">Bill Details</h3>
                      <div className="space-y-2 text-sm">
                        <div><strong>Number:</strong> {selectedBill.billNumber}</div>
                        <div><strong>Status:</strong> {selectedBill.status}</div>
                        <div><strong>Stage:</strong> {selectedBill.stage}</div>
                        <div><strong>Jurisdiction:</strong> {selectedBill.jurisdiction}</div>
                        <div><strong>Category:</strong> {selectedBill.category}</div>
                        <div><strong>Introduced:</strong> {formatDate(selectedBill.introducedDate)}</div>
                        {selectedBill.nextVoteDate && (
                          <div><strong>Next Vote:</strong> {formatDate(selectedBill.nextVoteDate)}</div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Sponsor</h3>
                      <div className="space-y-2 text-sm">
                        <div><strong>Name:</strong> {selectedBill.sponsor}</div>
                        <div><strong>Party:</strong> {selectedBill.sponsorParty}</div>
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  {selectedBill.summary && (
                    <div>
                      <h3 className="font-semibold mb-2">Summary</h3>
                      <p className="text-gray-700">{selectedBill.summary}</p>
                    </div>
                  )}

                  {/* Key Provisions */}
                  {selectedBill.keyProvisions && selectedBill.keyProvisions.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Key Provisions</h3>
                      <ul className="list-disc list-inside space-y-1 text-gray-700">
                        {selectedBill.keyProvisions.map((provision, index) => (
                          <li key={index}>{provision}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Interactive Content */}
                  <InteractiveContent
                    targetType="bill"
                    targetId={selectedBill.id}
                    title={selectedBill.title}
                    description={selectedBill.summary || selectedBill.description || ''}
                    showVoting={true}
                    showComments={true}
                    showSharing={true}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
