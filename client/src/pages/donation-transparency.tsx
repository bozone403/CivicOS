import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DollarSign, Users, TrendingUp, Heart, Shield, Eye } from "lucide-react";

export default function DonationTransparency() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Donation Transparency</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          We believe in complete financial transparency. This page will display all donations to CivicOS, 
          ensuring accountability and trust in our mission to empower citizens.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span>Total Raised</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 mb-2">$0</div>
            <p className="text-sm text-muted-foreground">Platform development phase</p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span>Supporters</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 mb-2">0</div>
            <p className="text-sm text-muted-foreground">Early supporters</p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <span>Goal</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600 mb-2">$50K</div>
            <p className="text-sm text-muted-foreground">Annual operating budget</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-blue-600" />
            <span>Transparency Commitment</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-green-600" />
              <div>
                <div className="font-semibold">Public Donations</div>
                <div className="text-sm text-muted-foreground">All amounts and donor names (with consent)</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Heart className="w-5 h-5 text-red-600" />
              <div>
                <div className="font-semibold">Anonymous Options</div>
                <div className="text-sm text-muted-foreground">Respect for privacy when requested</div>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Coming Soon:</strong> Real-time donation ledger, top supporters list, 
              and detailed financial reports will be available here.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <Badge variant="outline" className="text-sm">
          Platform in Development
        </Badge>
      </div>
    </div>
  );
} 