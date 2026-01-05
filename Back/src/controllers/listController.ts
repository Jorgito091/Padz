import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../prisma';

export const getLists = async (req: AuthRequest, res: Response) => {
    const { boardId } = req.query;
    if (!boardId) return res.status(400).json({ error: 'boardId is required' });

    try {
        const board = await prisma.board.findUnique({
            where: { id: String(boardId) }
        });

        if (!board) return res.status(404).json({ error: 'Board not found' });
        if (board.ownerId !== req.userId) return res.status(403).json({ error: 'Access denied' });

        const lists = await prisma.list.findMany({
            where: { boardId: String(boardId) },
            include: { cards: { orderBy: { order: 'asc' } } },
            orderBy: { order: 'asc' },
        });
        res.json(lists);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching lists' });
    }
};

export const createList = async (req: AuthRequest, res: Response) => {
    const { title, order, boardId } = req.body;
    try {
        const board = await prisma.board.findUnique({
            where: { id: boardId }
        });

        if (!board) return res.status(404).json({ error: 'Board not found' });
        if (board.ownerId !== req.userId) return res.status(403).json({ error: 'Access denied' });

        const list = await prisma.list.create({
            data: { title, order, boardId },
        });
        res.status(201).json(list);
    } catch (error) {
        res.status(500).json({ error: 'Error creating list' });
    }
};

export const updateList = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { title, order } = req.body;
    try {
        const list = await prisma.list.findUnique({
            where: { id },
            include: { board: true }
        });

        if (!list) return res.status(404).json({ error: 'List not found' });
        if (list.board.ownerId !== req.userId) return res.status(403).json({ error: 'Access denied' });

        const updatedList = await prisma.list.update({
            where: { id },
            data: { title, order },
        });
        res.json(updatedList);
    } catch (error) {
        res.status(500).json({ error: 'Error updating list' });
    }
};

export const deleteList = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    try {
        const list = await prisma.list.findUnique({
            where: { id },
            include: { board: true }
        });

        if (!list) return res.status(404).json({ error: 'List not found' });
        if (list.board.ownerId !== req.userId) return res.status(403).json({ error: 'Access denied' });

        await prisma.list.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Error deleting list' });
    }
};
