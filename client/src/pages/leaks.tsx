import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Archive, Shield, Calendar, Download, Lock, AlertTriangle, Eye } from "lucide-react";

export default function LeaksPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  // Remove all references to leakArchive and show fallback UI if no data is available
  // Example:
  // if (!leakData) return <div>No leaks available.</div>;

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
            No leaks available
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
            {/* {leakArchive.map((leak) => ( */}
            {/* <Card key={leak.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500"> */}
            {/* <CardHeader> */}
            {/* <div className="flex items-start justify-between"> */}
            {/* <div className="flex-1"> */}
            {/* <CardTitle className="text-xl">{leak.title}</CardTitle> */}
            {/* <CardDescription className="mt-1"> */}
            {/* {leak.source} • {formatDate(leak.dateLeaked)} */}
            {/* </CardDescription> */}
            {/* <div className="flex items-center space-x-2 mt-3"> */}
            {/* <Badge className={getSeverityColor(leak.severity)}> */}
            {/* {leak.severity} Impact */}
            {/* </Badge> */}
            {/* <Badge className={getVerificationColor(leak.verification)}> */}
            {/* <Shield className="w-3 h-3 mr-1" /> */}
            {/* {leak.verification} */}
            {/* </Badge> */}
            {/* <Badge variant="outline"> */}
            {/* {leak.category} */}
            {/* </Badge> */}
            {/* <Badge variant="outline"> */}
            {/* <Calendar className="w-3 h-3 mr-1" /> */}
            {/* {leak.documentsCount} docs */}
            {/* </Badge> */}
            {/* </div> */}
            {/* </div> */}
            {/* <div className="text-right"> */}
            {/* <div className="text-2xl font-bold text-red-600"> */}
            {/* {leak.publicImpact}/10 */}
            {/* </div> */}
            {/* <div className="text-sm text-muted-foreground">Impact Score</div> */}
            {/* </div> */}
            {/* </div> */}
            {/* </CardHeader> */}
            {/* <CardContent> */}
            {/* <div className="space-y-4"> */}
            {/* <div> */}
            {/* <div className="text-sm font-medium text-muted-foreground mb-2">Summary</div> */}
            {/* <p className="text-sm">{leak.description}</p> */}
            {/* </div> */}

            {/* <div> */}
            {/* <div className="text-sm font-medium text-muted-foreground mb-2">Key Findings</div> */}
            {/* <ul className="text-sm space-y-1"> */}
            {/* {leak.keyFindings.map((finding, index) => ( */}
            {/* <li key={index} className="text-muted-foreground flex items-start"> */}
            {/* <AlertTriangle className="w-3 h-3 mr-2 mt-1 text-orange-500 flex-shrink-0" /> */}
            {/* {finding} */}
            {/* </li> */}
            {/* ))} */}
            {/* </ul> */}
            {/* </div> */}

            {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> */}
            {/* <div> */}
            {/* <div className="text-sm font-medium text-muted-foreground mb-1">Government Response</div> */}
            {/* <div className="text-sm">{leak.governmentResponse}</div> */}
            {/* </div> */}
            {/* <div> */}
            {/* <div className="text-sm font-medium text-muted-foreground mb-1">Legal Status</div> */}
            {/* <div className="text-sm">{leak.legalStatus}</div> */}
            {/* </div> */}
            {/* </div> */}

            {/* <div> */}
            {/* <div className="text-sm font-medium text-muted-foreground mb-1">Media Coverage</div> */}
            {/* <div className="text-sm">{leak.mediaAttention}</div> */}
            {/* </div> */}
            {/* </div> */}

            {/* <div className="flex items-center justify-between pt-4 border-t mt-4"> */}
            {/* <div className="flex items-center space-x-2"> */}
            {/* <Lock className="w-4 h-4 text-muted-foreground" /> */}
            {/* <span className="text-sm text-muted-foreground"> */}
            {/* Secure • Verified • Protected Source */}
            {/* </span> */}
            {/* </div> */}
            {/* <div className="flex space-x-2"> */}
            {/* <Button variant="outline" size="sm"> */}
            {/* <Eye className="w-3 h-3 mr-2" /> */}
            {/* View Details */}
            {/* </Button> */}
            {/* <Button variant="outline" size="sm"> */}
            {/* <Download className="w-3 h-3 mr-2" /> */}
            {/* Download */}
            {/* </Button> */}
            {/* </div> */}
            {/* </div> */}
            {/* </CardContent> */}
            {/* </Card> */}
            {/* ))} */}
            <div className="text-center py-12 text-muted-foreground">
              <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No leaks available</p>
              <p className="text-sm mb-4">Please check back later for new government disclosures.</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Archive className="w-5 h-5 text-blue-600" />
                  <span>Total Leaks</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600 mb-2">847</div>
                <p className="text-sm text-muted-foreground">
                  Documents in secure archive
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <span>Critical Issues</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600 mb-2">23</div>
                <p className="text-sm text-muted-foreground">
                  High-impact government failures
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  <span>Verified Sources</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600 mb-2">156</div>
                <p className="text-sm text-muted-foreground">
                  Protected whistleblowers
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="submit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Secure Document Submission</CardTitle>
              <CardDescription>
                Submit government documents securely with full source protection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Secure Submission Portal</p>
                <p className="text-sm mb-4">End-to-end encrypted document submission with source protection</p>
                <div className="space-y-2 text-sm">
                  <p>• Anonymous TOR routing</p>
                  <p>• Military-grade encryption</p>
                  <p>• Legal protection guaranteed</p>
                </div>
                <Button className="mt-6" variant="default">
                  <Lock className="w-4 h-4 mr-2" />
                  Access Secure Portal
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}