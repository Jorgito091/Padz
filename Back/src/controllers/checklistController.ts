import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../prisma';
import { AppError } from '../utils/AppError';
import { catchAsync } from '../utils/catchAsync';
import { assertCanEditCard, getCardWithBoardAccess } from '../utils/cardAccess';

const emitBoardUpdated = (req: AuthRequest, boardId: string) => {
    const io = req.app.get('io');
    if (io) io.to(boardId).emit('board-updated');
};

export const getChecklistsByCard = catchAsync(async (req: AuthRequest, res: Response) => {
    const { cardId } = req.params;
    if (!req.userId) throw new AppError('Unauthorized', 401);

    await getCardWithBoardAccess(cardId, req.userId);

    const checklists = await prisma.checklist.findMany({
        where: { cardId },
        include: {
            items: { orderBy: { order: 'asc' } },
        },
        orderBy: { order: 'asc' },
    });

    res.json(checklists);
});

export const createChecklist = catchAsync(async (req: AuthRequest, res: Response) => {
    const { cardId, title } = req.body;
    if (!req.userId) throw new AppError('Unauthorized', 401);

    const { board } = await assertCanEditCard(cardId, req.userId);

    const count = await prisma.checklist.count({ where: { cardId } });

    const checklist = await prisma.checklist.create({
        data: {
            cardId,
            title: title || 'Subtareas',
            order: count,
        },
        include: { items: true },
    });

    emitBoardUpdated(req, board.id);
    res.status(201).json(checklist);
});

export const updateChecklist = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { title, order } = req.body;
    if (!req.userId) throw new AppError('Unauthorized', 401);

    const existing = await prisma.checklist.findUnique({
        where: { id },
        include: { card: { include: { list: true } } },
    });
    if (!existing) throw new AppError('Checklist not found', 404);

    const { board } = await assertCanEditCard(existing.cardId, req.userId);

    const checklist = await prisma.checklist.update({
        where: { id },
        data: { title, order },
        include: { items: { orderBy: { order: 'asc' } } },
    });

    emitBoardUpdated(req, board.id);
    res.json(checklist);
});

export const deleteChecklist = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    if (!req.userId) throw new AppError('Unauthorized', 401);

    const existing = await prisma.checklist.findUnique({
        where: { id },
        include: { card: { include: { list: true } } },
    });
    if (!existing) throw new AppError('Checklist not found', 404);

    const { board } = await assertCanEditCard(existing.cardId, req.userId);

    await prisma.checklist.delete({ where: { id } });

    emitBoardUpdated(req, board.id);
    res.status(204).send();
});

export const createChecklistItem = catchAsync(async (req: AuthRequest, res: Response) => {
    const { checklistId, title } = req.body;
    if (!req.userId) throw new AppError('Unauthorized', 401);

    const checklist = await prisma.checklist.findUnique({
        where: { id: checklistId },
        include: { card: { include: { list: true } } },
    });
    if (!checklist) throw new AppError('Checklist not found', 404);

    const { board } = await assertCanEditCard(checklist.cardId, req.userId);

    const count = await prisma.checklistItem.count({ where: { checklistId } });

    const item = await prisma.checklistItem.create({
        data: { checklistId, title, order: count },
    });

    emitBoardUpdated(req, board.id);
    res.status(201).json(item);
});

export const updateChecklistItem = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { title, isDone, order } = req.body;
    if (!req.userId) throw new AppError('Unauthorized', 401);

    const existing = await prisma.checklistItem.findUnique({
        where: { id },
        include: { checklist: { include: { card: { include: { list: true } } } } },
    });
    if (!existing) throw new AppError('Item not found', 404);

    const { board } = await assertCanEditCard(existing.checklist.cardId, req.userId);

    const item = await prisma.checklistItem.update({
        where: { id },
        data: { title, isDone, order },
    });

    emitBoardUpdated(req, board.id);
    res.json(item);
});

export const deleteChecklistItem = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    if (!req.userId) throw new AppError('Unauthorized', 401);

    const existing = await prisma.checklistItem.findUnique({
        where: { id },
        include: { checklist: { include: { card: { include: { list: true } } } } },
    });
    if (!existing) throw new AppError('Item not found', 404);

    const { board } = await assertCanEditCard(existing.checklist.cardId, req.userId);

    await prisma.checklistItem.delete({ where: { id } });

    emitBoardUpdated(req, board.id);
    res.status(204).send();
});
