import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface Bill {
  id: string;
  title: string;
  description: string;
  status: string;
  category: string;
  jurisdiction: string;
  votesFor: number;
  votesAgainst: number;
  userVote?: 'for' | 'against' | null;
}

export default function BillsVotingWidget() {
  const { data: bills = [], isLoading, error } = useQuery({
    queryKey: ['/api/bills'],
    queryFn: () => api.get('/api/bills').then(res => res.json()),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Bills</CardTitle>
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
          <CardTitle>Recent Bills</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Unable to load bills</p>
        </CardContent>
      </Card>
    );
  }

  const recentBills = bills.slice(0, 3);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'passed': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getVotePercentage = (forVotes: number, againstVotes: number) => {
    const total = forVotes + againstVotes;
    return total > 0 ? Math.round((forVotes / total) * 100) : 0;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Bills</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentBills.map((bill: Bill) => (
            <div key={bill.id} className="border-b border-gray-200 pb-4 last:border-b-0">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-sm">{bill.title}</h4>
                <Badge className={getStatusColor(bill.status)} variant="secondary">
                  {bill.status}
                </Badge>
              </div>
              <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                {bill.description}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">
                    {getVotePercentage(bill.votesFor, bill.votesAgainst)}% support
                  </span>
                  <span className="text-xs text-gray-400">
                    ({bill.votesFor + bill.votesAgainst} votes)
                  </span>
                </div>
                <Button size="sm" variant="outline">
                  Vote
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}