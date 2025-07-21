import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingDown, TrendingUp, Users, Crown, Building, AlertTriangle, Shield } from "lucide-react";

export default function TrustPage() {
  const [timeframe, setTimeframe] = useState("12months");

  // Remove all references to trustMetrics and show fallback UI if no data is available
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-xl font-bold mb-2">No trust data available</h2>
        <p className="text-gray-600">No public trust metrics found. Please check back later.</p>
      </div>
    </div>
  );
}