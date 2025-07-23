import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Vote, 
  Users, 
  FileText, 
  MessageSquare, 
  Bell,
  Shield,
  TrendingUp,
  MapPin,
  BookOpen,
  Sparkles,
  X,
  ArrowRight
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  glowColor: string;
  position: "top" | "bottom" | "center";
  feature: string;
}

export function FeatureTutorial({ onComplete }: { onComplete?: () => void }) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  // Check if user is new (first login)
  useEffect(() => {
    if (user && !localStorage.getItem('civicos-tutorial-completed')) {
      setShowTutorial(true);
    }
  }, [user]);

  const tutorialSteps: TutorialStep[] = [
    {
      id: "voting",
      title: "Vote on Bills & Petitions",
      description: "Participate in democracy by voting on active legislation and petitions. Your voice matters!",
      icon: Vote,
      color: "bg-blue-500",
      glowColor: "shadow-blue-500/50",
      position: "top",
      feature: "voting"
    },
    {
      id: "politicians",
      title: "Track Politicians",
      description: "Follow your representatives, see their voting records, and stay informed about their activities.",
      icon: Users,
      color: "bg-green-500",
      glowColor: "shadow-green-500/50",
      position: "center",
      feature: "politicians"
    },
    {
      id: "news",
      title: "Stay Informed",
      description: "Get verified news and analysis from trusted sources. Understand the issues that matter.",
      icon: FileText,
      color: "bg-purple-500",
      glowColor: "shadow-purple-500/50",
      position: "center",
      feature: "news"
    },
    {
      id: "social",
      title: "Connect with Citizens",
      description: "Join discussions, share insights, and connect with other engaged citizens in your community.",
      icon: MessageSquare,
      color: "bg-orange-500",
      glowColor: "shadow-orange-500/50",
      position: "center",
      feature: "civicsocial"
    },
    {
      id: "notifications",
      title: "Stay Updated",
      description: "Get notified about important votes, breaking news, and updates from your representatives.",
      icon: Bell,
      color: "bg-red-500",
      glowColor: "shadow-red-500/50",
      position: "bottom",
      feature: "notifications"
    }
  ];

  const handleStepComplete = (stepId: string) => {
    setCompletedSteps(prev => [...prev, stepId]);
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTutorial();
    }
  };

  const completeTutorial = () => {
    localStorage.setItem('civicos-tutorial-completed', 'true');
    setShowTutorial(false);
    onComplete?.();
  };

  const skipTutorial = () => {
    localStorage.setItem('civicos-tutorial-completed', 'true');
    setShowTutorial(false);
    onComplete?.();
  };

  if (!showTutorial) return null;

  const currentTutorialStep = tutorialSteps[currentStep];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="relative max-w-md w-full">
        {/* Tutorial Card */}
        <Card className={`relative overflow-hidden animate-pulse ${currentTutorialStep.glowColor} bg-white shadow-xl`}>
          {/* Glow Effect */}
          <div className={`absolute inset-0 ${currentTutorialStep.color} opacity-20 blur-xl`}></div>
          
          <CardHeader className="relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-full ${currentTutorialStep.color} text-white`}>
                  <currentTutorialStep.icon className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-xl">{currentTutorialStep.title}</CardTitle>
                  <Badge variant="secondary" className="mt-1">
                    Feature {currentStep + 1} of {tutorialSteps.length}
                  </Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={skipTutorial}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="relative">
            <p className="text-gray-600 mb-6 leading-relaxed">
              {currentTutorialStep.description}
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                {tutorialSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full ${
                      index <= currentStep ? currentTutorialStep.color : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
              
              <div className="flex space-x-2">
                {currentStep > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(currentStep - 1)}
                  >
                    Previous
                  </Button>
                )}
                
                {currentStep < tutorialSteps.length - 1 ? (
                  <Button
                    onClick={() => handleStepComplete(currentTutorialStep.id)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={completeTutorial}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Get Started!
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Skip Tutorial */}
        <div className="text-center mt-4">
          <Button
            variant="ghost"
            onClick={skipTutorial}
            className="text-gray-500 hover:text-gray-700"
          >
            Skip tutorial
          </Button>
        </div>
      </div>
    </div>
  );
}

// Feature highlight component for individual features
export function FeatureHighlight({ 
  children, 
  showGlow = false 
}: { 
  children: React.ReactNode; 
  showGlow?: boolean;
}) {
  const [isHighlighted, setIsHighlighted] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Show highlight for new users who haven't completed tutorial
    if (user && !localStorage.getItem('civicos-tutorial-completed')) {
      setIsHighlighted(true);
    }
  }, [user]);

  if (!isHighlighted) return <>{children}</>;

  return (
    <div className={`relative ${showGlow ? 'animate-pulse' : ''}`}>
      {children}
      {showGlow && (
        <div className="absolute inset-0 bg-blue-500/20 rounded-lg blur-sm pointer-events-none"></div>
      )}
    </div>
  );
} 