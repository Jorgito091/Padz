"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNotification = exports.markAsRead = exports.getNotifications = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const catchAsync_1 = require("../utils/catchAsync");
const AppError_1 = require("../utils/AppError");
exports.getNotifications = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const notifications = await prisma_1.default.notification.findMany({
        where: { userId: req.userId },
        orderBy: { createdAt: 'desc' },
        take: 50
    });
    res.json(notifications);
});
exports.markAsRead = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    const notification = await prisma_1.default.notification.findUnique({
        where: { id }
    });
    if (!notification)
        throw new AppError_1.AppError('Notification not found', 404);
    if (notification.userId !== req.userId)
        throw new AppError_1.AppError('Access denied', 403);
    const updated = await prisma_1.default.notification.update({
        where: { id },
        data: { read: true }
    });
    res.json(updated);
});
exports.deleteNotification = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    const notification = await prisma_1.default.notification.findUnique({
        where: { id }
    });
    if (!notification)
        throw new AppError_1.AppError('Notification not found', 404);
    if (notification.userId !== req.userId)
        throw new AppError_1.AppError('Access denied', 403);
    await prisma_1.default.notification.delete({
        where: { id }
    });
    res.status(204).send();
});
