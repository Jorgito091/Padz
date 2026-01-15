import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../prisma';

export const getBoards = async (req: AuthRequest, res: Response) => {
    try {
        const boards = await prisma.board.findMany({
            where: {
                OR: [
                    { ownerId: req.userId },
                    { members: { some: { userId: req.userId } } }
                ]
            },
            include: {
                lists: {
                    include: {
                        cards: {
                            include: {
                                labels: {
                                    include: {
                                        label: true
                                    }
                                }
                            },
                            orderBy: { order: 'asc' }
                        }
                    },
                    orderBy: { order: 'asc' }
                },
                labels: true,
                owner: { select: { name: true, avatar: true } },
                members: { include: { user: { select: { id: true, name: true, avatar: true } } } }
            },
            orderBy: [
                { isStarred: 'desc' },
                { order: 'asc' },
                { createdAt: 'desc' }
            ]
        });
        console.log(`[getBoards] User ${req.userId} found ${boards.length} boards`);
        res.json(boards);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching boards' });
    }
};

export const createBoard = async (req: AuthRequest, res: Response) => {
    const { title, bgImage, bgColor, description } = req.body;
    try {
        if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

        const board = await prisma.board.create({
            data: {
                title,
                bgImage,
                bgColor,
                description,
                ownerId: req.userId
            },
        });
        res.status(201).json(board);
    } catch (error) {
        res.status(500).json({ error: 'Error creating board' });
    }
};

export const updateBoard = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { title, bgImage, bgColor, description } = req.body;

    try {
        const board = await prisma.board.findUnique({ where: { id } });

        if (!board) return res.status(404).json({ error: 'Board not found' });
        if (board.ownerId !== req.userId) return res.status(403).json({ error: 'Access denied' });

        const updatedBoard = await prisma.board.update({
            where: { id },
            data: {
                title,
                bgImage,
                bgColor,
                description
            }
        });

        res.json(updatedBoard);
    } catch (error) {
        res.status(500).json({ error: 'Error updating board' });
    }
};

export const getBoardById = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    try {
        const board = await prisma.board.findUnique({
            where: { id },
            include: {
                lists: {
                    include: {
                        cards: {
                            include: {
                                labels: {
                                    include: {
                                        label: true
                                    }
                                }
                            },
                            orderBy: { order: 'asc' }
                        }
                    },
                    orderBy: { order: 'asc' }
                },
                labels: true,
                owner: { select: { name: true, avatar: true } },
                members: { include: { user: { select: { id: true, name: true, avatar: true } } } }
            },
        });

        if (!board) return res.status(404).json({ error: 'Board not found' });

        // Ownership or membership check
        const isMember = board.members.some((m: any) => m.userId === req.userId);
        if (board.ownerId !== req.userId && !isMember) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json(board);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching board' });
    }
};

export const deleteBoard = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    try {
        if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

        const board = await prisma.board.findUnique({
            where: { id },
            include: { members: true }
        });

        if (!board) return res.status(404).json({ error: 'Board not found' });

        if (board.ownerId === req.userId) {
            // Delete board (Owner)
            await prisma.board.delete({ where: { id } });
            return res.json({ message: 'Board deleted successfully', deleted: true });
        } else {
            // Leave board (Member)
            const membership = board.members.find((m: { id: string, userId: string }) => m.userId === req.userId);
            if (!membership) {
                return res.status(403).json({ error: 'Access denied' });
            }

            await prisma.boardMember.delete({
                where: { id: membership.id }
            });
            return res.json({ message: 'Left board successfully', deleted: false });
        }
    } catch (error) {
        console.error('Error deleting/leaving board:', error);
        res.status(500).json({ error: 'Error processing request' });
    }
};

export const toggleStar = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    try {
        if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

        const board = await prisma.board.findUnique({
            where: { id },
            include: { members: true }
        });

        if (!board) return res.status(404).json({ error: 'Board not found' });

        // Access check: must be owner or member
        const isMember = board.members.some((m: { userId: string }) => m.userId === req.userId);
        if (board.ownerId !== req.userId && !isMember) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const updatedBoard = await prisma.board.update({
            where: { id },
            data: { isStarred: !board.isStarred }
        });

        res.json(updatedBoard);
    } catch (error) {
        res.status(500).json({ error: 'Error toggling star' });
    }
};

export const reorderBoards = async (req: AuthRequest, res: Response) => {
    const { boardIds } = req.body; // Array of { id: string, order: number }
    try {
        if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

        await Promise.all(
            boardIds.map((item: { id: string, order: number }) =>
                prisma.board.update({
                    where: { id: item.id },
                    data: { order: item.order }
                })
            )
        );

        res.json({ message: 'Boards reordered successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error reordering boards' });
    }
};


