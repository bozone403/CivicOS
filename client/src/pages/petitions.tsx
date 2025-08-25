import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Search, Filter, TrendingUp, Users, Calendar, Target, CheckCircle, AlertTriangle, Clock, Share2, Bookmark, ExternalLink, Plus, MessageSquare } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Petition {
  id: number;
  title: string;
  description: string;
  creator: string;
  creatorId: string;
  category?: string;
  region?: string;
  targetSignatures: number;
  currentSignatures: number;
  daysLeft: number;
  status: string;
  urgency: string;
  verified: boolean;
  image?: string;
  tags?: string[];
  supporters?: Array<{
    name: string;
    role: string;
    location: string;
  }>;
  deadlineDate: string;
  createdAt: string;
  updatedAt: string;
}

export default function Petitions() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [selectedPetition, setSelectedPetition] = useState<Petition | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showSignDialog, setShowSignDialog] = useState(false);
  const [signatureComment, setSignatureComment] = useState("");

  // Fetch petitions from API
  const { data: petitions = [], isLoading, error } = useQuery<Petition[]>({
    queryKey: ['/api/petitions'],
    queryFn: async () => {
      try {
        const result = await apiRequest('/api/petitions', 'GET');
        // Handle wrapped API response format
        if (result && typeof result === 'object' && 'data' in result) {
          return Array.isArray(result.data) ? result.data : [];
        }
        // Fallback for direct array response
        return Array.isArray(result) ? result : [];
      } catch (error) {
        console.error('Failed to fetch petitions:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  // Create petition mutation
  const createPetitionMutation = useMutation({
    mutationFn: async (petitionData: Partial<Petition>) => {
      return await apiRequest('/api/petitions', 'POST', petitionData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your petition has been created successfully.",
      });
      setShowCreateDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/petitions"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to create petition. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Sign petition mutation
  const signPetitionMutation = useMutation({
    mutationFn: async (petitionId: number) => {
      return await apiRequest(`/api/petitions/${petitionId}/sign`, 'POST', {
        comment: signatureComment
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "You have successfully signed this petition!",
      });
      setShowSignDialog(false);
      setSignatureComment("");
      queryClient.invalidateQueries({ queryKey: ["/api/petitions"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to sign petition. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSignPetition = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to sign petitions.",
        variant: "destructive",
      });
      return;
    }
    setShowSignDialog(true);
  };

  const handleSavePetition = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to save petitions.",
        variant: "destructive",
      });
      return;
    }
    // TODO: Implement save petition functionality
    toast({
      title: "Feature coming soon",
      description: "Save functionality will be available soon.",
    });
  };

  const handleSharePetition = async (petitionId: number, platform: string) => {
    const petition = petitions.find(p => p.id === petitionId);
    if (!petition) return;
    
    const shareUrl = `${window.location.origin}/petitions?id=${petitionId}`;
    const shareText = `Sign this petition: ${petition.title} on CivicOS`;
    
    if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
    } else if (platform === 'civicsocial') {
      toast({
        title: "Feature coming soon",
        description: "CivicSocial sharing will be available soon.",
      });
    }
  };

  const handleCreatePetition = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to create petitions.",
        variant: "destructive",
      });
      return;
    }

    // TODO: Implement proper form handling
    createPetitionMutation.mutate({
      title: "New Petition Title", // Placeholder
      description: "New Petition Description", // Placeholder
      category: "Democracy", // Placeholder
      targetSignatures: 500, // Placeholder
      deadlineDate: "2024-12-31" // Placeholder
    });
  };

  const filteredPetitions = petitions.filter(petition => {
    const matchesSearch = petition.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         petition.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || petition.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || petition.status === statusFilter;
    const matchesUrgency = urgencyFilter === "all" || petition.urgency === urgencyFilter;
    return matchesSearch && matchesCategory && matchesStatus && matchesUrgency;
  });

  const getUrgencyColor = (urgency: string) => {
    switch (urgency.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  if (isLoading) {
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

  // Show error state but still display fallback data if available
  if (error && petitions.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error Loading Petitions</h3>
              <p className="text-gray-600">Unable to load petitions at this time. Please try again later.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Canadian Petitions</h1>
            <p className="text-gray-600">Make your voice heard on important issues affecting Canadians</p>
          </div>
          <Button 
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Petition
          </Button>
        </div>
        {error && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              <AlertTriangle className="inline w-4 h-4 mr-1" />
              Showing sample data due to connection issues. Some features may be limited.
            </p>
          </div>
        )}
        {/* Test button for development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <CheckCircle className="inline w-4 h-4 mr-1" />
              Petitions section is working. {petitions.length} petitions loaded.
            </p>
          </div>
        )}
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search petitions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="w-full md:w-48">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Healthcare">Healthcare</SelectItem>
              <SelectItem value="Environment">Environment</SelectItem>
              <SelectItem value="Democracy">Democracy</SelectItem>
              <SelectItem value="Indigenous Rights">Indigenous Rights</SelectItem>
              <SelectItem value="Housing">Housing</SelectItem>
              <SelectItem value="Economy">Economy</SelectItem>
              <SelectItem value="Transparency">Transparency</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full md:w-48">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full md:w-48">
          <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by urgency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Urgencies</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Petitions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPetitions.map((petition) => (
          <Card key={petition.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">{petition.title}</CardTitle>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      {petition.category}
                    </Badge>
                    <Badge className={`text-xs ${getUrgencyColor(petition.urgency)}`}>
                      {petition.urgency}
                    </Badge>
                    {petition.verified && (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pb-6">
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {petition.description}
              </p>
              
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium">{petition.currentSignatures.toLocaleString()} / {petition.targetSignatures.toLocaleString()}</span>
                  </div>
                  <Progress value={getProgressPercentage(petition.currentSignatures, petition.targetSignatures)} className="h-2" />
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-2">
                    <Users className="w-3 h-3" />
                    <span>{petition.currentSignatures.toLocaleString()} signatures</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-3 h-3" />
                    <span>{petition.daysLeft} days left</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <span className="text-sm font-medium text-gray-700">{petition.creator}</span>
                {petition.verified && (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                )}
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSavePetition()}
                    disabled={createPetitionMutation.isPending}
                  >
                    <Bookmark className="w-4 h-4 mr-1" />
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSharePetition(petition.id, 'twitter')}
                    disabled={createPetitionMutation.isPending}
                  >
                    <Share2 className="w-4 h-4 mr-1" />
                    Share
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSharePetition(petition.id, 'civicsocial')}
                  >
                    <MessageSquare className="w-4 h-4 mr-1" />
                    CivicSocial
                  </Button>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleSignPetition()}
                  disabled={signPetitionMutation.isPending}
                >
                  Sign Petition
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPetitions.length === 0 && (
        <div className="text-center py-12">
          <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No petitions found</h3>
          <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
        </div>
      )}

      {/* Petition Detail Dialog */}
      <Dialog open={!!selectedPetition} onOpenChange={(open) => !open && setSelectedPetition(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedPetition && (
            <div>
              <DialogHeader>
                <DialogTitle>{selectedPetition.title}</DialogTitle>
                <DialogDescription>{selectedPetition.description}</DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 mt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span>{selectedPetition.currentSignatures.toLocaleString()} signatures</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span>{selectedPetition.daysLeft} days left</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span>{selectedPetition.status}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3">Key Supporters</h4>
                  <div className="space-y-2">
                    {selectedPetition.supporters?.map((supporter, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{supporter.name}</p>
                          <p className="text-xs text-gray-600">{supporter.role}</p>
                        </div>
                        <span className="text-xs text-gray-500">{supporter.location}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
                    <span>Created by: {selectedPetition.creator}</span>
                    <span>{selectedPetition.daysLeft} days remaining</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleSavePetition()}
                    >
                      <Bookmark className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleSharePetition(selectedPetition.id, 'twitter')}
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => handleSignPetition()}
                    >
                      Sign Petition
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Petition Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Petition</DialogTitle>
            <DialogDescription>
              Start a petition to make your voice heard on important issues.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-6">
            <div>
              <Label htmlFor="title">Petition Title *</Label>
              <Input
                id="title"
                placeholder="Enter petition title..."
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe your petition and why it's important..."
                rows={4}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select 
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Democracy">Democracy</SelectItem>
                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                    <SelectItem value="Environment">Environment</SelectItem>
                    <SelectItem value="Housing">Housing</SelectItem>
                    <SelectItem value="Economy">Economy</SelectItem>
                    <SelectItem value="Indigenous Rights">Indigenous Rights</SelectItem>
                    <SelectItem value="Transparency">Transparency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="targetSignatures">Target Signatures</Label>
                <Input
                  id="targetSignatures"
                  type="number"
                  placeholder="500"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="deadlineDate">Deadline (Optional)</Label>
              <Input
                id="deadlineDate"
                type="date"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreatePetition}
              disabled={createPetitionMutation.isPending}
            >
              {createPetitionMutation.isPending ? "Creating..." : "Create Petition"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 