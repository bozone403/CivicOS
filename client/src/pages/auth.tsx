import * as React from "react";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Lock, 
  Mail, 
  Shield, 
  User, 
  Crown, 
  Building2, 
  Newspaper, 
  MapPin, 
  Phone, 
  Calendar,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Info
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import canadianCrest from "../../../attached_assets/ChatGPT Image Jun 20, 2025, 06_03_54 PM_1750464244456.png";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { config } from "@/lib/config";

// Membership types with features
const MEMBERSHIP_TYPES = [
  {
    id: 'citizen',
    name: 'Citizen',
    description: 'Free basic access for all Canadian citizens',
    price: 0,
    features: [
      'Basic voting and petition access',
      'Public forum participation',
      'Basic civic education resources',
      'Community engagement tools'
    ],
    icon: User,
    color: 'bg-blue-500',
    popular: false
  },
  {
    id: 'press',
    name: 'Press',
    description: 'Enhanced access for journalists and media professionals',
    price: 29.99,
    features: [
      'Advanced analytics and insights',
      'Press release access',
      'Exclusive content and interviews',
      'Priority support and assistance',
      'Media-specific reporting tools',
      'Press credential verification'
    ],
    icon: Newspaper,
    color: 'bg-purple-500',
    popular: true
  },
  {
    id: 'government',
    name: 'Government',
    description: 'Comprehensive access for government officials and staff',
    price: 49.99,
    features: [
      'Policy analysis and tracking',
      'Legislative monitoring tools',
      'Stakeholder networking platform',
      'Custom reports and analytics',
      'Government-specific resources',
      'Direct communication channels'
    ],
    icon: Building2,
    color: 'bg-green-500',
    popular: false
  }
];

