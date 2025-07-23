import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Search, Users, FileText, Gavel, Newspaper, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface SearchResult {
  id: string;
  type: string;
  title: string;
  description: string;
  url: string;
  relevance: number;
}

interface SearchResponse {
  query: string;
  results: SearchResult[];
  total: number;
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'politician':
      return <Users className="w-4 h-4" />;
    case 'bill':
      return <FileText className="w-4 h-4" />;
    case 'legal':
      return <Gavel className="w-4 h-4" />;
    case 'news':
      return <Newspaper className="w-4 h-4" />;
    default:
      return <Search className="w-4 h-4" />;
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'politician':
      return 'Politician';
    case 'bill':
      return 'Bill';
    case 'legal':
      return 'Legal Document';
    case 'news':
      return 'News Article';
    default:
      return 'Result';
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'politician':
      return 'bg-blue-100 text-blue-800';
    case 'bill':
      return 'bg-green-100 text-green-800';
    case 'legal':
      return 'bg-purple-100 text-purple-800';
    case 'news':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function SearchPage() {
  const [location, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Extract query from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q') || "";
    setSearchQuery(query);
    setDebouncedQuery(query);
  }, [location]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: searchData, isLoading, error } = useQuery<SearchResponse>({
    queryKey: ['/api/search', debouncedQuery],
    queryFn: () => apiRequest(`/api/search?q=${encodeURIComponent(debouncedQuery)}`, 'GET'),
    enabled: debouncedQuery.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleResultClick = (url: string) => {
    navigate(url);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Search Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Search CivicOS</h1>
        <p className="text-gray-600 mb-6">
          Search across politicians, bills, legal documents, and news articles
        </p>
        
        {/* Search Form */}
        <form onSubmit={handleSearch} className="relative max-w-2xl">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search for politicians, bills, laws, or news..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <Button 
            type="submit" 
            className="absolute right-2 top-1/2 transform -translate-y-1/2"
            disabled={!searchQuery.trim()}
          >
            Search
          </Button>
        </form>
      </div>

      {/* Search Results */}
      {debouncedQuery.length >= 2 && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
              <span className="ml-3 text-gray-600">Searching...</span>
            </div>
          ) : error ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-red-600">
                  Failed to load search results. Please try again.
                </div>
              </CardContent>
            </Card>
          ) : searchData ? (
            <>
              {/* Results Summary */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">
                  Search Results for "{searchData.query}"
                </h2>
                <p className="text-gray-600">
                  Found {searchData.total} results
                </p>
              </div>

              {/* Results List */}
              {searchData.results.length > 0 ? (
                <div className="space-y-4">
                  {searchData.results.map((result) => (
                    <Card 
                      key={`${result.type}-${result.id}`} 
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleResultClick(result.url)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="text-gray-500">
                              {getTypeIcon(result.type)}
                            </div>
                            <div>
                              <CardTitle className="text-lg">{result.title}</CardTitle>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge className={getTypeColor(result.type)}>
                                  {getTypeLabel(result.type)}
                                </Badge>
                                <span className="text-sm text-gray-500">
                                  Relevance: {result.relevance}%
                                </span>
                              </div>
                            </div>
                          </div>
                          <ExternalLink className="w-4 h-4 text-gray-400" />
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <CardDescription className="text-gray-700">
                          {result.description}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center text-gray-600">
                      <Search className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-semibold mb-2">No results found</h3>
                      <p>Try adjusting your search terms or browse our categories</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : null}
        </div>
      )}

      {/* Search Tips */}
      {!debouncedQuery && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Search Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Search for Politicians</h4>
                <p className="text-sm text-gray-600">Try searching by name, party, or constituency</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Search for Bills</h4>
                <p className="text-sm text-gray-600">Search by bill title or description</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Search Legal Documents</h4>
                <p className="text-sm text-gray-600">Find laws, acts, and legal cases</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Search News</h4>
                <p className="text-sm text-gray-600">Find news articles and analysis</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 