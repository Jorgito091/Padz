"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMemberRole = exports.removeMember = exports.getBoardMembers = exports.addMember = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const AppError_1 = require("../utils/AppError");
const catchAsync_1 = require("../utils/catchAsync");
exports.addMember = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { boardId, email, role } = req.body;
    if (!req.userId)
        throw new AppError_1.AppError('Unauthorized', 401);
    // Check if the board exists and if the requester is the owner
    const board = await prisma_1.default.board.findUnique({
        where: { id: boardId }
    });
    if (!board)
        throw new AppError_1.AppError('Board not found', 404);
    if (board.ownerId !== req.userId) {
        throw new AppError_1.AppError('Only the board owner can invite members', 403);
    }
    // Find the user to invite
    const userToInvite = await prisma_1.default.user.findUnique({
        where: { email }
    });
    if (!userToInvite) {
        throw new AppError_1.AppError('User not found', 404);
    }
    // Check if already a member
    const existingMember = await prisma_1.default.boardMember.findUnique({
        where: {
            userId_boardId: {
                userId: userToInvite.id,
                boardId: boardId
            }
        }
    });
    if (existingMember) {
        throw new AppError_1.AppError('User is already a member of this board', 400);
    }
    // Check if the user is the owner
    if (userToInvite.id === board.ownerId) {
        throw new AppError_1.AppError('User is already the owner of this board', 400);
    }
    const newMember = await prisma_1.default.boardMember.create({
        data: {
            userId: userToInvite.id,
            boardId: boardId,
            role: role || 'MEMBER'
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatar: true
                }
            }
        }
    });
    res.status(201).json(newMember);
});
exports.getBoardMembers = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { boardId } = req.params;
    const members = await prisma_1.default.boardMember.findMany({
        where: { boardId },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatar: true
                }
            }
        }
    });
    res.json(members);
});
exports.removeMember = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { boardId, userId } = req.params;
    if (!req.userId)
        throw new AppError_1.AppError('Unauthorized', 401);
    const board = await prisma_1.default.board.findUnique({
        where: { id: boardId }
    });
    if (!board)
        throw new AppError_1.AppError('Board not found', 404);
    // Only owner can remove members, OR a member can remove themselves
    if (board.ownerId !== req.userId && userId !== req.userId) {
        throw new AppError_1.AppError('Access denied', 403);
    }
    await prisma_1.default.boardMember.delete({
        where: {
            userId_boardId: {
                userId,
                boardId
            }
        }
    });
    res.json({ message: 'Member removed successfully' });
});
exports.updateMemberRole = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { boardId, userId, role } = req.body;
    if (!req.userId)
        throw new AppError_1.AppError('Unauthorized', 401);
    const board = await prisma_1.default.board.findUnique({
        where: { id: boardId }
    });
    if (!board)
        throw new AppError_1.AppError('Board not found', 404);
    // Only owner can change roles
    if (board.ownerId !== req.userId) {
        throw new AppError_1.AppError('Only the board owner can manage member roles', 403);
    }
    const updatedMember = await prisma_1.default.boardMember.update({
        where: {
            userId_boardId: {
                userId,
                boardId
            }
        },
        data: { role },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatar: true
                }
            }
        }
    });
    res.json(updatedMember);
});
