import { Request, Response } from 'express';
import prisma from '../prisma';

export const createCard = async (req: Request, res: Response) => {
    const { title, description, order, listId } = req.body;
    try {
        const card = await prisma.card.create({
            data: { title, description, order, listId },
        });
        res.status(201).json(card);
    } catch (error) {
        res.status(500).json({ error: 'Error creating card' });
    }
};

export const updateCard = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, description, order, listId } = req.body;
    try {
        const card = await prisma.card.update({
            where: { id },
            data: { title, description, order, listId },
        });
        res.json(card);
    } catch (error) {
        res.status(500).json({ error: 'Error updating card' });
    }
};

export const deleteCard = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await prisma.card.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Error deleting card' });
    }
};
