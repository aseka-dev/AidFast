import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';

/**
 * Centralized Error Handling Middleware for AidFast
 * Member 1: Platform & Tenant Security
 */
export const errorHandler = (
    err: any,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal server error';
    let code = err.code || (statusCode >= 500 ? 'INTERNAL_SERVER_ERROR' : 'ERROR');
    let details = err.details || undefined;

    // 1. Express / Body-Parser SyntaxError (malformed JSON in request payload)
    if (err instanceof SyntaxError && 'body' in err && (err as any).status === 400) {
        statusCode = 400;
        message = 'Invalid JSON in request payload';
        code = 'INVALID_JSON';
    }

    // 2. Mongoose CastError (e.g. malformed ObjectId passed in URL params or body)
    if (err.name === 'CastError') {
        statusCode = 400;
        message = `Invalid identifier format for field '${err.path}': ${err.value}`;
        code = 'INVALID_ID_FORMAT';
    }

    // 3. Mongoose Schema ValidationError
    if (err.name === 'ValidationError' && err.errors) {
        statusCode = 400;
        const messages = Object.values(err.errors).map((e: any) => e.message);
        message = `Validation failed: ${messages.join(', ')}`;
        code = 'VALIDATION_ERROR';
        details = messages;
    }

    // 4. Mongoose Duplicate Key Error (E11000)
    if (err.code === 11000) {
        statusCode = 409;
        const keys = Object.keys(err.keyValue || {});
        message = `Duplicate value for unique field: ${keys.join(', ')}`;
        code = 'DUPLICATE_KEY_ERROR';
        details = err.keyValue;
    }

    // 5. JWT Authentication Errors
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid or corrupted authentication token';
        code = 'INVALID_TOKEN';
    }

    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Authentication token has expired. Please log in again';
        code = 'TOKEN_EXPIRED';
    }

    // Non-operational or unexpected errors log in server logs
    if (statusCode >= 500 && process.env.NODE_ENV !== 'test') {
        console.error('Unhandled Application Error:', err);
    }

    const payload: {
        success: false;
        message: string;
        code?: string;
        details?: any;
        stack?: string;
    } = {
        success: false,
        message,
        code,
        ...(details ? { details } : {})
    };

    if (process.env.NODE_ENV === 'development') {
        payload.stack = err.stack;
    }

    res.status(statusCode).json(payload);
};

export default errorHandler;

