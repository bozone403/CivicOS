import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./appRoutes.js";
import { fileURLToPath } from 'url';
import path from "path";
import { initializeDataSync } from "./dataSync.js";
// import { initializeNewsAnalysis } from "./newsAnalyzer.js"; // Temporarily disabled
// import { comprehensiveNewsAnalyzer } from "./comprehensiveNewsAnalyzer.js"; // Temporarily disabled
import { realTimeMonitoring } from "./realTimeMonitoring.js";
import { confirmedAPIs } from "./confirmedAPIs.js";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import pino from "pino";
import { existsSync } from 'fs';

// Import middleware
import { authRateLimit, apiRateLimit, socialRateLimit, votingRateLimit } from './middleware/rateLimit.js';
import { requestLogger, errorLogger, logger as appLogger } from './middleware/logging.js';

// AI routes are mounted in registerRoutes()

// Security configuration - production-safe
if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  console.warn('[SECURITY] SSL verification disabled in development mode');
} else {
  // Production: use proper SSL verification
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '1';
  // console.log removed for production
}

const logger = pino();
// Enforce SESSION_SECRET is set before anything else
if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET must be set as an environment variable. Refusing to start.");
}
const JWT_SECRET = process.env.SESSION_SECRET;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Standardized JWT payload interface
interface JwtPayload {
  id: string;
  email: string;
  exp: number;
  iat: number;
  iss?: string;
  aud?: string;
}

// Extended request interface for authenticated routes
interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

// Enhanced JWT authentication middleware
function jwtAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ 
      message: "Missing or invalid token",
      code: "MISSING_TOKEN"
    });
  }
  
  try {
    const token = authHeader.split(" ")[1];
    
    // Verify token with enhanced security
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: 'civicos',
      audience: 'civicos-users',
      clockTolerance: 30, // 30 seconds tolerance for clock skew
    }) as JwtPayload;
    
    // Additional validation
    if (!decoded.id || !decoded.email) {
      return res.status(401).json({ 
        message: "Invalid token payload",
        code: "INVALID_PAYLOAD"
      });
    }
    
    // Check if token is expired (with 5 minute buffer)
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp < now - 300) {
      return res.status(401).json({ 
        message: "Token expired",
        code: "TOKEN_EXPIRED"
      });
    }
    
    (req as any).user = decoded;
    next();
  } catch (err) {
    logger.error('JWT verification failed', { 
      error: err instanceof Error ? err.message : 'Unknown error',
      token: authHeader.substring(0, 20) + '...' // Log first 20 chars for debugging
    });
    
    return res.status(401).json({ 
      message: "Invalid or expired token",
      code: "INVALID_TOKEN"
    });
  }
}

const app = express();
// Trust proxy chain on Render to ensure correct client IP for rate limiting (IPv6-safe)
app.set('trust proxy', true);

// Add JwtPayload type for req.user
// interface JwtPayload {
//   id: string;
//   email: string;
// }

// Ensure CORS headers are present for /health (handles GET, HEAD, OPTIONS)
app.use('/health', (req, res, next) => {
  const origin = req.headers.origin as string | undefined;
  const envOrigin = process.env.CORS_ORIGIN;
  const frontendBase = process.env.FRONTEND_BASE_URL;
  const allowedOrigins = [
    'https://civicos.ca',
    'https://www.civicos.ca',
    'https://civicos.onrender.com',
    envOrigin,
    frontendBase,
  ].filter(Boolean) as string[];
  const civicosDomainRegex = /^https?:\/\/(.*\.)?civicos\.ca$/i;

  const isAllowed = Boolean(
    origin && (allowedOrigins.includes(origin) || civicosDomainRegex.test(origin))
  );

  if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin!);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Simple health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    service: 'CivicOS API'
  });
});

