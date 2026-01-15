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
            where: { id: boardId },
            include: { members: true }
        });

        if (!board) return res.status(404).json({ error: 'Board not found' });

        const isMember = board.members.some((m: any) => m.userId === req.userId);
        if (board.ownerId !== req.userId && !isMember) return res.status(403).json({ error: 'Access denied' });

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
            include: { board: { include: { members: true } } }
        });

        if (!label) return res.status(404).json({ error: 'Label not found' });

        const isMember = label.board.members.some((m: any) => m.userId === req.userId);
        if (label.board.ownerId !== req.userId && !isMember) return res.status(403).json({ error: 'Access denied' });

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
            include: { list: { include: { board: { include: { members: true } } } } }
        });

        if (!card) return res.status(404).json({ error: 'Card not found' });
        const isMember = card.list.board.members.some((m: any) => m.userId === req.userId);
        if (card.list.board.ownerId !== req.userId && !isMember) return res.status(403).json({ error: 'Access denied' });

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
            include: { list: { include: { board: { include: { members: true } } } } }
        });

        if (!card) return res.status(404).json({ error: 'Card not found' });
        const isMember = card.list.board.members.some((m: any) => m.userId === req.userId);
        if (card.list.board.ownerId !== req.userId && !isMember) return res.status(403).json({ error: 'Access denied' });

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
