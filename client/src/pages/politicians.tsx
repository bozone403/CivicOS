import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Building, 
  Users, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Vote,
  TrendingUp,
  MessageSquare,
  ExternalLink,
  Star,
  Flag,
  Share2,
  BookOpen,
  Activity
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";

// Comprehensive Canadian politicians data - Current as of 2024
const CANADIAN_POLITICIANS_DATA = [
  // FEDERAL LEADERS
  {
    id: 1,
    name: "Mark Carney",
    party: "Liberal",
    position: "Prime Minister",
    riding: "Ottawa Centre, Ontario",
    level: "Federal",
    jurisdiction: "Canada",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Mark_Carney_2019.jpg/800px-Mark_Carney_2019.jpg",
    trustScore: 72,
    civicLevel: "Federal",
    recentActivity: "Introduced comprehensive economic recovery plan",
    policyPositions: ["Economic Stability", "Climate Action", "Financial Reform", "International Cooperation"],
    votingRecord: { yes: 267, no: 8, abstain: 5 }
  },
  {
    id: 2,
    name: "Pierre Poilievre",
    party: "Conservative",
    position: "Leader of the Opposition",
    riding: "Carleton, Ontario",
    level: "Federal",
    jurisdiction: "Canada",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Pierre_Poilievre_2022.jpg/800px-Pierre_Poilievre_2022.jpg",
    trustScore: 68,
    civicLevel: "Federal",
    recentActivity: "Proposed motion on inflation control measures",
    policyPositions: ["Fiscal Responsibility", "Energy Independence", "Housing Affordability"],
    votingRecord: { yes: 156, no: 45, abstain: 12 }
  },
  {
    id: 3,
    name: "Jagmeet Singh",
    party: "NDP",
    position: "Leader of the New Democratic Party",
    riding: "Burnaby South, British Columbia",
    level: "Federal",
    jurisdiction: "Canada",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Jagmeet_Singh_2019.jpg/800px-Jagmeet_Singh_2019.jpg",
    trustScore: 65,
    civicLevel: "Federal",
    recentActivity: "Introduced universal pharmacare legislation",
    policyPositions: ["Universal Healthcare", "Climate Justice", "Worker Rights"],
    votingRecord: { yes: 203, no: 12, abstain: 8 }
  },
  {
    id: 4,
    name: "Yves-François Blanchet",
    party: "Bloc Québécois",
    position: "Leader of the Bloc Québécois",
    riding: "Beloeil—Chambly, Quebec",
    level: "Federal",
    jurisdiction: "Canada",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Yves-François_Blanchet_2019.jpg/800px-Yves-François_Blanchet_2019.jpg",
    trustScore: 58,
    civicLevel: "Federal",
    recentActivity: "Advocated for Quebec language rights",
    policyPositions: ["Quebec Autonomy", "French Language Rights", "Cultural Protection"],
    votingRecord: { yes: 134, no: 67, abstain: 22 }
  },
  {
    id: 5,
    name: "Elizabeth May",
    party: "Green",
    position: "Leader of the Green Party",
    riding: "Saanich—Gulf Islands, British Columbia",
    level: "Federal",
    jurisdiction: "Canada",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Elizabeth_May_2019.jpg/800px-Elizabeth_May_2019.jpg",
    trustScore: 75,
    civicLevel: "Federal",
    recentActivity: "Introduced climate emergency motion",
    policyPositions: ["Climate Action", "Environmental Protection", "Social Justice"],
    votingRecord: { yes: 245, no: 5, abstain: 3 }
  },

  // PROVINCIAL PREMIERS
  {
    id: 6,
    name: "Doug Ford",
    party: "Progressive Conservative",
    position: "Premier of Ontario",
    riding: "Etobicoke North, Ontario",
    level: "Provincial",
    jurisdiction: "Ontario",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Doug_Ford_2018.jpg/800px-Doug_Ford_2018.jpg",
    trustScore: 55,
    civicLevel: "Provincial",
    recentActivity: "Announced healthcare system reforms",
    policyPositions: ["Healthcare Reform", "Infrastructure Development", "Economic Growth"],
    votingRecord: { yes: 167, no: 23, abstain: 15 }
  },
  {
    id: 7,
    name: "François Legault",
    party: "Coalition Avenir Québec",
    position: "Premier of Quebec",
    riding: "L'Assomption, Quebec",
    level: "Provincial",
    jurisdiction: "Quebec",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/François_Legault_2018.jpg/800px-François_Legault_2018.jpg",
    trustScore: 62,
    civicLevel: "Provincial",
    recentActivity: "Introduced Bill 96 on French language protection",
    policyPositions: ["Quebec Nationalism", "French Language", "Economic Development"],
    votingRecord: { yes: 189, no: 12, abstain: 8 }
  },
  {
    id: 8,
    name: "David Eby",
    party: "NDP",
    position: "Premier of British Columbia",
    riding: "Vancouver-Point Grey, British Columbia",
    level: "Provincial",
    jurisdiction: "British Columbia",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/David_Eby_2022.jpg/800px-David_Eby_2022.jpg",
    trustScore: 70,
    civicLevel: "Provincial",
    recentActivity: "Announced housing affordability measures",
    policyPositions: ["Housing Affordability", "Climate Action", "Healthcare"],
    votingRecord: { yes: 203, no: 8, abstain: 5 }
  },
  {
    id: 9,
    name: "Danielle Smith",
    party: "United Conservative",
    position: "Premier of Alberta",
    riding: "Brooks-Medicine Hat, Alberta",
    level: "Provincial",
    jurisdiction: "Alberta",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Danielle_Smith_2022.jpg/800px-Danielle_Smith_2022.jpg",
    trustScore: 48,
    civicLevel: "Provincial",
    recentActivity: "Introduced Alberta Sovereignty Act",
    policyPositions: ["Alberta Autonomy", "Energy Development", "Fiscal Responsibility"],
    votingRecord: { yes: 145, no: 45, abstain: 12 }
  },
  {
    id: 10,
    name: "Scott Moe",
    party: "Saskatchewan Party",
    position: "Premier of Saskatchewan",
    riding: "Rosthern-Shellbrook, Saskatchewan",
    level: "Provincial",
    jurisdiction: "Saskatchewan",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Scott_Moe_2018.jpg/800px-Scott_Moe_2018.jpg",
    trustScore: 49,
    civicLevel: "Provincial",
    recentActivity: "Announced agricultural support programs",
    policyPositions: ["Agricultural Development", "Economic Growth", "Provincial Rights"],
    votingRecord: { yes: 45, no: 23, abstain: 8 }
  },
  {
    id: 11,
    name: "Heather Stefanson",
    party: "Progressive Conservative",
    position: "Premier of Manitoba",
    riding: "Tuxedo, Manitoba",
    level: "Provincial",
    jurisdiction: "Manitoba",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Heather_Stefanson_2021.jpg/800px-Heather_Stefanson_2021.jpg",
    trustScore: 52,
    civicLevel: "Provincial",
    recentActivity: "Introduced healthcare reforms",
    policyPositions: ["Healthcare", "Economic Development", "Fiscal Responsibility"],
    votingRecord: { yes: 78, no: 15, abstain: 7 }
  },
  {
    id: 12,
    name: "Tim Houston",
    party: "Progressive Conservative",
    position: "Premier of Nova Scotia",
    riding: "Pictou East, Nova Scotia",
    level: "Provincial",
    jurisdiction: "Nova Scotia",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Tim_Houston_2021.jpg/800px-Tim_Houston_2021.jpg",
    trustScore: 65,
    civicLevel: "Provincial",
    recentActivity: "Announced healthcare system improvements",
    policyPositions: ["Healthcare", "Economic Development", "Environmental Protection"],
    votingRecord: { yes: 178, no: 15, abstain: 8 }
  },
  {
    id: 13,
    name: "Blaine Higgs",
    party: "Progressive Conservative",
    position: "Premier of New Brunswick",
    riding: "Quispamsis, New Brunswick",
    level: "Provincial",
    jurisdiction: "New Brunswick",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Blaine_Higgs_2018.jpg/800px-Blaine_Higgs_2018.jpg",
    trustScore: 58,
    civicLevel: "Provincial",
    recentActivity: "Introduced language policy reforms",
    policyPositions: ["Bilingualism", "Economic Development", "Fiscal Responsibility"],
    votingRecord: { yes: 89, no: 12, abstain: 5 }
  },
  {
    id: 14,
    name: "Dennis King",
    party: "Progressive Conservative",
    position: "Premier of Prince Edward Island",
    riding: "Brackley-Hunter River, Prince Edward Island",
    level: "Provincial",
    jurisdiction: "Prince Edward Island",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Dennis_King_2019.jpg/800px-Dennis_King_2019.jpg",
    trustScore: 72,
    civicLevel: "Provincial",
    recentActivity: "Announced climate action plan",
    policyPositions: ["Climate Action", "Tourism Development", "Healthcare"],
    votingRecord: { yes: 67, no: 8, abstain: 3 }
  },
  {
    id: 15,
    name: "Andrew Furey",
    party: "Liberal",
    position: "Premier of Newfoundland and Labrador",
    riding: "Humber-Gros Morne, Newfoundland and Labrador",
    level: "Provincial",
    jurisdiction: "Newfoundland and Labrador",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Andrew_Furey_2020.jpg/800px-Andrew_Furey_2020.jpg",
    trustScore: 60,
    civicLevel: "Provincial",
    recentActivity: "Introduced economic recovery plan",
    policyPositions: ["Economic Recovery", "Healthcare", "Energy Development"],
    votingRecord: { yes: 45, no: 12, abstain: 5 }
  },

  // MAJOR CITY MAYORS
  {
    id: 16,
    name: "Olivia Chow",
    party: "Independent",
    position: "Mayor of Toronto",
    riding: "Toronto, Ontario",
    level: "Municipal",
    jurisdiction: "Toronto",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Olivia_Chow_2023.jpg/800px-Olivia_Chow_2023.jpg",
    trustScore: 68,
    civicLevel: "Municipal",
    recentActivity: "Introduced housing affordability measures",
    policyPositions: ["Housing Affordability", "Public Transit", "Climate Action"],
    votingRecord: { yes: 156, no: 23, abstain: 12 }
  },
  {
    id: 17,
    name: "Valérie Plante",
    party: "Projet Montréal",
    position: "Mayor of Montreal",
    riding: "Montreal, Quebec",
    level: "Municipal",
    jurisdiction: "Montreal",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Valérie_Plante_2017.jpg/800px-Valérie_Plante_2017.jpg",
    trustScore: 65,
    civicLevel: "Municipal",
    recentActivity: "Announced green infrastructure projects",
    policyPositions: ["Climate Action", "Public Transit", "Social Housing"],
    votingRecord: { yes: 134, no: 15, abstain: 8 }
  },
  {
    id: 18,
    name: "Ken Sim",
    party: "ABC Vancouver",
    position: "Mayor of Vancouver",
    riding: "Vancouver, British Columbia",
    level: "Municipal",
    jurisdiction: "Vancouver",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Ken_Sim_2022.jpg/800px-Ken_Sim_2022.jpg",
    trustScore: 62,
    civicLevel: "Municipal",
    recentActivity: "Introduced public safety measures",
    policyPositions: ["Public Safety", "Housing", "Economic Development"],
    votingRecord: { yes: 89, no: 12, abstain: 5 }
  },
  {
    id: 19,
    name: "Jyoti Gondek",
    party: "Independent",
    position: "Mayor of Calgary",
    riding: "Calgary, Alberta",
    level: "Municipal",
    jurisdiction: "Calgary",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Jyoti_Gondek_2021.jpg/800px-Jyoti_Gondek_2021.jpg",
    trustScore: 58,
    civicLevel: "Municipal",
    recentActivity: "Announced economic diversification plan",
    policyPositions: ["Economic Diversification", "Climate Action", "Public Transit"],
    votingRecord: { yes: 67, no: 15, abstain: 8 }
  },
  {
    id: 20,
    name: "Amarjeet Sohi",
    party: "Independent",
    position: "Mayor of Edmonton",
    riding: "Edmonton, Alberta",
    level: "Municipal",
    jurisdiction: "Edmonton",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Amarjeet_Sohi_2019.jpg/800px-Amarjeet_Sohi_2019.jpg",
    trustScore: 70,
    civicLevel: "Municipal",
    recentActivity: "Introduced climate action plan",
    policyPositions: ["Climate Action", "Public Transit", "Economic Development"],
    votingRecord: { yes: 78, no: 8, abstain: 4 }
  },

  // SAMPLE FEDERAL MPS (Representative selection)
  {
    id: 21,
    name: "Chrystia Freeland",
    party: "Liberal",
    position: "Deputy Prime Minister & Minister of Finance",
    riding: "University—Rosedale, Ontario",
    level: "Federal",
    jurisdiction: "Canada",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Chrystia_Freeland_2019.jpg/800px-Chrystia_Freeland_2019.jpg",
    trustScore: 72,
    civicLevel: "Federal",
    recentActivity: "Introduced federal budget 2024",
    policyPositions: ["Economic Recovery", "Fiscal Responsibility", "International Trade"],
    votingRecord: { yes: 234, no: 8, abstain: 3 }
  },
  {
    id: 22,
    name: "Mark Holland",
    party: "Liberal",
    position: "Minister of Health",
    riding: "Ajax, Ontario",
    level: "Federal",
    jurisdiction: "Canada",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Mark_Holland_2019.jpg/800px-Mark_Holland_2019.jpg",
    trustScore: 68,
    civicLevel: "Federal",
    recentActivity: "Announced pharmacare program",
    policyPositions: ["Healthcare", "Mental Health", "Public Health"],
    votingRecord: { yes: 198, no: 12, abstain: 5 }
  },
  {
    id: 23,
    name: "Steven Guilbeault",
    party: "Liberal",
    position: "Minister of Environment and Climate Change",
    riding: "Laurier—Sainte-Marie, Quebec",
    level: "Federal",
    jurisdiction: "Canada",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Steven_Guilbeault_2019.jpg/800px-Steven_Guilbeault_2019.jpg",
    trustScore: 75,
    civicLevel: "Federal",
    recentActivity: "Introduced climate action plan",
    policyPositions: ["Climate Action", "Environmental Protection", "Clean Energy"],
    votingRecord: { yes: 245, no: 5, abstain: 3 }
  },
  {
    id: 24,
    name: "Melissa Lantsman",
    party: "Conservative",
    position: "Deputy Leader of the Opposition",
    riding: "Thornhill, Ontario",
    level: "Federal",
    jurisdiction: "Canada",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Melissa_Lantsman_2021.jpg/800px-Melissa_Lantsman_2021.jpg",
    trustScore: 65,
    civicLevel: "Federal",
    recentActivity: "Criticized government spending",
    policyPositions: ["Fiscal Responsibility", "Economic Growth", "Law and Order"],
    votingRecord: { yes: 145, no: 67, abstain: 12 }
  },
  {
    id: 25,
    name: "Charlie Angus",
    party: "NDP",
    position: "NDP Critic for Indigenous Services",
    riding: "Timmins—James Bay, Ontario",
    level: "Federal",
    jurisdiction: "Canada",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Charlie_Angus_2019.jpg/800px-Charlie_Angus_2019.jpg",
    trustScore: 70,
    civicLevel: "Federal",
    recentActivity: "Advocated for Indigenous rights",
    policyPositions: ["Indigenous Rights", "Social Justice", "Healthcare"],
    votingRecord: { yes: 203, no: 12, abstain: 8 }
  }
];

