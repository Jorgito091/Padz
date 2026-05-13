import { Request, Response, NextFunction } from 'express';

// Wraps an async route handler so we don't need try/catch blocks everywhere
export const catchAsync = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        fn(req, res, next).catch(next);
    };
};
