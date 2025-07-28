import express from "express";
import { registerRoutes } from "./appRoutes.js";
import { fileURLToPath } from 'url';
import path from "path";
import { initializeDataSync } from "./dataSync.js";
// import { initializeNewsAnalysis } from "./newsAnalyzer.js"; // Temporarily disabled
// import { comprehensiveNewsAnalyzer } from "./comprehensiveNewsAnalyzer.js"; // Temporarily disabled
import { realTimeMonitoring } from "./realTimeMonitoring.js";
import { confirmedAPIs } from "./confirmedAPIs.js";
import helmet from "helmet";
import jwt from "jsonwebtoken";
import pino from "pino";
// Import AI routes (updated)
import aiRoutes from './routes/ai.js';
// Security configuration - production-safe
if (process.env.NODE_ENV === 'development') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    console.warn('[SECURITY] SSL verification disabled in development mode');
}
else {
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
function jwtAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Missing or invalid token" });
    }
    try {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (err) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
}
const app = express();
app.set('trust proxy', 1); // Trust first proxy (Render, Heroku, etc.)
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
    // Debug CORS requests
    if (req.path.startsWith('/api/auth/')) {
        console.log('[CORS Debug]', {
            origin,
            isAllowed,
            path: req.path,
            method: req.method
        });
    }
    // Allow only trusted origins in production, strict in development
    if (process.env.NODE_ENV === 'production') {
        if (isAllowed) {
            res.header("Access-Control-Allow-Origin", origin);
        }
        else {
            res.header("Access-Control-Allow-Origin", "https://civicos.ca");
        }
    }
    else {
        // Development: allow civicos.ca for testing
        res.header("Access-Control-Allow-Origin", "https://civicos.ca");
    }
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header("Access-Control-Allow-Credentials", "true");
    if (req.method === "OPTIONS") {
        res.sendStatus(200);
    }
    else {
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
    let capturedJsonResponse = undefined;
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
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https://images.unsplash.com", "https://*.unsplash.com"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
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
app.use((error, req, res, next) => {
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
    }
    catch (error) {
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
// Mount updated AI routes
app.use('/api/ai', aiRoutes);
// Register all API routes before static serving and SPA fallback
(async () => {
    await registerRoutes(app);
    const { createServer } = await import("http");
    const httpServer = createServer(app);
    // Global error handler (must be before static serving and SPA fallback)
    app.use((err, req, res, _next) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";
        // console.error removed for production
        if (req.path && req.path.startsWith("/api/")) {
            res.status(status).json({ message });
        }
        else {
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
        }
        catch (error) {
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
                }
                else if (!health.model) {
                    logger.info({ msg: "Ollama service available but model missing - attempting initialization" });
                    // Try to initialize model in background
                    const initSuccess = await manager.initialize();
                    if (initSuccess) {
                        logger.info({ msg: "✅ Ollama and Mistral model successfully initialized" });
                    }
                    else {
                        logger.warn({ msg: "⚠️ Ollama initialization failed - using fallback responses" });
                    }
                }
                else {
                    logger.info({ msg: "✅ Ollama service and model are both ready" });
                }
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                logger.error({ msg: "Error during Ollama initialization", error: errorMessage });
            }
        }, 45000); // Increased delay to let Ollama binary start properly
    }
    // Run immediate data scraping on startup - NON-BLOCKING with longer delay
    setTimeout(async () => {
        try {
            const { syncAllGovernmentData } = await import('./dataSync.js');
            // Run data sync in background without blocking server startup
            syncAllGovernmentData().catch(error => {
                logger.error({ msg: "Background data scraping failed:", error });
            });
        }
        catch (error) {
            logger.error({ msg: "Failed to import data sync module:", error });
        }
    }, 120000); // Increased to 2 minutes delay to ensure server is fully started
    // Initialize confirmed government API data enhancement
    async function initializeConfirmedAPIs() {
        // Statistics Canada and Open Government API enhancement
        setInterval(async () => {
            try {
                await confirmedAPIs.enhanceDataWithConfirmedAPIs();
            }
            catch (error) {
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
        }
        catch (error) {
            logger.error({ msg: 'Error enhancing politician data', error });
        }
    }
    // Initialize daily news analysis and propaganda detection with better error handling
    try {
        setTimeout(() => {
            try {
                // initializeNewsAnalysis(); // Temporarily disabled
            }
            catch (error) {
                logger.error({ msg: "Failed to initialize news analysis", error });
            }
        }, 90000); // Delay news analysis by 90 seconds
    }
    catch (error) {
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
        }
        catch (error) {
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
    const user = req.user;
    if (!user || user.email !== process.env.ADMIN_EMAIL) {
        return res.status(403).json({ message: 'Forbidden' });
    }
    try {
        const reqWithSession = req;
        if (reqWithSession.sessionStore && typeof reqWithSession.sessionStore.clear === 'function') {
            await new Promise((resolve, reject) => reqWithSession.sessionStore.clear((err) => err ? reject(err) : resolve(undefined)));
            res.json({ message: 'All sessions cleared' });
        }
        else {
            res.status(500).json({ message: 'Session store does not support cleanup' });
        }
    }
    catch (error) {
        logger.error({ msg: 'Error clearing sessions', error });
        res.status(500).json({ message: 'Failed to clear sessions' });
    }
});
app.get("/api/admin/identity-review", jwtAuth, async (req, res) => {
    const user = req.user;
    if (!user || user.email !== process.env.ADMIN_EMAIL) {
        return res.status(403).json({ message: 'Forbidden' });
    }
    // Admin identity review endpoint
    res.json({ message: "Admin endpoint" });
});
export { app };
