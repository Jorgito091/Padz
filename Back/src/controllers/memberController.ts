import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../prisma';
import { AppError } from '../utils/AppError';
import { catchAsync } from '../utils/catchAsync';

export const addMember = catchAsync(async (req: AuthRequest, res: Response) => {
    const { boardId, email, role } = req.body;

    if (!req.userId) throw new AppError('Unauthorized', 401);

    // Check if the board exists and if the requester is the owner
    const board = await prisma.board.findUnique({
        where: { id: boardId }
    });

    if (!board) throw new AppError('Board not found', 404);
    if (board.ownerId !== req.userId) {
        throw new AppError('Only the board owner can invite members', 403);
    }

    // Find the user to invite
    const userToInvite = await prisma.user.findUnique({
        where: { email }
    });

    if (!userToInvite) {
        throw new AppError('User not found', 404);
    }

    // Check if already a member
    const existingMember = await prisma.boardMember.findUnique({
        where: {
            userId_boardId: {
                userId: userToInvite.id,
                boardId: boardId
            }
        }
    });

    if (existingMember) {
        throw new AppError('User is already a member of this board', 400);
    }

    // Check if the user is the owner
    if (userToInvite.id === board.ownerId) {
        throw new AppError('User is already the owner of this board', 400);
    }

    const newMember = await prisma.boardMember.create({
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

export const getBoardMembers = catchAsync(async (req: AuthRequest, res: Response) => {
    const { boardId } = req.params;

    const members = await prisma.boardMember.findMany({
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

export const removeMember = catchAsync(async (req: AuthRequest, res: Response) => {
    const { boardId, userId } = req.params;

    if (!req.userId) throw new AppError('Unauthorized', 401);

    const board = await prisma.board.findUnique({
        where: { id: boardId }
    });

    if (!board) throw new AppError('Board not found', 404);

    // Only owner can remove members, OR a member can remove themselves
    if (board.ownerId !== req.userId && userId !== req.userId) {
        throw new AppError('Access denied', 403);
    }

    await prisma.boardMember.delete({
        where: {
            userId_boardId: {
                userId,
                boardId
            }
        }
    });

    res.json({ message: 'Member removed successfully' });
});

export const updateMemberRole = catchAsync(async (req: AuthRequest, res: Response) => {
    const { boardId, userId, role } = req.body;

    if (!req.userId) throw new AppError('Unauthorized', 401);

    const board = await prisma.board.findUnique({
        where: { id: boardId }
    });

    if (!board) throw new AppError('Board not found', 404);

    // Only owner can change roles
    if (board.ownerId !== req.userId) {
        throw new AppError('Only the board owner can manage member roles', 403);
    }

    const updatedMember = await prisma.boardMember.update({
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
