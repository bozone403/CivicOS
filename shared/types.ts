// Standardized API response types for consistency across the application

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string;
  timestamp?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ErrorResponse {
  success: false;
  error: string;
  code: string;
  message: string;
  timestamp: string;
}

// Common API error codes
export const API_ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
  CONFLICT: 'CONFLICT',
} as const;

// Standardized success response helper
export const createSuccessResponse = <T>(data: T, message?: string): ApiResponse<T> => ({
  success: true,
  data,
  message,
  timestamp: new Date().toISOString(),
});

// Standardized error response helper
export const createErrorResponse = (
  error: string,
  code: keyof typeof API_ERROR_CODES = 'INTERNAL_SERVER_ERROR',
  message?: string
): ErrorResponse => ({
  success: false,
  error,
  code: API_ERROR_CODES[code],
  message: message || error,
  timestamp: new Date().toISOString(),
});

// Validation error response
export const createValidationError = (field: string, message: string) =>
  createErrorResponse(`Validation failed for ${field}`, 'VALIDATION_ERROR', message);

// Authentication error response
export const createAuthError = (message: string = 'Authentication required') =>
  createErrorResponse(message, 'UNAUTHORIZED');

// Rate limit error response
export const createRateLimitError = (message: string = 'Rate limit exceeded') =>
  createErrorResponse(message, 'RATE_LIMIT_EXCEEDED'); 