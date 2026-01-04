import { Request, Response } from 'express';
import prisma from '../prisma';

export const getBoards = async (req: Request, res: Response) => {
    try {
        const boards = await prisma.board.findMany({
            include: { lists: { include: { cards: true } } },
        });
        res.json(boards);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching boards' });
    }
};

export const createBoard = async (req: Request, res: Response) => {
    const { title, bgImage } = req.body;
    try {
        const board = await prisma.board.create({
            data: { title, bgImage },
        });
        res.status(201).json(board);
    } catch (error) {
        res.status(500).json({ error: 'Error creating board' });
    }
};

export const getBoardById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const board = await prisma.board.findUnique({
            where: { id },
            include: { lists: { include: { cards: true }, orderBy: { order: 'asc' } } },
        });
        if (!board) return res.status(404).json({ error: 'Board not found' });
        res.json(board);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching board' });
    }
};
