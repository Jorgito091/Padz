import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../prisma';

export const createCard = async (req: AuthRequest, res: Response) => {
    const { title, description, order, listId } = req.body;
    try {
        const list = await prisma.list.findUnique({
            where: { id: listId },
            include: { board: true }
        });

        if (!list) return res.status(404).json({ error: 'List not found' });
        if (list.board.ownerId !== req.userId) return res.status(403).json({ error: 'Access denied' });

        const card = await prisma.card.create({
            data: { title, description, order, listId },
        });
        res.status(201).json(card);
    } catch (error) {
        res.status(500).json({ error: 'Error creating card' });
    }
};

export const updateCard = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { title, description, order, listId } = req.body;
    try {
        const card = await prisma.card.findUnique({
            where: { id },
            include: { list: { include: { board: true } } }
        });

        if (!card) return res.status(404).json({ error: 'Card not found' });
        if (card.list.board.ownerId !== req.userId) return res.status(403).json({ error: 'Access denied' });

        const updatedCard = await prisma.card.update({
            where: { id },
            data: {
                title,
                description,
                order,
                listId
            }
        });
        res.json(updatedCard);
    } catch (error) {
        res.status(500).json({ error: 'Error updating card' });
    }
};

export const deleteCard = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    try {
        const card = await prisma.card.findUnique({
            where: { id },
            include: { list: { include: { board: true } } }
        });

        if (!card) return res.status(404).json({ error: 'Card not found' });
        if (card.list.board.ownerId !== req.userId) return res.status(403).json({ error: 'Access denied' });

        await prisma.card.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Error deleting card' });
    }
};
