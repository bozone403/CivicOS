// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp?: string;
}

// Politician Types
export interface Politician {
  id: number;
  name: string;
  party: string;
  position: string;
  riding: string;
  level: string;
  jurisdiction: string;
  trustScore: number;
  civicLevel: string;
  recentActivity: string;
  policyPositions: string[];
  votingRecord: {
    yes: number;
    no: number;
    abstain: number;
  };
  contactInfo: {
    email: string;
    phone: string;
    office: string;
    website: string;
    social: Record<string, string>;
  };
  bio: string;
  keyAchievements: string[];
  committees: string[];
  expenses: {
    travel: number;
    hospitality: number;
    office: number;
    total: number;
    year: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Bill Types
export interface Bill {
  id: number;
  billNumber: string;
  title: string;
  description: string;
  status: string;
  sponsorName: string;
  category: string;
  summary: string;
  introducedDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Vote Types
export interface Vote {
  id: number;
  itemId: number;
  itemType: string;
  userId: string;
  voteValue: number;
  timestamp: Date;
  createdAt: Date;
}

// User Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  membershipType: string;
  trustScore: number;
  civicPoints: number;
  createdAt: Date;
  updatedAt: Date;
}

// Dashboard Types
export interface DashboardStats {
  totalVotes: number;
  activeBills: number;
  politiciansTracked: number;
  petitionsSigned: number;
  civicPoints: number;
  trustScore: number;
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: Date;
  }>;
}

// Error Types
export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

// Request Types
export interface AuthenticatedRequest {
  user: {
    id: string;
    email: string;
    membershipType: string;
  };
}

// Pagination Types
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
} 