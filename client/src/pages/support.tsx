import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  HelpCircle, 
  Mail, 
  MessageSquare, 
  BookOpen, 
  Shield, 
  Users, 
  FileText,
  ExternalLink,
  ArrowRight
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Support() {
  const { user } = useAuth();

  const supportCategories = [
    {
      title: "Getting Started",
      description: "Learn how to use CivicOS effectively",
      icon: BookOpen,
      color: "bg-blue-50 text-blue-700",
      items: [
        "How to vote on bills and petitions",
        "Understanding your civic profile",
        "Connecting with other users",
        "Setting up notifications"
      ]
    },
    {
      title: "Account & Security",
      description: "Manage your account and privacy",
      icon: Shield,
      color: "bg-green-50 text-green-700",
      items: [
        "Updating your profile information",
        "Privacy and data protection",
        "Account verification process",
        "Password and security settings"
      ]
    },
    {
      title: "Features & Tools",
      description: "Explore CivicOS capabilities",
      icon: Users,
      color: "bg-purple-50 text-purple-700",
      items: [
        "Political intelligence dashboard",
        "News and media analysis",
        "Legal document search",
        "Election information and maps"
      ]
    },
    {
      title: "Technical Support",
      description: "Resolve technical issues",
      icon: FileText,
      color: "bg-orange-50 text-orange-700",
      items: [
        "Browser compatibility",
        "Mobile app issues",
        "Performance optimization",
        "Bug reports and feedback"
      ]
    }
  ];

  const contactMethods = [
    {
      title: "Email Support",
      description: "Get detailed help via email",
      icon: Mail,
      action: "support@civicos.ca",
      href: "mailto:support@civicos.ca"
    },
    {
      title: "Live Chat",
      description: "Real-time assistance",
      icon: MessageSquare,
      action: "Start Chat",
      href: "#"
    },
    {
      title: "Documentation",
      description: "Comprehensive guides",
      icon: BookOpen,
      action: "View Docs",
      href: "#"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <HelpCircle className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Support Center</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Get help with CivicOS features, account management, and technical issues. 
            We're here to help you make the most of your civic engagement platform.
          </p>
        </div>

        {/* Quick Help Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {supportCategories.map((category, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${category.color}`}>
                    <category.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{category.title}</CardTitle>
                    <p className="text-sm text-gray-600">{category.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {category.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-center space-x-2 text-sm text-gray-700">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact Methods */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5" />
              <span>Contact Support</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {contactMethods.map((method, index) => (
                <div key={index} className="text-center p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex justify-center mb-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <method.icon className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                  <h3 className="font-semibold mb-1">{method.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{method.description}</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(method.href, '_blank')}
                    className="w-full"
                  >
                    {method.action}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-b pb-4">
                <h3 className="font-semibold mb-2">How do I vote on bills and petitions?</h3>
                <p className="text-gray-600 text-sm">
                  Navigate to the Voting section to see active bills and petitions. Click on any item to view details and cast your vote. Your votes help inform policymakers about public opinion.
                </p>
              </div>
              
              <div className="border-b pb-4">
                <h3 className="font-semibold mb-2">Is my personal information secure?</h3>
                <p className="text-gray-600 text-sm">
                  Yes, we use government-grade encryption and follow strict privacy protocols. Your data is never shared with third parties without your explicit consent.
                </p>
              </div>
              
              <div className="border-b pb-4">
                <h3 className="font-semibold mb-2">How can I connect with other users?</h3>
                <p className="text-gray-600 text-sm">
                  Use the CivicSocial feature to find and connect with other users. You can follow politicians, join discussions, and participate in civic communities.
                </p>
              </div>
              
              <div className="pb-4">
                <h3 className="font-semibold mb-2">What if I find incorrect information?</h3>
                <p className="text-gray-600 text-sm">
                  If you spot any inaccuracies, please report them through our feedback system. We regularly verify and update our data to ensure accuracy.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Info */}
        {user && (
          <div className="mt-8 text-center">
            <Badge variant="outline" className="mb-2">
              User ID: {user.id}
            </Badge>
            <p className="text-sm text-gray-500">
              Logged in as: {user.email}
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 