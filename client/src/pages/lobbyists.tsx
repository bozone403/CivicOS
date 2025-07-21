import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Users, Building, Search, Filter, ExternalLink, AlertTriangle } from "lucide-react";

export default function LobbyistsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSector, setFilterSector] = useState("all");

  // Remove the lobbyistData and influenceNetworkData arrays and replace with API data only
  // const lobbyistData = [...];
  // const influenceNetworkData = [...];
  // ...
  // Use API data only. If no data, show fallback UI.

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getComplianceColor = (status: string) => {
    switch (status) {
      case "Compliant": return "text-green-600 bg-green-50 border-green-200";
      case "Under Review": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "Non-Compliant": return "text-red-600 bg-red-50 border-red-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  // influenceNetworkData = [
  //   {
  //     lobbyist: "Earnscliffe Strategy Group",
  //     minister: "Jonathan Wilkinson",
  //     department: "Environment and Climate Change Canada",
  //     meetingCount: 12,
  //     lastMeeting: "2024-05-15",
  //     topics: ["Carbon pricing", "Clean technology funding"]
  //   },
  //   {
  //     lobbyist: "Hill+Knowlton Strategies",
  //     minister: "Jean-Yves Duclos",
  //     department: "Health Canada",
  //     meetingCount: 8,
  //     lastMeeting: "2024-05-20",
  //     topics: ["Drug approval timelines", "Rare disease strategy"]
  //   },
  //   {
  //     lobbyist: "Global Public Affairs",
  //     minister: "Anita Anand",
  //     department: "Transport Canada",
  //     meetingCount: 6,
  //     lastMeeting: "2024-04-28",
  //     topics: ["Railway safety", "Infrastructure investments"]
  //   }
  // ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-serif text-foreground">Lobbyist Influence Mapping</h1>
          <p className="text-muted-foreground mt-2">
            Track registered lobbyists, their clients, and government interactions
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Eye className="w-3 h-3 mr-1" />
            Registry Data
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="lobbyists" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="lobbyists">Registered Lobbyists</TabsTrigger>
          <TabsTrigger value="influence-network">Influence Network</TabsTrigger>
          <TabsTrigger value="analytics">Impact Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="lobbyists" className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search lobbyists, clients, or registration numbers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterSector} onValueChange={setFilterSector}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by sector" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sectors</SelectItem>
                <SelectItem value="Energy">Energy</SelectItem>
                <SelectItem value="Technology">Technology</SelectItem>
                <SelectItem value="Healthcare">Healthcare</SelectItem>
                <SelectItem value="Finance">Finance</SelectItem>
                <SelectItem value="Transportation">Transportation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-6">
            {/* Use API data only. If no data, show fallback UI. */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">No lobbyist data available</CardTitle>
                <CardDescription>
                  Please ensure the API is running and providing data.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  The lobbyist data is currently not loaded. This might be due to an issue with the API connection or data availability.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="influence-network" className="space-y-6">
          <div className="grid gap-6">
            {/* Use API data only. If no data, show fallback UI. */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">No influence network data available</CardTitle>
                <CardDescription>
                  Please ensure the API is running and providing data.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  The influence network data is currently not loaded. This might be due to an issue with the API connection or data availability.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span>Active Lobbyists</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600 mb-2">1,247</div>
                <p className="text-sm text-muted-foreground">
                  Registered in federal lobbying registry
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="w-5 h-5 text-green-600" />
                  <span>Government Meetings</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600 mb-2">2,847</div>
                <p className="text-sm text-muted-foreground">
                  Documented interactions this year
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <span>Compliance Issues</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600 mb-2">23</div>
                <p className="text-sm text-muted-foreground">
                  Under investigation or review
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}