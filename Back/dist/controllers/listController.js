"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteList = exports.updateList = exports.createList = exports.getLists = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const AppError_1 = require("../utils/AppError");
const catchAsync_1 = require("../utils/catchAsync");
exports.getLists = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { boardId } = req.query;
    if (!boardId)
        throw new AppError_1.AppError('boardId is required', 400);
    const board = await prisma_1.default.board.findUnique({
        where: { id: String(boardId) }
    });
    if (!board)
        throw new AppError_1.AppError('Board not found', 404);
    if (board.ownerId !== req.userId)
        throw new AppError_1.AppError('Access denied', 403);
    const lists = await prisma_1.default.list.findMany({
        where: { boardId: String(boardId) },
        include: { cards: { orderBy: { order: 'asc' } } },
        orderBy: { order: 'asc' },
    });
    res.json(lists);
});
exports.createList = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { title, order, boardId } = req.body;
    const board = await prisma_1.default.board.findUnique({
        where: { id: boardId },
        include: { members: true }
    });
    if (!board)
        throw new AppError_1.AppError('Board not found', 404);
    const member = board.members.find((m) => m.userId === req.userId);
    const isOwner = board.ownerId === req.userId;
    if (!isOwner && (!member || member.role !== 'MEMBER')) {
        throw new AppError_1.AppError('Access denied', 403);
    }
    const list = await prisma_1.default.list.create({
        data: { title, order, boardId },
    });
    const io = req.app.get('io');
    io.to(boardId).emit('board-updated');
    res.status(201).json(list);
});
exports.updateList = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    const { title, order } = req.body;
    const list = await prisma_1.default.list.findUnique({
        where: { id },
        include: { board: { include: { members: true } } }
    });
    if (!list)
        throw new AppError_1.AppError('List not found', 404);
    const member = list.board.members.find((m) => m.userId === req.userId);
    const isOwner = list.board.ownerId === req.userId;
    if (!isOwner && (!member || member.role !== 'MEMBER'))
        throw new AppError_1.AppError('Access denied', 403);
    const updatedList = await prisma_1.default.list.update({
        where: { id },
        data: { title, order },
    });
    const io = req.app.get('io');
    io.to(list.boardId).emit('board-updated');
    res.json(updatedList);
});
exports.deleteList = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    const list = await prisma_1.default.list.findUnique({
        where: { id },
        include: { board: { include: { members: true } } }
    });
    if (!list)
        throw new AppError_1.AppError('List not found', 404);
    const member = list.board.members.find((m) => m.userId === req.userId);
    const isOwner = list.board.ownerId === req.userId;
    if (!isOwner && (!member || member.role !== 'MEMBER'))
        throw new AppError_1.AppError('Access denied', 403);
    await prisma_1.default.list.delete({ where: { id } });
    const io = req.app.get('io');
    io.to(list.boardId).emit('board-updated');
    res.status(204).send();
});