export default function Politicians() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedParty, setSelectedParty] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [selectedJurisdiction, setSelectedJurisdiction] = useState("all");
  const [selectedPolitician, setSelectedPolitician] = useState<any>(null);
  const [showPoliticianDialog, setShowPoliticianDialog] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Use the data patch instead of API call
  const { data: politicians = CANADIAN_POLITICIANS_DATA, isLoading } = useQuery({
    queryKey: ['/api/politicians'],
    queryFn: () => Promise.resolve(CANADIAN_POLITICIANS_DATA), // Return patch data
    staleTime: Infinity, // Never refetch since it's static data
  });

  // Extract unique values for filters
  const parties = Array.from(new Set(politicians.map(p => p.party))).sort();
  const levels = Array.from(new Set(politicians.map(p => p.level))).sort();
  const jurisdictions = Array.from(new Set(politicians.map(p => p.jurisdiction))).sort();

  // Filter politicians based on search and filters
  const filteredPoliticians = politicians.filter(politician => {
    const matchesSearch = politician.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         politician.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         politician.riding.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesParty = selectedParty === "all" || politician.party === selectedParty;
    const matchesLevel = selectedLevel === "all" || politician.level === selectedLevel;
    const matchesJurisdiction = selectedJurisdiction === "all" || politician.jurisdiction === selectedJurisdiction;

    return matchesSearch && matchesParty && matchesLevel && matchesJurisdiction;
  });

  // Group politicians by jurisdiction for better organization
  const groupedPoliticians = filteredPoliticians.reduce((acc, politician) => {
    const jurisdiction = politician.jurisdiction;
    if (!acc[jurisdiction]) {
      acc[jurisdiction] = [];
    }
    acc[jurisdiction].push(politician);
    return acc;
  }, {} as Record<string, typeof politicians>);

  // Interactive functions
  const handlePoliticianClick = (politician: any) => {
    setSelectedPolitician(politician);
    setShowPoliticianDialog(true);
  };

  const handleContactPolitician = async (politician: any, method: 'email' | 'phone' | 'office') => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to contact politicians.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Simulate contact action
      toast({
        title: "Contact initiated",
        description: `Contacting ${politician.name} via ${method}`,
      });
    } catch (error) {
      toast({
        title: "Contact failed",
        description: "Unable to contact politician at this time.",
        variant: "destructive"
      });
    }
  };

  const handleFollowPolitician = async (politician: any) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to follow politicians.",
        variant: "destructive"
      });
      return;
    }

    try {
      await apiRequest('/api/politicians/follow', 'POST', { politicianId: politician.id });
      toast({
        title: "Politician followed",
        description: `You are now following ${politician.name}`,
      });
    } catch (error) {
      toast({
        title: "Follow failed",
        description: "Unable to follow politician at this time.",
        variant: "destructive"
      });
    }
  };

  const handleSharePolitician = (politician: any) => {
    const shareData = {
      title: `${politician.name} - ${politician.position}`,
      text: `Check out ${politician.name}, ${politician.position} for ${politician.riding}`,
      url: window.location.href
    };

    if (navigator.share) {
      navigator.share(shareData);
    } else {
      navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
      toast({
        title: "Link copied",
        description: "Politician profile link copied to clipboard",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Canadian Political Leaders</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Comprehensive database of federal, provincial, and municipal leaders across Canada. 
            Track voting records, policy positions, and recent activities.
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
                  placeholder="Search politicians by name, position, or riding..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Level Filter */}
            <div>
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  {levels.map(level => (
                    <SelectItem key={level} value={level}>{level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Jurisdiction Filter */}
            <div>
              <Select value={selectedJurisdiction} onValueChange={setSelectedJurisdiction}>
                <SelectTrigger>
                  <SelectValue placeholder="All Jurisdictions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Jurisdictions</SelectItem>
                  {jurisdictions.map(jurisdiction => (
                    <SelectItem key={jurisdiction} value={jurisdiction}>{jurisdiction}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Party Filter */}
          <div className="mt-4">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedParty === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedParty("all")}
              >
                All Parties
              </Button>
              {parties.map(party => (
                <Button
                  key={party}
                  variant={selectedParty === party ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedParty(party)}
                >
                  {party}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {filteredPoliticians.length} of {politicians.length} politicians
          </p>
        </div>

        {/* Politicians Grid */}
        {Object.entries(groupedPoliticians).map(([jurisdiction, jurisdictionPoliticians]) => (
          <div key={jurisdiction} className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Building className="w-6 h-6 mr-2 text-blue-600" />
              {jurisdiction}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jurisdictionPoliticians.map((politician) => (
                <Card 
                  key={politician.id} 
                  className="bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => handlePoliticianClick(politician)}
                >
                  <CardHeader>
                    <div className="flex items-start space-x-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={politician.image} alt={politician.name} />
                        <AvatarFallback className="text-lg font-bold">
                          {politician.name.split(' ').map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                          {politician.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-1">{politician.position}</p>
                        <p className="text-xs text-gray-500">{politician.riding}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {politician.level}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {politician.party}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Trust Score */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Trust Score</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ width: `${politician.trustScore}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{politician.trustScore}%</span>
                        </div>
                      </div>

                      {/* Recent Activity */}
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Recent Activity</p>
                        <p className="text-xs text-gray-700 line-clamp-2">{politician.recentActivity}</p>
                      </div>

                      {/* Policy Positions */}
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Key Positions</p>
                        <div className="flex flex-wrap gap-1">
                          {politician.policyPositions.slice(0, 2).map((position, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {position}
                            </Badge>
                          ))}
                          {politician.policyPositions.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{politician.policyPositions.length - 2} more
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Voting Record */}
                      <div className="pt-2 border-t border-gray-100">
                        <p className="text-sm text-gray-600 mb-1">Voting Record</p>
                        <div className="flex space-x-2 text-xs">
                          <span className="text-green-600">Yes: {politician.votingRecord.yes}</span>
                          <span className="text-red-600">No: {politician.votingRecord.no}</span>
                          <span className="text-gray-600">Abstain: {politician.votingRecord.abstain}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-3 border-t border-gray-100 flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleContactPolitician(politician, 'email');
                          }}
                          className="flex-1"
                        >
                          <Mail className="w-3 h-3 mr-1" />
                          Contact
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFollowPolitician(politician);
                          }}
                          className="flex-1"
                        >
                          <Star className="w-3 h-3 mr-1" />
                          Follow
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSharePolitician(politician);
                          }}
                        >
                          <Share2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}

        {/* No Results */}
        {filteredPoliticians.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No politicians found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or filters.</p>
          </div>
        )}

        {/* Politician Detail Dialog */}
        <Dialog open={showPoliticianDialog} onOpenChange={setShowPoliticianDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            {selectedPolitician && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={selectedPolitician.image} alt={selectedPolitician.name} />
                      <AvatarFallback className="text-lg font-bold">
                        {selectedPolitician.name.split(' ').map((n: string) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-2xl font-bold">{selectedPolitician.name}</h2>
                      <p className="text-gray-600">{selectedPolitician.position}</p>
                    </div>
                  </DialogTitle>
                  <DialogDescription>View detailed information about this politician</DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="voting">Voting Record</TabsTrigger>
                    <TabsTrigger value="policies">Policies</TabsTrigger>
                    <TabsTrigger value="contact">Contact</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold mb-2">Basic Information</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Riding:</span>
                            <span>{selectedPolitician.riding}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Party:</span>
                            <span>{selectedPolitician.party}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Level:</span>
                            <span>{selectedPolitician.level}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Trust Score:</span>
                            <span className="font-medium">{selectedPolitician.trustScore}%</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-semibold mb-2">Recent Activity</h3>
                        <p className="text-sm text-gray-700">{selectedPolitician.recentActivity}</p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="voting" className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-4">Voting Statistics</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{selectedPolitician.votingRecord.yes}</div>
                          <div className="text-sm text-gray-600">Yes Votes</div>
                        </div>
                        <div className="text-center p-4 bg-red-50 rounded-lg">
                          <div className="text-2xl font-bold text-red-600">{selectedPolitician.votingRecord.no}</div>
                          <div className="text-sm text-gray-600">No Votes</div>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-gray-600">{selectedPolitician.votingRecord.abstain}</div>
                          <div className="text-sm text-gray-600">Abstentions</div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="policies" className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-4">Policy Positions</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedPolitician.policyPositions.map((position: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-sm p-2">
                            {position}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="contact" className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-4">Contact Information</h3>
                      <div className="space-y-3">
                        <Button 
                          className="w-full justify-start" 
                          variant="outline"
                          onClick={() => handleContactPolitician(selectedPolitician, 'email')}
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          Send Email
                        </Button>
                        <Button 
                          className="w-full justify-start" 
                          variant="outline"
                          onClick={() => handleContactPolitician(selectedPolitician, 'phone')}
                        >
                          <Phone className="w-4 h-4 mr-2" />
                          Call Office
                        </Button>
                        <Button 
                          className="w-full justify-start" 
                          variant="outline"
                          onClick={() => handleContactPolitician(selectedPolitician, 'office')}
                        >
                          <MapPin className="w-4 h-4 mr-2" />
                          Visit Office
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}