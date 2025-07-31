import { Response } from 'express';

export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
  details?: unknown;
}

export class ErrorHandler {
  static handle(error: unknown): ApiError {
    if (error instanceof Error) {
      return {
        message: error.message,
        code: error.name,
        statusCode: 500
      };
    }
    
    if (typeof error === 'string') {
      return {
        message: error,
        statusCode: 500
      };
    }
    
    return {
      message: 'An unexpected error occurred',
      statusCode: 500
    };
  }
  
  static sendError(res: Response, error: unknown, statusCode: number = 500) {
    const apiError = this.handle(error);
    
    res.status(statusCode).json({
      success: false,
      error: apiError.message,
      code: apiError.code,
      timestamp: new Date().toISOString()
    });
  }
  
  static sendValidationError(res: Response, message: string, details?: unknown) {
    res.status(400).json({
      success: false,
      error: message,
      details,
      timestamp: new Date().toISOString()
    });
  }
  
  static sendNotFound(res: Response, message: string = 'Resource not found') {
    res.status(404).json({
      success: false,
      error: message,
      timestamp: new Date().toISOString()
    });
  }
  
  static sendUnauthorized(res: Response, message: string = 'Unauthorized') {
    res.status(401).json({
      success: false,
      error: message,
      timestamp: new Date().toISOString()
    });
  }
  
  static sendForbidden(res: Response, message: string = 'Forbidden') {
    res.status(403).json({
      success: false,
      error: message,
      timestamp: new Date().toISOString()
    });
  }
} 