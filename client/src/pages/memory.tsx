import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Calendar, AlertTriangle, CheckCircle, Clock, TrendingUp, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface MemoryItem {
  id: string;
  politician: string;
  promise: string;
  madeDate: string;
  status: string;
  details: string;
  impact: string;
  mediaAttention: string;
  publicReaction: string;
  followUpActions: string;
}

interface MemoryResponse {
  memory: MemoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function MemoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTimeframe, setFilterTimeframe] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const { data: memoryData, isLoading, error } = useQuery<MemoryResponse>({
    queryKey: ['/api/memory', searchTerm, filterTimeframe, currentPage],
    queryFn: () => apiRequest('/api/memory', 'GET', {
      search: searchTerm,
      timeframe: filterTimeframe,
      page: currentPage.toString(),
      limit: '20'
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Kept": return "text-green-600 bg-green-50 border-green-200";
      case "Partially Kept": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "Broken": return "text-red-600 bg-red-50 border-red-200";
      case "In Progress": return "text-blue-600 bg-blue-50 border-blue-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "High": return "text-red-600 bg-red-50 border-red-200";
      case "Medium": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "Low": return "text-green-600 bg-green-50 border-green-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Brain className="w-12 h-12 mx-auto mb-4 text-gray-400 animate-pulse" />
            <p className="text-gray-600">Loading political memory database...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-400" />
            <p className="text-red-600">Failed to load political memory data</p>
            <p className="text-gray-600 text-sm mt-2">Please try again later</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-serif text-foreground">Political Memory</h1>
          <p className="text-muted-foreground mt-2">
            Track political promises, commitments, and their outcomes over time
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Brain className="w-3 h-3 mr-1" />
            Memory Database
          </Badge>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <TrendingUp className="w-3 h-3 mr-1" />
            {memoryData?.pagination.total || 0} promises tracked
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="promises" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="promises">Promise Tracker</TabsTrigger>
          <TabsTrigger value="analysis">Impact Analysis</TabsTrigger>
          <TabsTrigger value="patterns">Pattern Recognition</TabsTrigger>
        </TabsList>

        <TabsContent value="promises" className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Brain className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search promises, politicians, or policies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterTimeframe} onValueChange={setFilterTimeframe}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Filter by timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="current">Current Term</SelectItem>
                <SelectItem value="recent">Last 5 Years</SelectItem>
                <SelectItem value="historical">Historical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-6">
            {memoryData?.memory.map((item) => (
              <Card key={item.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold">{item.promise}</CardTitle>
                      <CardDescription className="mt-2">
                        Made by {item.politician} on {formatDate(item.madeDate)}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-end space-y-2 ml-4">
                      <Badge className={getStatusColor(item.status)}>
                        {item.status}
                      </Badge>
                      <Badge className={getImpactColor(item.impact)}>
                        {item.impact} Impact
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Details</h4>
                      <p className="text-sm text-muted-foreground">{item.details}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h4 className="font-semibold text-sm mb-1">Media Attention</h4>
                        <p className="text-sm text-muted-foreground">{item.mediaAttention}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm mb-1">Public Reaction</h4>
                        <p className="text-sm text-muted-foreground">{item.publicReaction}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm mb-1">Follow-up Actions</h4>
                        <p className="text-sm text-muted-foreground">{item.followUpActions}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <User className="w-4 h-4" />
                        <span>{item.politician}</span>
                        <Calendar className="w-4 h-4 ml-2" />
                        <span>{formatDate(item.madeDate)}</span>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Clock className="w-4 h-4 mr-2" />
                          Track Progress
                        </Button>
                        <Button variant="outline" size="sm">
                          <TrendingUp className="w-4 h-4 mr-2" />
                          View Impact
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {memoryData?.memory.length === 0 && (
            <div className="text-center py-12">
              <Brain className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">No political promises found matching your criteria</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Promise Impact Analysis</CardTitle>
              <CardDescription>
                Analysis of how political promises affect public trust and policy outcomes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Impact analysis features will be available soon. This will include detailed analysis
                of how political promises affect public trust, policy outcomes, and electoral results.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pattern Recognition</CardTitle>
              <CardDescription>
                Identify patterns in political promises and their outcomes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Pattern recognition features will be available soon. This will include AI-powered
                analysis to identify common patterns in political promises and their fulfillment rates.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}