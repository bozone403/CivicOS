import rateLimit from "express-rate-limit";
import pino from "pino";
const logger = pino();
// Unified rate limiting configuration
export const createRateLimit = (windowMs, max, message = 'Too many requests, please try again later.', skipSuccessfulRequests = false) => rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    handler: (req, res) => {
        logger.warn('Rate limit exceeded', {
            ip: req.ip,
            path: req.path,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString()
        });
        res.status(429).json({ error: message });
    },
    keyGenerator: (req) => {
        // Use user ID if authenticated, otherwise IP
        return req.user?.id || req.ip;
    }
});
// Specific rate limit configurations
export const authRateLimit = createRateLimit(15 * 60 * 1000, // 15 minutes
5, // 5 requests per window
'Too many authentication attempts, please try again later.', true // Skip successful requests
);
export const apiRateLimit = createRateLimit(15 * 60 * 1000, // 15 minutes
200, // 200 requests per window
'API rate limit exceeded, please try again later.');
export const socialRateLimit = createRateLimit(15 * 60 * 1000, // 15 minutes
100, // 100 requests per window
'Social feature rate limit exceeded, please try again later.');
export const votingRateLimit = createRateLimit(15 * 60 * 1000, // 15 minutes
50, // 50 requests per window
'Voting rate limit exceeded, please try again later.');
export const uploadRateLimit = createRateLimit(15 * 60 * 1000, // 15 minutes
10, // 10 uploads per window
'Upload rate limit exceeded, please try again later.');
// Admin rate limit (more permissive)
export const adminRateLimit = createRateLimit(15 * 60 * 1000, // 15 minutes
500, // 500 requests per window
'Admin rate limit exceeded, please try again later.');
// Development rate limit (very permissive)
export const devRateLimit = createRateLimit(15 * 60 * 1000, // 15 minutes
1000, // 1000 requests per window
'Development rate limit exceeded, please try again later.');