export default function Auth() {
  const [location, navigate] = useLocation();
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({
    // Basic Information
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    middleName: "",
    preferredName: "",
    phoneNumber: "",
    dateOfBirth: "",
    gender: "",
    
    // Address Information
    streetAddress: "",
    apartmentUnit: "",
    city: "",
    province: "",
    postalCode: "",
    country: "Canada",
    
    // Professional Information
    employer: "",
    jobTitle: "",
    industry: "",
    yearsOfExperience: "",
    highestEducation: "",
    almaMater: "",
    graduationYear: "",
    
    // Political Engagement
    politicalExperience: "",
    campaignExperience: "",
    volunteerExperience: "",
    advocacyAreas: [] as string[],
    policyInterests: [] as string[],
    
    // Emergency Contact
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelationship: "",
    
    // Membership Selection
    membershipType: "citizen",
    
    // Terms and Conditions
    agreeToTerms: false,
    agreeToPrivacy: false,
    agreeToMarketing: false
  });
  
  const [errors, setErrors] = useState({ login: "", register: "" });
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);

  // Redirect authenticated users away from /auth
  React.useEffect(() => {
    if (isAuthenticated) {
      if (location === "/auth" || location === "/login") {
        navigate("/dashboard");
      } else if (location === "/register") {
        navigate("/profile");
      }
    }
  }, [isAuthenticated, location, navigate]);

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const result = await apiRequest("/api/auth/login", "POST", credentials);
      if (result.token) localStorage.setItem('civicos-jwt', result.token);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Welcome to CivicOS",
        description: "You have successfully logged in",
      });
      setTimeout(() => {
        navigate("/dashboard");
      }, 500);
    },
    onError: (error: any) => {
      setErrors(prev => ({ ...prev, login: error.message || "Invalid email or password" }));
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: typeof registerData) => {
      return apiRequest("/api/auth/register", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Welcome to CivicOS",
        description: "Your account has been created successfully",
      });
      setTimeout(() => {
        navigate("/profile?welcome=1");
      }, 500);
    },
    onError: (error: any) => {
      let message = error.message || "Registration failed";
      if (error.status === 409 || (error.message && error.message.toLowerCase().includes("409"))) {
        message = "Email already registered. Please use a different email or log in.";
      }
      setErrors(prev => ({ ...prev, register: message }));
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors(prev => ({ ...prev, login: "" }));
    
    if (!loginData.email || !loginData.password) {
      setErrors(prev => ({ ...prev, login: "Please enter both email and password" }));
      return;
    }

    loginMutation.mutate(loginData);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors(prev => ({ ...prev, register: "" }));
    
    // Validation
    if (!registerData.email || !registerData.password || !registerData.firstName) {
      setErrors(prev => ({ ...prev, register: "Please fill in all required fields" }));
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      setErrors(prev => ({ ...prev, register: "Passwords do not match" }));
      return;
    }

    if (registerData.password.length < 8) {
      setErrors(prev => ({ ...prev, register: "Password must be at least 8 characters long" }));
      return;
    }

    if (!registerData.agreeToTerms) {
      setErrors(prev => ({ ...prev, register: "You must agree to the terms and conditions" }));
      return;
    }

    registerMutation.mutate(registerData);
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const selectedMembership = MEMBERSHIP_TYPES.find(m => m.id === registerData.membershipType);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center mb-3 sm:mb-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 flex items-center justify-center shadow-2xl border border-slate-600 overflow-hidden">
              <img 
                src={canadianCrest} 
                alt="CivicOS" 
                className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-full filter brightness-125 contrast-125"
              />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 dark:text-slate-100">CivicOS</h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 font-medium tracking-wider">SECURE ACCESS PORTAL</p>
        </div>

        {/* Auth Card */}
        <Card className="shadow-2xl border-slate-200 dark:border-slate-700">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center flex items-center justify-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>Authentication</span>
            </CardTitle>
            <p className="text-center text-muted-foreground">
              Access the Canadian political intelligence platform
            </p>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="register">Create Account</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="space-y-4 mt-6">
                <form onSubmit={handleLogin} className="space-y-4">
                  {errors.login && (
                    <Alert variant="destructive">
                      <AlertDescription>{errors.login}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="flex items-center space-x-2 text-sm sm:text-base">
                      <Mail className="w-4 h-4" />
                      <span>Email Address</span>
                    </Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={loginData.email}
                      onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                      className="h-10 sm:h-11 text-sm sm:text-base"
                      disabled={loginMutation.isPending}
                      autoComplete="username"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="flex items-center space-x-2 text-sm sm:text-base">
                      <Lock className="w-4 h-4" />
                      <span>Password</span>
                    </Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Enter your password"
                      value={loginData.password}
                      onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                      className="h-10 sm:h-11 text-sm sm:text-base"
                      disabled={loginMutation.isPending}
                      autoComplete="current-password"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-10 sm:h-11 bg-slate-800 hover:bg-slate-700 text-white text-sm sm:text-base"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? "Authenticating..." : "Secure Login"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register" className="space-y-4 mt-6">
                <form onSubmit={handleRegister} className="space-y-6">
                  {errors.register && (
                    <Alert variant="destructive">
                      <AlertDescription>{errors.register}</AlertDescription>
                    </Alert>
                  )}

                  {/* Step 1: Basic Information */}
                  {currentStep === 1 && (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2 mb-4">
                        <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">1</div>
                        <h3 className="text-lg font-semibold">Basic Information</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name *</Label>
                          <Input
                            id="firstName"
                            value={registerData.firstName}
                            onChange={(e) => setRegisterData(prev => ({ ...prev, firstName: e.target.value }))}
                            placeholder="Jordan"
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name *</Label>
                          <Input
                            id="lastName"
                            value={registerData.lastName}
                            onChange={(e) => setRegisterData(prev => ({ ...prev, lastName: e.target.value }))}
                            placeholder="Smith"
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="middleName">Middle Name</Label>
                          <Input
                            id="middleName"
                            value={registerData.middleName}
                            onChange={(e) => setRegisterData(prev => ({ ...prev, middleName: e.target.value }))}
                            placeholder="Kenneth"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="preferredName">Preferred Name</Label>
                          <Input
                            id="preferredName"
                            value={registerData.preferredName}
                            onChange={(e) => setRegisterData(prev => ({ ...prev, preferredName: e.target.value }))}
                            placeholder="How you'd like to be called"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={registerData.email}
                          onChange={(e) => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="your.email@example.com"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="phoneNumber">Phone Number</Label>
                          <Input
                            id="phoneNumber"
                            type="tel"
                            value={registerData.phoneNumber}
                            onChange={(e) => setRegisterData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                            placeholder="(555) 123-4567"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="dateOfBirth">Date of Birth</Label>
                          <Input
                            id="dateOfBirth"
                            type="date"
                            value={registerData.dateOfBirth}
                            onChange={(e) => setRegisterData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="gender">Gender</Label>
                        <Select value={registerData.gender} onValueChange={(value) => setRegisterData(prev => ({ ...prev, gender: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="non-binary">Non-binary</SelectItem>
                            <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex justify-end">
                        <Button type="button" onClick={nextStep} className="bg-blue-600 hover:bg-blue-700">
                          Next: Address Information
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Address Information */}
                  {currentStep === 2 && (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2 mb-4">
                        <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">2</div>
                        <h3 className="text-lg font-semibold">Address Information</h3>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="streetAddress">Street Address</Label>
                        <Input
                          id="streetAddress"
                          value={registerData.streetAddress}
                          onChange={(e) => setRegisterData(prev => ({ ...prev, streetAddress: e.target.value }))}
                          placeholder="123 Main Street"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="apartmentUnit">Apartment/Unit</Label>
                          <Input
                            id="apartmentUnit"
                            value={registerData.apartmentUnit}
                            onChange={(e) => setRegisterData(prev => ({ ...prev, apartmentUnit: e.target.value }))}
                            placeholder="Apt 4B"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="city">City *</Label>
                          <Input
                            id="city"
                            value={registerData.city}
                            onChange={(e) => setRegisterData(prev => ({ ...prev, city: e.target.value }))}
                            placeholder="Toronto"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="province">Province *</Label>
                          <Select value={registerData.province} onValueChange={(value) => setRegisterData(prev => ({ ...prev, province: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select province" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ON">Ontario</SelectItem>
                              <SelectItem value="QC">Quebec</SelectItem>
                              <SelectItem value="BC">British Columbia</SelectItem>
                              <SelectItem value="AB">Alberta</SelectItem>
                              <SelectItem value="MB">Manitoba</SelectItem>
                              <SelectItem value="SK">Saskatchewan</SelectItem>
                              <SelectItem value="NS">Nova Scotia</SelectItem>
                              <SelectItem value="NB">New Brunswick</SelectItem>
                              <SelectItem value="NL">Newfoundland and Labrador</SelectItem>
                              <SelectItem value="PE">Prince Edward Island</SelectItem>
                              <SelectItem value="NT">Northwest Territories</SelectItem>
                              <SelectItem value="NU">Nunavut</SelectItem>
                              <SelectItem value="YT">Yukon</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="postalCode">Postal Code *</Label>
                          <Input
                            id="postalCode"
                            value={registerData.postalCode}
                            onChange={(e) => setRegisterData(prev => ({ ...prev, postalCode: e.target.value }))}
                            placeholder="M5V 3A8"
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="country">Country</Label>
                          <Input
                            id="country"
                            value={registerData.country}
                            onChange={(e) => setRegisterData(prev => ({ ...prev, country: e.target.value }))}
                            placeholder="Canada"
                          />
                        </div>
                      </div>

                      <div className="flex justify-between">
                        <Button type="button" onClick={prevStep} variant="outline">
                          Previous
                        </Button>
                        <Button type="button" onClick={nextStep} className="bg-blue-600 hover:bg-blue-700">
                          Next: Professional Information
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Professional Information */}
                  {currentStep === 3 && (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2 mb-4">
                        <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">3</div>
                        <h3 className="text-lg font-semibold">Professional Information</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="employer">Employer</Label>
                          <Input
                            id="employer"
                            value={registerData.employer}
                            onChange={(e) => setRegisterData(prev => ({ ...prev, employer: e.target.value }))}
                            placeholder="Company Name"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="jobTitle">Job Title</Label>
                          <Input
                            id="jobTitle"
                            value={registerData.jobTitle}
                            onChange={(e) => setRegisterData(prev => ({ ...prev, jobTitle: e.target.value }))}
                            placeholder="Software Engineer"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="industry">Industry</Label>
                          <Select value={registerData.industry} onValueChange={(value) => setRegisterData(prev => ({ ...prev, industry: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select industry" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="technology">Technology</SelectItem>
                              <SelectItem value="healthcare">Healthcare</SelectItem>
                              <SelectItem value="finance">Finance</SelectItem>
                              <SelectItem value="education">Education</SelectItem>
                              <SelectItem value="government">Government</SelectItem>
                              <SelectItem value="media">Media</SelectItem>
                              <SelectItem value="non-profit">Non-profit</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="yearsOfExperience">Years of Experience</Label>
                          <Input
                            id="yearsOfExperience"
                            type="number"
                            value={registerData.yearsOfExperience}
                            onChange={(e) => setRegisterData(prev => ({ ...prev, yearsOfExperience: e.target.value }))}
                            placeholder="5"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="highestEducation">Highest Education</Label>
                          <Select value={registerData.highestEducation} onValueChange={(value) => setRegisterData(prev => ({ ...prev, highestEducation: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select education level" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="high-school">High School</SelectItem>
                              <SelectItem value="college">College</SelectItem>
                              <SelectItem value="bachelors">Bachelor's Degree</SelectItem>
                              <SelectItem value="masters">Master's Degree</SelectItem>
                              <SelectItem value="doctorate">Doctorate</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="almaMater">Alma Mater</Label>
                          <Input
                            id="almaMater"
                            value={registerData.almaMater}
                            onChange={(e) => setRegisterData(prev => ({ ...prev, almaMater: e.target.value }))}
                            placeholder="University of Toronto"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="graduationYear">Graduation Year</Label>
                        <Input
                          id="graduationYear"
                          type="number"
                          value={registerData.graduationYear}
                          onChange={(e) => setRegisterData(prev => ({ ...prev, graduationYear: e.target.value }))}
                          placeholder="2020"
                        />
                      </div>

                      <div className="flex justify-between">
                        <Button type="button" onClick={prevStep} variant="outline">
                          Previous
                        </Button>
                        <Button type="button" onClick={nextStep} className="bg-blue-600 hover:bg-blue-700">
                          Next: Membership Selection
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Membership Selection */}
                  {currentStep === 4 && (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2 mb-4">
                        <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">4</div>
                        <h3 className="text-lg font-semibold">Choose Your Membership</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {MEMBERSHIP_TYPES.map((membership) => {
                          const Icon = membership.icon;
                          return (
                            <Card 
                              key={membership.id}
                              className={`cursor-pointer transition-all ${
                                registerData.membershipType === membership.id 
                                  ? 'ring-2 ring-blue-500 border-blue-500' 
                                  : 'hover:border-gray-300'
                              }`}
                              onClick={() => setRegisterData(prev => ({ ...prev, membershipType: membership.id }))}
                            >
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                  <div className={`w-10 h-10 rounded-full ${membership.color} flex items-center justify-center`}>
                                    <Icon className="w-5 h-5 text-white" />
                                  </div>
                                  {membership.popular && (
                                    <Badge className="bg-purple-500 text-white">Most Popular</Badge>
                                  )}
                                </div>
                                <CardTitle className="text-lg">{membership.name}</CardTitle>
                                <p className="text-sm text-gray-600">{membership.description}</p>
                                <div className="text-2xl font-bold">
                                  {membership.price === 0 ? 'Free' : `$${membership.price}/month`}
                                </div>
                              </CardHeader>
                              <CardContent className="pt-0">
                                <ul className="space-y-2 text-sm">
                                  {membership.features.map((feature, index) => (
                                    <li key={index} className="flex items-center space-x-2">
                                      <CheckCircle className="w-4 h-4 text-green-500" />
                                      <span>{feature}</span>
                                    </li>
                                  ))}
                                </ul>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>

                      {/* Password Fields */}
                      <Separator />
                      <div className="space-y-4">
                        <h4 className="font-semibold">Create Your Password</h4>
                        
                        <div className="space-y-2">
                          <Label htmlFor="password">Password *</Label>
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={registerData.password}
                            onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
                            placeholder="Create a secure password"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">Confirm Password *</Label>
                          <Input
                            id="confirmPassword"
                            type={showPassword ? "text" : "password"}
                            value={registerData.confirmPassword}
                            onChange={(e) => setRegisterData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            placeholder="Confirm your password"
                            required
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="showPassword"
                            checked={showPassword}
                            onCheckedChange={(checked) => setShowPassword(checked as boolean)}
                          />
                          <Label htmlFor="showPassword">Show password</Label>
                        </div>
                      </div>

                      {/* Terms and Conditions */}
                      <Separator />
                      <div className="space-y-4">
                        <h4 className="font-semibold">Terms and Conditions</h4>
                        
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="agreeToTerms"
                              checked={registerData.agreeToTerms}
                              onCheckedChange={(checked) => setRegisterData(prev => ({ ...prev, agreeToTerms: checked as boolean }))}
                              required
                            />
                            <Label htmlFor="agreeToTerms" className="text-sm">
                              I agree to the <a href="#" className="text-blue-600 hover:underline">Terms of Service</a> *
                            </Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="agreeToPrivacy"
                              checked={registerData.agreeToPrivacy}
                              onCheckedChange={(checked) => setRegisterData(prev => ({ ...prev, agreeToPrivacy: checked as boolean }))}
                            />
                            <Label htmlFor="agreeToPrivacy" className="text-sm">
                              I agree to the <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
                            </Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="agreeToMarketing"
                              checked={registerData.agreeToMarketing}
                              onCheckedChange={(checked) => setRegisterData(prev => ({ ...prev, agreeToMarketing: checked as boolean }))}
                            />
                            <Label htmlFor="agreeToMarketing" className="text-sm">
                              I agree to receive marketing communications
                            </Label>
                          </div>
                        </div>
                      </div>

                      {/* Selected Membership Summary */}
                      {selectedMembership && (
                        <Alert>
                          <Info className="h-4 w-4" />
                          <AlertDescription>
                            You've selected the <strong>{selectedMembership.name}</strong> membership. 
                            {selectedMembership.price > 0 ? (
                              <span> You will be charged ${selectedMembership.price}/month after your free trial.</span>
                            ) : (
                              <span> This is a free membership with basic features.</span>
                            )}
                          </AlertDescription>
                        </Alert>
                      )}

                      <div className="flex justify-between">
                        <Button type="button" onClick={prevStep} variant="outline">
                          Previous
                        </Button>
                        <Button 
                          type="submit" 
                          className="bg-blue-600 hover:bg-blue-700"
                          disabled={registerMutation.isPending}
                        >
                          {registerMutation.isPending ? "Creating Account..." : "Create Account"}
                        </Button>
                      </div>
                    </div>
                  )}
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 sm:mt-8 text-xs text-slate-500 dark:text-slate-400">
          <p>Built by Jordan Kenneth Boisclair</p>
          <p>© 2025 CivicOS™ - All rights reserved</p>
        </div>
      </div>
    </div>
  );
}