import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../prisma';

export const createComment = async (req: AuthRequest, res: Response) => {
    const { cardId, text } = req.body;

    try {
        if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

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
    } catch (error) {
        res.status(500).json({ error: 'Error creating comment' });
    }
};

export const getComments = async (req: AuthRequest, res: Response) => {
    const { cardId } = req.params;

    try {
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
    } catch (error) {
        res.status(500).json({ error: 'Error fetching comments' });
    }
};

export const deleteComment = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    try {
        if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

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

        if (!comment) return res.status(404).json({ error: 'Comment not found' });

        // Only author OR board owner can delete
        const isAuthor = comment.userId === req.userId;
        const isBoardOwner = comment.card.list.board.ownerId === req.userId;

        if (!isAuthor && !isBoardOwner) {
            return res.status(403).json({ error: 'Access denied' });
        }

        await prisma.comment.delete({
            where: { id }
        });

        res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting comment' });
    }
};
