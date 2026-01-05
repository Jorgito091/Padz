"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteList = exports.updateList = exports.createList = exports.getLists = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getLists = async (req, res) => {
    const { boardId } = req.query;
    try {
        const lists = await prisma_1.default.list.findMany({
            where: boardId ? { boardId: String(boardId) } : {},
            include: { cards: { orderBy: { order: 'asc' } } },
            orderBy: { order: 'asc' },
        });
        res.json(lists);
    }
    catch (error) {
        res.status(500).json({ error: 'Error fetching lists' });
    }
};
exports.getLists = getLists;
const createList = async (req, res) => {
    const { title, order, boardId } = req.body;
    try {
        const list = await prisma_1.default.list.create({
            data: { title, order, boardId },
        });
        res.status(201).json(list);
    }
    catch (error) {
        res.status(500).json({ error: 'Error creating list' });
    }
};
exports.createList = createList;
const updateList = async (req, res) => {
    const { id } = req.params;
    const { title, order } = req.body;
    try {
        const list = await prisma_1.default.list.update({
            where: { id },
            data: { title, order },
        });
        res.json(list);
    }
    catch (error) {
        res.status(500).json({ error: 'Error updating list' });
    }
};
exports.updateList = updateList;
const deleteList = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma_1.default.list.delete({ where: { id } });
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: 'Error deleting list' });
    }
};
exports.deleteList = deleteList;
