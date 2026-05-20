"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteComment = exports.getComments = exports.createComment = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const AppError_1 = require("../utils/AppError");
const catchAsync_1 = require("../utils/catchAsync");
exports.createComment = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { cardId, text } = req.body;
    if (!req.userId)
        throw new AppError_1.AppError('Unauthorized', 401);
    const comment = await prisma_1.default.comment.create({
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
exports.getComments = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { cardId } = req.params;
    const comments = await prisma_1.default.comment.findMany({
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
exports.deleteComment = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    if (!req.userId)
        throw new AppError_1.AppError('Unauthorized', 401);
    const comment = await prisma_1.default.comment.findUnique({
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
    if (!comment)
        throw new AppError_1.AppError('Comment not found', 404);
    // Only author OR board owner can delete
    const isAuthor = comment.userId === req.userId;
    const isBoardOwner = comment.card.list.board.ownerId === req.userId;
    if (!isAuthor && !isBoardOwner) {
        throw new AppError_1.AppError('Access denied', 403);
    }
    await prisma_1.default.comment.delete({
        where: { id }
    });
    res.json({ message: 'Comment deleted successfully' });
});
