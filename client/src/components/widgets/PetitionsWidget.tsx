import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

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
    queryFn: async () => {
      try {
        const response = await apiRequest('/api/petitions');
        if (response && Array.isArray(response)) {
          return response.slice(0, 3); // Only show first 3
        } else if (response && response.data && Array.isArray(response.data)) {
          return response.data.slice(0, 3);
        } else {
          console.warn("Unexpected API response format, returning empty array");
          return [];
        }
      } catch (error) {
        // console.error removed for production
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
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

  // Handle empty state properly
  if (!petitions || petitions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Petitions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-sm text-gray-500 mb-2">No petitions available</p>
            <p className="text-xs text-gray-400">Check back later for new petitions</p>
          </div>
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
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getProgressPercentage = (signatures: number, target: number) => {
    return Math.min(Math.round((signatures / target) * 100), 100);
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
                <div className="flex gap-1">
                  <Badge variant="secondary" className={getUrgencyColor(petition.urgency)}>
                    {petition.urgency}
                  </Badge>
                  <Badge variant="outline" className={getStatusColor(petition.status)}>
                    {petition.status}
                  </Badge>
                </div>
              </div>
              
              <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                {petition.description}
              </p>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Progress</span>
                  <span>{petition.signatures.toLocaleString()} / {petition.targetSignatures.toLocaleString()}</span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getProgressPercentage(petition.signatures, petition.targetSignatures)}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">
                    {petition.region} • {petition.category}
                  </span>
                  <span className="text-gray-400">
                    Deadline: {new Date(petition.deadline).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              <div className="mt-3 flex gap-2">
                <Button size="sm" className="flex-1">
                  Sign Petition
                </Button>
                <Button size="sm" variant="outline">
                  Share
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}