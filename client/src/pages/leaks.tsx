import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Archive, Shield, Calendar, Download, Lock, AlertTriangle, Eye } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface Leak {
  id: string;
  title: string;
  category: string;
  severity: string;
  verificationStatus: string;
  datePublished: string;
  summary: string;
  keyFindings: string[];
  publicImpact: string;
  mediaAttention: string;
  documentCount: number;
  pagesReleased: number;
  exemptionsUsed: string[];
  totalCost: number;
}

interface LeaksResponse {
  leaks: Leak[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function LeaksPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const { data: leaksData, isLoading, error } = useQuery<LeaksResponse>({
    queryKey: ['/api/leaks', searchTerm, filterCategory, currentPage],
    queryFn: () => apiRequest('/api/leaks', 'GET', {
      search: searchTerm,
      category: filterCategory,
      page: currentPage.toString(),
      limit: '20'
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Critical": return "text-red-600 bg-red-50 border-red-200";
      case "High": return "text-orange-600 bg-orange-50 border-orange-200";
      case "Medium": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "Low": return "text-green-600 bg-green-50 border-green-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getVerificationColor = (status: string) => {
    switch (status) {
      case "Verified": return "text-green-600 bg-green-50 border-green-200";
      case "Partially Verified": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "Unverified": return "text-red-600 bg-red-50 border-red-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Archive className="w-12 h-12 mx-auto mb-4 text-gray-400 animate-pulse" />
            <p className="text-gray-600">Loading government leak archive...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-400" />
            <p className="text-red-600">Failed to load leak archive</p>
            <p className="text-gray-600 text-sm mt-2">Please try again later</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-serif text-foreground">Government Leak Archive</h1>
          <p className="text-muted-foreground mt-2">
            Secure repository of verified government documents and transparency disclosures
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Shield className="w-3 h-3 mr-1" />
            Secure Access
          </Badge>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Archive className="w-3 h-3 mr-1" />
            {leaksData?.pagination.total || 0} documents
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="archive" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="archive">Document Archive</TabsTrigger>
          <TabsTrigger value="analysis">Impact Analysis</TabsTrigger>
          <TabsTrigger value="submit">Submit Leak</TabsTrigger>
        </TabsList>

        <TabsContent value="archive" className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Archive className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search documents, categories, or findings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Government Failures">Government Failures</SelectItem>
                <SelectItem value="Political Interference">Political Interference</SelectItem>
                <SelectItem value="Civil Liberties">Civil Liberties</SelectItem>
                <SelectItem value="Procurement Fraud">Procurement Fraud</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-6">
            {leaksData?.leaks.map((leak) => (
              <Card key={leak.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold">{leak.title}</CardTitle>
                      <CardDescription className="mt-2">
                        {leak.summary}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-end space-y-2 ml-4">
                      <Badge className={getSeverityColor(leak.severity)}>
                        {leak.severity}
                      </Badge>
                      <Badge className={getVerificationColor(leak.verificationStatus)}>
                        {leak.verificationStatus}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Key Findings</h4>
                      <ul className="text-sm space-y-1">
                        {leak.keyFindings.map((finding, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-blue-600 mr-2">•</span>
                            {finding}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Published:</span>
                        <span>{formatDate(leak.datePublished)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Documents:</span>
                        <span>{leak.documentCount}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Pages Released:</span>
                        <span>{leak.pagesReleased}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Total Cost:</span>
                        <span>${leak.totalCost.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-sm mb-1">Public Impact</h4>
                        <p className="text-sm text-muted-foreground">{leak.publicImpact}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {leaksData?.leaks.length === 0 && (
            <div className="text-center py-12">
              <Archive className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">No leaks found matching your criteria</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Impact Analysis</CardTitle>
              <CardDescription>
                Analysis of leak impact on government transparency and public trust
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Impact analysis features will be available soon. This will include detailed analysis
                of how leaks have affected government transparency, policy changes, and public trust.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="submit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Submit a Leak</CardTitle>
              <CardDescription>
                Secure submission portal for government documents and transparency disclosures
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-yellow-800 mb-1">Important Notice</h4>
                      <p className="text-yellow-700 text-sm">
                        This submission portal is for legitimate government transparency disclosures only. 
                        All submissions are verified and must comply with Canadian whistleblower protection laws.
                      </p>
                    </div>
                  </div>
                </div>
                
                <p className="text-muted-foreground">
                  Secure leak submission features will be available soon. This will include encrypted
                  file upload, anonymous submission options, and legal protection information.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}