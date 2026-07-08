import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../prisma';
import { AppError } from '../utils/AppError';
import { catchAsync } from '../utils/catchAsync';

const defaultBoardColor = '#f43f5e';

export const getBoards = catchAsync(async (req: AuthRequest, res: Response) => {
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
                            },
                            assignees: {
                                include: {
                                    user: {
                                        select: {
                                            id: true,
                                            name: true,
                                            avatar: true
                                        }
                                    }
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
            members: { include: { user: { select: { id: true, name: true, email: true, avatar: true } } } },
            starredBy: {
                where: { userId: req.userId }
            }
        },
        orderBy: [
            { order: 'asc' },
            { createdAt: 'desc' }
        ]
    });

    const mappedBoards = boards.map(board => {
        const { starredBy, ...rest } = board;
        return {
            ...rest,
            isStarred: starredBy.length > 0
        };
    });

    mappedBoards.sort((a, b) => {
        if (a.isStarred && !b.isStarred) return -1;
        if (!a.isStarred && b.isStarred) return 1;

        if ((a.order ?? 0) !== (b.order ?? 0)) {
            return (a.order ?? 0) - (b.order ?? 0);
        }

        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    console.log(`[getBoards] User ${req.userId} found ${mappedBoards.length} boards`);
    res.json(mappedBoards);
});

export const createBoard = catchAsync(async (req: AuthRequest, res: Response) => {
    const { title, bgImage, bgColor, description } = req.body;

    if (!req.userId) throw new AppError('Unauthorized', 401);

    const board = await prisma.board.create({
        data: {
            title,
            bgImage,
            bgColor: bgColor || defaultBoardColor,
            description,
            ownerId: req.userId
        },
    });
    res.status(201).json(board);
});

export const updateBoard = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { title, bgImage, bgColor, description } = req.body;

    const board = await prisma.board.findUnique({ where: { id } });

    if (!board) throw new AppError('Board not found', 404);
    if (board.ownerId !== req.userId) throw new AppError('Access denied', 403);

    const updatedBoard = await prisma.board.update({
        where: { id },
        data: {
            title,
            bgImage,
            ...(bgColor ? { bgColor } : {}),
            description
        }
    });

    res.json(updatedBoard);
});

export const getBoardById = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

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
                            },
                            assignees: {
                                include: {
                                    user: {
                                        select: {
                                            id: true,
                                            name: true,
                                            avatar: true
                                        }
                                    }
                                }
                            },
                            checklists: {
                                include: {
                                    items: {
                                        select: { id: true, isDone: true }
                                    }
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
            members: { include: { user: { select: { id: true, name: true, email: true, avatar: true } } } },
            starredBy: {
                where: { userId: req.userId }
            }
        },
    });

    if (!board) throw new AppError('Board not found', 404);

    // Ownership or membership check
    const isMember = board.members.some((m: any) => m.userId === req.userId);
    if (board.ownerId !== req.userId && !isMember) {
        throw new AppError('Access denied', 403);
    }

    const isStarred = board.starredBy.length > 0;
    const { starredBy, ...rest } = board;

    res.json({ ...rest, isStarred });
});

export const deleteBoard = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    if (!req.userId) throw new AppError('Unauthorized', 401);

    const board = await prisma.board.findUnique({
        where: { id },
        include: { members: true }
    });

    if (!board) throw new AppError('Board not found', 404);

    if (board.ownerId === req.userId) {
        // Delete board (Owner)
        await prisma.board.delete({ where: { id } });
        return res.json({ message: 'Board deleted successfully', deleted: true });
    } else {
        // Leave board (Member)
        const membership = board.members.find((m: { id: string, userId: string }) => m.userId === req.userId);
        if (!membership) {
            throw new AppError('Access denied', 403);
        }

        await prisma.boardMember.delete({
            where: { id: membership.id }
        });
        return res.json({ message: 'Left board successfully', deleted: false });
    }
});

export const toggleStar = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    if (!req.userId) throw new AppError('Unauthorized', 401);

    const board = await prisma.board.findUnique({
        where: { id },
        include: { members: true }
    });

    if (!board) throw new AppError('Board not found', 404);

    // Access check: must be owner or member
    const isMember = board.members.some((m: { userId: string }) => m.userId === req.userId);
    if (board.ownerId !== req.userId && !isMember) {
        throw new AppError('Access denied', 403);
    }

    const existingStar = await prisma.starredBoard.findUnique({
        where: {
            userId_boardId: {
                userId: req.userId,
                boardId: id
            }
        }
    });

    if (existingStar) {
        await prisma.starredBoard.delete({
            where: {
                userId_boardId: {
                    userId: req.userId,
                    boardId: id
                }
            }
        });
        res.json({ ...board, isStarred: false });
    } else {
        await prisma.starredBoard.create({
            data: {
                userId: req.userId,
                boardId: id
            }
        });
        res.json({ ...board, isStarred: true });
    }
});

export const reorderBoards = catchAsync(async (req: AuthRequest, res: Response) => {
    const { boardIds } = req.body; // Array of { id: string, order: number }

    if (!req.userId) throw new AppError('Unauthorized', 401);

    await Promise.all(
        boardIds.map((item: { id: string, order: number }) =>
            prisma.board.update({
                where: { id: item.id },
                data: { order: item.order }
            })
        )
    );

    res.json({ message: 'Boards reordered successfully' });
});


