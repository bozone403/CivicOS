import React, { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, User, Lock, Eye, EyeOff, ArrowRight, AlertTriangle, Mail, Phone, MapPin, Calendar, FileText, CheckCircle } from "lucide-react";
import { CanadianCoatOfArms } from "@/components/CanadianCoatOfArms";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";

interface RegistrationData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  dateOfBirth: string;
  city: string;
  province: string;
  postalCode: string;
  federalRiding: string;
  provincialRiding: string;
  municipalWard: string;
  citizenshipStatus: string;
  voterRegistrationStatus: string;
  communicationStyle: string;
  agreeToTerms: boolean;
  agreeToPrivacy: boolean;
  agreeToVerification: boolean;
}

interface RegistrationErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  federalRiding?: string;
  provincialRiding?: string;
  municipalWard?: string;
  citizenshipStatus?: string;
  voterRegistrationStatus?: string;
  communicationStyle?: string;
  agreeToTerms?: string;
  agreeToPrivacy?: string;
  agreeToVerification?: string;
}

const PROVINCES = [
  "Alberta", "British Columbia", "Manitoba", "New Brunswick", 
  "Newfoundland and Labrador", "Nova Scotia", "Ontario", 
  "Prince Edward Island", "Quebec", "Saskatchewan",
  "Northwest Territories", "Nunavut", "Yukon"
];

const CITIZENSHIP_STATUSES = [
  "citizen", "permanent_resident", "temporary_resident", "visitor"
];

const VOTER_STATUSES = [
  "registered", "not_registered", "unknown"
];

const COMMUNICATION_STYLES = [
  "auto", "simple", "casual", "formal", "technical"
];

