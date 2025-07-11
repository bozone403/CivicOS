import { useQuery } from "@tanstack/react-query";

// Add VerificationStatus type
interface VerificationStatus {
  isVerified?: boolean;
  verificationLevel?: string;
  verifiedAt?: string;
  permissions?: {
    canVote?: boolean;
    canComment?: boolean;
    canCreatePetitions?: boolean;
    canAccessFOI?: boolean;
  };
}

export function useIdentityVerification() {
  const { data: verificationStatus, isLoading } = useQuery<VerificationStatus>({
    queryKey: ["/api/identity/status"],
    retry: false,
  });

  return {
    isVerified: verificationStatus?.isVerified || false,
    verificationLevel: verificationStatus?.verificationLevel || 'none',
    verifiedAt: verificationStatus?.verifiedAt,
    permissions: verificationStatus?.permissions || {
      canVote: false,
      canComment: false,
      canCreatePetitions: false,
      canAccessFOI: false
    },
    isLoading
  };
}