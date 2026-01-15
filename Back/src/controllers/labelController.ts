import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../prisma';

export const getBoardLabels = async (req: AuthRequest, res: Response) => {
    const { boardId } = req.params;
    try {
        const labels = await prisma.label.findMany({
            where: { boardId }
        });
        res.json(labels);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching labels' });
    }
};

export const createLabel = async (req: AuthRequest, res: Response) => {
    const { name, color, boardId } = req.body;
    try {
        const board = await prisma.board.findUnique({
            where: { id: boardId }
        });

        if (!board) return res.status(404).json({ error: 'Board not found' });
        if (board.ownerId !== req.userId) return res.status(403).json({ error: 'Access denied' });

        const label = await prisma.label.create({
            data: { name, color, boardId },
        });
        res.status(201).json(label);
    } catch (error) {
        res.status(500).json({ error: 'Error creating label' });
    }
};

export const deleteLabel = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    try {
        const label = await prisma.label.findUnique({
            where: { id },
            include: { board: true }
        });

        if (!label) return res.status(404).json({ error: 'Label not found' });
        if (label.board.ownerId !== req.userId) return res.status(403).json({ error: 'Access denied' });

        await prisma.label.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Error deleting label' });
    }
};

export const addLabelToCard = async (req: AuthRequest, res: Response) => {
    const { cardId, labelId } = req.body;
    try {
        const card = await prisma.card.findUnique({
            where: { id: cardId },
            include: { list: { include: { board: true } } }
        });

        if (!card) return res.status(404).json({ error: 'Card not found' });
        if (card.list.board.ownerId !== req.userId) return res.status(403).json({ error: 'Access denied' });

        const cardLabel = await prisma.cardLabel.create({
            data: { cardId, labelId }
        });
        res.status(201).json(cardLabel);
    } catch (error) {
        res.status(500).json({ error: 'Error adding label to card' });
    }
};

export const removeLabelFromCard = async (req: AuthRequest, res: Response) => {
    const { cardId, labelId } = req.params;
    try {
        const card = await prisma.card.findUnique({
            where: { id: cardId },
            include: { list: { include: { board: true } } }
        });

        if (!card) return res.status(404).json({ error: 'Card not found' });
        if (card.list.board.ownerId !== req.userId) return res.status(403).json({ error: 'Access denied' });

        await prisma.cardLabel.delete({
            where: {
                cardId_labelId: { cardId, labelId }
            }
        });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Error removing label from card' });
    }
};
