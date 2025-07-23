import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Search, Filter, TrendingUp, Users, Calendar, Target, CheckCircle, AlertTriangle, Clock, Share2, Bookmark, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Canadian petitions data patch
const CANADIAN_PETITIONS_DATA = [
  {
    id: 1,
    title: "Support Universal Dental Care for All Canadians",
    description: "Petition to implement universal dental care coverage for all Canadian citizens, ensuring access to essential dental services regardless of income.",
    creator: "Canadian Dental Association",
    category: "Healthcare",
    region: "National",
    targetSignatures: 50000,
    currentSignatures: 42350,
    daysLeft: 15,
    status: "Active",
    urgency: "High",
    verified: true,
    image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=400&fit=crop",
    tags: ["Healthcare", "Dental Care", "Universal Coverage"],
    supporters: [
      { name: "Dr. Sarah Johnson", role: "Dentist", location: "Toronto, ON" },
      { name: "Canadian Medical Association", role: "Organization", location: "Ottawa, ON" },
      { name: "Health Coalition", role: "Advocacy Group", location: "Vancouver, BC" }
    ]
  },
  {
    id: 2,
    title: "Protect Indigenous Land Rights and Sovereignty",
    description: "Petition to strengthen Indigenous land rights, respect treaty obligations, and ensure meaningful consultation on development projects affecting Indigenous territories.",
    creator: "Assembly of First Nations",
    category: "Indigenous Rights",
    region: "National",
    targetSignatures: 75000,
    currentSignatures: 67890,
    daysLeft: 8,
    status: "Active",
    urgency: "Critical",
    verified: true,
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop",
    tags: ["Indigenous Rights", "Land Rights", "Treaty Obligations"],
    supporters: [
      { name: "Chief Roseanne Archibald", role: "National Chief", location: "Ottawa, ON" },
      { name: "Indigenous Environmental Network", role: "Organization", location: "Winnipeg, MB" },
      { name: "Truth and Reconciliation Commission", role: "Government Body", location: "Ottawa, ON" }
    ]
  },
  {
    id: 3,
    title: "Implement Stronger Climate Action Plan",
    description: "Petition demanding immediate action on climate change with concrete targets for emissions reduction and investment in renewable energy infrastructure.",
    creator: "Climate Action Network Canada",
    category: "Environment",
    region: "National",
    targetSignatures: 100000,
    currentSignatures: 89234,
    daysLeft: 22,
    status: "Active",
    urgency: "Critical",
    verified: true,
    image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=400&fit=crop",
    tags: ["Climate Change", "Renewable Energy", "Emissions Reduction"],
    supporters: [
      { name: "David Suzuki Foundation", role: "Environmental Organization", location: "Vancouver, BC" },
      { name: "Greenpeace Canada", role: "Environmental Organization", location: "Toronto, ON" },
      { name: "Canadian Environmental Law Association", role: "Legal Organization", location: "Toronto, ON" }
    ]
  },
  {
    id: 4,
    title: "Reform Electoral System to Proportional Representation",
    description: "Petition to replace the first-past-the-post electoral system with proportional representation to ensure fair representation of all political parties.",
    creator: "Fair Vote Canada",
    category: "Democracy",
    region: "National",
    targetSignatures: 60000,
    currentSignatures: 45678,
    daysLeft: 30,
    status: "Active",
    urgency: "Medium",
    verified: true,
    image: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=400&fit=crop",
    tags: ["Electoral Reform", "Proportional Representation", "Democracy"],
    supporters: [
      { name: "Fair Vote Canada", role: "Advocacy Organization", location: "Ottawa, ON" },
      { name: "Canadian Centre for Policy Alternatives", role: "Think Tank", location: "Ottawa, ON" },
      { name: "Democracy Watch", role: "Watchdog Organization", location: "Ottawa, ON" }
    ]
  },
  {
    id: 5,
    title: "Increase Funding for Mental Health Services",
    description: "Petition to significantly increase federal and provincial funding for mental health services, including crisis intervention and long-term care programs.",
    creator: "Canadian Mental Health Association",
    category: "Healthcare",
    region: "National",
    targetSignatures: 45000,
    currentSignatures: 38901,
    daysLeft: 12,
    status: "Active",
    urgency: "High",
    verified: true,
    image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&h=400&fit=crop",
    tags: ["Mental Health", "Healthcare Funding", "Crisis Intervention"],
    supporters: [
      { name: "Canadian Mental Health Association", role: "Healthcare Organization", location: "Toronto, ON" },
      { name: "Canadian Psychiatric Association", role: "Professional Association", location: "Ottawa, ON" },
      { name: "Mental Health Commission of Canada", role: "Government Agency", location: "Calgary, AB" }
    ]
  },
  {
    id: 6,
    title: "Protect Affordable Housing in Urban Centers",
    description: "Petition to implement stronger rent control measures and increase affordable housing stock in major Canadian cities to address the housing crisis.",
    creator: "Canadian Housing and Renewal Association",
    category: "Housing",
    region: "Urban",
    targetSignatures: 35000,
    currentSignatures: 31234,
    daysLeft: 18,
    status: "Active",
    urgency: "High",
    verified: true,
    image: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=400&fit=crop",
    tags: ["Affordable Housing", "Rent Control", "Urban Development"],
    supporters: [
      { name: "Canadian Housing and Renewal Association", role: "Housing Organization", location: "Ottawa, ON" },
      { name: "ACORN Canada", role: "Tenant Advocacy", location: "Toronto, ON" },
      { name: "Canadian Federation of Students", role: "Student Organization", location: "Ottawa, ON" }
    ]
  },
  {
    id: 7,
    title: "Strengthen Anti-Corruption Laws and Enforcement",
    description: "Petition to strengthen anti-corruption legislation and increase funding for enforcement agencies to combat political corruption and corporate fraud.",
    creator: "Transparency International Canada",
    category: "Transparency",
    region: "National",
    targetSignatures: 40000,
    currentSignatures: 34567,
    daysLeft: 25,
    status: "Active",
    urgency: "Medium",
    verified: true,
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=400&fit=crop",
    tags: ["Anti-Corruption", "Transparency", "Law Enforcement"],
    supporters: [
      { name: "Transparency International Canada", role: "Anti-Corruption Organization", location: "Ottawa, ON" },
      { name: "Canadian Bar Association", role: "Legal Association", location: "Ottawa, ON" },
      { name: "Public Service Alliance of Canada", role: "Union", location: "Ottawa, ON" }
    ]
  },
  {
    id: 8,
    title: "Support Small Business Recovery Post-Pandemic",
    description: "Petition to provide additional financial support and tax relief for small businesses struggling to recover from the economic impacts of the pandemic.",
    creator: "Canadian Federation of Independent Business",
    category: "Economy",
    region: "National",
    targetSignatures: 30000,
    currentSignatures: 26789,
    daysLeft: 20,
    status: "Active",
    urgency: "Medium",
    verified: true,
    image: "https://images.unsplash.com/photo-1513828583688-c52646db42da?w=800&h=400&fit=crop",
    tags: ["Small Business", "Economic Recovery", "Tax Relief"],
    supporters: [
      { name: "Canadian Federation of Independent Business", role: "Business Association", location: "Toronto, ON" },
      { name: "Canadian Chamber of Commerce", role: "Business Organization", location: "Ottawa, ON" },
      { name: "Canadian Restaurant and Foodservices Association", role: "Industry Association", location: "Toronto, ON" }
    ]
  },
  {
    id: 9,
    title: "Alberta Independence Referendum",
    description: "Petition to hold a provincial referendum on Alberta's independence from Canada, allowing Albertans to vote on their constitutional future and potential sovereignty.",
    creator: "Alberta Sovereignty Movement",
    category: "Constitutional",
    region: "Alberta",
    targetSignatures: 25000,
    currentSignatures: 18945,
    daysLeft: 45,
    status: "Active",
    urgency: "High",
    verified: true,
    image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=400&fit=crop",
    tags: ["Alberta Independence", "Constitutional Reform", "Provincial Sovereignty"],
    supporters: [
      { name: "Alberta Sovereignty Movement", role: "Advocacy Organization", location: "Calgary, AB" },
      { name: "Western Canada Foundation", role: "Think Tank", location: "Edmonton, AB" },
      { name: "Alberta First Coalition", role: "Political Organization", location: "Red Deer, AB" }
    ]
  }
];

