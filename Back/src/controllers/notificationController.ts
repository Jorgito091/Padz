import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../prisma';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';

export const getNotifications = catchAsync(async (req: AuthRequest, res: Response) => {
    const notifications = await prisma.notification.findMany({
        where: { userId: req.userId },
        orderBy: { createdAt: 'desc' },
        take: 50
    });
    res.json(notifications);
});

export const markAsRead = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const notification = await prisma.notification.findUnique({
        where: { id }
    });

    if (!notification) throw new AppError('Notification not found', 404);
    if (notification.userId !== req.userId) throw new AppError('Access denied', 403);

    const updated = await prisma.notification.update({
        where: { id },
        data: { read: true }
    });

    res.json(updated);
});

export const deleteNotification = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const notification = await prisma.notification.findUnique({
        where: { id }
    });

    if (!notification) throw new AppError('Notification not found', 404);
    if (notification.userId !== req.userId) throw new AppError('Access denied', 403);

    await prisma.notification.delete({
        where: { id }
    });

    res.status(204).send();
});
