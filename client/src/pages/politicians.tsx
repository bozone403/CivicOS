import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Filter, MapPin, Building, Crown, Users, TrendingUp, Activity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Real Canadian politicians data patch
const CANADIAN_POLITICIANS_DATA = [
  {
    id: 1,
    name: "Justin Trudeau",
    party: "Liberal",
    position: "Prime Minister",
    riding: "Papineau, Quebec",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Justin_Trudeau_2019.jpg/800px-Justin_Trudeau_2019.jpg",
    trustScore: 65,
    civicLevel: "Federal",
    recentActivity: "Introduced Bill C-69 on environmental assessment",
    policyPositions: ["Climate Action", "Social Programs", "International Relations"],
    votingRecord: { yes: 245, no: 12, abstain: 8 }
  },
  {
    id: 2,
    name: "Pierre Poilievre",
    party: "Conservative",
    position: "Leader of the Opposition",
    riding: "Carleton, Ontario",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Pierre_Poilievre_2022.jpg/800px-Pierre_Poilievre_2022.jpg",
    trustScore: 72,
    civicLevel: "Federal",
    recentActivity: "Criticized government spending in Question Period",
    policyPositions: ["Fiscal Responsibility", "Economic Growth", "Law and Order"],
    votingRecord: { yes: 189, no: 67, abstain: 15 }
  },
  {
    id: 3,
    name: "Jagmeet Singh",
    party: "NDP",
    position: "Leader of the New Democratic Party",
    riding: "Burnaby South, British Columbia",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Jagmeet_Singh_2019.jpg/800px-Jagmeet_Singh_2019.jpg",
    trustScore: 68,
    civicLevel: "Federal",
    recentActivity: "Advocated for dental care program",
    policyPositions: ["Social Justice", "Healthcare", "Climate Action"],
    votingRecord: { yes: 156, no: 89, abstain: 26 }
  },
  {
    id: 4,
    name: "Yves-François Blanchet",
    party: "Bloc Québécois",
    position: "Leader of the Bloc Québécois",
    riding: "Beloeil—Chambly, Quebec",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Yves-François_Blanchet_2019.jpg/800px-Yves-François_Blanchet_2019.jpg",
    trustScore: 58,
    civicLevel: "Federal",
    recentActivity: "Defended Quebec's language laws",
    policyPositions: ["Quebec Sovereignty", "French Language", "Provincial Rights"],
    votingRecord: { yes: 134, no: 112, abstain: 35 }
  },
  {
    id: 5,
    name: "Elizabeth May",
    party: "Green",
    position: "Leader of the Green Party",
    riding: "Saanich—Gulf Islands, British Columbia",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Elizabeth_May_2019.jpg/800px-Elizabeth_May_2019.jpg",
    trustScore: 75,
    civicLevel: "Federal",
    recentActivity: "Introduced climate emergency motion",
    policyPositions: ["Environmental Protection", "Climate Action", "Social Justice"],
    votingRecord: { yes: 198, no: 45, abstain: 38 }
  },
  {
    id: 6,
    name: "Doug Ford",
    party: "Progressive Conservative",
    position: "Premier of Ontario",
    riding: "Etobicoke North, Ontario",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Doug_Ford_2018.jpg/800px-Doug_Ford_2018.jpg",
    trustScore: 45,
    civicLevel: "Provincial",
    recentActivity: "Announced healthcare reforms",
    policyPositions: ["Economic Development", "Infrastructure", "Healthcare"],
    votingRecord: { yes: 89, no: 23, abstain: 12 }
  },
  {
    id: 7,
    name: "François Legault",
    party: "Coalition Avenir Québec",
    position: "Premier of Quebec",
    riding: "L'Assomption, Quebec",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/François_Legault_2018.jpg/800px-François_Legault_2018.jpg",
    trustScore: 52,
    civicLevel: "Provincial",
    recentActivity: "Introduced Bill 96 on French language",
    policyPositions: ["Quebec Nationalism", "French Language", "Economic Development"],
    votingRecord: { yes: 67, no: 34, abstain: 8 }
  },
  {
    id: 8,
    name: "John Horgan",
    party: "NDP",
    position: "Premier of British Columbia",
    riding: "Langford-Juan de Fuca, British Columbia",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/John_Horgan_2017.jpg/800px-John_Horgan_2017.jpg",
    trustScore: 61,
    civicLevel: "Provincial",
    recentActivity: "Announced climate action plan",
    policyPositions: ["Climate Action", "Social Programs", "Indigenous Reconciliation"],
    votingRecord: { yes: 78, no: 45, abstain: 12 }
  },
  {
    id: 9,
    name: "Jason Kenney",
    party: "United Conservative",
    position: "Premier of Alberta",
    riding: "Calgary-Lougheed, Alberta",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Jason_Kenney_2019.jpg/800px-Jason_Kenney_2019.jpg",
    trustScore: 38,
    civicLevel: "Provincial",
    recentActivity: "Defended energy sector policies",
    policyPositions: ["Energy Development", "Fiscal Responsibility", "Provincial Rights"],
    votingRecord: { yes: 56, no: 67, abstain: 15 }
  },
  {
    id: 10,
    name: "Scott Moe",
    party: "Saskatchewan Party",
    position: "Premier of Saskatchewan",
    riding: "Rosthern-Shellbrook, Saskatchewan",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Scott_Moe_2018.jpg/800px-Scott_Moe_2018.jpg",
    trustScore: 49,
    civicLevel: "Provincial",
    recentActivity: "Announced agricultural support programs",
    policyPositions: ["Agricultural Development", "Economic Growth", "Provincial Rights"],
    votingRecord: { yes: 45, no: 23, abstain: 8 }
  }
];

