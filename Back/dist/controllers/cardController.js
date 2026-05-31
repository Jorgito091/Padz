"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchCards = exports.unassignUser = exports.assignUser = exports.deleteCard = exports.updateCard = exports.createCard = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const AppError_1 = require("../utils/AppError");
const catchAsync_1 = require("../utils/catchAsync");
exports.createCard = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { title, description, order, listId, dueDate, isDone } = req.body;
    const list = await prisma_1.default.list.findUnique({
        where: { id: listId },
        include: { board: { include: { members: true } } }
    });
    if (!list)
        throw new AppError_1.AppError('List not found', 404);
    const member = list.board.members.find((m) => m.userId === req.userId);
    const isOwner = list.board.ownerId === req.userId;
    if (!isOwner && (!member || member.role !== 'MEMBER')) {
        throw new AppError_1.AppError('Access denied. Guests cannot create cards.', 403);
    }
    const card = await prisma_1.default.card.create({
        data: { title, description, order, listId, dueDate, isDone },
    });
    const io = req.app.get('io');
    io.to(list.board.id).emit('board-updated');
    res.status(201).json(card);
});
exports.updateCard = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    const { title, description, order, listId, dueDate, isDone } = req.body;
    const card = await prisma_1.default.card.findUnique({
        where: { id },
        include: { list: { include: { board: { include: { members: true } } } } }
    });
    if (!card)
        throw new AppError_1.AppError('Card not found', 404);
    const member = card.list.board.members.find((m) => m.userId === req.userId);
    const isOwner = card.list.board.ownerId === req.userId;
    if (!isOwner && (!member || member.role !== 'MEMBER')) {
        throw new AppError_1.AppError('Access denied. Insufficient permissions.', 403);
    }
    const updatedCard = await prisma_1.default.card.update({
        where: { id },
        data: {
            title,
            description,
            order,
            listId,
            dueDate,
            isDone
        }
    });
    const io = req.app.get('io');
    io.to(card.list.board.id).emit('board-updated');
    res.json(updatedCard);
});
exports.deleteCard = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    const card = await prisma_1.default.card.findUnique({
        where: { id },
        include: { list: { include: { board: { include: { members: true } } } } }
    });
    if (!card)
        throw new AppError_1.AppError('Card not found', 404);
    const member = card.list.board.members.find((m) => m.userId === req.userId);
    const isOwner = card.list.board.ownerId === req.userId;
    if (!isOwner && (!member || member.role !== 'MEMBER')) {
        throw new AppError_1.AppError('Access denied. Insufficient permissions.', 403);
    }
    await prisma_1.default.card.delete({ where: { id } });
    const io = req.app.get('io');
    io.to(card.list.board.id).emit('board-updated');
    res.status(204).send();
});
exports.assignUser = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { cardId, userId } = req.body;
    const card = await prisma_1.default.card.findUnique({
        where: { id: cardId },
        include: { list: { include: { board: { include: { members: true } } } } }
    });
    if (!card)
        throw new AppError_1.AppError('Card not found', 404);
    const member = card.list.board.members.find((m) => m.userId === req.userId);
    const isOwner = card.list.board.ownerId === req.userId;
    if (!isOwner && (!member || member.role !== 'MEMBER')) {
        throw new AppError_1.AppError('Access denied. Insufficient permissions.', 403);
    }
    const assignment = await prisma_1.default.cardAssignee.create({
        data: { cardId, userId },
        include: { user: { select: { name: true } } }
    });
    const io = req.app.get('io');
    // Create notification if assigning someone else
    if (userId !== req.userId) {
        const notification = await prisma_1.default.notification.create({
            data: {
                userId,
                type: 'CARD_ASSIGNED',
                payload: {
                    cardId,
                    cardTitle: card.title,
                    boardId: card.list.boardId,
                    assignedBy: req.userId
                }
            }
        });
        io.to(userId).emit('notification', notification);
    }
    io.to(card.list.boardId).emit('board-updated');
    res.status(201).json(assignment);
});
exports.unassignUser = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { cardId, userId } = req.params;
    const card = await prisma_1.default.card.findUnique({
        where: { id: cardId },
        include: { list: { include: { board: { include: { members: true } } } } }
    });
    if (!card)
        throw new AppError_1.AppError('Card not found', 404);
    const member = card.list.board.members.find((m) => m.userId === req.userId);
    const isOwner = card.list.board.ownerId === req.userId;
    if (!isOwner && (!member || member.role !== 'MEMBER')) {
        throw new AppError_1.AppError('Access denied. Insufficient permissions.', 403);
    }
    await prisma_1.default.cardAssignee.delete({
        where: {
            cardId_userId: { cardId, userId }
        }
    });
    const io = req.app.get('io');
    io.to(card.list.boardId).emit('board-updated');
    res.status(204).send();
});
exports.searchCards = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { q, labelIds, assignedTo, boardId, isDone, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const take = Math.min(parseInt(limit, 10) || 20, 100);
    const skip = (pageNum - 1) * take;
    const where = {};
    // Board filter via list
    if (boardId) {
        where.list = { boardId: boardId };
    }
    // Text search on title/description
    if (q) {
        where.AND = where.AND || [];
        where.AND.push({
            OR: [
                { title: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } }
            ]
        });
    }
    // Label filter (comma separated ids)
    if (labelIds) {
        const ids = labelIds.split(',').map(s => s.trim()).filter(Boolean);
        if (ids.length) {
            where.labels = { some: { labelId: { in: ids } } };
        }
    }
    // Assigned to filter
    if (assignedTo) {
        where.assignees = { some: { userId: assignedTo } };
    }
    if (isDone === 'true' || isDone === 'false') {
        where.isDone = isDone === 'true';
    }
    const [cards, total] = await Promise.all([
        prisma_1.default.card.findMany({
            where,
            include: {
                list: true,
                labels: { include: { label: true } },
                assignees: { include: { user: { select: { id: true, name: true, avatar: true } } } }
            },
            orderBy: { updatedAt: 'desc' },
            skip,
            take
        }),
        prisma_1.default.card.count({ where })
    ]);
    res.json({ data: cards, meta: { total, page: pageNum, limit: take } });
});
