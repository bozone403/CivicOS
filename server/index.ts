import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.ts";
import { serveStatic, log } from "./vite";
import { initializeDataSync } from "./dataSync";
import { initializeNewsAnalysis } from "./newsAnalyzer";
import { comprehensiveNewsAnalyzer } from "./comprehensiveNewsAnalyzer";
import { realTimeMonitoring } from "./realTimeMonitoring";
import { confirmedAPIs } from "./confirmedAPIs";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

const app = express();

// CORS configuration
app.use((req, res, next) => {
  const allowedOrigins = [
    "http://localhost:5173", // Vite dev server
    "http://localhost:3000", // Alternative dev port
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
  console.log(
    "CORS request from origin:",
    typeof origin === "string" ? origin : "undefined",
    "Regex match:",
    typeof origin === "string" ? civicosRegex.test(origin) : false,
    "Allowed:",
    isAllowed
  );

  // Allow only trusted origins in production, '*' in development
  if (process.env.NODE_ENV === 'production') {
    if (isAllowed) {
      res.header("Access-Control-Allow-Origin", origin);
    } else {
      res.header("Access-Control-Allow-Origin", "https://civicos.ca");
    }
  } else {
    res.header("Access-Control-Allow-Origin", typeof origin === 'string' ? origin : '*');
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

      log(logLine);
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
    'SESSION_SECRET',
    'REPLIT_DOMAINS',
    'REPL_ID',
    'ISSUER_URL',
    'STRIPE_SECRET_KEY',
    'OPENAI_API_KEY',
    'FRONTEND_BASE_URL',
  ];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error('Missing required environment variables:', missing.join(', '));
    process.exit(1);
  }
})();

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err);
  process.exit(1);
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    // Only import and use setupVite in development
    const { setupVite } = await import("./viteDevServer.js");
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    
    // Initialize automatic government data sync
    initializeDataSync();
    
    // Local authentication removed - using Replit Auth
    
    // Initialize confirmed government API data enhancement
    async function initializeConfirmedAPIs() {
      console.log("Initializing confirmed Canadian government APIs...");
      
      // Statistics Canada and Open Government API enhancement
      setInterval(async () => {
        try {
          await confirmedAPIs.enhanceDataWithConfirmedAPIs();
        } catch (error) {
          console.error("Government API enhancement error:", error);
        }
      }, 12 * 60 * 60 * 1000); // Every 12 hours
      
      // Initial enhancement
      setTimeout(() => {
        confirmedAPIs.enhanceDataWithConfirmedAPIs();
      }, 60000); // 1 minute delay to let scraping start first
    }
    
    // Initialize politician data enhancement
    async function initializePoliticianEnhancement() {
      console.log("Starting politician data enhancement...");
      try {
        const { politicianDataEnhancer } = await import('./politicianDataEnhancer');
        setTimeout(async () => {
          await politicianDataEnhancer.enhanceAllPoliticians();
          const stats = await politicianDataEnhancer.getEnhancementStats();
          console.log(`Politician enhancement completed: ${stats.withConstituency}/${stats.total} politicians now have constituency data (${stats.completionRate}%)`);
        }, 120000); // 2 minute delay to let initial data load
      } catch (error) {
        console.error('Error enhancing politician data:', error);
      }
    }
    
    initializeConfirmedAPIs();
    initializePoliticianEnhancement();
    
    // Initialize daily news analysis and propaganda detection
    initializeNewsAnalysis();
    
    // Start comprehensive Canadian news analysis
    console.log("Starting comprehensive Canadian news analysis system...");
    comprehensiveNewsAnalyzer.performComprehensiveAnalysis().catch(error => {
      console.error("Error in comprehensive news analysis:", error);
    });

    // Schedule regular comprehensive news analysis (every 2 hours)
    setInterval(() => {
      comprehensiveNewsAnalyzer.performComprehensiveAnalysis().catch(error => {
        console.error("Error in scheduled news analysis:", error);
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
  });
})();
