export class ResponseFormatter {
    static version = "1.0.0";
    static success(res, data, message = "Success", statusCode = 200, count, pagination, processingTime) {
        const response = {
            success: true,
            data,
            message,
            timestamp: new Date().toISOString(),
            count,
            pagination,
            metadata: {
                version: this.version,
                endpoint: res.req.path,
                processingTime
            }
        };
        return res.status(statusCode).json(response);
    }
    static error(res, message, statusCode = 500, errorCode = "INTERNAL_ERROR", details) {
        const response = {
            success: false,
            error: {
                code: errorCode,
                message,
                details
            },
            timestamp: new Date().toISOString(),
            metadata: {
                version: this.version,
                endpoint: res.req.path
            }
        };
        return res.status(statusCode).json(response);
    }
    static notFound(res, message = "Resource not found") {
        return this.error(res, message, 404, "NOT_FOUND");
    }
    static unauthorized(res, message = "Unauthorized") {
        return this.error(res, message, 401, "UNAUTHORIZED");
    }
    static forbidden(res, message = "Forbidden") {
        return this.error(res, message, 403, "FORBIDDEN");
    }
    static badRequest(res, message = "Bad request", details) {
        return this.error(res, message, 400, "BAD_REQUEST", details);
    }
    static validationError(res, message = "Validation failed", details) {
        return this.error(res, message, 422, "VALIDATION_ERROR", details);
    }
    static databaseError(res, message = "Database error") {
        return this.error(res, message, 500, "DATABASE_ERROR");
    }
    static rateLimitError(res, message = "Rate limit exceeded") {
        return this.error(res, message, 429, "RATE_LIMIT_EXCEEDED");
    }
}
