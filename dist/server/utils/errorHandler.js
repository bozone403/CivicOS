export class ErrorHandler {
    static handle(error) {
        if (error instanceof Error) {
            return {
                message: error.message,
                code: error.name,
                statusCode: 500
            };
        }
        if (typeof error === 'string') {
            return {
                message: error,
                statusCode: 500
            };
        }
        return {
            message: 'An unexpected error occurred',
            statusCode: 500
        };
    }
    static sendError(res, error, statusCode = 500) {
        const apiError = this.handle(error);
        res.status(statusCode).json({
            success: false,
            error: apiError.message,
            code: apiError.code,
            timestamp: new Date().toISOString()
        });
    }
    static sendValidationError(res, message, details) {
        res.status(400).json({
            success: false,
            error: message,
            details,
            timestamp: new Date().toISOString()
        });
    }
    static sendNotFound(res, message = 'Resource not found') {
        res.status(404).json({
            success: false,
            error: message,
            timestamp: new Date().toISOString()
        });
    }
    static sendUnauthorized(res, message = 'Unauthorized') {
        res.status(401).json({
            success: false,
            error: message,
            timestamp: new Date().toISOString()
        });
    }
    static sendForbidden(res, message = 'Forbidden') {
        res.status(403).json({
            success: false,
            error: message,
            timestamp: new Date().toISOString()
        });
    }
}
