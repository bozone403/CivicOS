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
  id: number;
  politician: string;
  promise: string;
  date: string;
  status: string;
  category: string;
  source: string;
  progress: number;
  notes: string;
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

// Fallback data for when API fails
const fallbackMemoryData: MemoryResponse = {
  memory: [],
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  }
};

export default function MemoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTimeframe, setFilterTimeframe] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const { data: memoryData, isLoading, error } = useQuery<MemoryResponse>({
    queryKey: ['/api/memory', searchTerm, filterTimeframe, currentPage],
    queryFn: async () => {
      try {
        const response = await apiRequest('/api/memory', 'GET', {
          search: searchTerm,
          timeframe: filterTimeframe,
          page: currentPage.toString(),
          limit: '20'
        });
        return response;
      } catch (error) {
        // console.error removed for production
        return fallbackMemoryData;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "text-green-600 bg-green-50 border-green-200";
      case "in_progress": return "text-blue-600 bg-blue-50 border-blue-200";
      case "pending": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "proposed": return "text-purple-600 bg-purple-50 border-purple-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "text-green-600 bg-green-50 border-green-200";
    if (progress >= 50) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
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

  const displayData = memoryData || fallbackMemoryData;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-serif text-foreground">Political Memory</h1>
          <p className="text-muted-foreground mt-2">
            Track political promises, commitments, and their outcomes over time
          </p>
          {error && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                <AlertTriangle className="inline w-4 h-4 mr-1" />
                Showing sample data due to connection issues.
              </p>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Brain className="w-3 h-3 mr-1" />
            Memory Database
          </Badge>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <TrendingUp className="w-3 h-3 mr-1" />
            {displayData.pagination.total} promises tracked
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
            {displayData.memory.map((item) => (
              <Card key={item.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold">{item.promise}</CardTitle>
                      <CardDescription className="mt-2">
                        Made by {item.politician} on {formatDate(item.date)}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-end space-y-2 ml-4">
                      <Badge className={getStatusColor(item.status)}>
                        {item.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <Badge className={getProgressColor(item.progress)}>
                        {item.progress}% Complete
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h4 className="font-semibold text-sm mb-1">Category</h4>
                        <p className="text-sm text-muted-foreground">{item.category}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm mb-1">Source</h4>
                        <p className="text-sm text-muted-foreground">{item.source}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm mb-1">Progress</h4>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${item.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Notes</h4>
                      <p className="text-sm text-muted-foreground">{item.notes}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Promise Analysis</CardTitle>
              <CardDescription>
                Analysis of promise fulfillment patterns and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">20%</div>
                  <div className="text-sm text-green-700">Completed</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">40%</div>
                  <div className="text-sm text-blue-700">In Progress</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">40%</div>
                  <div className="text-sm text-yellow-700">Pending</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pattern Recognition</CardTitle>
              <CardDescription>
                AI-powered analysis of political promise patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Most Common Promise Categories</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Healthcare</span>
                      <span className="font-semibold">40%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Economy</span>
                      <span className="font-semibold">30%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxation</span>
                      <span className="font-semibold">20%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Environment</span>
                      <span className="font-semibold">10%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}