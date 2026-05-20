"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const AppError_1 = require("../utils/AppError");
const errorHandler = (err, req, res, next) => {
    let statusCode = 500;
    let message = 'Internal Server Error';
    if (err instanceof AppError_1.AppError) {
        statusCode = err.statusCode;
        message = err.message;
    }
    else {
        // Fallback for unknown errors
        console.error('ERROR 💥', err);
        message = err.message || message;
    }
    res.status(statusCode).json({
        error: message,
    });
};
exports.errorHandler = errorHandler;
