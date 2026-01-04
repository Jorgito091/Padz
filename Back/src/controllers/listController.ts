import { Request, Response } from 'express';
import prisma from '../prisma';

export const getLists = async (req: Request, res: Response) => {
    const { boardId } = req.query;
    try {
        const lists = await prisma.list.findMany({
            where: boardId ? { boardId: String(boardId) } : {},
            include: { cards: { orderBy: { order: 'asc' } } },
            orderBy: { order: 'asc' },
        });
        res.json(lists);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching lists' });
    }
};

export const createList = async (req: Request, res: Response) => {
    const { title, order, boardId } = req.body;
    try {
        const list = await prisma.list.create({
            data: { title, order, boardId },
        });
        res.status(201).json(list);
    } catch (error) {
        res.status(500).json({ error: 'Error creating list' });
    }
};

export const updateList = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, order } = req.body;
    try {
        const list = await prisma.list.update({
            where: { id },
            data: { title, order },
        });
        res.json(list);
    } catch (error) {
        res.status(500).json({ error: 'Error updating list' });
    }
};

export const deleteList = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await prisma.list.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Error deleting list' });
    }
};
