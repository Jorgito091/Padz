import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../prisma';
import { AppError } from '../utils/AppError';
import { catchAsync } from '../utils/catchAsync';
import { io } from '../server';

export const createCard = catchAsync(async (req: AuthRequest, res: Response) => {
    const { title, description, order, listId, dueDate, isDone } = req.body;
    
    const list = await prisma.list.findUnique({
        where: { id: listId },
        include: { board: { include: { members: true } } }
    });

    if (!list) throw new AppError('List not found', 404);

    const member = list.board.members.find((m: any) => m.userId === req.userId);
    const isOwner = list.board.ownerId === req.userId;
    if (!isOwner && (!member || member.role !== 'MEMBER')) {
        throw new AppError('Access denied. Guests cannot create cards.', 403);
    }

    const card = await prisma.card.create({
        data: { title, description, order, listId, dueDate, isDone },
    });
    
    io.to(list.board.id).emit('board-updated');
    
    res.status(201).json(card);
});

export const updateCard = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { title, description, order, listId, dueDate, isDone } = req.body;
    
    const card = await prisma.card.findUnique({
        where: { id },
        include: { list: { include: { board: { include: { members: true } } } } }
    });

    if (!card) throw new AppError('Card not found', 404);

    const member = (card?.list || list).board.members.find((m: any) => m.userId === req.userId);
    const isOwner = (card?.list || list).board.ownerId === req.userId;
    if (!isOwner && (!member || member.role !== 'MEMBER')) {
        throw new AppError('Access denied. Insufficient permissions.', 403);
    }

    const updatedCard = await prisma.card.update({
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
    
    io.to(card.list.board.id).emit('board-updated');
    
    res.json(updatedCard);
});

export const deleteCard = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    
    const card = await prisma.card.findUnique({
        where: { id },
        include: { list: { include: { board: { include: { members: true } } } } }
    });

    if (!card) throw new AppError('Card not found', 404);

    const member = (card?.list || list).board.members.find((m: any) => m.userId === req.userId);
    const isOwner = (card?.list || list).board.ownerId === req.userId;
    if (!isOwner && (!member || member.role !== 'MEMBER')) {
        throw new AppError('Access denied. Insufficient permissions.', 403);
    }

    await prisma.card.delete({ where: { id } });
    
    io.to(card.list.board.id).emit('board-updated');
    
    res.status(204).send();
});

export const assignUser = catchAsync(async (req: AuthRequest, res: Response) => {
    const { cardId, userId } = req.body;

    const card = await prisma.card.findUnique({
        where: { id: cardId },
        include: { list: { include: { board: { include: { members: true } } } } }
    });

    if (!card) throw new AppError('Card not found', 404);

    const member = (card?.list || list).board.members.find((m: any) => m.userId === req.userId);
    const isOwner = (card?.list || list).board.ownerId === req.userId;
    if (!isOwner && (!member || member.role !== 'MEMBER')) {
        throw new AppError('Access denied. Insufficient permissions.', 403);
    }

    const assignment = await prisma.cardAssignee.create({
        data: { cardId, userId },
        include: { user: { select: { name: true } } }
    });

    // Create notification if assigning someone else
    if (userId !== req.userId) {
        const notification = await prisma.notification.create({
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

export const unassignUser = catchAsync(async (req: AuthRequest, res: Response) => {
    const { cardId, userId } = req.params;

    const card = await prisma.card.findUnique({
        where: { id: cardId },
        include: { list: { include: { board: { include: { members: true } } } } }
    });

    if (!card) throw new AppError('Card not found', 404);

    const member = (card?.list || list).board.members.find((m: any) => m.userId === req.userId);
    const isOwner = (card?.list || list).board.ownerId === req.userId;
    if (!isOwner && (!member || member.role !== 'MEMBER')) {
        throw new AppError('Access denied. Insufficient permissions.', 403);
    }

    await prisma.cardAssignee.delete({
        where: {
            cardId_userId: { cardId, userId }
        }
    });

    io.to(card.list.boardId).emit('board-updated');
    res.status(204).send();
});

