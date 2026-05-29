import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../prisma';
import { AppError } from '../utils/AppError';
import { catchAsync } from '../utils/catchAsync';


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
    
    const io = req.app.get('io');
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

    const member = card.list.board.members.find((m: any) => m.userId === req.userId);
    const isOwner = card.list.board.ownerId === req.userId;
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
    
    const io = req.app.get('io');
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

    const member = card.list.board.members.find((m: any) => m.userId === req.userId);
    const isOwner = card.list.board.ownerId === req.userId;
    if (!isOwner && (!member || member.role !== 'MEMBER')) {
        throw new AppError('Access denied. Insufficient permissions.', 403);
    }

    await prisma.card.delete({ where: { id } });
    
    const io = req.app.get('io');
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

    const member = card.list.board.members.find((m: any) => m.userId === req.userId);
    const isOwner = card.list.board.ownerId === req.userId;
    if (!isOwner && (!member || member.role !== 'MEMBER')) {
        throw new AppError('Access denied. Insufficient permissions.', 403);
    }

    const assignment = await prisma.cardAssignee.create({
        data: { cardId, userId },
        include: { user: { select: { name: true } } }
    });

    const io = req.app.get('io');
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

    const member = card.list.board.members.find((m: any) => m.userId === req.userId);
    const isOwner = card.list.board.ownerId === req.userId;
    if (!isOwner && (!member || member.role !== 'MEMBER')) {
        throw new AppError('Access denied. Insufficient permissions.', 403);
    }

    await prisma.cardAssignee.delete({
        where: {
            cardId_userId: { cardId, userId }
        }
    });

    const io = req.app.get('io');
    io.to(card.list.boardId).emit('board-updated');
    res.status(204).send();
});

export const searchCards = catchAsync(async (req: AuthRequest, res: Response) => {
    const { q, labelIds, assignedTo, boardId, isDone, page = '1', limit = '20' } = req.query as any;

    const pageNum = Math.max(parseInt(page as string, 10) || 1, 1);
    const take = Math.min(parseInt(limit as string, 10) || 20, 100);
    const skip = (pageNum - 1) * take;

    const where: any = { };

    // Board filter via list
    if (boardId) {
        where.list = { boardId: boardId };
    }

    // Text search on title/description
    if (q) {
        where.AND = where.AND || [];
        where.AND.push({
            OR: [
                { title: { contains: q as string, mode: 'insensitive' } },
                { description: { contains: q as string, mode: 'insensitive' } }
            ]
        });
    }

    // Label filter (comma separated ids)
    if (labelIds) {
        const ids = (labelIds as string).split(',').map(s => s.trim()).filter(Boolean);
        if (ids.length) {
            where.labels = { some: { labelId: { in: ids } } };
        }
    }

    // Assigned to filter
    if (assignedTo) {
        where.assignees = { some: { userId: assignedTo as string } };
    }

    if (isDone === 'true' || isDone === 'false') {
        where.isDone = isDone === 'true';
    }

    const [cards, total] = await Promise.all([
        prisma.card.findMany({
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
        prisma.card.count({ where })
    ]);

    res.json({ data: cards, meta: { total, page: pageNum, limit: take } });
});