// CORS configuration (production-safe)
app.use((req, res, next) => {
  const origin = req.headers.origin as string | undefined;
  const envOrigin = process.env.CORS_ORIGIN;
  const frontendBase = process.env.FRONTEND_BASE_URL;
  const allowedOrigins = [
    'https://civicos.ca',
    'https://www.civicos.ca',
    'https://civicos.onrender.com',
    envOrigin,
    frontendBase,
  ].filter(Boolean) as string[];
  const civicosDomainRegex = /^https?:\/\/(.*\.)?civicos\.ca$/i;

  const isAllowed = Boolean(
    origin && (allowedOrigins.includes(origin) || civicosDomainRegex.test(origin))
  );

  if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin!);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Apply rate limiting and logging middleware
app.use(requestLogger);

// Normalize incoming URLs to prevent double-slash routing edge cases
app.use((req, _res, next) => {
  if (req.url.includes('//')) {
    // Collapse any sequence of multiple slashes to a single slash (idempotent)
    req.url = req.url.replace(/\/+/, '/');
    while (req.url.includes('//')) {
      req.url = req.url.replace(/\/+/, '/');
    }
  }
  next();
});

// Apply specific rate limits to sensitive endpoints
app.use('/api/auth', authRateLimit);
app.use('/api/social', socialRateLimit);
app.use('/api/voting', votingRateLimit);
app.use('/api', apiRateLimit);

app.use((req, res, next) => {
  logger.info({ method: req.method, url: req.url, ip: req.ip });
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      // log(logLine); // This line is removed as per the edit hint
    }
  });

  next();
});

// Security middleware with CSP configuration for images
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:", "https://images.unsplash.com", "https://*.unsplash.com"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

// Enhanced rate limiting configuration (temporarily disabled)
// const createRateLimit = (windowMs: number, max: number, message: string) => {
//   return rateLimit({
//     windowMs,
//     max,
//     message: { error: message },
//     standardHeaders: true,
//     legacyHeaders: false,
//     handler: (req, res) => {
//       res.status(429).json({
//         error: message,
//         retryAfter: Math.ceil(windowMs / 1000)
//       });
//     }
//   });
// };

// Apply rate limiting to different endpoints (temporarily disabled)
// app.use('/api/auth/', createRateLimit(15 * 60 * 1000, 5, 'Too many authentication attempts')); // 5 attempts per 15 minutes
// app.use('/api/voting/', createRateLimit(60 * 1000, 10, 'Too many voting attempts')); // 10 votes per minute
// app.use('/api/social/', createRateLimit(60 * 1000, 20, 'Too many social interactions')); // 20 interactions per minute
// app.use('/api/', createRateLimit(60 * 1000, 100, 'Too many API requests')); // 100 requests per minute for general API

// Enhanced error handling middleware
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  logger.error({ 
    msg: 'Unhandled error', 
    error: error.message, 
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  // Don't expose internal errors in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  const errorMessage = isDevelopment ? error.message : 'Internal server error';
  const errorStack = isDevelopment ? error.stack : undefined;

  res.status(500).json({
    error: errorMessage,
    ...(errorStack && { stack: errorStack }),
    timestamp: new Date().toISOString()
  });
});

(function checkRequiredEnvVars() {
  const required = [
    'DATABASE_URL',
    'SESSION_SECRET'
  ];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    logger.error({ msg: 'Missing required environment variables', missing });
    process.exit(1);
  }
})();

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
  logger.error({ msg: 'Uncaught Exception thrown', err });
  process.exit(1);
});

// DB health check endpoint
app.get('/api/monitoring/db', async (req, res) => {
  try {
    const { pool } = await import('./db.js');
    const result = await pool.query('SELECT NOW() as now');
    res.json({ status: 'ok', time: result.rows[0].now });
  } catch (error) {
    res.status(500).json({ status: 'error', error: error instanceof Error ? error.message : String(error) });
  }
});

