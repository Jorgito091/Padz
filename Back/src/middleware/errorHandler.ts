import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

export const errorHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    let statusCode = 500;
    let message = 'Internal Server Error';

    if (err instanceof AppError) {
        statusCode = err.statusCode;
        message = err.message;
    } else {
        // Fallback for unknown errors
        console.error('ERROR 💥', err);
        message = err.message || message;
    }

    res.status(statusCode).json({
        error: message,
    });
};
