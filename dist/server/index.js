import express from "express";
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
const logger = pino();
const JWT_SECRET = process.env.SESSION_SECRET || "changeme";
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
    // Allow only trusted origins in production, '*' in development
    if (process.env.NODE_ENV === 'production') {
        if (isAllowed) {
            res.header("Access-Control-Allow-Origin", origin);
        }
        else {
            res.header("Access-Control-Allow-Origin", "https://civicos.ca");
        }
    }
    else {
        res.header("Access-Control-Allow-Origin", typeof origin === 'string' ? origin : '*');
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
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
    logger.error({ msg: 'Uncaught Exception thrown', err });
    process.exit(1);
});
(async () => {
    await registerRoutes(app);
    const { createServer } = await import("http");
    const server = createServer(app);
    app.use((err, _req, res, _next) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";
        logger.error({ msg: 'Express error handler', err });
        res.status(status).json({ message });
    });
    // Patch static file serving to use ESM-compatible __dirname
    const distPath = path.resolve(__dirname, "../client/dist/public");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
    });
    // ALWAYS serve the app on port 5000
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = 5000;
    server.listen(port, "0.0.0.0", () => {
        logger.info({ msg: `serving on port ${port}` });
        // Initialize automatic government data sync
        initializeDataSync();
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
                }, 120000); // 2 minute delay to let initial data load
            }
            catch (error) {
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
    });
})();
// Monitoring/health endpoint
app.get('/api/monitoring/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});
// Health check endpoint for Render monitoring
app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
});
// Admin session cleanup endpoint (admin only)
app.post('/api/admin/session/cleanup', jwtAuth, async (req, res) => {
    const user = req.user;
    if (!user || user.email !== process.env.ADMIN_EMAIL) {
        return res.status(403).json({ message: 'Forbidden' });
    }
    try {
        if (req.sessionStore && typeof req.sessionStore.clear === 'function') {
            await new Promise((resolve, reject) => req.sessionStore.clear((err) => err ? reject(err) : resolve(undefined)));
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