export default function Petitions() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedPetition, setSelectedPetition] = useState<any>(null);

  // Use data patch instead of API call
  const { data: petitions = CANADIAN_PETITIONS_DATA } = useQuery({
    queryKey: ['/api/petitions'],
    queryFn: () => Promise.resolve(CANADIAN_PETITIONS_DATA),
    staleTime: Infinity,
  });

  const filteredPetitions = petitions.filter(petition => {
    const matchesSearch = petition.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         petition.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         petition.creator.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || petition.category === selectedCategory;
    const matchesRegion = selectedRegion === "all" || petition.region === selectedRegion;
    const matchesStatus = selectedStatus === "all" || petition.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesRegion && matchesStatus;
  });

  const categories = [...new Set(petitions.map(p => p.category))];
  const regions = [...new Set(petitions.map(p => p.region))];
  const statuses = [...new Set(petitions.map(p => p.status))];

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "Critical": return "bg-red-100 text-red-800";
      case "High": return "bg-orange-100 text-orange-800";
      case "Medium": return "bg-yellow-100 text-yellow-800";
      case "Low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Canadian Petitions</h1>
          <p className="text-gray-600">Support causes that matter to Canadians and make your voice heard</p>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All Petitions</TabsTrigger>
            <TabsTrigger value="trending">Trending</TabsTrigger>
            <TabsTrigger value="ending">Ending Soon</TabsTrigger>
            <TabsTrigger value="successful">Successful</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search petitions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
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
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
                  <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Regions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Regions</SelectItem>
                      {regions.map(region => (
                        <SelectItem key={region} value={region}>{region}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      {statuses.map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("all");
                      setSelectedRegion("all");
                      setSelectedStatus("all");
                    }}
                    className="w-full"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </div>

            {/* Petitions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPetitions.map((petition) => (
                <Card key={petition.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedPetition(petition)}>
                  <div className="aspect-video bg-gray-200 rounded-t-lg overflow-hidden">
                    <img 
                      src={petition.image} 
                      alt={petition.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="outline" className="text-xs">
                        {petition.category}
                      </Badge>
                      <Badge className={`text-xs ${getUrgencyColor(petition.urgency)}`}>
                        {petition.urgency}
                      </Badge>
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {petition.title}
                    </h3>
                    
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">
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
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredPetitions.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No petitions found matching your criteria.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="trending" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPetitions
                .filter(p => p.currentSignatures > 50000)
                .map((petition) => (
                  <Card key={petition.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedPetition(petition)}>
                    <div className="aspect-video bg-gray-200 rounded-t-lg overflow-hidden">
                      <img 
                        src={petition.image} 
                        alt={petition.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="outline" className="text-xs">
                          {petition.category}
                        </Badge>
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      </div>
                      
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                        {petition.title}
                      </h3>
                      
                      <p className="text-sm text-gray-600 mb-4 line-clamp-3">
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
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="ending" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPetitions
                .filter(p => p.daysLeft <= 10)
                .map((petition) => (
                  <Card key={petition.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedPetition(petition)}>
                    <div className="aspect-video bg-gray-200 rounded-t-lg overflow-hidden">
                      <img 
                        src={petition.image} 
                        alt={petition.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="outline" className="text-xs">
                          {petition.category}
                        </Badge>
                        <AlertTriangle className="w-4 h-4 text-orange-600" />
                      </div>
                      
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                        {petition.title}
                      </h3>
                      
                      <p className="text-sm text-gray-600 mb-4 line-clamp-3">
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
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="successful" className="space-y-6">
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No successful petitions yet. Be the first to reach your target!</p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Petition Detail Modal */}
        {selectedPetition && (
          <Dialog open={!!selectedPetition} onOpenChange={() => setSelectedPetition(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">{selectedPetition.title}</DialogTitle>
                <DialogDescription>View detailed information about this petition</DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
                  <img 
                    src={selectedPetition.image} 
                    alt={selectedPetition.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Badge variant="outline">{selectedPetition.category}</Badge>
                    <Badge variant="secondary">{selectedPetition.region}</Badge>
                    <Badge className={getUrgencyColor(selectedPetition.urgency)}>
                      {selectedPetition.urgency}
                    </Badge>
                  </div>
                  {selectedPetition.verified && (
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-600">Verified</span>
                    </div>
                  )}
                </div>
                
                <p className="text-gray-700 leading-relaxed">
                  {selectedPetition.description}
                </p>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600">Progress to Target</span>
                      <span className="font-medium">{selectedPetition.currentSignatures.toLocaleString()} / {selectedPetition.targetSignatures.toLocaleString()}</span>
                    </div>
                    <Progress value={getProgressPercentage(selectedPetition.currentSignatures, selectedPetition.targetSignatures)} className="h-3" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span>{selectedPetition.currentSignatures.toLocaleString()} signatures</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Target className="w-4 h-4 text-gray-500" />
                      <span>{selectedPetition.targetSignatures.toLocaleString()} target</span>
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
                    {selectedPetition.supporters.map((supporter: any, index: number) => (
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
                    <Button variant="outline" size="sm">
                      <Bookmark className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                    <Button variant="outline" size="sm">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                    <Button size="sm">
                      Sign Petition
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}