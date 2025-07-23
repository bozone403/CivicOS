import { Request, Response, NextFunction } from "express";
import { z } from "zod";

// Validation schemas
export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  city: z.string().min(1, "City is required"),
  province: z.string().min(1, "Province is required"),
  postalCode: z.string().min(1, "Postal code is required"),
});

export const userUpdateSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  province: z.string().min(1).optional(),
  postalCode: z.string().min(1).optional(),
});

// Validation middleware
export function validateRequest(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation failed",
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      return res.status(400).json({ message: "Invalid request data" });
    }
  };
}

// Rate limiting helper
export function createRateLimit(maxRequests: number, windowMs: number) {
  const requests = new Map<string, { count: number; resetTime: number }>();
  
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    
    const userRequests = requests.get(ip);
    
    if (!userRequests || now > userRequests.resetTime) {
      requests.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    if (userRequests.count >= maxRequests) {
      return res.status(429).json({
        message: "Too many requests. Please try again later."
      });
    }
    
    userRequests.count++;
    next();
  };
}

// XSS protection middleware
export function xssProtection(req: Request, res: Response, next: NextFunction) {
  // Sanitize request body
  if (req.body) {
    const sanitize = (obj: any): any => {
      if (typeof obj === 'string') {
        return obj.replace(/[<>]/g, '');
      }
      if (Array.isArray(obj)) {
        return obj.map(sanitize);
      }
      if (typeof obj === 'object' && obj !== null) {
        const sanitized: any = {};
        for (const [key, value] of Object.entries(obj)) {
          sanitized[key] = sanitize(value);
        }
        return sanitized;
      }
      return obj;
    };
    
    req.body = sanitize(req.body);
  }
  
  next();
}

// CSRF protection middleware
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  // Skip CSRF check for GET requests
  if (req.method === 'GET') {
    return next();
  }
  
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://civicos.ca',
    'https://www.civicos.ca',
    process.env.FRONTEND_BASE_URL
  ].filter(Boolean);
  
  if (origin && !allowedOrigins.includes(origin)) {
    return res.status(403).json({ message: "CSRF protection: Invalid origin" });
  }
  
  next();
} 