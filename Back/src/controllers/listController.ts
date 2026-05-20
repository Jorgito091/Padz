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
        where: { id: boardId },
        include: { members: true }
    });

    if (!board) throw new AppError('Board not found', 404);
    
    const member = board.members.find((m: any) => m.userId === req.userId);
    const isOwner = board.ownerId === req.userId;
    if (!isOwner && (!member || member.role !== 'MEMBER')) {
        throw new AppError('Access denied', 403);
    }

    const list = await prisma.list.create({
        data: { title, order, boardId },
    });
    
    const io = req.app.get('io');
    io.to(boardId).emit('board-updated');
    
    res.status(201).json(list);
});

export const updateList = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { title, order } = req.body;
    
    const list = await prisma.list.findUnique({
        where: { id },
        include: { board: { include: { members: true } } }
    });

    if (!list) throw new AppError('List not found', 404);
    const member = list.board.members.find((m: any) => m.userId === req.userId);
    const isOwner = list.board.ownerId === req.userId;
    if (!isOwner && (!member || member.role !== 'MEMBER')) throw new AppError('Access denied', 403);

    const updatedList = await prisma.list.update({
        where: { id },
        data: { title, order },
    });
    
    const io = req.app.get('io');
    io.to(list.boardId).emit('board-updated');
    
    res.json(updatedList);
});

export const deleteList = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    
    const list = await prisma.list.findUnique({
        where: { id },
        include: { board: { include: { members: true } } }
    });

    if (!list) throw new AppError('List not found', 404);
    const member = list.board.members.find((m: any) => m.userId === req.userId);
    const isOwner = list.board.ownerId === req.userId;
    if (!isOwner && (!member || member.role !== 'MEMBER')) throw new AppError('Access denied', 403);

    await prisma.list.delete({ where: { id } });
    
    const io = req.app.get('io');
    io.to(list.boardId).emit('board-updated');
    
    res.status(204).send();
});
