"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reorderBoards = exports.toggleStar = exports.deleteBoard = exports.getBoardById = exports.updateBoard = exports.createBoard = exports.getBoards = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const AppError_1 = require("../utils/AppError");
const catchAsync_1 = require("../utils/catchAsync");
exports.getBoards = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const boards = await prisma_1.default.board.findMany({
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
        if (a.isStarred && !b.isStarred)
            return -1;
        if (!a.isStarred && b.isStarred)
            return 1;
        if ((a.order ?? 0) !== (b.order ?? 0)) {
            return (a.order ?? 0) - (b.order ?? 0);
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    console.log(`[getBoards] User ${req.userId} found ${mappedBoards.length} boards`);
    res.json(mappedBoards);
});
exports.createBoard = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { title, bgImage, bgColor, description } = req.body;
    if (!req.userId)
        throw new AppError_1.AppError('Unauthorized', 401);
    const board = await prisma_1.default.board.create({
        data: {
            title,
            bgImage,
            bgColor,
            description,
            ownerId: req.userId
        },
    });
    res.status(201).json(board);
});
exports.updateBoard = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    const { title, bgImage, bgColor, description } = req.body;
    const board = await prisma_1.default.board.findUnique({ where: { id } });
    if (!board)
        throw new AppError_1.AppError('Board not found', 404);
    if (board.ownerId !== req.userId)
        throw new AppError_1.AppError('Access denied', 403);
    const updatedBoard = await prisma_1.default.board.update({
        where: { id },
        data: {
            title,
            bgImage,
            bgColor,
            description
        }
    });
    res.json(updatedBoard);
});
exports.getBoardById = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    const board = await prisma_1.default.board.findUnique({
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
    if (!board)
        throw new AppError_1.AppError('Board not found', 404);
    // Ownership or membership check
    const isMember = board.members.some((m) => m.userId === req.userId);
    if (board.ownerId !== req.userId && !isMember) {
        throw new AppError_1.AppError('Access denied', 403);
    }
    const isStarred = board.starredBy.length > 0;
    const { starredBy, ...rest } = board;
    res.json({ ...rest, isStarred });
});
exports.deleteBoard = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    if (!req.userId)
        throw new AppError_1.AppError('Unauthorized', 401);
    const board = await prisma_1.default.board.findUnique({
        where: { id },
        include: { members: true }
    });
    if (!board)
        throw new AppError_1.AppError('Board not found', 404);
    if (board.ownerId === req.userId) {
        // Delete board (Owner)
        await prisma_1.default.board.delete({ where: { id } });
        return res.json({ message: 'Board deleted successfully', deleted: true });
    }
    else {
        // Leave board (Member)
        const membership = board.members.find((m) => m.userId === req.userId);
        if (!membership) {
            throw new AppError_1.AppError('Access denied', 403);
        }
        await prisma_1.default.boardMember.delete({
            where: { id: membership.id }
        });
        return res.json({ message: 'Left board successfully', deleted: false });
    }
});
exports.toggleStar = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    if (!req.userId)
        throw new AppError_1.AppError('Unauthorized', 401);
    const board = await prisma_1.default.board.findUnique({
        where: { id },
        include: { members: true }
    });
    if (!board)
        throw new AppError_1.AppError('Board not found', 404);
    // Access check: must be owner or member
    const isMember = board.members.some((m) => m.userId === req.userId);
    if (board.ownerId !== req.userId && !isMember) {
        throw new AppError_1.AppError('Access denied', 403);
    }
    const existingStar = await prisma_1.default.starredBoard.findUnique({
        where: {
            userId_boardId: {
                userId: req.userId,
                boardId: id
            }
        }
    });
    if (existingStar) {
        await prisma_1.default.starredBoard.delete({
            where: {
                userId_boardId: {
                    userId: req.userId,
                    boardId: id
                }
            }
        });
        res.json({ ...board, isStarred: false });
    }
    else {
        await prisma_1.default.starredBoard.create({
            data: {
                userId: req.userId,
                boardId: id
            }
        });
        res.json({ ...board, isStarred: true });
    }
});
exports.reorderBoards = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { boardIds } = req.body; // Array of { id: string, order: number }
    if (!req.userId)
        throw new AppError_1.AppError('Unauthorized', 401);
    await Promise.all(boardIds.map((item) => prisma_1.default.board.update({
        where: { id: item.id },
        data: { order: item.order }
    })));
    res.json({ message: 'Boards reordered successfully' });
});
