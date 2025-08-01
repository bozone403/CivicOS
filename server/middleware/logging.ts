import { Request, Response, NextFunction } from 'express';
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  }
});

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  
  // Log request
  logger.info({
    type: 'request',
    requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.id || 'anonymous',
    timestamp: new Date().toISOString()
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any): Response {
    const duration = Date.now() - startTime;
    
    // Log response
    logger.info({
      type: 'response',
      requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: (req as any).user?.id || 'anonymous',
      timestamp: new Date().toISOString()
    });

    return originalEnd.call(this, chunk, encoding);
  };

  next();
};

// Error logging middleware
export const errorLogger = (error: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error({
    type: 'error',
    method: req.method,
    url: req.originalUrl,
    error: error.message,
    stack: error.stack,
    userId: (req as any).user?.id || 'anonymous',
    timestamp: new Date().toISOString()
  });

  next(error);
};

// Security event logging
export const securityLogger = (event: string, details: any) => {
  logger.warn({
    type: 'security',
    event,
    details,
    timestamp: new Date().toISOString()
  });
};

// Performance monitoring
export const performanceLogger = (operation: string, duration: number, details?: any) => {
  logger.info({
    type: 'performance',
    operation,
    duration: `${duration}ms`,
    details,
    timestamp: new Date().toISOString()
  });
};

// Database query logging
export const dbLogger = (query: string, duration: number, params?: any) => {
  logger.debug({
    type: 'database',
    query,
    duration: `${duration}ms`,
    params,
    timestamp: new Date().toISOString()
  });
};

// Authentication logging
export const authLogger = (event: 'login' | 'logout' | 'register' | 'failed_login', userId?: string, details?: any) => {
  logger.info({
    type: 'authentication',
    event,
    userId,
    details,
    timestamp: new Date().toISOString()
  });
};

// Content moderation logging
export const moderationLogger = (action: 'flag' | 'remove' | 'warn', contentId: string, reason: string, moderatorId?: string) => {
  logger.warn({
    type: 'moderation',
    action,
    contentId,
    reason,
    moderatorId,
    timestamp: new Date().toISOString()
  });
};

export { logger }; 