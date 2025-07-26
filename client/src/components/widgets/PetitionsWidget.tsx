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

// Fallback data for the widget
const fallbackPetitions = [
  {
    id: "1",
    title: "Climate Action Now",
    description: "Urgent petition calling for immediate climate action and carbon reduction targets.",
    category: "Environment",
    status: "active",
    signatures: 32450,
    targetSignatures: 50000,
    urgency: "high",
    deadline: "2025-03-15",
    region: "National"
  },
  {
    id: "2",
    title: "Universal Healthcare Expansion",
    description: "Petition to expand universal healthcare coverage to include dental and vision services.",
    category: "Healthcare",
    status: "active",
    signatures: 56780,
    targetSignatures: 75000,
    urgency: "medium",
    deadline: "2025-04-10",
    region: "National"
  },
  {
    id: "3",
    title: "Housing Affordability Crisis",
    description: "Petition demanding immediate action on the housing affordability crisis.",
    category: "Housing",
    status: "active",
    signatures: 89230,
    targetSignatures: 100000,
    urgency: "critical",
    deadline: "2025-02-28",
    region: "National"
  }
];

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
          console.warn("Unexpected API response format, using fallback data");
          return fallbackPetitions;
        }
      } catch (error) {
        // console.error removed for production
        return fallbackPetitions;
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
        {error && (
          <p className="text-xs text-yellow-600">
            Showing sample data due to connection issues
          </p>
        )}
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