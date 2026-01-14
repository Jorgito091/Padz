import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../prisma';

export const addMember = async (req: AuthRequest, res: Response) => {
    const { boardId, email, role } = req.body;

    try {
        if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

        // Check if the board exists and if the requester is the owner
        const board = await prisma.board.findUnique({
            where: { id: boardId }
        });

        if (!board) return res.status(404).json({ error: 'Board not found' });
        if (board.ownerId !== req.userId) {
            return res.status(403).json({ error: 'Only the board owner can invite members' });
        }

        // Find the user to invite
        const userToInvite = await prisma.user.findUnique({
            where: { email }
        });

        if (!userToInvite) {
            return res.status(404).json({ error: 'User not found' });
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
            return res.status(400).json({ error: 'User is already a member of this board' });
        }

        // Check if the user is the owner
        if (userToInvite.id === board.ownerId) {
            return res.status(400).json({ error: 'User is already the owner of this board' });
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
    } catch (error) {
        console.error('Error adding member:', error);
        res.status(500).json({ error: 'Error adding member' });
    }
};

export const getBoardMembers = async (req: AuthRequest, res: Response) => {
    const { boardId } = req.params;

    try {
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
    } catch (error) {
        res.status(500).json({ error: 'Error fetching members' });
    }
};

export const removeMember = async (req: AuthRequest, res: Response) => {
    const { boardId, userId } = req.params;

    try {
        if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

        const board = await prisma.board.findUnique({
            where: { id: boardId }
        });

        if (!board) return res.status(404).json({ error: 'Board not found' });

        // Only owner can remove members, OR a member can remove themselves
        if (board.ownerId !== req.userId && userId !== req.userId) {
            return res.status(403).json({ error: 'Access denied' });
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
    } catch (error) {
        res.status(500).json({ error: 'Error removing member' });
    }
};
