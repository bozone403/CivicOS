import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { BookOpen, Scale, Gavel, FileText, Search, ExternalLink } from 'lucide-react';

interface CriminalCodeSection {
  id: number;
  section: string;
  title: string;
  description: string;
  category: string;
  maxPenalty: string;
  lastUpdated: string;
}

interface LegalHierarchy {
  federal: {
    constitution: string[];
    criminal: CriminalCodeSection[];
    civil: string[];
  };
  provincial: {
    constitution: string[];
    criminal: string[];
    civil: string[];
  };
  municipal: {
    bylaws: string[];
    regulations: string[];
  };
}

export default function LegalSystemWidget({ liveData = true }: { liveData?: boolean }) {
  const { data: criminalCode = [], isLoading: criminalLoading } = useQuery<CriminalCodeSection[]>({
    queryKey: ['/api/legal/criminal-code']
  });

  const { data: legalHierarchy, isLoading: hierarchyLoading } = useQuery<LegalHierarchy>({
    queryKey: ['/api/legal/hierarchy']
  });

  // Use real data only - no fallbacks
  const displayCriminalCode = criminalCode;
  const displayLegalHierarchy = legalHierarchy;

  if (criminalLoading || hierarchyLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Legal System
          </CardTitle>
          <CardDescription>Canadian legal framework and criminal code</CardDescription>
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

  // Handle empty state properly
  if ((!displayCriminalCode || displayCriminalCode.length === 0) && !displayLegalHierarchy) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Legal System
          </CardTitle>
          <CardDescription>Canadian legal framework and criminal code</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Scale className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-500 mb-2">No legal data available</p>
            <p className="text-xs text-gray-400">Legal system information will appear here when available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="h-5 w-5" />
          Legal System
        </CardTitle>
        <CardDescription>Canadian legal framework and criminal code</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Criminal Code Section */}
        {displayCriminalCode && displayCriminalCode.length > 0 && (
          <div>
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Gavel className="h-4 w-4" />
              Criminal Code Sections
            </h3>
            <div className="space-y-3">
              {displayCriminalCode.slice(0, 3).map((section) => (
                <div key={section.id} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm">{section.section}</h4>
                    <Badge variant="outline" className="text-xs">
                      {section.category}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{section.title}</p>
                  <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                    {section.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Max Penalty: {section.maxPenalty}</span>
                    <span>Updated: {new Date(section.lastUpdated).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Legal Hierarchy */}
        {displayLegalHierarchy && (
          <div>
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Legal Hierarchy
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Federal Level */}
              <div className="border rounded-lg p-3">
                <h4 className="font-medium text-sm mb-2 text-blue-600">Federal</h4>
                <div className="space-y-1 text-xs">
                  {displayLegalHierarchy.federal?.constitution?.map((item, index) => (
                    <div key={index} className="text-gray-600">• {item}</div>
                  ))}
                  {displayLegalHierarchy.federal?.criminal?.length > 0 && (
                    <div className="text-gray-600">• Criminal Code ({displayLegalHierarchy.federal.criminal.length} sections)</div>
                  )}
                  {displayLegalHierarchy.federal?.civil?.map((item, index) => (
                    <div key={index} className="text-gray-600">• {item}</div>
                  ))}
                </div>
              </div>

              {/* Provincial Level */}
              <div className="border rounded-lg p-3">
                <h4 className="font-medium text-sm mb-2 text-green-600">Provincial</h4>
                <div className="space-y-1 text-xs">
                  {displayLegalHierarchy.provincial?.constitution?.map((item, index) => (
                    <div key={index} className="text-gray-600">• {item}</div>
                  ))}
                  {displayLegalHierarchy.provincial?.criminal?.map((item, index) => (
                    <div key={index} className="text-gray-600">• {item}</div>
                  ))}
                  {displayLegalHierarchy.provincial?.civil?.map((item, index) => (
                    <div key={index} className="text-gray-600">• {item}</div>
                  ))}
                </div>
              </div>

              {/* Municipal Level */}
              <div className="border rounded-lg p-3">
                <h4 className="font-medium text-sm mb-2 text-purple-600">Municipal</h4>
                <div className="space-y-1 text-xs">
                  {displayLegalHierarchy.municipal?.bylaws?.map((item, index) => (
                    <div key={index} className="text-gray-600">• {item}</div>
                  ))}
                  {displayLegalHierarchy.municipal?.regulations?.map((item, index) => (
                    <div key={index} className="text-gray-600">• {item}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2">
          <Button size="sm" variant="outline" className="flex-1">
            <Search className="h-4 w-4 mr-2" />
            Search Laws
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            <FileText className="h-4 w-4 mr-2" />
            View Full Code
          </Button>
          <Button size="sm" variant="outline">
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}