import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FileText, CheckCircle, Users, Eye, Share2, Target, Clock, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { VotingButtons } from "@/components/VotingButtons";
import { InteractiveContent } from "@/components/InteractiveContent";
import { ShareToCivicSocialDialog } from "@/components/ui/ShareToCivicSocialDialog";

interface Petition {
  id: number;
  title: string;
  description: string;
  targetSignatures: number;
  currentSignatures: number;
  creatorId: string;
  targetOfficial?: string;
  billId?: number;
  category: string;
  status: "active" | "successful" | "closed";
  createdAt: string;
  deadlineDate?: string;
  isVerified: boolean;
  creator?: {
    firstName: string;
    email: string;
    profileImageUrl?: string;
  };
  bill?: {
    title: string;
    billNumber: string;
  };
}

interface Bill {
  id: number;
  title: string;
  billNumber: string;
  status: string;
}

function Petitions() {
  const [showCreatePetition, setShowCreatePetition] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recent");
  const [selectedPetition, setSelectedPetition] = useState<Petition | null>(null);
  const [newPetition, setNewPetition] = useState({
    title: "",
    description: "",
    targetSignatures: 1000,
    targetOfficial: "",
    billId: "",
    category: "general",
    deadlineDate: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch petitions
  const { data: petitions = [], isLoading: petitionsLoading } = useQuery<Petition[]>({
    queryKey: ["/api/petitions", selectedCategory, sortBy]
  });

  // Use API data only. If no data, show fallback UI.
  const petitionsToShow = petitions;
  const filteredPetitions = petitionsToShow.filter(
    petition => selectedCategory === "all" || petition.category === selectedCategory
  );

  // Fetch bills for petition targeting
  const { data: bills = [] } = useQuery<Bill[]>({
    queryKey: ["/api/bills"]
  });

  // Create petition mutation
  const createPetitionMutation = useMutation({
    mutationFn: async (petitionData: any) => {
      return await apiRequest("/api/petitions", "POST", petitionData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your petition has been created successfully!"
      });
      setShowCreatePetition(false);
      setNewPetition({
        title: "",
        description: "",
        targetSignatures: 1000,
        targetOfficial: "",
        billId: "",
        category: "general",
        deadlineDate: ""
      });
      queryClient.invalidateQueries({ queryKey: ["/api/petitions"] });
    }
  });

  // Sign petition mutation
  const signPetitionMutation = useMutation({
    mutationFn: async (petitionId: number) => {
      return await apiRequest(`/api/petitions/${petitionId}/sign`, "POST");
    },
    onSuccess: () => {
      toast({
        title: "Signed!",
        description: "Thank you for supporting this petition."
      });
      queryClient.invalidateQueries({ queryKey: ["/api/petitions"] });
    }
  });

  const handleSignPetition = (petitionId: number) => {
    signPetitionMutation.mutate(petitionId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-blue-100 text-blue-800";
      case "successful": return "bg-green-100 text-green-800";
      case "closed": return "bg-gray-200 text-gray-600";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getProgressPercentage = (current: number, target: number) => {
    if (!target || target === 0) return 0;
    return Math.min(100, (current / target) * 100);
  };

  const categories = [
    { value: "all", label: "All Petitions" },
    { value: "federal", label: "Federal Issues" },
    { value: "provincial", label: "Provincial Issues" },
    { value: "municipal", label: "Municipal Issues" },
    { value: "environment", label: "Environment" },
    { value: "healthcare", label: "Healthcare" },
    { value: "education", label: "Education" },
    { value: "justice", label: "Justice & Rights" },
    { value: "general", label: "General" }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header, filters, and create petition dialog would go here */}
      <div className="space-y-6">
        {selectedPetition ? (
          <div> {/* Your detailed petition view code here */} </div>
        ) : petitionsLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-300">Loading petitions...</p>
          </div>
        ) : filteredPetitions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No petitions found
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Be the first to create a petition in this category!
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredPetitions.map((petition) => {
            const progressPercentage = getProgressPercentage(petition.currentSignatures, petition.targetSignatures);
            const isSuccessful = petition.currentSignatures >= petition.targetSignatures;
            return (
              <Card key={petition.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge className={getStatusColor(petition.status)}>
                          {petition.status.charAt(0).toUpperCase() + petition.status.slice(1)}
                        </Badge>
                        {petition.isVerified && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                        {petition.bill && (
                          <Badge variant="secondary">
                            Against {petition.bill.billNumber}
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        {petition.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                        {petition.description}
                      </p>
                      {petition.targetOfficial && (
                        <div className="flex items-center space-x-2 mb-3">
                          <Target className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            Directed to: {petition.targetOfficial}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="ml-6 text-right">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {typeof petition.currentSignatures === 'number' ? petition.currentSignatures.toLocaleString() : '0'}
                      </div>
                      <div className="text-sm text-gray-500">
                        of {typeof petition.targetSignatures === 'number' ? petition.targetSignatures.toLocaleString() : '500'} signatures
                      </div>
                    </div>
                  </div>
                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Progress
                      </span>
                      <span className="text-sm text-gray-500">
                        {progressPercentage.toFixed(1)}%
                      </span>
                    </div>
                    <Progress 
                      value={progressPercentage} 
                      className={`h-2 ${isSuccessful ? 'bg-green-200' : 'bg-gray-200'}`}
                    />
                  </div>
                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {petition.creator?.firstName?.[0] || petition.creator?.email?.[0] || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <span>{petition.creator?.firstName || petition.creator?.email?.split('@')[0]}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{new Date(petition.createdAt).toLocaleDateString()}</span>
                      </div>
                      {petition.deadlineDate && (
                        <div className="flex items-center space-x-1">
                          <AlertCircle className="h-4 w-4" />
                          <span>Deadline: {new Date(petition.deadlineDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedPetition(petition)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                      <ShareToCivicSocialDialog
                        trigger={
                          <Button variant="outline" size="sm">
                            <Share2 className="h-4 w-4 mr-1" />
                            Share
                          </Button>
                        }
                        itemType="petition"
                        itemId={petition.id}
                        title={petition.title}
                        summary={petition.description}
                      />
                      {petition.status === "active" && !isSuccessful && (
                        <Button 
                          onClick={() => handleSignPetition(petition.id)}
                          disabled={signPetitionMutation.isPending}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          <Users className="h-4 w-4 mr-1" />
                          {signPetitionMutation.isPending ? "Signing..." : "Sign Petition"}
                        </Button>
                      )}
                      {isSuccessful && (
                        <Button disabled className="bg-green-600">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Goal Reached!
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

export default Petitions;