// Monitoring/health endpoint
app.get('/api/monitoring/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// Health check endpoint for Render monitoring
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// AI routes mounted within registerRoutes()

// Register all API routes before static serving and SPA fallback
(async () => {
  await registerRoutes(app);
  const { createServer } = await import("http");
  const httpServer = createServer(app);

  // Global error handler (must be before static serving and SPA fallback)
  app.use(errorLogger);
  
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    // console.error removed for production
    if (req.path && req.path.startsWith("/api/")) {
      res.status(status).json({ message });
    } else {
      res.status(status).send(message);
    }
  });

  // Add a catch-all 404 handler for /api/* routes (must be after all API routes)
  app.all('/api/*', (req, res) => {
    res.status(404).json({ message: 'API route not found', path: req.originalUrl });
  });

  // Patch static file serving to use ESM-compatible __dirname
  const staticRootCandidates = [
    path.resolve(__dirname, "../dist/public"),
    path.resolve(process.cwd(), "dist/public"),
    "/opt/render/project/src/dist/public",
  ];
  let staticRoot = staticRootCandidates.find((p) => {
    try { return require('fs').existsSync(p); } catch { return false; }
  }) || path.resolve(__dirname, "../dist/public");
  app.use(express.static(staticRoot));
  // Ensure SPA fallback for all non-API routes
  app.get(/^\/(?!api\/).*/, (_req, res) => {
    res.sendFile(path.join(staticRoot, 'index.html'));
  });

  // ALWAYS serve the app on the correct port for Render
  // Render uses PORT environment variable
  const PORT = process.env.PORT || 5001;
  httpServer.listen(PORT, () => {
    logger.info({ msg: `Server running on port ${PORT}`, environment: process.env.NODE_ENV });
  });
  
  // Run database migrations on startup
  setTimeout(async () => {
    try {
      // Temporarily disabled due to TypeScript compilation issues
      // const migrateModule = await import('./migrate.js') as any;
      // await migrateModule.runMigrations();
      logger.info({ msg: "Database migrations temporarily disabled" });
    } catch (error) {
      logger.error({ msg: "Failed to run database migrations", error });
    }
  }, 5000); // Run migrations 5 seconds after server starts
  
  // Initialize automatic government data sync (non-blocking)
  setTimeout(() => {
    try {
      initializeDataSync();
    } catch (error) {
      logger.error({ msg: "Failed to initialize data sync", error });
    }
  }, 30000); // Increased to 30 seconds to ensure server is fully started
  
  // Initialize Ollama AI service for production (enhanced with robust error handling)
  if (process.env.NODE_ENV === 'production') {
    // Start Ollama initialization in background - don't wait for completion
    setTimeout(async () => {
      try {
        logger.info({ msg: "Starting Ollama initialization process..." });
        
        // Import the enhanced Ollama manager
        const OllamaManagerModule = await import('./initOllama.js');
        const OllamaManager = OllamaManagerModule.default;
        const manager = new OllamaManager();
        
        // Run health check first
        const health = await manager.healthCheck();
        logger.info({ msg: "Ollama health check", status: health });
        
        if (!health.service) {
          logger.warn({ msg: "Ollama service not available - AI will use fallback responses" });
        } else if (!health.model) {
          logger.info({ msg: "Ollama service available but model missing - attempting initialization" });
          
          // Try to initialize model in background
          const initSuccess = await manager.initialize();
          if (initSuccess) {
            logger.info({ msg: "✅ Ollama and Mistral model successfully initialized" });
          } else {
            logger.warn({ msg: "⚠️ Ollama initialization failed - using fallback responses" });
          }
        } else {
          logger.info({ msg: "✅ Ollama service and model are both ready" });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error({ msg: "Error during Ollama initialization", error: errorMessage });
      }
    }, 45000); // Increased delay to let Ollama binary start properly
  }
  // Run admin permission bootstrap (non-blocking)
  setTimeout(async () => {
    try {
      const adminEmail = process.env.ADMIN_EMAIL;
      if (!adminEmail) return;
      const { db } = await import('./db.js');
      const { users, userPermissions, permissions } = await import('../shared/schema.js');
      const { eq } = await import('drizzle-orm');
      const [admin] = await db.select().from(users).where(eq(users.email, adminEmail)).limit(1);
      if (admin) {
        const ensurePermission = async (name: string) => {
          const [perm] = await db.select().from(permissions).where(eq(permissions.name, name)).limit(1);
          if (!perm) {
            const [created] = await db.insert(permissions).values({ name, description: name, isActive: true }).returning();
            return created.id as number;
          }
          return (perm as any).id as number;
        };
        const p1 = await ensurePermission('admin.identity.review');
        const p2 = await ensurePermission('admin.news.manage');
        await db.insert(userPermissions).values({ userId: (admin as any).id, permissionId: p1, permissionName: 'admin.identity.review', isGranted: true }).catch(() => undefined);
        await db.insert(userPermissions).values({ userId: (admin as any).id, permissionId: p2, permissionName: 'admin.news.manage', isGranted: true }).catch(() => undefined);
      }
    } catch {}
  }, 10000);
  
  // Run immediate data scraping on startup - NON-BLOCKING with longer delay
  setTimeout(async () => {
    try {
      const { syncAllGovernmentData } = await import('./dataSync.js');
      // Run data sync in background without blocking server startup
      syncAllGovernmentData().catch(error => {
        logger.error({ msg: "Background data scraping failed:", error });
      });
    } catch (error) {
      logger.error({ msg: "Failed to import data sync module:", error });
    }
  }, 120000); // Increased to 2 minutes delay to ensure server is fully started
  
  // Initialize confirmed government API data enhancement
  async function initializeConfirmedAPIs() {
    // Statistics Canada and Open Government API enhancement
    setInterval(async () => {
      try {
        await confirmedAPIs.enhanceDataWithConfirmedAPIs();
      } catch (error) {
        logger.error({ msg: "Government API enhancement error", error });
      }
    }, 12 * 60 * 60 * 1000); // Every 12 hours
    
    // Initial enhancement
    setTimeout(() => {
      confirmedAPIs.enhanceDataWithConfirmedAPIs();
    }, 60000); // 1 minute delay to let scraping start first
  }
  
  // Initialize politician data enhancement
  async function initializePoliticianEnhancement() {
    try {
      const { politicianDataEnhancer } = await import('./politicianDataEnhancer.js');
      setTimeout(async () => {
        await politicianDataEnhancer.enhanceAllPoliticians();
        const stats = await politicianDataEnhancer.getEnhancementStats();
        // Politician enhancement completed
        
        // Force garbage collection after enhancement
        if (global.gc) {
          global.gc();
        }
      }, 300000); // Increased to 5 minutes delay to let initial data load
    } catch (error) {
      logger.error({ msg: 'Error enhancing politician data', error });
    }
  }
  
  // Initialize daily news analysis and propaganda detection with better error handling
  try {
    setTimeout(() => {
      try {
        // initializeNewsAnalysis(); // Temporarily disabled
      } catch (error) {
        logger.error({ msg: "Failed to initialize news analysis", error });
      }
    }, 90000); // Delay news analysis by 90 seconds
  } catch (error) {
    logger.error({ msg: "Failed to initialize news analysis", error });
  }
  
  // Start comprehensive Canadian news analysis (non-blocking) with much longer delay
  // setTimeout(() => {
  //   comprehensiveNewsAnalyzer.performComprehensiveAnalysis().catch(error => {
  //     logger.error({ msg: "Error in comprehensive news analysis", error });
  //   });
  // }, 300000); // Increased to 5 minutes delay

  // Schedule regular comprehensive news analysis (every 12 hours instead of 4 to reduce memory pressure)
  // setInterval(() => {
  //   comprehensiveNewsAnalyzer.performComprehensiveAnalysis().catch(error => {
  //     logger.error({ msg: "Error in scheduled news analysis", error });
  //   });
  // }, 12 * 60 * 60 * 1000); // 12 hours instead of 4
  
  // Start real-time platform monitoring (non-blocking) with delay
  setTimeout(() => {
    try {
      realTimeMonitoring.startMonitoring();
    } catch (error) {
      logger.error({ msg: "Failed to start real-time monitoring", error });
    }
  }, 45000); // Increased to 45 second delay
  
  // Initialize comprehensive legal database
  setTimeout(() => {
    // Legal data populator removed during cleanup
  }, 5000);
  
  // Populate forum with civic discussions (disabled to prevent duplicates)
  // setTimeout(() => {
  //   forumPopulator.populateInitialDiscussions().catch(console.error);
  // }, 8000);
})();

