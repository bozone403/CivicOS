import rateLimit from 'express-rate-limit';
// Basic rate limiter for all routes
export const basicRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Too many requests from this IP, please try again later.',
            retryAfter: '15 minutes'
        });
    }
});
// Stricter rate limiter for authentication routes
export const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 auth requests per windowMs
    message: {
        error: 'Too many authentication attempts from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Too many authentication attempts from this IP, please try again later.',
            retryAfter: '15 minutes'
        });
    }
});
// Rate limiter for API endpoints
export const apiRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Limit each IP to 200 API requests per windowMs
    message: {
        error: 'Too many API requests from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Too many API requests from this IP, please try again later.',
            retryAfter: '15 minutes'
        });
    }
});
// Rate limiter for voting endpoints
export const votingRateLimit = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 voting requests per hour
    message: {
        error: 'Too many voting attempts from this IP, please try again later.',
        retryAfter: '1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Too many voting attempts from this IP, please try again later.',
            retryAfter: '1 hour'
        });
    }
});
// Rate limiter for posting content
export const postingRateLimit = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // Limit each IP to 20 posts per hour
    message: {
        error: 'Too many posts from this IP, please try again later.',
        retryAfter: '1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Too many posts from this IP, please try again later.',
            retryAfter: '1 hour'
        });
    }
});
// Dynamic rate limiter based on user authentication
export const dynamicRateLimit = (req, res, next) => {
    const isAuthenticated = req.headers.authorization && req.headers.authorization.startsWith('Bearer ');
    if (isAuthenticated) {
        // Authenticated users get higher limits
        return rateLimit({
            windowMs: 15 * 60 * 1000,
            max: 500,
            message: {
                error: 'Too many requests, please try again later.',
                retryAfter: '15 minutes'
            }
        })(req, res, next);
    }
    else {
        // Unauthenticated users get lower limits
        return rateLimit({
            windowMs: 15 * 60 * 1000,
            max: 50,
            message: {
                error: 'Too many requests, please try again later.',
                retryAfter: '15 minutes'
            }
        })(req, res, next);
    }
};
