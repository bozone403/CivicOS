export class PaginationHelper {
    static validateParams(page, limit) {
        const validPage = Math.max(1, page);
        const validLimit = Math.min(Math.max(1, limit), 100); // Max 100 items per page
        return {
            page: validPage,
            limit: validLimit
        };
    }
    static calculateOffset(page, limit) {
        return (page - 1) * limit;
    }
    static calculateTotalPages(total, limit) {
        return Math.ceil(total / limit);
    }
    static createPaginationResult(data, total, page, limit) {
        const totalPages = this.calculateTotalPages(total, limit);
        return {
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        };
    }
}
