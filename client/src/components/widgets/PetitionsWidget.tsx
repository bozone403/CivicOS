import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface Petition {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  signatures: number;
  targetSignatures: number;
  urgency: string;
  deadline: string;
  region: string;
}

export default function PetitionsWidget() {
  const { data: petitions = [], isLoading, error } = useQuery({
    queryKey: ['/api/petitions'],
    queryFn: () => api.get('/api/petitions').then(res => res.json()),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Petitions</CardTitle>
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
          <CardTitle>Recent Petitions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Unable to load petitions</p>
        </CardContent>
      </Card>
    );
  }

  const recentPetitions = petitions.slice(0, 3);

  const getUrgencyColor = (urgency: string) => {
    switch (urgency.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Petitions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentPetitions.map((petition: Petition) => (
            <div key={petition.id} className="border-b border-gray-200 pb-4 last:border-b-0">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-sm">{petition.title}</h4>
                <Badge className={getUrgencyColor(petition.urgency)} variant="secondary">
                  {petition.urgency}
                </Badge>
              </div>
              <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                {petition.description}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(petition.status)} variant="outline">
                    {petition.status}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {petition.signatures.toLocaleString()} / {petition.targetSignatures.toLocaleString()}
                  </span>
                </div>
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