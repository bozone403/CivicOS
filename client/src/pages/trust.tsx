import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingDown, TrendingUp, Users, Crown, Building, AlertTriangle, Shield, CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface TrustMetrics {
  overallTrust: number;
  governmentTrust: number;
  mediaTrust: number;
  businessTrust: number;
  trends: {
    period: string;
    government: number;
    media: number;
    business: number;
  }[];
  breakdown: {
    category: string;
    trustScore: number;
    change: number;
  }[];
}

// Fallback trust data
const fallbackTrustData: TrustMetrics = {
  overallTrust: 45,
  governmentTrust: 38,
  mediaTrust: 42,
  businessTrust: 52,
  trends: [
    { period: "2023 Q1", government: 42, media: 45, business: 58 },
    { period: "2023 Q2", government: 40, media: 43, business: 55 },
    { period: "2023 Q3", government: 39, media: 42, business: 53 },
    { period: "2023 Q4", government: 38, media: 42, business: 52 },
  ],
  breakdown: [
    { category: "Federal Government", trustScore: 35, change: -2 },
    { category: "Provincial Governments", trustScore: 42, change: 1 },
    { category: "Municipal Governments", trustScore: 48, change: 0 },
    { category: "Mainstream Media", trustScore: 38, change: -1 },
    { category: "Social Media", trustScore: 25, change: -3 },
    { category: "Large Corporations", trustScore: 45, change: 2 },
    { category: "Small Business", trustScore: 58, change: 1 },
    { category: "Non-Profits", trustScore: 62, change: 3 },
  ]
};

export default function TrustPage() {
  const [timeframe, setTimeframe] = useState("12months");

  const { data: trustData, isLoading, error } = useQuery<TrustMetrics>({
    queryKey: ['/api/trust', timeframe],
    queryFn: async () => {
      try {
        const response = await apiRequest('/api/trust', 'GET', { timeframe });
        return response;
      } catch (error) {
        // console.error removed for production
        return fallbackTrustData;
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });

  const displayData = trustData || fallbackTrustData;

  const getTrustColor = (score: number) => {
    if (score >= 70) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 50) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return "text-green-600";
    if (change < 0) return "text-red-600";
    return "text-gray-600";
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4" />;
    if (change < 0) return <TrendingDown className="w-4 h-4" />;
    return <CheckCircle className="w-4 w-4" />;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400 animate-pulse" />
          <p className="text-gray-600">Loading trust metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-serif text-foreground">Trust Metrics</h1>
          <p className="text-muted-foreground mt-2">
            Public trust levels across government, media, and business institutions
          </p>
          {error && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                <AlertTriangle className="inline w-4 h-4 mr-1" />
                Showing sample data due to connection issues.
              </p>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Shield className="w-3 h-3 mr-1" />
            Trust Index
          </Badge>
          <Badge className={getTrustColor(displayData.overallTrust)}>
            {displayData.overallTrust}% Overall Trust
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Crown className="w-5 h-5 mr-2" />
                  Government Trust
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className={`text-3xl font-bold ${getTrustColor(displayData.governmentTrust).split(' ')[0]}`}>
                    {displayData.governmentTrust}%
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Federal, Provincial & Municipal
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Media Trust
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className={`text-3xl font-bold ${getTrustColor(displayData.mediaTrust).split(' ')[0]}`}>
                    {displayData.mediaTrust}%
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Mainstream & Social Media
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="w-5 h-5 mr-2" />
                  Business Trust
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className={`text-3xl font-bold ${getTrustColor(displayData.businessTrust).split(' ')[0]}`}>
                    {displayData.businessTrust}%
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Corporations & Small Business
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Trust Trends Over Time</CardTitle>
              <CardDescription>
                Quarterly trust level changes across institutions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {displayData.trends.map((trend, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="font-medium">{trend.period}</div>
                    <div className="flex space-x-6">
                      <div className="text-center">
                        <div className="text-sm text-gray-600">Government</div>
                        <div className={`font-bold ${getTrustColor(trend.government).split(' ')[0]}`}>
                          {trend.government}%
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-600">Media</div>
                        <div className={`font-bold ${getTrustColor(trend.media).split(' ')[0]}`}>
                          {trend.media}%
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-600">Business</div>
                        <div className={`font-bold ${getTrustColor(trend.business).split(' ')[0]}`}>
                          {trend.business}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Trust Breakdown</CardTitle>
              <CardDescription>
                Trust levels by specific institution type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {displayData.breakdown.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{item.category}</div>
                      <div className="text-sm text-muted-foreground">
                        Trust Score: {item.trustScore}%
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`flex items-center ${getChangeColor(item.change)}`}>
                        {getChangeIcon(item.change)}
                        <span className="ml-1 text-sm">
                          {item.change > 0 ? '+' : ''}{item.change}%
                        </span>
                      </div>
                      <Badge className={getTrustColor(item.trustScore)}>
                        {item.trustScore}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Trust Analysis</CardTitle>
              <CardDescription>
                Key insights and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-red-50 rounded-lg">
                  <h4 className="font-semibold text-red-800 mb-2">Critical Areas</h4>
                  <p className="text-sm text-red-700">
                    Government trust at 38% indicates significant public skepticism. 
                    Federal institutions need transparency improvements.
                  </p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-semibold text-yellow-800 mb-2">Concerning Trends</h4>
                  <p className="text-sm text-yellow-700">
                    Media trust declining, especially social media at 25%. 
                    Need for better fact-checking and transparency.
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">Positive Signs</h4>
                  <p className="text-sm text-green-700">
                    Non-profits and small business maintain higher trust levels. 
                    Local institutions performing better than national ones.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}