import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  Search, 
  ExternalLink, 
  Clock, 
  User, 
  Star,
  TrendingUp,
  Shield,
  Eye,
  Calendar,
  Globe,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  sourceId: number;
  url: string;
  publishedAt: string;
  category: string;
  region: string;
  credibility: number;
  bias: string;
  readTime: number;
  image?: string;
  tags: string[];
  verified: boolean;
}

interface NewsSource {
  id: number;
  name: string;
  url: string;
  logo?: string;
  credibility: number;
  bias: string;
  region: string;
  type: string;
  verified: boolean;
}

export default function News() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedSource, setSelectedSource] = useState("all");
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);

  // Fetch news articles from comprehensive data service
  const { data: articles = [], isLoading, error } = useQuery<NewsArticle[]>({
    queryKey: ['/api/news'],
    queryFn: async () => {
      try {
        const result = await apiRequest('/api/news', 'GET');
        // Handle wrapped API response format
        if (result && typeof result === 'object' && 'data' in result) {
          return Array.isArray(result.data) ? result.data : [];
        }
        // Fallback for direct array response
        return Array.isArray(result) ? result : [];
      } catch (error) {
        console.error('Failed to fetch news:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  // Get news sources from API or use empty array if not available
  const { data: newsSources = [] } = useQuery<NewsSource[]>({
    queryKey: ['/api/news/sources'],
    queryFn: async () => {
      try {
        const result = await apiRequest('/api/news/sources', 'GET');
        if (result && typeof result === 'object' && 'data' in result) {
          return Array.isArray(result.data) ? result.data : [];
        }
        return Array.isArray(result) ? result : [];
      } catch (error) {
        console.error('Failed to fetch news sources:', error);
        return [];
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.summary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || article.category === selectedCategory;
    const matchesRegion = selectedRegion === "all" || article.region === selectedRegion;
    const matchesSource = selectedSource === "all" || article.source === selectedSource;
    
    return matchesSearch && matchesCategory && matchesRegion && matchesSource;
  });

  // Extract unique values for filters
  const categories = Array.from(new Set(articles.map(a => a.category)));
  const regions = Array.from(new Set(articles.map(a => a.region)));
  const sources = Array.from(new Set(articles.map(a => a.source)));

  const getCredibilityColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-yellow-600";
    return "text-red-600";
  };

  const getBiasColor = (bias: string) => {
    switch (bias) {
      case "Left": return "bg-blue-100 text-blue-800";
      case "Center-Left": return "bg-blue-50 text-blue-700";
      case "Center": return "bg-gray-100 text-gray-800";
      case "Center-Right": return "bg-red-50 text-red-700";
      case "Right": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto"></div>
            <p className="text-lg font-medium text-slate-600 dark:text-slate-400">
              Loading latest news...
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Canadian News</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Stay informed with verified news from across Canada - Updated July 2025
          </p>
        </div>

        <Tabs defaultValue="articles" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="articles">Latest News</TabsTrigger>
            <TabsTrigger value="sources">News Sources</TabsTrigger>
          </TabsList>

          <TabsContent value="articles" className="space-y-6">
            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search articles..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Region</label>
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Source</label>
                  <Select value={selectedSource} onValueChange={setSelectedSource}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Sources" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sources</SelectItem>
                      {sources.map(source => (
                        <SelectItem key={source} value={source}>{source}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                </div>
                
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs">
                  {filteredArticles.length} articles found
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Updated {formatTimeAgo(new Date().toISOString())}
                </Badge>
              </div>
            </div>

            {/* News Articles Grid */}
            {articles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredArticles.map((article) => (
                  <Card key={article.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <Badge variant="outline" className="text-xs">
                          {article.category}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          {formatTimeAgo(article.publishedAt)}
                        </div>
                      </div>
                      <CardTitle className="text-lg leading-tight line-clamp-2">
                        {article.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-3">
                        {article.summary}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                            {article.source.charAt(0)}
                          </div>
                          <span>{article.source}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          <span className={getCredibilityColor(article.credibility)}>
                            {article.credibility}%
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          {article.tags.slice(0, 2).map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedArticle(article)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Read
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Globe className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No News Articles Available</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  There are currently no news articles available. Check back later for updates on Canadian politics and civic affairs.
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>Last updated: {new Date().toLocaleDateString()}</span>
                </div>
              </div>
            )}

            {filteredArticles.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No articles found
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Try adjusting your search criteria or filters.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="sources" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {newsSources.map((source) => (
                <Card key={source.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{source.name}</CardTitle>
                      {source.verified && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                    <CardDescription>{source.type}</CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Credibility:</span>
                        <span className={`font-medium ${getCredibilityColor(source.credibility)}`}>
                            {source.credibility}%
                          </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Bias:</span>
                        <Badge className={getBiasColor(source.bias)}>
                          {source.bias}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Region:</span>
                        <span className="text-sm font-medium">{source.region}</span>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => window.open(source.url, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Visit Source
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Article Detail Dialog */}
          <Dialog open={!!selectedArticle} onOpenChange={() => setSelectedArticle(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            {selectedArticle && (
              <>
              <DialogHeader>
                  <DialogTitle className="text-xl">{selectedArticle.title}</DialogTitle>
                  <DialogDescription>
                    Read the full article and view additional details.
                  </DialogDescription>
              </DialogHeader>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Globe className="w-4 h-4" />
                      {selectedArticle.source}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(selectedArticle.publishedAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {selectedArticle.readTime} min read
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Badge className={getBiasColor(selectedArticle.bias)}>
                      {selectedArticle.bias}
                    </Badge>
                    <Badge variant="outline">
                      {selectedArticle.category}
                    </Badge>
                    <Badge variant="outline" className={getCredibilityColor(selectedArticle.credibility)}>
                      {selectedArticle.credibility}% Credible
                    </Badge>
                </div>
                
                  <div className="prose max-w-none">
                    <p className="text-lg text-gray-700 dark:text-gray-300">
                  {selectedArticle.summary}
                </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={() => window.open(selectedArticle.url, '_blank')}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Read Full Article
                    </Button>
                    <Button variant="outline" onClick={() => setSelectedArticle(null)}>
                      Close
                    </Button>
                  </div>
                </div>
              </>
            )}
            </DialogContent>
          </Dialog>
      </main>
    </div>
  );
}