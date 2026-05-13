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

    const isMember = list.board.members.some((m: any) => m.userId === req.userId);
    if (list.board.ownerId !== req.userId && !isMember) {
        throw new AppError('Access denied', 403);
    }

    const card = await prisma.card.create({
        data: { title, description, order, listId, dueDate, isDone },
    });
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

    const isMember = card.list.board.members.some((m: any) => m.userId === req.userId);
    if (card.list.board.ownerId !== req.userId && !isMember) {
        throw new AppError('Access denied', 403);
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
    res.json(updatedCard);
});

export const deleteCard = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    
    const card = await prisma.card.findUnique({
        where: { id },
        include: { list: { include: { board: { include: { members: true } } } } }
    });

    if (!card) throw new AppError('Card not found', 404);

    const isMember = card.list.board.members.some((m: any) => m.userId === req.userId);
    if (card.list.board.ownerId !== req.userId && !isMember) {
        throw new AppError('Access denied', 403);
    }

    await prisma.card.delete({ where: { id } });
    res.status(204).send();
});
