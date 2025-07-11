import { useIdentityVerification } from "@/hooks/useIdentityVerification";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertTriangle, CheckCircle } from "lucide-react";
import { useLocation } from "wouter";

export function IdentityVerificationBanner() {
  const { isVerified, verificationLevel, isLoading } = useIdentityVerification();
  const [, setLocation] = useLocation();

  if (isLoading || isVerified) {
    return null;
  }

  return (
    <Alert className="mb-4 md:mb-6 border-yellow-500 bg-yellow-50">
      <Shield className="h-4 w-4" />
      <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div className="text-sm">
          <strong>Identity Verification Required:</strong> Complete government-grade verification to unlock voting, petitions, and civic features.
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setLocation('/identity-verification')}
          className="sm:ml-4 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
        >
          <Shield className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
          Verify Now
        </Button>
      </AlertDescription>
    </Alert>
  );
}