import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../prisma';
import { AppError } from '../utils/AppError';
import { catchAsync } from '../utils/catchAsync';

export const getLists = catchAsync(async (req: AuthRequest, res: Response) => {
    const { boardId } = req.query;
    if (!boardId) throw new AppError('boardId is required', 400);

    const board = await prisma.board.findUnique({
        where: { id: String(boardId) }
    });

    if (!board) throw new AppError('Board not found', 404);
    if (board.ownerId !== req.userId) throw new AppError('Access denied', 403);

    const lists = await prisma.list.findMany({
        where: { boardId: String(boardId) },
        include: { cards: { orderBy: { order: 'asc' } } },
        orderBy: { order: 'asc' },
    });
    res.json(lists);
});

export const createList = catchAsync(async (req: AuthRequest, res: Response) => {
    const { title, order, boardId } = req.body;
    
    const board = await prisma.board.findUnique({
        where: { id: boardId }
    });

    if (!board) throw new AppError('Board not found', 404);
    if (board.ownerId !== req.userId) throw new AppError('Access denied', 403);

    const list = await prisma.list.create({
        data: { title, order, boardId },
    });
    res.status(201).json(list);
});

export const updateList = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { title, order } = req.body;
    
    const list = await prisma.list.findUnique({
        where: { id },
        include: { board: true }
    });

    if (!list) throw new AppError('List not found', 404);
    if (list.board.ownerId !== req.userId) throw new AppError('Access denied', 403);

    const updatedList = await prisma.list.update({
        where: { id },
        data: { title, order },
    });
    res.json(updatedList);
});

export const deleteList = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    
    const list = await prisma.list.findUnique({
        where: { id },
        include: { board: true }
    });

    if (!list) throw new AppError('List not found', 404);
    if (list.board.ownerId !== req.userId) throw new AppError('Access denied', 403);

    await prisma.list.delete({ where: { id } });
    res.status(204).send();
});
