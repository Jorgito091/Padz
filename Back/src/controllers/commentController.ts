import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../prisma';
import { AppError } from '../utils/AppError';
import { catchAsync } from '../utils/catchAsync';

export const createComment = catchAsync(async (req: AuthRequest, res: Response) => {
    const { cardId, text } = req.body;

    if (!req.userId) throw new AppError('Unauthorized', 401);

    const comment = await prisma.comment.create({
        data: {
            text,
            cardId,
            userId: req.userId
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    avatar: true
                }
            }
        }
    });

    res.status(201).json(comment);
});

export const getComments = catchAsync(async (req: AuthRequest, res: Response) => {
    const { cardId } = req.params;

    const comments = await prisma.comment.findMany({
        where: { cardId },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    avatar: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    res.json(comments);
});

export const deleteComment = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    if (!req.userId) throw new AppError('Unauthorized', 401);

    const comment = await prisma.comment.findUnique({
        where: { id },
        include: {
            card: {
                include: {
                    list: {
                        include: {
                            board: true
                        }
                    }
                }
            }
        }
    });

    if (!comment) throw new AppError('Comment not found', 404);

    // Only author OR board owner can delete
    const isAuthor = comment.userId === req.userId;
    const isBoardOwner = comment.card.list.board.ownerId === req.userId;

    if (!isAuthor && !isBoardOwner) {
        throw new AppError('Access denied', 403);
    }

    await prisma.comment.delete({
        where: { id }
    });

    res.json({ message: 'Comment deleted successfully' });
});
