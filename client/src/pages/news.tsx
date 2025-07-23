import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Search, Filter, Globe, TrendingUp, Clock, Eye, Share2, Bookmark, ExternalLink, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Canadian news sources data patch
const CANADIAN_NEWS_SOURCES = [
  {
    id: 1,
    name: "CBC News",
    url: "https://www.cbc.ca/news",
    logo: "https://upload.wikimedia.org/wikipedia/en/8/8c/CBC_News_logo.svg",
    credibility: 95,
    bias: "Center",
    region: "National",
    type: "Public Broadcaster",
    verified: true
  },
  {
    id: 2,
    name: "CTV News",
    url: "https://www.ctvnews.ca",
    logo: "https://upload.wikimedia.org/wikipedia/en/8/8c/CTV_News_logo.svg",
    credibility: 88,
    bias: "Center-Right",
    region: "National",
    type: "Private Broadcaster",
    verified: true
  },
  {
    id: 3,
    name: "Global News",
    url: "https://globalnews.ca",
    logo: "https://upload.wikimedia.org/wikipedia/en/8/8c/Global_News_logo.svg",
    credibility: 85,
    bias: "Center",
    region: "National",
    type: "Private Broadcaster",
    verified: true
  },
  {
    id: 4,
    name: "The Globe and Mail",
    url: "https://www.theglobeandmail.com",
    logo: "https://upload.wikimedia.org/wikipedia/en/8/8c/The_Globe_and_Mail_logo.svg",
    credibility: 92,
    bias: "Center-Right",
    region: "National",
    type: "Newspaper",
    verified: true
  },
  {
    id: 5,
    name: "National Post",
    url: "https://nationalpost.com",
    logo: "https://upload.wikimedia.org/wikipedia/en/8/8c/National_Post_logo.svg",
    credibility: 87,
    bias: "Right",
    region: "National",
    type: "Newspaper",
    verified: true
  },
  {
    id: 6,
    name: "Toronto Star",
    url: "https://www.thestar.com",
    logo: "https://upload.wikimedia.org/wikipedia/en/8/8c/Toronto_Star_logo.svg",
    credibility: 89,
    bias: "Center-Left",
    region: "Ontario",
    type: "Newspaper",
    verified: true
  },
  {
    id: 7,
    name: "La Presse",
    url: "https://www.lapresse.ca",
    logo: "https://upload.wikimedia.org/wikipedia/en/8/8c/La_Presse_logo.svg",
    credibility: 90,
    bias: "Center",
    region: "Quebec",
    type: "Newspaper",
    verified: true
  },
  {
    id: 8,
    name: "Le Devoir",
    url: "https://www.ledevoir.com",
    logo: "https://upload.wikimedia.org/wikipedia/en/8/8c/Le_Devoir_logo.svg",
    credibility: 88,
    bias: "Center-Left",
    region: "Quebec",
    type: "Newspaper",
    verified: true
  },
  {
    id: 9,
    name: "Vancouver Sun",
    url: "https://vancouversun.com",
    logo: "https://upload.wikimedia.org/wikipedia/en/8/8c/Vancouver_Sun_logo.svg",
    credibility: 84,
    bias: "Center-Right",
    region: "British Columbia",
    type: "Newspaper",
    verified: true
  },
  {
    id: 10,
    name: "Calgary Herald",
    url: "https://calgaryherald.com",
    logo: "https://upload.wikimedia.org/wikipedia/en/8/8c/Calgary_Herald_logo.svg",
    credibility: 83,
    bias: "Center-Right",
    region: "Alberta",
    type: "Newspaper",
    verified: true
  }
];

