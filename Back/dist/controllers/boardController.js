"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBoardById = exports.createBoard = exports.getBoards = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getBoards = async (req, res) => {
    try {
        const boards = await prisma_1.default.board.findMany({
            where: { ownerId: req.userId },
            include: { lists: { include: { cards: true } } },
        });
        res.json(boards);
    }
    catch (error) {
        res.status(500).json({ error: 'Error fetching boards' });
    }
};
exports.getBoards = getBoards;
const createBoard = async (req, res) => {
    const { title, bgImage } = req.body;
    try {
        if (!req.userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const board = await prisma_1.default.board.create({
            data: {
                title,
                bgImage,
                ownerId: req.userId
            },
        });
        res.status(201).json(board);
    }
    catch (error) {
        res.status(500).json({ error: 'Error creating board' });
    }
};
exports.createBoard = createBoard;
const getBoardById = async (req, res) => {
    const { id } = req.params;
    try {
        const board = await prisma_1.default.board.findUnique({
            where: { id },
            include: { lists: { include: { cards: true }, orderBy: { order: 'asc' } } },
        });
        if (!board)
            return res.status(404).json({ error: 'Board not found' });
        res.json(board);
    }
    catch (error) {
        res.status(500).json({ error: 'Error fetching board' });
    }
};
exports.getBoardById = getBoardById;
