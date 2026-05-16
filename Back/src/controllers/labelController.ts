import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../prisma';
import { AppError } from '../utils/AppError';
import { catchAsync } from '../utils/catchAsync';

export const getBoardLabels = catchAsync(async (req: AuthRequest, res: Response) => {
    const { boardId } = req.params;
    const labels = await prisma.label.findMany({
        where: { boardId }
    });
    res.json(labels);
});

export const createLabel = catchAsync(async (req: AuthRequest, res: Response) => {
    const { name, color, boardId } = req.body;
    
    const board = await prisma.board.findUnique({
        where: { id: boardId },
        include: { members: true }
    });

    if (!board) throw new AppError('Board not found', 404);

    const member = board.members.find((m: any) => m.userId === req.userId);
    const isOwner = board.ownerId === req.userId;
    if (!isOwner && (!member || member.role !== 'MEMBER')) throw new AppError('Access denied', 403);

    const label = await prisma.label.create({
        data: { name, color, boardId },
    });
    res.status(201).json(label);
});

export const deleteLabel = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    
    const label = await prisma.label.findUnique({
        where: { id },
        include: { board: { include: { members: true } } }
    });

    if (!label) throw new AppError('Label not found', 404);

    const member = label.board.members.find((m: any) => m.userId === req.userId);
    const isOwner = label.board.ownerId === req.userId;
    if (!isOwner && (!member || member.role !== 'MEMBER')) throw new AppError('Access denied', 403);

    await prisma.label.delete({ where: { id } });
    res.status(204).send();
});

export const addLabelToCard = catchAsync(async (req: AuthRequest, res: Response) => {
    const { cardId, labelId } = req.body;
    
    const card = await prisma.card.findUnique({
        where: { id: cardId },
        include: { list: { include: { board: { include: { members: true } } } } }
    });

    if (!card) throw new AppError('Card not found', 404);
    const member = card.list.board.members.find((m: any) => m.userId === req.userId);
    const isOwner = card.list.board.ownerId === req.userId;
    if (!isOwner && (!member || member.role !== 'MEMBER')) throw new AppError('Access denied', 403);

    const cardLabel = await prisma.cardLabel.create({
        data: { cardId, labelId }
    });
    res.status(201).json(cardLabel);
});

export const removeLabelFromCard = catchAsync(async (req: AuthRequest, res: Response) => {
    const { cardId, labelId } = req.params;
    
    const card = await prisma.card.findUnique({
        where: { id: cardId },
        include: { list: { include: { board: { include: { members: true } } } } }
    });

    if (!card) throw new AppError('Card not found', 404);
    const member = card.list.board.members.find((m: any) => m.userId === req.userId);
    const isOwner = card.list.board.ownerId === req.userId;
    if (!isOwner && (!member || member.role !== 'MEMBER')) throw new AppError('Access denied', 403);

    await prisma.cardLabel.delete({
        where: {
            cardId_labelId: { cardId, labelId }
        }
    });
    res.status(204).send();
});