// Admin session cleanup endpoint (admin only)
app.post('/api/admin/session/cleanup', jwtAuth, async (req, res) => {
  const user = req.user as JwtPayload;
  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  try {
    const reqWithSession = req as any;
    if (reqWithSession.sessionStore && typeof reqWithSession.sessionStore.clear === 'function') {
      await new Promise((resolve, reject) => reqWithSession.sessionStore.clear((err: any) => err ? reject(err) : resolve(undefined)));
      res.json({ message: 'All sessions cleared' });
    } else {
      res.status(500).json({ message: 'Session store does not support cleanup' });
    }
  } catch (error) {
    logger.error({ msg: 'Error clearing sessions', error });
    res.status(500).json({ message: 'Failed to clear sessions' });
  }
});

app.get("/api/admin/identity-review", jwtAuth, async (req, res) => {
  const user = req.user as JwtPayload;
  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  // Admin identity review endpoint
  res.json({ message: "Admin endpoint" });
});

// Temporary admin endpoint to trigger migrations
app.post('/api/admin/run-migrations', jwtAuth, async (req, res) => {
  const user = req.user as JwtPayload;
  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  try {
    // Temporarily disabled due to TypeScript compilation issues
    // const migrateModule = await import('./migrate.js') as any;
    // await migrateModule.runMigrations();
    res.json({ message: 'Migrations temporarily disabled' });
  } catch (error) {
    logger.error({ msg: 'Error running migrations', error });
    res.status(500).json({ message: 'Failed to run migrations', error: String(error) });
  }
});

// Identity verification routes are now registered in appRoutes

export { app };
