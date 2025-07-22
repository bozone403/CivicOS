import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Scale, Calendar, Gavel, ExternalLink, Search } from "lucide-react";

export default function CasesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCourt, setFilterCourt] = useState("all");

  // Remove all references to constitutionalCases and show fallback UI if no data is available
  // Example:
  // if (!caseData) return <div>No case data available.</div>;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getSignificanceColor = (significance: string) => {
    switch (significance) {
      case "Constitutional": return "text-purple-600 bg-purple-50 border-purple-200";
      case "Landmark": return "text-blue-600 bg-blue-50 border-blue-200"; 
      case "Important": return "text-green-600 bg-green-50 border-green-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getPrecedentColor = (value: string) => {
    switch (value) {
      case "Fundamental": return "text-red-600";
      case "High": return "text-orange-600";
      case "Medium": return "text-blue-600";
      case "Low": return "text-green-600";
      default: return "text-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-serif text-foreground">Constitutional Cases</h1>
          <p className="text-muted-foreground mt-2">
            Landmark Supreme Court decisions shaping Canadian law and Charter interpretation
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            <Scale className="w-3 h-3 mr-1" />
            SCC Decisions
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="constitutional" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="constitutional">Constitutional Cases</TabsTrigger>
          <TabsTrigger value="charter">Charter Decisions</TabsTrigger>
          <TabsTrigger value="recent">Recent Rulings</TabsTrigger>
        </TabsList>

        <TabsContent value="constitutional" className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search cases, parties, or legal principles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterCourt} onValueChange={setFilterCourt}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Filter by court" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courts</SelectItem>
                <SelectItem value="Supreme Court of Canada">Supreme Court of Canada</SelectItem>
                <SelectItem value="Federal Court of Appeal">Federal Court of Appeal</SelectItem>
                <SelectItem value="Provincial Courts of Appeal">Provincial Courts of Appeal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-6">
            {/* Demo data for development */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-blue-600" />
                  <span>R. v. Jordan (2016)</span>
                  <Badge variant="outline" className="ml-auto">Supreme Court</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  Established the "Jordan framework" for unreasonable delay in criminal proceedings.
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-green-600 font-semibold">Significance: High</span>
                  <span className="text-gray-500">Decision: 2016-07-08</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-green-600" />
                  <span>Carter v. Canada (2015)</span>
                  <Badge variant="outline" className="ml-auto">Supreme Court</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  Legalized physician-assisted dying in Canada under certain conditions.
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-green-600 font-semibold">Significance: High</span>
                  <span className="text-gray-500">Decision: 2015-02-06</span>
                </div>
              </CardContent>
            </Card>

            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                More constitutional case analysis coming soon.
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="charter" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Charter Rights Jurisprudence</CardTitle>
              <CardDescription>
                Key Supreme Court decisions interpreting Charter of Rights and Freedoms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Scale className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Charter jurisprudence analysis coming soon.</p>
                <p className="text-sm">This will show how Charter rights have evolved through court decisions.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Scale className="w-5 h-5 text-blue-600" />
                  <span>Cases This Year</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600 mb-2">47</div>
                <p className="text-sm text-muted-foreground">
                  Supreme Court decisions in 2024
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Gavel className="w-5 h-5 text-green-600" />
                  <span>Charter Challenges</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600 mb-2">12</div>
                <p className="text-sm text-muted-foreground">
                  Charter-based appeals heard
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <span>Pending Appeals</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600 mb-2">89</div>
                <p className="text-sm text-muted-foreground">
                  Cases awaiting hearing
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}