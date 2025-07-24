import { Response } from "express";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
  timestamp: string;
  count?: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  metadata?: {
    version: string;
    endpoint: string;
    processingTime?: number;
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  metadata?: {
    version: string;
    endpoint: string;
  };
}

export class ResponseFormatter {
  private static version = "1.0.0";

  static success<T>(
    res: Response,
    data: T,
    message: string = "Success",
    statusCode: number = 200,
    count?: number,
    pagination?: ApiResponse["pagination"],
    processingTime?: number
  ) {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
      count,
      pagination,
      metadata: {
        version: this.version,
        endpoint: res.req.path,
        processingTime
      }
    };

    return res.status(statusCode).json(response);
  }

  static error(
    res: Response,
    message: string,
    statusCode: number = 500,
    errorCode: string = "INTERNAL_ERROR",
    details?: any
  ) {
    const response: ApiError = {
      success: false,
      error: {
        code: errorCode,
        message,
        details
      },
      timestamp: new Date().toISOString(),
      metadata: {
        version: this.version,
        endpoint: res.req.path
      }
    };

    return res.status(statusCode).json(response);
  }

  static notFound(res: Response, message: string = "Resource not found") {
    return this.error(res, message, 404, "NOT_FOUND");
  }

  static unauthorized(res: Response, message: string = "Unauthorized") {
    return this.error(res, message, 401, "UNAUTHORIZED");
  }

  static forbidden(res: Response, message: string = "Forbidden") {
    return this.error(res, message, 403, "FORBIDDEN");
  }

  static badRequest(res: Response, message: string = "Bad request", details?: any) {
    return this.error(res, message, 400, "BAD_REQUEST", details);
  }

  static validationError(res: Response, message: string = "Validation failed", details?: any) {
    return this.error(res, message, 422, "VALIDATION_ERROR", details);
  }

  static databaseError(res: Response, message: string = "Database error") {
    return this.error(res, message, 500, "DATABASE_ERROR");
  }

  static rateLimitError(res: Response, message: string = "Rate limit exceeded") {
    return this.error(res, message, 429, "RATE_LIMIT_EXCEEDED");
  }
} 