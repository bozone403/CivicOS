import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./appRoutes.js";
import { fileURLToPath } from 'url';
import path from "path";
import { initializeDataSync } from "./dataSync.js";
import { initializeNewsAnalysis } from "./newsAnalyzer.js";
import { comprehensiveNewsAnalyzer } from "./comprehensiveNewsAnalyzer.js";
import { realTimeMonitoring } from "./realTimeMonitoring.js";
import { confirmedAPIs } from "./confirmedAPIs.js";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import pino from "pino";
import { existsSync } from 'fs';

// Security configuration - production-safe
if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  console.warn('[SECURITY] SSL verification disabled in development mode');
} else {
  // Production: use proper SSL verification
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '1';
  console.log('[SECURITY] SSL verification enabled in production mode');
}

const logger = pino();
// Enforce SESSION_SECRET is set before anything else
if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET must be set as an environment variable. Refusing to start.");
}
const JWT_SECRET = process.env.SESSION_SECRET;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
function jwtAuth(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing or invalid token" });
  }
  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

const app = express();
app.set('trust proxy', 1); // Trust first proxy (Render, Heroku, etc.)

// Add JwtPayload type for req.user
interface JwtPayload {
  id: string;
  email: string;
}

// Simple health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    service: 'CivicOS API'
  });
});

// CORS configuration
// This logic allows all civicos.ca subdomains and any origin in allowedOrigins, including process.env.CORS_ORIGIN if set.
// In production, only trusted origins are allowed. In dev, any origin is allowed.
app.use((req, res, next) => {
  const allowedOrigins = [
    "https://civicos.ca",
    "https://www.civicos.ca",
    "http://civicos.ca",
    "http://www.civicos.ca",
    "https://afterhourshvac.me",
    "https://www.afterhourshvac.me",
    "http://afterhourshvac.me",
    "http://www.afterhourshvac.me",
    process.env.CORS_ORIGIN, // Custom CORS origin from env
  ].filter(Boolean);

  // Allow all civicos.ca and afterhourshvac.me subdomains
  const origin = req.headers.origin;
  const civicosRegex = /^https?:\/\/(.*\.)?civicos\.ca$/;
  const afterhourshvacRegex = /^https?:\/\/(.*\.)?afterhourshvac\.me$/;
  const isAllowed = origin && (allowedOrigins.includes(origin) || civicosRegex.test(origin) || afterhourshvacRegex.test(origin));

  // Allow only trusted origins in production, strict in development
  if (process.env.NODE_ENV === 'production') {
    if (isAllowed) {
      res.header("Access-Control-Allow-Origin", origin);
    } else {
      res.header("Access-Control-Allow-Origin", "https://civicos.ca");
    }
  } else {
    // Development: allow civicos.ca for testing
    res.header("Access-Control-Allow-Origin", "https://civicos.ca");
  }

  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  );
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

// Security middleware
app.use(helmet());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
}));

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

// Register all API routes before static serving and SPA fallback
(async () => {
  await registerRoutes(app);
  const { createServer } = await import("http");
  const httpServer = createServer(app);

  // Global error handler (must be before static serving and SPA fallback)
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
  const distPath = path.resolve(__dirname, "../dist/public");
  app.use(express.static(distPath));
  // Ensure SPA fallback for all non-API routes
  app.get(/^\/(?!api\/).*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/public/index.html'));
  });

  // ALWAYS serve the app on the correct port for Render
  // Render uses PORT environment variable
  const PORT = process.env.PORT || 5001;
  httpServer.listen(PORT, () => {
    logger.info({ msg: `Server running on port ${PORT}`, environment: process.env.NODE_ENV });
  });
  
  // Initialize automatic government data sync (non-blocking)
  setTimeout(() => {
    try {
      initializeDataSync();
    } catch (error) {
      logger.error({ msg: "Failed to initialize data sync", error });
    }
  }, 30000); // Increased to 30 seconds to ensure server is fully started
  
  // Initialize Ollama AI service for production (optional) - with better error handling
  if (process.env.NODE_ENV === 'production') {
    // Wait longer for Ollama to be ready
    setTimeout(async () => {
      try {
        // Test Ollama connection with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // Increased timeout
        
        const response = await fetch('http://127.0.0.1:11434/api/tags', {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          logger.info('Ollama service is available');
          // Test Mistral model with timeout
          try {
            const modelResponse = await fetch('http://127.0.0.1:11434/api/generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model: 'mistral',
                prompt: 'Test',
                stream: false
              }),
              signal: AbortSignal.timeout(15000) // 15 second timeout
            });
            
            if (modelResponse.ok) {
              logger.info('Mistral model is available and working');
            } else {
              logger.warn('Mistral model not available, using fallback');
            }
          } catch (error) {
            logger.warn('Mistral model test failed, using fallback');
          }
        } else {
          logger.warn('Ollama not available, using fallback responses');
        }
      } catch (error) {
        logger.warn('Ollama initialization failed, using fallback responses');
      }
    }, 60000); // Wait 60 seconds before trying Ollama
  }
  
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
      }, 180000); // Increased to 3 minutes delay to let initial data load
    } catch (error) {
      logger.error({ msg: 'Error enhancing politician data', error });
    }
  }
  
  // Initialize daily news analysis and propaganda detection with better error handling
  try {
    setTimeout(() => {
      try {
        initializeNewsAnalysis();
      } catch (error) {
        logger.error({ msg: "Failed to initialize news analysis", error });
      }
    }, 90000); // Delay news analysis by 90 seconds
  } catch (error) {
    logger.error({ msg: "Failed to initialize news analysis", error });
  }
  
  // Start comprehensive Canadian news analysis (non-blocking) with much longer delay
  setTimeout(() => {
    comprehensiveNewsAnalyzer.performComprehensiveAnalysis().catch(error => {
      logger.error({ msg: "Error in comprehensive news analysis", error });
    });
  }, 300000); // Increased to 5 minutes delay

  // Schedule regular comprehensive news analysis (every 4 hours instead of 2)
  setInterval(() => {
    comprehensiveNewsAnalyzer.performComprehensiveAnalysis().catch(error => {
      logger.error({ msg: "Error in scheduled news analysis", error });
    });
  }, 4 * 60 * 60 * 1000); // 4 hours instead of 2
  
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
    if (req.sessionStore && typeof (req.sessionStore as any).clear === 'function') {
      await new Promise((resolve, reject) => (req.sessionStore as any).clear((err: any) => err ? reject(err) : resolve(undefined)));
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

export { app };
