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
  billNumber: string;
  introducedDate: string;
  sponsor: string;
  keyProvisions: string;
  userVote?: 'yes' | 'no' | 'abstain' | null;
  voteStats?: {
    total_votes: number;
    yes_votes: number;
    no_votes: number;
    abstentions: number;
  };
  governmentUrl?: string;
  legiscanUrl?: string;
}

export default function BillsVotingWidget() {
  const { data: billsResponse, isLoading, error } = useQuery({
    queryKey: ['/api/bills'],
    queryFn: async () => {
      try {
        const response = await api.get('/api/bills');
        const data = await response.json();
        // Handle the new API response format
        if (data?.success && Array.isArray(data?.data)) {
          return data.data;
        } else if (Array.isArray(data)) {
          return data;
        } else {
          console.warn('Unexpected bills API response format:', data);
          return [];
        }
      } catch (error) {
        // console.error removed for production
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Extract bills array from response, with fallback to empty array
  const bills = Array.isArray(billsResponse) ? billsResponse : [];

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

  // Handle empty state properly
  if (!bills || bills.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Bills</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-sm text-gray-500 mb-2">No bills available</p>
            <p className="text-xs text-gray-400">Check back later for new legislation</p>
          </div>
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

  const handleVote = async (_billId: string, _voteValue: 'yes' | 'no' | 'abstain') => {
    try {
      // TODO: Implement actual voting API call
      // console.log removed for production
    } catch (error) {
      // console.error removed for production
    }
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
                <div className="flex-1">
                  <h4 className="font-medium text-sm mb-1">{bill.title}</h4>
                  <p className="text-xs text-gray-500 mb-1">
                    Bill {bill.billNumber} • {bill.jurisdiction}
                  </p>
                  {bill.sponsor && (
                    <p className="text-xs text-gray-400">Sponsored by {bill.sponsor}</p>
                  )}
                </div>
                <Badge className={getStatusColor(bill.status)}>
                  {bill.status}
                </Badge>
              </div>
              
              {bill.description && (
                <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                  {bill.description}
                </p>
              )}
              
              {bill.keyProvisions && bill.keyProvisions !== 'Legislation details available from Parliament' && (
                <p className="text-xs text-gray-500 mb-3">
                  <strong>Key Provisions:</strong> {bill.keyProvisions}
                </p>
              )}
              
              {bill.voteStats && bill.voteStats.total_votes > 0 && (
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Public Opinion</span>
                    <span>{bill.voteStats.total_votes} votes</span>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span className="text-green-600">
                      👍 {bill.voteStats.yes_votes} ({getVotePercentage(bill.voteStats.yes_votes, bill.voteStats.no_votes)}%)
                    </span>
                    <span className="text-red-600">
                      👎 {bill.voteStats.no_votes} ({getVotePercentage(bill.voteStats.no_votes, bill.voteStats.yes_votes)}%)
                    </span>
                    {bill.voteStats.abstentions > 0 && (
                      <span className="text-gray-600">
                        🤷 {bill.voteStats.abstentions}
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              <div className="flex gap-2 mb-3">
                <Button 
                  size="sm" 
                  variant={bill.userVote === 'yes' ? 'default' : 'outline'}
                  onClick={() => handleVote(bill.id, 'yes')}
                  className="flex-1"
                >
                  👍 Support
                </Button>
                <Button 
                  size="sm" 
                  variant={bill.userVote === 'no' ? 'default' : 'outline'}
                  onClick={() => handleVote(bill.id, 'no')}
                  className="flex-1"
                >
                  👎 Oppose
                </Button>
                <Button 
                  size="sm" 
                  variant={bill.userVote === 'abstain' ? 'default' : 'outline'}
                  onClick={() => handleVote(bill.id, 'abstain')}
                >
                  🤷 Abstain
                </Button>
              </div>
              
              <div className="flex gap-2 text-xs">
                {bill.governmentUrl && (
                  <a 
                    href={bill.governmentUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Parliament Link
                  </a>
                )}
                {bill.legiscanUrl && (
                  <a 
                    href={bill.legiscanUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    LegiScan
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}