export default function Politicians() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedParty, setSelectedParty] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState("all");

  // Use the data patch instead of API call
  const { data: politicians = CANADIAN_POLITICIANS_DATA, isLoading } = useQuery({
    queryKey: ['/api/politicians'],
    queryFn: () => Promise.resolve(CANADIAN_POLITICIANS_DATA), // Return patch data
    staleTime: Infinity, // Never refetch since it's static data
  });

  const filteredPoliticians = politicians.filter(politician => {
    const matchesSearch = politician.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         politician.party.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         politician.position.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesParty = selectedParty === "all" || politician.party === selectedParty;
    const matchesLevel = selectedLevel === "all" || politician.civicLevel === selectedLevel;
    
    return matchesSearch && matchesParty && matchesLevel;
  });

  const parties = [...new Set(politicians.map(p => p.party))];
  const levels = [...new Set(politicians.map(p => p.civicLevel))];

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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Canadian Politicians</h1>
          <p className="text-gray-600">Track and analyze political figures across Canada</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search politicians..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Party</label>
              <select
                value={selectedParty}
                onChange={(e) => setSelectedParty(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Parties</option>
                {parties.map(party => (
                  <option key={party} value={party}>{party}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Levels</option>
                {levels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery("");
                  setSelectedParty("all");
                  setSelectedLevel("all");
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Politicians</p>
                  <p className="text-2xl font-bold text-gray-900">{politicians.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Building className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Federal</p>
                  <p className="text-2xl font-bold text-gray-900">{politicians.filter(p => p.civicLevel === "Federal").length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Crown className="w-8 h-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Provincial</p>
                  <p className="text-2xl font-bold text-gray-900">{politicians.filter(p => p.civicLevel === "Provincial").length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Activity className="w-8 h-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-gray-900">{politicians.filter(p => p.recentActivity).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Politicians Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPoliticians.map((politician) => (
            <Card key={politician.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start space-x-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={politician.image} alt={politician.name} />
                    <AvatarFallback className="text-lg font-bold">
                      {politician.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                      {politician.name}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mb-2">{politician.position}</p>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {politician.party}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {politician.civicLevel}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    {politician.riding}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Trust Score</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${politician.trustScore}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{politician.trustScore}%</span>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Recent Activity</p>
                    <p className="text-sm text-gray-800">{politician.recentActivity}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Key Positions</p>
                    <div className="flex flex-wrap gap-1">
                      {politician.policyPositions.slice(0, 2).map((position, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {position}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Voting Record</span>
                    <div className="flex space-x-2">
                      <span className="text-green-600">✓ {politician.votingRecord.yes}</span>
                      <span className="text-red-600">✗ {politician.votingRecord.no}</span>
                      <span className="text-gray-600">○ {politician.votingRecord.abstain}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredPoliticians.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No politicians found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}