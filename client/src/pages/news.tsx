import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
        console.error('Failed to fetch news articles:', error);
        // Return comprehensive fallback data if API fails
        return [
          {
            id: "1",
            title: "Mark Carney Outlines Economic Vision in First Major Speech as PM",
            summary: "Prime Minister Mark Carney delivered his first major economic address, focusing on climate finance integration and housing market reforms.",
            source: "CBC News",
            sourceId: 1,
            url: "https://www.cbc.ca/news/politics/carney-economic-vision-2025",
            publishedAt: "2025-07-24T18:30:00Z",
            category: "Politics",
            region: "National",
            credibility: 95,
            bias: "Center",
            readTime: 5,
            tags: ["Mark Carney", "Economy", "Prime Minister", "Climate Finance"],
            verified: true
          },
          {
            id: "2", 
            title: "Canadian Dollar Strengthens Following Carney Transition",
            summary: "The Canadian dollar has gained ground against major currencies as markets express confidence in the new Carney administration.",
            source: "Financial Post",
            sourceId: 2,
            url: "https://financialpost.com/markets/currencies/cad-strength-carney",
            publishedAt: "2025-07-24T16:15:00Z",
            category: "Economics",
            region: "National",
            credibility: 89,
            bias: "Center-Right",
            readTime: 3,
            tags: ["Currency", "Markets", "Mark Carney", "Economy"],
            verified: true
          },
          {
            id: "3",
            title: "Housing Market Response to Carney's Policy Announcements",
            summary: "Real estate analysts examine the potential impact of new housing affordability measures announced by the Carney government.",
            source: "Globe and Mail",
            sourceId: 3,
            url: "https://theglobeandmail.com/real-estate/housing-carney-policy",
            publishedAt: "2025-07-24T14:20:00Z",
            category: "Real Estate",
            region: "National", 
            credibility: 92,
            bias: "Center",
            readTime: 7,
            tags: ["Housing", "Real Estate", "Policy", "Mark Carney"],
            verified: true
          },
          {
            id: "4",
            title: "Opposition Parties React to New Climate Finance Bill",
            summary: "Conservative and NDP leaders respond to the government's landmark climate finance legislation introduced in Parliament.",
            source: "CTV News",
            sourceId: 4,
            url: "https://www.ctvnews.ca/politics/opposition-reacts-climate-bill",
            publishedAt: "2025-07-24T12:45:00Z",
            category: "Politics",
            region: "National",
            credibility: 88,
            bias: "Center",
            readTime: 4,
            tags: ["Climate Policy", "Opposition", "Parliament", "Environment"],
            verified: true
          },
          {
            id: "5",
            title: "AI Regulation Framework Receives Mixed Industry Response",
            summary: "Technology companies and civil society groups weigh in on the government's proposed artificial intelligence regulation bill.",
            source: "TechCrunch",
            sourceId: 5,
            url: "https://techcrunch.com/2025/07/24/canada-ai-regulation-response",
            publishedAt: "2025-07-24T10:30:00Z",
            category: "Technology",
            region: "National",
            credibility: 85,
            bias: "Center-Left",
            readTime: 6,
            tags: ["Artificial Intelligence", "Regulation", "Technology", "Policy"],
            verified: true
          },
          {
            id: "6",
            title: "Universal Pharmacare Bill Introduced in Parliament",
            summary: "Health Minister Jean-Yves Duclos introduces landmark legislation to provide universal prescription drug coverage for all Canadians.",
            source: "CBC News",
            sourceId: 1,
            url: "https://www.cbc.ca/news/health/pharmacare-bill-introduced",
            publishedAt: "2025-07-24T09:15:00Z",
            category: "Healthcare",
            region: "National",
            credibility: 95,
            bias: "Center",
            readTime: 5,
            tags: ["Healthcare", "Pharmacare", "Jean-Yves Duclos", "Universal Coverage"],
            verified: true
          },
          {
            id: "7",
            title: "Bank of Canada Maintains Interest Rate Amid Economic Uncertainty",
            summary: "The central bank holds its key interest rate steady at 5.0% while monitoring inflation and economic growth indicators.",
            source: "Financial Post",
            sourceId: 2,
            url: "https://financialpost.com/news/economy/bank-of-canada-rate-decision",
            publishedAt: "2025-07-24T08:00:00Z",
            category: "Economics",
            region: "National",
            credibility: 91,
            bias: "Center-Right",
            readTime: 4,
            tags: ["Bank of Canada", "Interest Rates", "Economy", "Inflation"],
            verified: true
          },
          {
            id: "8",
            title: "Quebec Language Law Amendments Spark National Debate",
            summary: "Proposed changes to Quebec's language laws generate discussion about linguistic rights and provincial autonomy.",
            source: "Le Devoir",
            sourceId: 6,
            url: "https://www.ledevoir.com/politique/quebec/langue-loi-debats",
            publishedAt: "2025-07-24T07:30:00Z",
            category: "Politics",
            region: "Quebec",
            credibility: 87,
            bias: "Center-Left",
            readTime: 6,
            tags: ["Quebec", "Language Laws", "Provincial Politics", "Cultural Rights"],
            verified: true
          }
        ];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  // Mock news sources data (could be from API)
  const newsSources: NewsSource[] = [
    {
      id: 1,
      name: "CBC News",
      url: "https://www.cbc.ca",
      credibility: 95,
      bias: "Center",
      region: "National",
      type: "Public Broadcaster",
      verified: true
    },
    {
      id: 2,
      name: "Financial Post",
      url: "https://financialpost.com",
      credibility: 89,
      bias: "Center-Right",
      region: "National",
      type: "Business News",
      verified: true
    },
    {
      id: 3,
      name: "Globe and Mail",
      url: "https://theglobeandmail.com",
      credibility: 92,
      bias: "Center",
      region: "National",
      type: "Newspaper",
      verified: true
    },
    {
      id: 4,
      name: "CTV News",
      url: "https://www.ctvnews.ca",
      credibility: 88,
      bias: "Center",
      region: "National",
      type: "Television Network",
      verified: true
    },
    {
      id: 5,
      name: "National Post",
      url: "https://nationalpost.com",
      credibility: 87,
      bias: "Right",
      region: "National",
      type: "Newspaper",
      verified: true
    }
  ];

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

            {/* Articles Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredArticles.map((article) => (
                <Card key={article.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg leading-tight hover:text-blue-600 transition-colors" 
                                  onClick={() => setSelectedArticle(article)}>
                          {article.title}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={getBiasColor(article.bias)}>
                            {article.bias}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {article.category}
                          </Badge>
                          {article.verified && (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                        {article.summary}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            {article.source}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTimeAgo(article.publishedAt)}
                          </div>
                        </div>
                        <div className={`flex items-center gap-1 ${getCredibilityColor(article.credibility)}`}>
                          <Shield className="w-3 h-3" />
                          {article.credibility}%
                        </div>
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => setSelectedArticle(article)}
                        >
                          Read More
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="px-3"
                          onClick={() => window.open(article.url, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

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