// Sample news articles data patch
const CANADIAN_NEWS_ARTICLES = [
  {
    id: 1,
    title: "Federal government announces new climate action plan",
    summary: "The Liberal government has unveiled a comprehensive climate action strategy that includes new emissions targets and funding for green infrastructure projects across Canada.",
    source: "CBC News",
    sourceId: 1,
    url: "https://www.cbc.ca/news/politics/climate-action-plan-2024",
    publishedAt: "2024-01-15T10:30:00Z",
    category: "Politics",
    region: "National",
    credibility: 95,
    bias: "Center",
    readTime: 5,
    image: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=400&fit=crop"
  },
  {
    id: 2,
    title: "Conservative leader criticizes government spending in Question Period",
    summary: "Pierre Poilievre took aim at the Liberal government's fiscal policies during a heated Question Period, calling for greater fiscal responsibility.",
    source: "CTV News",
    sourceId: 2,
    url: "https://www.ctvnews.ca/politics/conservative-leader-criticizes-government-spending",
    publishedAt: "2024-01-15T14:20:00Z",
    category: "Politics",
    region: "National",
    credibility: 88,
    bias: "Center-Right",
    readTime: 3,
    image: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=400&fit=crop"
  },
  {
    id: 3,
    title: "NDP pushes for dental care expansion in Parliament",
    summary: "Jagmeet Singh and the NDP are advocating for an expanded dental care program, arguing it's essential for Canadian families.",
    source: "Global News",
    sourceId: 3,
    url: "https://globalnews.ca/news/ndp-dental-care-expansion",
    publishedAt: "2024-01-15T09:15:00Z",
    category: "Politics",
    region: "National",
    credibility: 85,
    bias: "Center",
    readTime: 4,
    image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=400&fit=crop"
  },
  {
    id: 4,
    title: "Quebec introduces new language law amendments",
    summary: "The CAQ government has proposed amendments to Bill 96, strengthening French language requirements in the province.",
    source: "La Presse",
    sourceId: 7,
    url: "https://www.lapresse.ca/actualites/politique/2024/amendements-loi-96",
    publishedAt: "2024-01-15T11:45:00Z",
    category: "Politics",
    region: "Quebec",
    credibility: 90,
    bias: "Center",
    readTime: 6,
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop"
  },
  {
    id: 5,
    title: "Alberta energy sector reports strong quarterly results",
    summary: "Major energy companies in Alberta are reporting positive quarterly results, with increased production and export numbers.",
    source: "Calgary Herald",
    sourceId: 10,
    url: "https://calgaryherald.com/business/energy-sector-quarterly-results",
    publishedAt: "2024-01-15T13:30:00Z",
    category: "Business",
    region: "Alberta",
    credibility: 83,
    bias: "Center-Right",
    readTime: 4,
    image: "https://images.unsplash.com/photo-1513828583688-c52646db42da?w=800&h=400&fit=crop"
  },
  {
    id: 6,
    title: "BC announces new climate action initiatives",
    summary: "The British Columbia government has announced new climate action initiatives, including funding for clean energy projects.",
    source: "Vancouver Sun",
    sourceId: 9,
    url: "https://vancouversun.com/news/bc-climate-action-initiatives",
    publishedAt: "2024-01-15T08:00:00Z",
    category: "Environment",
    region: "British Columbia",
    credibility: 84,
    bias: "Center-Right",
    readTime: 5,
    image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=400&fit=crop"
  },
  {
    id: 7,
    title: "Ontario healthcare reforms face opposition",
    summary: "The Ford government's healthcare reforms are facing opposition from healthcare workers and opposition parties.",
    source: "Toronto Star",
    sourceId: 6,
    url: "https://www.thestar.com/news/ontario/healthcare-reforms-opposition",
    publishedAt: "2024-01-15T12:15:00Z",
    category: "Health",
    region: "Ontario",
    credibility: 89,
    bias: "Center-Left",
    readTime: 6,
    image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&h=400&fit=crop"
  },
  {
    id: 8,
    title: "Federal budget deficit exceeds projections",
    summary: "The federal government's budget deficit has exceeded projections, raising concerns about fiscal management.",
    source: "The Globe and Mail",
    sourceId: 4,
    url: "https://www.theglobeandmail.com/politics/federal-budget-deficit-projections",
    publishedAt: "2024-01-15T15:45:00Z",
    category: "Politics",
    region: "National",
    credibility: 92,
    bias: "Center-Right",
    readTime: 7,
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=400&fit=crop"
  }
];

