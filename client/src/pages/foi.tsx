import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, FileText, Calendar, Download, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function FOIPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Fetch FOI requests from API
  const { data: foiRequests = [], isLoading, error } = useQuery({
    queryKey: ["/api/foi/requests"],
    queryFn: async () => {
      const response = await apiRequest("/api/foi/requests", "GET");
      return response || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Filter requests based on search and status
  const filteredRequests = foiRequests.filter((request: any) => {
    const matchesSearch = request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || request.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed": return "text-green-600 bg-green-50 border-green-200";
      case "Under Review": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "Rejected": return "text-red-600 bg-red-50 border-red-200";
      case "Overdue": return "text-red-600 bg-red-50 border-red-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getResponseTypeColor = (type: string) => {
    switch (type) {
      case "Full Release": return "text-green-600 bg-green-50 border-green-200";
      case "Partial Release": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "Heavily Redacted": return "text-orange-600 bg-orange-50 border-orange-200";
      case "Rejected": return "text-red-600 bg-red-50 border-red-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return "N/A";
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Pending";
    return new Date(dateString).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-serif text-foreground">Freedom of Information Repository</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive database of FOI requests and government transparency responses
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Eye className="w-3 h-3 mr-1" />
            Public Access
          </Badge>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <FileText className="w-3 h-3 mr-1" />
            {foiRequests.length} Requests
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="requests" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="requests">FOI Requests</TabsTrigger>
          <TabsTrigger value="analytics">Transparency Metrics</TabsTrigger>
          <TabsTrigger value="submit">Submit Request</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search FOI requests, departments, or topics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Under Review">Under Review</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
                <SelectItem value="Overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-6">
            {isLoading && <p>Loading FOI requests...</p>}
            {error && <p className="text-red-500">{error.message}</p>}
            {!isLoading && filteredRequests.length === 0 && (
              <Card>
                <CardContent className="text-center py-12 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No FOI requests available</p>
                  <p className="text-sm">
                    No Freedom of Information requests have been submitted or processed yet.
                    Please check back later or submit a new request.
                  </p>
                </CardContent>
              </Card>
            )}
            {!isLoading && filteredRequests.length > 0 && (
              filteredRequests.map((request: any) => (
                <Card key={request.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl">{request.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {request.department} • Requested by {request.requestor}
                        </CardDescription>
                        <div className="flex items-center space-x-2 mt-3">
                          <Badge className={getStatusColor(request.status)}>
                            {request.status === "Completed" && <CheckCircle className="w-3 h-3 mr-1" />}
                            {request.status === "Under Review" && <Clock className="w-3 h-3 mr-1" />}
                            {request.status === "Rejected" && <XCircle className="w-3 h-3 mr-1" />}
                            {request.status}
                          </Badge>
                          {request.responseType !== "Pending" && (
                            <Badge className={getResponseTypeColor(request.responseType)}>
                              {request.responseType}
                            </Badge>
                          )}
                          <Badge variant="outline">
                            <Calendar className="w-3 h-3 mr-1" />
                            {formatDate(request.dateSubmitted)}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          {request.totalCost ? formatCurrency(request.totalCost) : "TBD"}
                        </div>
                        <div className="text-sm text-muted-foreground">Total Cost Revealed</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-2">Request Summary</div>
                        <p className="text-sm">{request.summary}</p>
                      </div>

                      {request.status === "Completed" && (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <div className="text-sm font-medium text-muted-foreground mb-1">Pages Released</div>
                              <div className="text-2xl font-bold text-green-600">{request.pagesReleased}</div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-muted-foreground mb-1">Pages Withheld</div>
                              <div className="text-2xl font-bold text-red-600">{request.pagesWithheld}</div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-muted-foreground mb-1">Response Time</div>
                              <div className="text-sm">
                                {Math.ceil((new Date(request.dateResponded!).getTime() - new Date(request.dateSubmitted).getTime()) / (1000 * 60 * 60 * 24))} days
                              </div>
                            </div>
                          </div>

                          {request.exemptionsUsed.length > 0 && (
                            <div>
                              <div className="text-sm font-medium text-muted-foreground mb-2">Exemptions Applied</div>
                              <div className="flex flex-wrap gap-1">
                                {request.exemptionsUsed.map((exemption: string, index: number) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    {exemption}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {request.keyFindings.length > 0 && (
                            <div>
                              <div className="text-sm font-medium text-muted-foreground mb-2">Key Findings</div>
                              <ul className="text-sm space-y-1">
                                {request.keyFindings.map((finding: string, index: number) => (
                                  <li key={index} className="text-muted-foreground">• {finding}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm font-medium text-muted-foreground mb-1">Date Submitted</div>
                          <div className="text-sm">{formatDate(request.dateSubmitted)}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-muted-foreground mb-1">Response Date</div>
                          <div className="text-sm">{formatDate(request.dateResponded)}</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t mt-4">
                      <div className="flex items-center space-x-2">
                        <Eye className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Public Impact: {request.publicImpact}/10 • {request.mediaAttention} Media Coverage
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        {request.status === "Completed" && (
                          <Button variant="outline" size="sm">
                            <Download className="w-3 h-3 mr-2" />
                            Download Response
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span>Total Requests</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600 mb-2">12,847</div>
                <p className="text-sm text-muted-foreground">
                  FOI requests tracked
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Completion Rate</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600 mb-2">73%</div>
                <p className="text-sm text-muted-foreground">
                  Requests completed on time
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-yellow-600" />
                  <span>Avg Response Time</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600 mb-2">67</div>
                <p className="text-sm text-muted-foreground">
                  Days (legal limit: 30)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span>Exemption Rate</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600 mb-2">34%</div>
                <p className="text-sm text-muted-foreground">
                  Requests with exemptions
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="submit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Submit FOI Request</CardTitle>
              <CardDescription>
                File a Freedom of Information request with any federal department
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">FOI Request Portal</p>
                <p className="text-sm mb-4">Access government information through official channels</p>
                <div className="space-y-2 text-sm">
                  <p>• Free for most requests</p>
                  <p>• 30-day response requirement</p>
                  <p>• Appeal process available</p>
                </div>
                <Button className="mt-6" variant="default">
                  <FileText className="w-4 h-4 mr-2" />
                  Start FOI Request
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}