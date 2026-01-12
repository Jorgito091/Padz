import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../prisma';

export const getBoards = async (req: AuthRequest, res: Response) => {
    try {
        const boards = await prisma.board.findMany({
            where: { ownerId: req.userId },
            include: {
                lists: { include: { cards: true } }
            },
        });
        res.json(boards);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching boards' });
    }
};

export const createBoard = async (req: AuthRequest, res: Response) => {
    const { title, bgImage, bgColor, description } = req.body;
    try {
        if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

        const board = await prisma.board.create({
            data: {
                title,
                bgImage,
                bgColor,
                description,
                ownerId: req.userId
            },
        });
        res.status(201).json(board);
    } catch (error) {
        res.status(500).json({ error: 'Error creating board' });
    }
};

export const updateBoard = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { title, bgImage, bgColor, description } = req.body;

    try {
        const board = await prisma.board.findUnique({ where: { id } });

        if (!board) return res.status(404).json({ error: 'Board not found' });
        if (board.ownerId !== req.userId) return res.status(403).json({ error: 'Access denied' });

        const updatedBoard = await prisma.board.update({
            where: { id },
            data: {
                title,
                bgImage,
                bgColor,
                description
            }
        });

        res.json(updatedBoard);
    } catch (error) {
        res.status(500).json({ error: 'Error updating board' });
    }
};

export const getBoardById = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    try {
        const board = await prisma.board.findUnique({
            where: { id },
            include: {
                lists: {
                    include: { cards: true },
                    orderBy: { order: 'asc' }
                }
            },
        });

        if (!board) return res.status(404).json({ error: 'Board not found' });

        // Ownership check
        if (board.ownerId !== req.userId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json(board);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching board' });
    }
};
