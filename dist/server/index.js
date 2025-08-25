import 'dotenv/config';
import express from "express";
import { sql } from 'drizzle-orm';
import { db } from './db.js';
import { registerRoutes } from "./appRoutes.js";
import { fileURLToPath } from 'url';
import path from "path";
import { initializeDataSync } from "./dataSync.js";
// import { initializeNewsAnalysis } from "./newsAnalyzer.js"; // Temporarily disabled
// import { comprehensiveNewsAnalyzer } from "./comprehensiveNewsAnalyzer.js"; // Temporarily disabled
import { realTimeMonitoring } from "./realTimeMonitoring.js";
import { confirmedAPIs } from "./confirmedAPIs.js";
import helmet from "helmet";
import pino from "pino";
import { existsSync, readdirSync, statSync } from 'fs';
import { jwtAuth } from "./routes/auth.js";
// Import middleware
import { authRateLimit, apiRateLimit, socialRateLimit, votingRateLimit } from './middleware/rateLimit.js';
import { requestLogger, errorLogger } from './middleware/logging.js';
// AI routes are mounted in registerRoutes()
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
// Enforce SESSION_SECRET: log and continue in mock mode to avoid instance crash
if (!process.env.SESSION_SECRET) {
    logger.warn({ msg: 'SESSION_SECRET missing; running with limited auth features' });
}
const JWT_SECRET = process.env.SESSION_SECRET || '';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// JWT authentication middleware is imported from auth.ts
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
    const origin = req.headers.origin;
    const envOrigin = process.env.CORS_ORIGIN;
    const frontendBase = process.env.FRONTEND_BASE_URL;
    const allowedOrigins = [
        'https://civicos.ca',
        'https://www.civicos.ca',
        'https://civicos.onrender.com',
        envOrigin,
        frontendBase,
    ].filter(Boolean);
    const civicosDomainRegex = /^https?:\/\/(.*\.)?civicos\.ca$/i;
    const isAllowed = Boolean(origin && (allowedOrigins.includes(origin) || civicosDomainRegex.test(origin)));
    if (isAllowed) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS')
        return res.sendStatus(200);
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
    const origin = req.headers.origin;
    const envOrigin = process.env.CORS_ORIGIN;
    const frontendBase = process.env.FRONTEND_BASE_URL;
    const allowedOrigins = [
        'https://civicos.ca',
        'https://www.civicos.ca',
        'https://civicos.onrender.com',
        envOrigin,
        frontendBase,
    ].filter(Boolean);
    const civicosDomainRegex = /^https?:\/\/(.*\.)?civicos\.ca$/i;
    const isAllowed = Boolean(origin && (allowedOrigins.includes(origin) || civicosDomainRegex.test(origin)));
    if (isAllowed) {
        res.setHeader('Access-Control-Allow-Origin', origin);
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
// Temporarily disable CSP to eliminate potential blocking of module scripts
app.use(helmet({ contentSecurityPolicy: false }));
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
// AI routes mounted within registerRoutes()
// Register all API routes before static serving and SPA fallback
(async () => {
    await registerRoutes(app);
    const { createServer } = await import("http");
    const httpServer = createServer(app);
    // Global error handler (must be before static serving and SPA fallback)
    app.use(errorLogger);
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
    // Try multiple likely locations and pick the first that exists
    const staticRootCandidates = [
        // When running from project root
        path.resolve(process.cwd(), "dist/public"),
        // When resolving relative to compiled server file at dist/server/index.js → dist/public
        path.resolve(__dirname, "../public"),
        // Fallback patterns
        path.resolve(__dirname, "../../dist/public"),
        "/opt/render/project/src/dist/public",
    ];
    let staticRoot = staticRootCandidates.find((p) => {
        try {
            return existsSync(p);
        }
        catch {
            return false;
        }
    }) || path.resolve(process.cwd(), "dist/public");
    // Serve built index.html as-is for root
    app.get('/', (_req, res) => {
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('Content-Type', 'text/html; charset=UTF-8');
        return res.sendFile(path.join(staticRoot, 'index.html'));
    });
    // Compatibility: map stale hashed entry requests to current built assets
    const assetsDir = path.join(staticRoot, 'assets');
    function findLatestAsset(prefix, ext) {
        try {
            const files = readdirSync(assetsDir).filter(f => f.startsWith(prefix) && f.endsWith(ext));
            if (files.length === 0)
                return null;
            // Pick the most recently modified
            const sorted = files.sort((a, b) => statSync(path.join(assetsDir, b)).mtimeMs - statSync(path.join(assetsDir, a)).mtimeMs);
            return path.join(assetsDir, sorted[0]);
        }
        catch {
            return null;
        }
    }
    // Intercept any /assets/index-*.js|css and serve latest to avoid 404 from static handler
    app.use('/assets', (req, res, next) => {
        try {
            if (req.path.startsWith('/index-') && (req.path.endsWith('.js') || req.path.endsWith('.css'))) {
                const isJs = req.path.endsWith('.js');
                const latest = findLatestAsset('index-', isJs ? '.js' : '.css');
                if (latest) {
                    res.setHeader('Cache-Control', 'no-store');
                    res.setHeader('Content-Type', isJs ? 'application/javascript; charset=UTF-8' : 'text/css; charset=UTF-8');
                    return res.sendFile(latest);
                }
            }
        }
        catch { }
        return next();
    });
    // Serve old hashed entry requests with the latest built asset
    app.get(/^\/assets\/index-.*\.js$/, (req, res, next) => {
        const latest = findLatestAsset('index-', '.js');
        if (latest) {
            res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
            res.setHeader('Cache-Control', 'no-store');
            return res.sendFile(latest);
        }
        return next();
    });
    app.get(/^\/assets\/index-.*\.css$/, (req, res, next) => {
        const latest = findLatestAsset('index-', '.css');
        if (latest) {
            res.setHeader('Content-Type', 'text/css; charset=UTF-8');
            res.setHeader('Cache-Control', 'no-store');
            return res.sendFile(latest);
        }
        return next();
    });
    app.get('/assets/index-:hash.js', (req, res, next) => {
        const requested = path.join(assetsDir, `index-${req.params.hash}.js`);
        if (existsSync(requested))
            return next();
        const latest = findLatestAsset('index-', '.js');
        if (latest) {
            res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
            res.setHeader('Cache-Control', 'no-store');
            return res.sendFile(latest);
        }
        return next();
    });
    app.get('/assets/index-:hash.css', (req, res, next) => {
        const requested = path.join(assetsDir, `index-${req.params.hash}.css`);
        if (existsSync(requested))
            return next();
        const latest = findLatestAsset('index-', '.css');
        if (latest) {
            res.setHeader('Content-Type', 'text/css; charset=UTF-8');
            res.setHeader('Cache-Control', 'no-store');
            return res.sendFile(latest);
        }
        return next();
    });
    app.use('/assets', express.static(path.join(staticRoot, 'assets'), {
        setHeaders: (res, filePath) => {
            if (filePath.endsWith('.css')) {
                res.setHeader('Content-Type', 'text/css; charset=UTF-8');
            }
            else if (filePath.endsWith('.js')) {
                res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
            }
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
    }));
    // Stable aliases to the latest entry assets
    app.get('/assets/index.js', (req, res, next) => {
        const latest = findLatestAsset('index-', '.js');
        if (latest) {
            res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
            res.setHeader('Cache-Control', 'no-store');
            return res.sendFile(latest);
        }
        return next();
    });
    app.get('/assets/index.css', (req, res, next) => {
        const latest = findLatestAsset('index-', '.css');
        if (latest) {
            res.setHeader('Content-Type', 'text/css; charset=UTF-8');
            res.setHeader('Cache-Control', 'no-store');
            return res.sendFile(latest);
        }
        return next();
    });
    app.use(express.static(staticRoot, {
        setHeaders: (res, filePath) => {
            const isIndex = filePath.endsWith('index.html');
            if (isIndex) {
                res.setHeader('Cache-Control', 'no-store');
            }
            else if (/\/assets\//.test(filePath)) {
                res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            }
            else {
                res.setHeader('Cache-Control', 'public, max-age=3600');
            }
        }
    }));
    // SPA fallback: serve built index.html as-is for all non-API and non-asset routes
    app.get(/^\/(?!api\/|assets\/).*/, (_req, res) => {
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('Content-Type', 'text/html; charset=UTF-8');
        return res.sendFile(path.join(staticRoot, 'index.html'));
    });
    // If an /assets/* file was not served by express.static above, return 404 instead of HTML
    app.use('/assets', (_req, res) => {
        res.status(404).type('text/plain').send('Not found');
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
            const migrateModule = await import('./migrate.js');
            await migrateModule.runMigrations();
            logger.info({ msg: "Database migrations completed successfully" });
        }
        catch (error) {
            logger.error({ msg: "Failed to run database migrations", error });
        }
    }, 5000); // Run migrations 5 seconds after server starts
    // Schema drift guard: ensure critical columns/indexes exist in live DB
    setTimeout(async () => {
        try {
            await db.execute(sql `DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'politicians' AND column_name = 'parliament_member_id'
        ) THEN
          ALTER TABLE politicians ADD COLUMN parliament_member_id text;
        END IF;
      END $$;`);
            await db.execute(sql `CREATE UNIQUE INDEX IF NOT EXISTS idx_politicians_parliament_member_id 
        ON politicians(parliament_member_id) WHERE parliament_member_id IS NOT NULL;`);
            logger.info({ msg: 'Schema guard: ensured politicians.parliament_member_id exists' });
        }
        catch (error) {
            logger.error({ msg: 'Schema guard failed', error: error instanceof Error ? error.message : String(error) });
        }
    }, 8000);
    // Initialize automatic government data sync (non-blocking) if enabled
    if (process.env.DATA_SYNC_ENABLED === 'true') {
        setTimeout(() => {
            try {
                initializeDataSync();
            }
            catch (error) {
                logger.error({ msg: "Failed to initialize data sync", error });
            }
        }, 30000);
    }
    else {
        logger.info({ msg: "Data sync disabled by env (DATA_SYNC_ENABLED != 'true')" });
    }
    // Initialize Ollama AI service for production (enhanced with robust error handling)
    if (process.env.NODE_ENV === 'production' && process.env.OLLAMA_ENABLED === 'true' && process.env.AI_SERVICE_ENABLED === 'true') {
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
    // Run admin permission bootstrap (non-blocking)
    setTimeout(async () => {
        try {
            const adminEmail = process.env.ADMIN_EMAIL;
            if (!adminEmail)
                return;
            const { db } = await import('./db.js');
            const { users, userPermissions, permissions } = await import('../shared/schema.js');
            const { eq } = await import('drizzle-orm');
            const [admin] = await db.select().from(users).where(eq(users.email, adminEmail)).limit(1);
            if (admin) {
                const ensurePermission = async (name) => {
                    const [perm] = await db.select().from(permissions).where(eq(permissions.name, name)).limit(1);
                    if (!perm) {
                        const [created] = await db.insert(permissions).values({ name, description: name, isActive: true }).returning();
                        return created.id;
                    }
                    return perm.id;
                };
                const p1 = await ensurePermission('admin.identity.review');
                const p2 = await ensurePermission('admin.news.manage');
                await db.insert(userPermissions).values({ userId: admin.id, permissionId: p1, permissionName: 'admin.identity.review', isGranted: true }).catch(() => undefined);
                await db.insert(userPermissions).values({ userId: admin.id, permissionId: p2, permissionName: 'admin.news.manage', isGranted: true }).catch(() => undefined);
            }
        }
        catch { }
    }, 10000);
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
    // Start real-time platform monitoring if enabled
    if (process.env.MONITORING_ENABLED === 'true') {
        setTimeout(() => {
            try {
                realTimeMonitoring.startMonitoring();
            }
            catch (error) {
                logger.error({ msg: "Failed to start real-time monitoring", error });
            }
        }, 45000);
    }
    else {
        logger.info({ msg: "Real-time monitoring disabled by env (MONITORING_ENABLED != 'true')" });
    }
    // Schedule nightly incumbents refresh at ~03:30 UTC
    setInterval(async () => {
        try {
            const { ingestProvincialIncumbents, ingestMunicipalIncumbents } = await import('./utils/provincialMunicipalIngestion.js');
            await ingestProvincialIncumbents();
            await ingestMunicipalIncumbents();
            logger.info({ msg: 'Nightly incumbents refresh completed' });
        }
        catch (error) {
            logger.error({ msg: 'Nightly incumbents refresh failed', error: error instanceof Error ? error.message : String(error) });
        }
    }, 24 * 60 * 60 * 1000);
    // Weekly legal refresh (Justice Laws scrapes) ~7 days
    setInterval(async () => {
        try {
            const { legalIngestionService } = await import('./utils/legalIngestion.js');
            const acts = await legalIngestionService.ingestFederalActs();
            const cc = await legalIngestionService.ingestCriminalCode();
            logger.info({ msg: 'Weekly legal refresh completed', acts, cc });
        }
        catch (error) {
            logger.error({ msg: 'Weekly legal refresh failed', error: error instanceof Error ? error.message : String(error) });
        }
    }, 7 * 24 * 60 * 60 * 1000);
    // One-time automatic ingestion after boot if DB is empty (opt-in)
    if (process.env.AUTO_INGEST_ON_START === 'true') {
        setTimeout(async () => {
            try {
                const { db } = await import('./db.js');
                const { count } = await import('drizzle-orm');
                const { users, politicians, legalActs, legalCases } = await import('../shared/schema.js');
                const polRows = await db.select({ c: count() }).from(politicians);
                const polCount = Number(polRows[0]?.c || 0);
                const actRows = await db.select({ c: count() }).from(legalActs);
                const actsCount = Number(actRows[0]?.c || 0);
                const caseRows = await db.select({ c: count() }).from(legalCases);
                const casesCount = Number(caseRows[0]?.c || 0);
                const needsOfficials = polCount < 50;
                const needsLegal = actsCount < 50 || casesCount < 1;
                if (needsOfficials) {
                    try {
                        const { ingestParliamentMembers, ingestBillRollcallsForCurrentSession } = await import('./utils/parliamentIngestion.js');
                        const { syncIncumbentPoliticiansFromParliament } = await import('./utils/politicianSync.js');
                        await ingestParliamentMembers();
                        await syncIncumbentPoliticiansFromParliament();
                        await ingestBillRollcallsForCurrentSession();
                        const { ingestProvincialIncumbents, ingestMunicipalIncumbents } = await import('./utils/provincialMunicipalIngestion.js');
                        await ingestProvincialIncumbents();
                        await ingestMunicipalIncumbents();
                        logger.info({ msg: 'Initial officials ingestion completed' });
                    }
                    catch (error) {
                        logger.error({ msg: 'Initial officials ingestion failed', error: error instanceof Error ? error.message : String(error) });
                    }
                }
                if (needsLegal) {
                    try {
                        const { legalIngestionService } = await import('./utils/legalIngestion.js');
                        await legalIngestionService.ingestFederalActs();
                        await legalIngestionService.ingestCriminalCode();
                        logger.info({ msg: 'Initial legal ingestion completed' });
                    }
                    catch (error) {
                        logger.error({ msg: 'Initial legal ingestion failed', error: error instanceof Error ? error.message : String(error) });
                    }
                }
            }
            catch (error) {
                logger.error({ msg: 'AUTO_INGEST_ON_START failed', error: error instanceof Error ? error.message : String(error) });
            }
        }, 15000);
    }
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
// Identity verification routes are now registered in appRoutes
export { app };
