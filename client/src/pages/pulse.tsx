import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, TrendingUp, TrendingDown, Users, MessageSquare, Vote, AlertTriangle, Eye } from "lucide-react";

export default function PulsePage() {
  const [timeframe, setTimeframe] = useState("24h");

  // Real-time civic engagement metrics
  const pulseMetrics = {
    overall: {
      score: 74,
      change: +3.2,
      trend: "up",
      status: "Active"
    },
    engagement: {
      activeUsers: 18429,
      newRegistrations: 347,
      dailyLogins: 12847,
      avgSessionTime: "14m 32s"
    },
    participation: {
      votescast: 2847,
      discussionPosts: 1204,
      petitionsSigned: 567,
      foiRequests: 89
    },
    sentiment: {
      positive: 42,
      neutral: 38,
      negative: 20,
      trending: "stable"
    }
  };

  // Remove the liveActivity array and replace with API data only
  // const liveActivity = [
  //   {
  //     id: 1,
  //     type: "vote",
  //     action: "voted on Bill C-27 discussion",
  //     user: "Anonymous User",
  //     location: "Toronto, ON",
  //     timestamp: "2 minutes ago",
  //     impact: "medium"
  //   },
  //   {
  //     id: 2,
  //     type: "petition",
  //     action: "signed petition for healthcare funding",
  //     user: "Anonymous User", 
  //     location: "Vancouver, BC",
  //     timestamp: "4 minutes ago",
  //     impact: "high"
  //   },
  //   {
  //     id: 3,
  //     type: "discussion",
  //     action: "started discussion on municipal budget",
  //     user: "Anonymous User",
  //     location: "Calgary, AB",
  //     timestamp: "7 minutes ago",
  //     impact: "medium"
  //   },
  //   {
  //     id: 4,
  //     type: "foi",
  //     action: "submitted FOI request to Health Canada",
  //     user: "Anonymous User",
  //     location: "Ottawa, ON",
  //     timestamp: "12 minutes ago",
  //     impact: "high"
  //   },
  //   {
  //     id: 5,
  //     type: "report",
  //     action: "reported potential procurement irregularity",
  //     user: "Anonymous User",
  //     location: "Montreal, QC",
  //     timestamp: "18 minutes ago",
  //     impact: "critical"
  //   }
  // ];

  const regionalActivity = [
    {
      province: "Ontario",
      score: 78,
      activeUsers: 6847,
      change: +2.1,
      topIssues: ["Healthcare", "Housing", "Education"],
      population: "14.8M",
      capital: "Toronto",
      premier: "Doug Ford"
    },
    {
      province: "Quebec", 
      score: 71,
      activeUsers: 4023,
      change: +1.8,
      topIssues: ["Language Rights", "Environment", "Economy"],
      population: "8.6M",
      capital: "Quebec City",
      premier: "François Legault"
    },
    {
      province: "British Columbia",
      score: 76,
      activeUsers: 3456,
      change: -0.5,
      topIssues: ["Housing Crisis", "Environment", "Indigenous Rights"],
      population: "5.2M",
      capital: "Victoria",
      premier: "David Eby"
    },
    {
      province: "Alberta",
      score: 69,
      activeUsers: 2134,
      change: +4.2,
      topIssues: ["Energy Policy", "Healthcare", "Economy"],
      population: "4.5M",
      capital: "Edmonton",
      premier: "Danielle Smith"
    },
    {
      province: "Saskatchewan",
      score: 64,
      activeUsers: 890,
      change: +1.2,
      topIssues: ["Agriculture", "Healthcare", "Infrastructure"],
      population: "1.2M",
      capital: "Regina",
      premier: "Scott Moe"
    },
    {
      province: "Manitoba",
      score: 62,
      activeUsers: 756,
      change: +0.8,
      topIssues: ["Healthcare", "Indigenous Relations", "Economy"],
      population: "1.4M",
      capital: "Winnipeg",
      premier: "Wab Kinew"
    },
    {
      province: "Nova Scotia",
      score: 68,
      activeUsers: 634,
      change: +1.5,
      topIssues: ["Healthcare", "Climate Change", "Housing"],
      population: "1.0M",
      capital: "Halifax",
      premier: "Tim Houston"
    },
    {
      province: "New Brunswick",
      score: 65,
      activeUsers: 445,
      change: +0.9,
      topIssues: ["Bilingualism", "Healthcare", "Economy"],
      population: "800K",
      capital: "Fredericton",
      premier: "Blaine Higgs"
    },
    {
      province: "Newfoundland and Labrador",
      score: 61,
      activeUsers: 334,
      change: +0.6,
      topIssues: ["Fisheries", "Energy", "Healthcare"],
      population: "520K",
      capital: "St. John's",
      premier: "Andrew Furey"
    },
    {
      province: "Prince Edward Island",
      score: 67,
      activeUsers: 223,
      change: +1.1,
      topIssues: ["Agriculture", "Tourism", "Healthcare"],
      population: "170K",
      capital: "Charlottetown",
      premier: "Dennis King"
    },
    {
      province: "Northwest Territories",
      score: 58,
      activeUsers: 89,
      change: +0.4,
      topIssues: ["Indigenous Rights", "Climate Change", "Infrastructure"],
      population: "45K",
      capital: "Yellowknife",
      premier: "R.J. Simpson"
    },
    {
      province: "Nunavut",
      score: 55,
      activeUsers: 67,
      change: +0.3,
      topIssues: ["Indigenous Rights", "Healthcare", "Education"],
      population: "40K",
      capital: "Iqaluit",
      premier: "P.J. Akeeagok"
    },
    {
      province: "Yukon",
      score: 63,
      activeUsers: 123,
      change: +0.7,
      topIssues: ["Mining", "Indigenous Relations", "Tourism"],
      population: "43K",
      capital: "Whitehorse",
      premier: "Ranj Pillai"
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "vote": return Vote;
      case "petition": return Users;
      case "discussion": return MessageSquare;
      case "foi": return Eye;
      case "report": return AlertTriangle;
      default: return Activity;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "vote": return "text-blue-600 bg-blue-50";
      case "petition": return "text-green-600 bg-green-50";
      case "discussion": return "text-purple-600 bg-purple-50";
      case "foi": return "text-orange-600 bg-orange-50";
      case "report": return "text-red-600 bg-red-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "critical": return "text-red-600";
      case "high": return "text-orange-600";
      case "medium": return "text-yellow-600";
      case "low": return "text-green-600";
      default: return "text-gray-600";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 70) return "text-blue-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-serif text-foreground">Civic Pulse Monitor</h1>
          <p className="text-muted-foreground mt-2">
            Real-time tracking of civic engagement and democratic participation across Canada
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Activity className="w-3 h-3 mr-1" />
            Live Monitoring
          </Badge>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Users className="w-3 h-3 mr-1" />
            {pulseMetrics.engagement.activeUsers.toLocaleString()} Active
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Live Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity Feed</TabsTrigger>
          <TabsTrigger value="regional">Regional Pulse</TabsTrigger>
          <TabsTrigger value="trends">Trends Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Overall Pulse Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className={`text-3xl font-bold ${getScoreColor(pulseMetrics.overall.score)}`}>
                    {pulseMetrics.overall.score}
                  </div>
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-600">+{pulseMetrics.overall.change}</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {pulseMetrics.overall.status} civic engagement
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Active Citizens</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {pulseMetrics.engagement.activeUsers.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground">
                  +{pulseMetrics.engagement.newRegistrations} new today
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Daily Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600 mb-1">
                  {pulseMetrics.engagement.dailyLogins.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground">
                  Avg session: {pulseMetrics.engagement.avgSessionTime}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Actions Today</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600 mb-1">
                  {(pulseMetrics.participation.votescast + pulseMetrics.participation.discussionPosts + pulseMetrics.participation.petitionsSigned).toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground">
                  Democratic actions taken
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Participation Breakdown</CardTitle>
                <CardDescription>Democratic actions in the last 24 hours</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Vote className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">Votes Cast</span>
                    </div>
                    <span className="font-bold text-blue-600">{pulseMetrics.participation.votescast.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="w-4 h-4 text-purple-600" />
                      <span className="text-sm">Discussion Posts</span>
                    </div>
                    <span className="font-bold text-purple-600">{pulseMetrics.participation.discussionPosts.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Petitions Signed</span>
                    </div>
                    <span className="font-bold text-green-600">{pulseMetrics.participation.petitionsSigned.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Eye className="w-4 h-4 text-orange-600" />
                      <span className="text-sm">FOI Requests</span>
                    </div>
                    <span className="font-bold text-orange-600">{pulseMetrics.participation.foiRequests.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Public Sentiment</CardTitle>
                <CardDescription>Overall mood and engagement quality</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Positive</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{width: `${pulseMetrics.sentiment.positive}%`}}></div>
                      </div>
                      <span className="text-sm font-medium">{pulseMetrics.sentiment.positive}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Neutral</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{width: `${pulseMetrics.sentiment.neutral}%`}}></div>
                      </div>
                      <span className="text-sm font-medium">{pulseMetrics.sentiment.neutral}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Negative</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500 rounded-full" style={{width: `${pulseMetrics.sentiment.negative}%`}}></div>
                      </div>
                      <span className="text-sm font-medium">{pulseMetrics.sentiment.negative}%</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Trend</span>
                      <Badge variant="outline" className="text-blue-600">
                        {pulseMetrics.sentiment.trending}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Live Activity Feed</CardTitle>
              <CardDescription>Real-time civic actions across Canada</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Use API data only. If no data, show fallback UI. */}
                {/* For now, we'll show a placeholder message */}
                <p className="text-center text-muted-foreground">No activity data available.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regional" className="space-y-6">
          {/* Regional Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Total Regions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {regionalActivity.length}
                </div>
                <p className="text-sm text-muted-foreground">
                  Provinces & Territories
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Total Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {regionalActivity.reduce((sum, region) => sum + region.activeUsers, 0).toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground">
                  Across all regions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Avg Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600 mb-1">
                  {Math.round(regionalActivity.reduce((sum, region) => sum + region.score, 0) / regionalActivity.length)}
                </div>
                <p className="text-sm text-muted-foreground">
                  Average score
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Top Region</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600 mb-1">
                  {regionalActivity.reduce((max, region) => region.score > max.score ? region : max).province}
                </div>
                <p className="text-sm text-muted-foreground">
                  Highest engagement
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4">
            {regionalActivity.map((region) => (
              <Card key={region.province} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="font-semibold">{region.province}</h3>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>{region.activeUsers.toLocaleString()} active users</p>
                          <p>Population: {region.population} • Capital: {region.capital}</p>
                          <p>Premier: {region.premier}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {region.topIssues.map((issue, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {issue}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${getScoreColor(region.score)}`}>
                        {region.score}
                      </div>
                      <div className="flex items-center space-x-1">
                        {region.change > 0 ? (
                          <TrendingUp className="w-3 h-3 text-green-600" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-red-600" />
                        )}
                        <span className={`text-xs ${region.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {region.change > 0 ? '+' : ''}{region.change}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span>Peak Engagement</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600 mb-2">8-10 PM</div>
                <p className="text-sm text-muted-foreground">
                  Daily peak hours for civic participation
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span>Growth Rate</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600 mb-2">+12.3%</div>
                <p className="text-sm text-muted-foreground">
                  Month-over-month user growth
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-purple-600" />
                  <span>Avg Session</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600 mb-2">14m 32s</div>
                <p className="text-sm text-muted-foreground">
                  Average time spent engaging
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}