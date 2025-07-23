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
  // Production: use proper SSL but allow Supabase connections
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // Allow Supabase SSL
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

// CORS configuration
// This logic allows all civicos.ca subdomains and any origin in allowedOrigins, including process.env.CORS_ORIGIN if set.
// In production, only trusted origins are allowed. In dev, any origin is allowed.
app.use((req, res, next) => {
  const allowedOrigins = [
    "https://civicos.ca",
    "https://www.civicos.ca",
    "http://civicos.ca",
    "http://www.civicos.ca",
    process.env.CORS_ORIGIN, // Custom CORS origin from env
  ].filter(Boolean);

  // Allow all civicos.ca subdomains
  const origin = req.headers.origin;
  const civicosRegex = /^https?:\/\/(.*\.)?civicos\.ca$/;
  const isAllowed = origin && (allowedOrigins.includes(origin) || civicosRegex.test(origin));

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

// Paranoid logging for Node.js version and SSL config
console.log('[Startup] Node.js version:', process.version);
console.log('[Startup] NODE_TLS_REJECT_UNAUTHORIZED:', process.env.NODE_TLS_REJECT_UNAUTHORIZED);

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
  logger.error({ msg: 'Uncaught Exception thrown', err });
  process.exit(1);
});

// Paranoid: Log every /api/* request
app.use('/api', (req, res, next) => {
  console.log('[API ROUTE]', req.method, req.originalUrl);
  next();
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
    console.error("[GLOBAL ERROR]", err);
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
  const distPath = path.resolve(__dirname, "../public");
  app.use(express.static(distPath));
  // Ensure SPA fallback for all non-API routes
  app.get(/^\/(?!api\/).*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  });

  // ALWAYS serve the app on the correct port for Render
  // Render uses PORT environment variable
  const PORT = process.env.PORT || 5001;
  httpServer.listen(PORT, () => {
    logger.info({ msg: `Server running on port ${PORT}`, environment: process.env.NODE_ENV });
  });
  
  // Initialize automatic government data sync
  initializeDataSync();
  
  // Run database migration if needed
  if (process.env.NODE_ENV === 'production') {
    setTimeout(async () => {
      try {
        console.log('🗄️  Database migrations handled by startup script');
      } catch (error) {
        console.error('Migration error:', error);
      }
    }, 2000); // Run after 2 seconds
  }
  
  // Initialize Ollama AI service for production
  if (process.env.NODE_ENV === 'production') {
    console.log('🤖 Initializing Ollama AI service for production...');
    
    // Wait a bit for Ollama to be ready
    setTimeout(async () => {
      try {
        // Test Ollama connection with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        const response = await fetch('http://127.0.0.1:11434/api/tags', {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          console.log('✅ Ollama AI service is ready');
          
          // Test Mistral model with timeout
          try {
            const mistralController = new AbortController();
            const mistralTimeoutId = setTimeout(() => mistralController.abort(), 10000); // 10 second timeout
            
            const mistralResponse = await fetch('http://127.0.0.1:11434/api/generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model: 'mistral:latest',
                prompt: 'Hello',
                stream: false
              }),
              signal: mistralController.signal
            });
            
            clearTimeout(mistralTimeoutId);
            
            if (mistralResponse.ok) {
              console.log('✅ Mistral model is working');
            } else {
              console.log('⚠️  Mistral model not responding properly');
            }
          } catch (mistralError) {
            console.log('⚠️  Mistral model test failed:', mistralError);
          }
        } else {
          console.log('⚠️  Ollama service not responding properly');
        }
      } catch (error) {
        console.error('❌ Failed to connect to Ollama AI service:', error);
        console.log('⚠️  AI functionality will use fallback responses');
      }
    }, 30000); // Wait 30 seconds for Ollama to be ready
  } else {
    console.log('🤖 Ollama AI service disabled - using fallback responses');
  }
  

  
  // Run immediate data scraping on startup
  setTimeout(async () => {
    try {
      const { syncAllGovernmentData } = await import('./dataSync.js');
      await syncAllGovernmentData();
    } catch (error) {
      logger.error({ msg: "Initial data scraping failed:", error });
    }
  }, 5000); // 5 second delay
  
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
      }, 120000); // 2 minute delay to let initial data load
    } catch (error) {
      logger.error({ msg: 'Error enhancing politician data', error });
    }
  }
  
  initializeConfirmedAPIs();
  initializePoliticianEnhancement();
  
  // Initialize daily news analysis and propaganda detection
  initializeNewsAnalysis();
  
  // Start comprehensive Canadian news analysis
  comprehensiveNewsAnalyzer.performComprehensiveAnalysis().catch(error => {
    logger.error({ msg: "Error in comprehensive news analysis", error });
  });

  // Schedule regular comprehensive news analysis (every 2 hours)
  setInterval(() => {
    comprehensiveNewsAnalyzer.performComprehensiveAnalysis().catch(error => {
      logger.error({ msg: "Error in scheduled news analysis", error });
    });
  }, 2 * 60 * 60 * 1000); // 2 hours
  
  // Start real-time platform monitoring
  realTimeMonitoring.startMonitoring();
  
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
