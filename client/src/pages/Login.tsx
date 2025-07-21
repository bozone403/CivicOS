import React, { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Shield, User, Lock, Eye, EyeOff, ArrowRight, CheckCircle, AlertTriangle } from "lucide-react";
import { CanadianCoatOfArms } from "@/components/CanadianCoatOfArms";
import { Badge } from "@/components/ui/badge";
import civicOSLogo from "@/assets/ChatGPT Image Jun 20, 2025, 06_03_54 PM_1750464244456.png";
import canadianCrest from "@/assets/ChatGPT Image Jun 20, 2025, 05_42_18 PM_1750462997583.png";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

// Add this at the top of the file or in a global.d.ts file if not present:
// declare module "*.png" {
//   const value: string;
//   export default value;
// }

export default function Login() {
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { user, isLoading: userLoading } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      // Use email as username for API
      const res = await apiRequest("/api/auth/login", "POST", {
        email: credentials.username,
        password: credentials.password,
      });
      toast({ title: "Login API Response", description: JSON.stringify(res), variant: "default" });
      if (res.token) {
        localStorage.setItem('civicos-jwt', res.token);
        toast({ title: "Token Stored", description: res.token, variant: "default" });
        // Remove debug-token endpoint call for production
        // fetch(`${import.meta.env.VITE_API_BASE_URL || "https://civicos.onrender.com"}/api/auth/debug-token`, {
        //   method: 'GET',
        //   headers: { 'Authorization': `Bearer ${res.token}` },
        // })
        //   .then(async (r) => {
        //     const data = await r.json();
        //     if (r.ok) {
        //       toast({ title: "JWT Decoded Claims", description: JSON.stringify(data.decoded), variant: "default" });
        //     } else {
        //       toast({ title: "JWT Debug Error", description: JSON.stringify(data), variant: "destructive" });
        //     }
        //   })
        //   .catch((err) => {
        //     toast({ title: "JWT Debug Network Error", description: String(err), variant: "destructive" });
        //   });
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        setTimeout(() => {
          const storedToken = localStorage.getItem('civicos-jwt');
          if (storedToken) {
            toast({ title: "Token in localStorage", description: storedToken, variant: "default" });
            if (user && user.email) {
              toast({ title: "User after login", description: JSON.stringify(user), variant: "default" });
              navigate("/dashboard");
            } else {
              toast({ title: "User not loaded after login", description: "User is null or missing email", variant: "destructive" });
            }
          } else {
            toast({ title: "Token missing after storage", description: "localStorage empty", variant: "destructive" });
          }
        }, 500);
      } else {
        toast({ title: "Login failed", description: "No token returned from server.", variant: "destructive" });
      }
    } catch (err: any) {
      setError(err.message || "Login failed. Please check your credentials.");
      toast({
        title: "Login failed",
        description: err.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex flex-col">
      <header className="bg-white shadow-md border-b-2 border-red-600">
        <div className="max-w-4xl mx-auto px-4">
          {/* ...header content omitted for brevity... */}
        </div>
      </header>
      <main className="max-w-md mx-auto pt-12 pb-24 px-4">
        {/* Disclaimer Banner */}
        <div className="mb-8">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700 font-medium">
                  <strong>Important Notice:</strong> This is NOT an official Government of Canada website. CivicOS is an independent platform for government accountability.
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* Login Card */}
        <Card className="shadow-lg border-0">
          <CardHeader className="space-y-4 pb-6">
            <div className="flex justify-center">
              <div className="p-3 bg-red-600 rounded-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="text-center">
              <CardTitle className="text-2xl font-bold text-gray-900">
                Secure Access Portal
              </CardTitle>
              <CardTitle className="text-lg font-semibold text-red-600 mt-1">
                Portail d&apos;Accès Sécurisé
              </CardTitle>
              <CardDescription className="mt-4 text-gray-600">
                Access the CivicOS Government Accountability Platform with your secure credentials.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-2 text-sm">{error}</div>
              )}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-semibold text-gray-700">
                  Username / Nom d&apos;utilisateur
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Email or Username"
                    value={credentials.username}
                    onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                    className="h-12 text-base"
                    disabled={isLoading}
                    autoComplete="username"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                  Password / Mot de passe
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={credentials.password}
                    onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                    className="h-12 text-base"
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-semibold text-base"
              >
                {isLoading ? (
                  "Authenticating..."
                ) : (
                  <>
                    Secure Login / Connexion Sécurisée
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
            <Separator />
            {/* Security Notice */}
            <div className="mt-8 text-center">
              <div className="inline-flex items-center px-4 py-2 bg-gray-100 rounded-lg">
                <Shield className="w-4 h-4 text-gray-500 mr-2" />
                <span className="text-xs text-gray-600 font-medium">
                  Secured with Government-Grade Encryption
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
      {/* Footer */}
      <footer className="bg-gray-100 border-t-2 border-red-600 py-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="flex justify-center items-center space-x-2 mb-4">
            <CanadianCoatOfArms size="sm" />
            <span className="font-bold text-gray-900">CivicOS</span>
            <Badge variant="outline" className="ml-2 text-yellow-700 border-yellow-400">
              Independent Platform
            </Badge>
          </div>
          <p className="text-sm text-gray-600">
            Independent Canadian Government Accountability Platform<br />
            Plateforme Indépendante de Responsabilité Gouvernementale Canadienne
          </p>
          <p className="text-xs text-yellow-600 font-medium mt-2">
            * Not affiliated with the Government of Canada<br />
            * Non affilié au gouvernement du Canada
          </p>
        </div>
      </footer>
    </div>
  );
} 