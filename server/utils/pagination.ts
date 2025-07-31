export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class PaginationHelper {
  static validateParams(page: number, limit: number): PaginationParams {
    const validPage = Math.max(1, page);
    const validLimit = Math.min(Math.max(1, limit), 100); // Max 100 items per page
    
    return {
      page: validPage,
      limit: validLimit
    };
  }
  
  static calculateOffset(page: number, limit: number): number {
    return (page - 1) * limit;
  }
  
  static calculateTotalPages(total: number, limit: number): number {
    return Math.ceil(total / limit);
  }
  
  static createPaginationResult<T>(
    data: T[],
    total: number,
    page: number,
    limit: number
  ): PaginationResult<T> {
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