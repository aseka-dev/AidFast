/**
 * Centralized Error Classes for AidFast
 * Member 1: Platform & Tenant Security
 */

export class AppError extends Error {
    public readonly statusCode: number;
    public readonly status: 'fail' | 'error';
    public readonly isOperational: boolean;
    public readonly code?: string;
    public readonly details?: any;

    constructor(message: string, statusCode = 500, code?: string, details?: any) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        this.code = code;
        this.details = details;

        Error.captureStackTrace(this, this.constructor);
    }
}

export class BadRequestError extends AppError {
    constructor(message = 'Bad request', code = 'BAD_REQUEST', details?: any) {
        super(message, 400, code, details);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = 'Authentication required', code = 'UNAUTHORIZED', details?: any) {
        super(message, 401, code, details);
    }
}

export class ForbiddenError extends AppError {
    constructor(message = 'Access forbidden', code = 'FORBIDDEN', details?: any) {
        super(message, 403, code, details);
    }
}

export class TenantAccessError extends AppError {
    constructor(message = 'You cannot access another pharmacy', code = 'CROSS_PHARMACY_ACCESS_DENIED') {
        super(message, 403, code);
    }
}

export class NotFoundError extends AppError {
    constructor(message = 'Resource not found', code = 'NOT_FOUND', details?: any) {
        super(message, 404, code, details);
    }
}

export class ConflictError extends AppError {
    constructor(message = 'Resource conflict', code = 'CONFLICT', details?: any) {
        super(message, 409, code, details);
    }
}

export class ValidationError extends AppError {
    constructor(message = 'Validation failed', details?: any) {
        super(message, 400, 'VALIDATION_ERROR', details);
    }
}