export default function Register() {
  const [formData, setFormData] = useState<RegistrationData>({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    dateOfBirth: "",
    city: "",
    province: "",
    postalCode: "",
    federalRiding: "",
    provincialRiding: "",
    municipalWard: "",
    citizenshipStatus: "citizen",
    voterRegistrationStatus: "unknown",
    communicationStyle: "auto",
    agreeToTerms: false,
    agreeToPrivacy: false,
    agreeToVerification: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<RegistrationErrors>({});
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const validateForm = (): boolean => {
    const newErrors: RegistrationErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long";
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // Required fields
    if (!formData.firstName) newErrors.firstName = "First name is required";
    if (!formData.lastName) newErrors.lastName = "Last name is required";
    if (!formData.city) newErrors.city = "City is required";
    if (!formData.province) newErrors.province = "Province is required";
    if (!formData.postalCode) newErrors.postalCode = "Postal code is required";

    // Terms agreement
    if (!formData.agreeToTerms) {
      (newErrors as any).agreeToTerms = "You must agree to the terms of service";
    }
    if (!formData.agreeToPrivacy) {
      (newErrors as any).agreeToPrivacy = "You must agree to the privacy policy";
    }
    if (!formData.agreeToVerification) {
      (newErrors as any).agreeToVerification = "You must agree to identity verification";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const registrationPayload = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        dateOfBirth: formData.dateOfBirth,
        city: formData.city,
        province: formData.province,
        postalCode: formData.postalCode,
        federalRiding: formData.federalRiding,
        provincialRiding: formData.provincialRiding,
        municipalWard: formData.municipalWard,
        citizenshipStatus: formData.citizenshipStatus,
        voterRegistrationStatus: formData.voterRegistrationStatus,
        communicationStyle: formData.communicationStyle,
      };

      const res = await apiRequest("/api/auth/register", "POST", registrationPayload);
      
      if (res.token) {
        localStorage.setItem('civicos-jwt', res.token);
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        
        toast({ 
          title: "Registration successful", 
          description: "Welcome to CivicOS! Your account has been created.", 
          variant: "default" 
        });
        
        setTimeout(() => {
          navigate("/dashboard");
        }, 1000);
      } else {
        toast({
          title: "Registration failed",
          description: "No authentication token received",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      // console.error removed for production
      const errorMessage = err.message || "Registration failed. Please try again.";
      toast({
        title: "Registration failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof RegistrationData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex flex-col">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm shadow-lg border-b-2 border-red-600 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">CivicOS</h1>
                <p className="text-xs text-gray-600">Government Accountability Platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <CanadianCoatOfArms size="sm" />
              <Badge variant="outline" className="text-yellow-700 border-yellow-400">
                Independent Platform
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          {/* Disclaimer Banner */}
          <div className="mb-6">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
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

          {/* Registration Card */}
          <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
            <CardHeader className="space-y-6 pb-8">
              <div className="flex justify-center">
                <div className="p-4 bg-gradient-to-br from-red-600 to-red-700 rounded-xl shadow-lg">
                  <User className="w-10 h-10 text-white" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <CardTitle className="text-3xl font-bold text-gray-900">
                  Create Your CivicOS Account
                </CardTitle>
                <CardTitle className="text-lg font-semibold text-red-600">
                  Créer Votre Compte CivicOS
                </CardTitle>
                <CardDescription className="text-gray-600 text-base">
                  Join the platform for transparent government accountability and civic engagement.
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 px-8 pb-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Account Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Account Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        className="h-12"
                        disabled={isLoading}
                      />
                      {errors.firstName && <p className="text-red-500 text-sm">{errors.firstName}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        className="h-12"
                        disabled={isLoading}
                      />
                      {errors.lastName && <p className="text-red-500 text-sm">{errors.lastName}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="h-12 pl-12"
                        disabled={isLoading}
                      />
                    </div>
                    {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">Password *</Label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          className="h-12 pl-12 pr-12"
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password *</Label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                          className="h-12 pl-12 pr-12"
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      {errors.confirmPassword && <p className="text-red-500 text-sm">{errors.confirmPassword}</p>}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Contact Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="phoneNumber"
                          type="tel"
                          value={formData.phoneNumber}
                          onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                          className="h-12 pl-12"
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="dateOfBirth"
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                          className="h-12 pl-12"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Location Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Location Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        className="h-12"
                        disabled={isLoading}
                      />
                      {errors.city && <p className="text-red-500 text-sm">{errors.city}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="province">Province *</Label>
                      <Select value={formData.province} onValueChange={(value) => handleInputChange('province', value)}>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select province" />
                        </SelectTrigger>
                        <SelectContent>
                          {PROVINCES.map((province) => (
                            <SelectItem key={province} value={province}>
                              {province}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.province && <p className="text-red-500 text-sm">{errors.province}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="postalCode">Postal Code *</Label>
                      <Input
                        id="postalCode"
                        value={formData.postalCode}
                        onChange={(e) => handleInputChange('postalCode', e.target.value)}
                        className="h-12"
                        disabled={isLoading}
                      />
                      {errors.postalCode && <p className="text-red-500 text-sm">{errors.postalCode}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="federalRiding">Federal Riding</Label>
                      <Input
                        id="federalRiding"
                        value={formData.federalRiding}
                        onChange={(e) => handleInputChange('federalRiding', e.target.value)}
                        className="h-12"
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="provincialRiding">Provincial Riding</Label>
                      <Input
                        id="provincialRiding"
                        value={formData.provincialRiding}
                        onChange={(e) => handleInputChange('provincialRiding', e.target.value)}
                        className="h-12"
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="municipalWard">Municipal Ward</Label>
                      <Input
                        id="municipalWard"
                        value={formData.municipalWard}
                        onChange={(e) => handleInputChange('municipalWard', e.target.value)}
                        className="h-12"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Civic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Civic Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="citizenshipStatus">Citizenship Status</Label>
                      <Select value={formData.citizenshipStatus} onValueChange={(value) => handleInputChange('citizenshipStatus', value)}>
                        <SelectTrigger className="h-12">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CITIZENSHIP_STATUSES.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="voterRegistrationStatus">Voter Registration</Label>
                      <Select value={formData.voterRegistrationStatus} onValueChange={(value) => handleInputChange('voterRegistrationStatus', value)}>
                        <SelectTrigger className="h-12">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {VOTER_STATUSES.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="communicationStyle">Communication Style</Label>
                      <Select value={formData.communicationStyle} onValueChange={(value) => handleInputChange('communicationStyle', value)}>
                        <SelectTrigger className="h-12">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {COMMUNICATION_STYLES.map((style) => (
                            <SelectItem key={style} value={style}>
                              {style.charAt(0).toUpperCase() + style.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Terms and Conditions */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Terms and Conditions</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="agreeToTerms"
                        checked={formData.agreeToTerms}
                        onCheckedChange={(checked) => handleInputChange('agreeToTerms', checked as boolean)}
                        disabled={isLoading}
                      />
                      <div className="space-y-1">
                        <Label htmlFor="agreeToTerms" className="text-sm font-medium">
                          I agree to the Terms of Service *
                        </Label>
                        <p className="text-xs text-gray-500">
                          You must agree to our terms of service to create an account.
                        </p>
                      </div>
                    </div>
                    {errors.agreeToTerms && <p className="text-red-500 text-sm">{errors.agreeToTerms}</p>}

                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="agreeToPrivacy"
                        checked={formData.agreeToPrivacy}
                        onCheckedChange={(checked) => handleInputChange('agreeToPrivacy', checked as boolean)}
                        disabled={isLoading}
                      />
                      <div className="space-y-1">
                        <Label htmlFor="agreeToPrivacy" className="text-sm font-medium">
                          I agree to the Privacy Policy *
                        </Label>
                        <p className="text-xs text-gray-500">
                          You must agree to our privacy policy to create an account.
                        </p>
                      </div>
                    </div>
                    {errors.agreeToPrivacy && <p className="text-red-500 text-sm">{errors.agreeToPrivacy}</p>}

                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="agreeToVerification"
                        checked={formData.agreeToVerification}
                        onCheckedChange={(checked) => handleInputChange('agreeToVerification', checked as boolean)}
                        disabled={isLoading}
                      />
                      <div className="space-y-1">
                        <Label htmlFor="agreeToVerification" className="text-sm font-medium">
                          I agree to identity verification *
                        </Label>
                        <p className="text-xs text-gray-500">
                          You must agree to identity verification for platform integrity.
                        </p>
                      </div>
                    </div>
                    {errors.agreeToVerification && <p className="text-red-500 text-sm">{errors.agreeToVerification}</p>}
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-14 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold text-lg shadow-lg transition-all duration-200 transform hover:scale-[1.02]"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Creating Account...
                    </div>
                  ) : (
                    <>
                      Create Account / Créer le Compte
                      <ArrowRight className="w-5 h-5 ml-3" />
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => navigate("/auth")}
                      className="text-red-600 hover:text-red-700 font-medium"
                    >
                      Sign in here
                    </button>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t-2 border-red-600 py-8 mt-auto">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="flex justify-center items-center space-x-3 mb-4">
            <CanadianCoatOfArms size="sm" />
            <span className="font-bold text-gray-900 text-lg">CivicOS</span>
            <Badge variant="outline" className="text-yellow-700 border-yellow-400">
              Independent Platform
            </Badge>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            Independent Canadian Government Accountability Platform<br />
            Plateforme Indépendante de Responsabilité Gouvernementale Canadienne
          </p>
          <p className="text-xs text-yellow-600 font-medium mt-3">
            * Not affiliated with the Government of Canada<br />
            * Non affilié au gouvernement du Canada
          </p>
        </div>
      </footer>
    </div>
  );
} 