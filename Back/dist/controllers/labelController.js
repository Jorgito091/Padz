"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeLabelFromCard = exports.addLabelToCard = exports.deleteLabel = exports.createLabel = exports.getBoardLabels = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const AppError_1 = require("../utils/AppError");
const catchAsync_1 = require("../utils/catchAsync");
exports.getBoardLabels = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { boardId } = req.params;
    const labels = await prisma_1.default.label.findMany({
        where: { boardId }
    });
    res.json(labels);
});
exports.createLabel = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { name, color, boardId } = req.body;
    const board = await prisma_1.default.board.findUnique({
        where: { id: boardId },
        include: { members: true }
    });
    if (!board)
        throw new AppError_1.AppError('Board not found', 404);
    const member = board.members.find((m) => m.userId === req.userId);
    const isOwner = board.ownerId === req.userId;
    if (!isOwner && (!member || member.role !== 'MEMBER'))
        throw new AppError_1.AppError('Access denied', 403);
    const label = await prisma_1.default.label.create({
        data: { name, color, boardId },
    });
    res.status(201).json(label);
});
exports.deleteLabel = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    const label = await prisma_1.default.label.findUnique({
        where: { id },
        include: { board: { include: { members: true } } }
    });
    if (!label)
        throw new AppError_1.AppError('Label not found', 404);
    const member = label.board.members.find((m) => m.userId === req.userId);
    const isOwner = label.board.ownerId === req.userId;
    if (!isOwner && (!member || member.role !== 'MEMBER'))
        throw new AppError_1.AppError('Access denied', 403);
    await prisma_1.default.label.delete({ where: { id } });
    res.status(204).send();
});
exports.addLabelToCard = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { cardId, labelId } = req.body;
    const card = await prisma_1.default.card.findUnique({
        where: { id: cardId },
        include: { list: { include: { board: { include: { members: true } } } } }
    });
    if (!card)
        throw new AppError_1.AppError('Card not found', 404);
    const member = card.list.board.members.find((m) => m.userId === req.userId);
    const isOwner = card.list.board.ownerId === req.userId;
    if (!isOwner && (!member || member.role !== 'MEMBER'))
        throw new AppError_1.AppError('Access denied', 403);
    const cardLabel = await prisma_1.default.cardLabel.create({
        data: { cardId, labelId }
    });
    res.status(201).json(cardLabel);
});
exports.removeLabelFromCard = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { cardId, labelId } = req.params;
    const card = await prisma_1.default.card.findUnique({
        where: { id: cardId },
        include: { list: { include: { board: { include: { members: true } } } } }
    });
    if (!card)
        throw new AppError_1.AppError('Card not found', 404);
    const member = card.list.board.members.find((m) => m.userId === req.userId);
    const isOwner = card.list.board.ownerId === req.userId;
    if (!isOwner && (!member || member.role !== 'MEMBER'))
        throw new AppError_1.AppError('Access denied', 403);
    await prisma_1.default.cardLabel.delete({
        where: {
            cardId_labelId: { cardId, labelId }
        }
    });
    res.status(204).send();
});
