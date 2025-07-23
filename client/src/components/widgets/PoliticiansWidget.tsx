import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface Politician {
  id: string;
  name: string;
  party: string;
  position: string;
  jurisdiction: string;
  trustScore: number;
  recentActivity: string;
}

export default function PoliticiansWidget() {
  const { data: politicians = [], isLoading, error } = useQuery({
    queryKey: ['/api/politicians'],
    queryFn: () => api.get('/api/politicians').then(res => res.json()),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Politicians</CardTitle>
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
          <CardTitle>Recent Politicians</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Unable to load politicians</p>
        </CardContent>
      </Card>
    );
  }

  const recentPoliticians = politicians.slice(0, 3);

  const getTrustScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Politicians</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentPoliticians.map((politician: Politician) => (
            <div key={politician.id} className="border-b border-gray-200 pb-4 last:border-b-0">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-sm">{politician.name}</h4>
                <Badge className={getTrustScoreColor(politician.trustScore)} variant="secondary">
                  {politician.trustScore}%
                </Badge>
              </div>
              <p className="text-xs text-gray-600 mb-2">
                {politician.position} • {politician.party}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{politician.jurisdiction}</span>
                <Button size="sm" variant="outline">
                  View
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}