export default function News() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedSource, setSelectedSource] = useState("all");
  const [selectedArticle, setSelectedArticle] = useState<any>(null);

  // Use data patches instead of API calls
  const { data: newsSources = CANADIAN_NEWS_SOURCES } = useQuery({
    queryKey: ['/api/news/outlets'],
    queryFn: () => Promise.resolve(CANADIAN_NEWS_SOURCES),
    staleTime: Infinity,
  });

  const { data: newsArticles = CANADIAN_NEWS_ARTICLES } = useQuery({
    queryKey: ['/api/news/articles'],
    queryFn: () => Promise.resolve(CANADIAN_NEWS_ARTICLES),
    staleTime: Infinity,
  });

  const filteredArticles = newsArticles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.summary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || article.category === selectedCategory;
    const matchesRegion = selectedRegion === "all" || article.region === selectedRegion;
    const matchesSource = selectedSource === "all" || article.source === selectedSource;
    
    return matchesSearch && matchesCategory && matchesRegion && matchesSource;
  });

  // Extract unique values for filters
  const categories = Array.from(new Set(newsArticles.map(a => a.category)));
  const regions = Array.from(new Set(newsArticles.map(a => a.region)));
  const sources = Array.from(new Set(newsArticles.map(a => a.source)));

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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Canadian News</h1>
          <p className="text-gray-600">Stay informed with verified news from across Canada</p>
        </div>

        <Tabs defaultValue="articles" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="articles">Latest News</TabsTrigger>
            <TabsTrigger value="sources">News Sources</TabsTrigger>
          </TabsList>

          <TabsContent value="articles" className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Source</label>
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
                
                <div className="flex items-end">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("all");
                      setSelectedRegion("all");
                      setSelectedSource("all");
                    }}
                    className="w-full"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </div>

            {/* Articles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArticles.map((article) => (
                <Card key={article.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedArticle(article)}>
                  <div className="aspect-video bg-gray-200 rounded-t-lg overflow-hidden">
                    <img 
                      src={article.image} 
                      alt={article.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="outline" className="text-xs">
                        {article.category}
                      </Badge>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs">
                          {article.region}
                        </Badge>
                        <div className={`w-2 h-2 rounded-full ${getCredibilityColor(article.credibility).replace('text-', 'bg-')}`}></div>
                      </div>
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {article.title}
                    </h3>
                    
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                      {article.summary}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Eye className="w-3 h-3" />
                        <span>{article.readTime} min read</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                      <span className="text-sm font-medium text-gray-700">{article.source}</span>
                      <Badge className={`text-xs ${getBiasColor(article.bias)}`}>
                        {article.bias}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredArticles.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No articles found matching your criteria.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="sources" className="space-y-6">
            {/* News Sources Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {newsSources.map((source) => (
                <Card key={source.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Globe className="w-6 h-6 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold">{source.name}</CardTitle>
                        <p className="text-sm text-gray-600">{source.type}</p>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Credibility</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${source.credibility}%` }}
                            ></div>
                          </div>
                          <span className={`text-sm font-medium ${getCredibilityColor(source.credibility)}`}>
                            {source.credibility}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Bias</span>
                        <Badge className={`text-xs ${getBiasColor(source.bias)}`}>
                          {source.bias}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Region</span>
                        <Badge variant="outline" className="text-xs">
                          {source.region}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Verified</span>
                        {source.verified ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
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

        {/* Article Detail Modal */}
        {selectedArticle && (
          <Dialog open={!!selectedArticle} onOpenChange={() => setSelectedArticle(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">{selectedArticle.title}</DialogTitle>
                <DialogDescription>View detailed information about this news article</DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
                  <img 
                    src={selectedArticle.image} 
                    alt={selectedArticle.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600">{selectedArticle.source}</span>
                    <Badge variant="outline">{selectedArticle.category}</Badge>
                    <Badge variant="secondary">{selectedArticle.region}</Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={`text-xs ${getBiasColor(selectedArticle.bias)}`}>
                      {selectedArticle.bias}
                    </Badge>
                    <div className={`w-3 h-3 rounded-full ${getCredibilityColor(selectedArticle.credibility).replace('text-', 'bg-')}`}></div>
                  </div>
                </div>
                
                <p className="text-gray-700 leading-relaxed">
                  {selectedArticle.summary}
                </p>
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
                    <span>Published: {new Date(selectedArticle.publishedAt).toLocaleDateString()}</span>
                    <span>{selectedArticle.readTime} min read</span>
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
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(selectedArticle.url, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Read Full Article
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