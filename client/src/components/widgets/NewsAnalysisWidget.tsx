import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  category: string;
  biasScore: number;
  credibilityScore: number;
  publishedAt: string;
}

export default function NewsAnalysisWidget() {
  const { data: articles = [], isLoading, error } = useQuery({
    queryKey: ['/api/news'],
    queryFn: () => api.get('/api/news').then(res => res.json()),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent News</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent News</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Unable to load news</p>
        </CardContent>
      </Card>
    );
  }

  const recentArticles = articles.slice(0, 3);

  const getBiasColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getCredibilityColor = (score: number) => {
    if (score >= 80) return 'bg-blue-100 text-blue-800';
    if (score >= 60) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent News</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentArticles.map((article: NewsArticle) => (
            <div key={article.id} className="border-b border-gray-200 pb-4 last:border-b-0">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-sm">{article.title}</h4>
                <div className="flex space-x-1">
                  <Badge className={getBiasColor(article.biasScore)} variant="secondary">
                    {article.biasScore}%
                  </Badge>
                  <Badge className={getCredibilityColor(article.credibilityScore)} variant="secondary">
                    {article.credibilityScore}%
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                {article.summary}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">{article.source}</span>
                  <span className="text-xs text-gray-400">{article.category}</span>
                </div>
                <Button size="sm" variant="outline">
                  Read
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}