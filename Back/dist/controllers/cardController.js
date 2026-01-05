"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCard = exports.updateCard = exports.createCard = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const createCard = async (req, res) => {
    const { title, description, order, listId } = req.body;
    try {
        const card = await prisma_1.default.card.create({
            data: { title, description, order, listId },
        });
        res.status(201).json(card);
    }
    catch (error) {
        res.status(500).json({ error: 'Error creating card' });
    }
};
exports.createCard = createCard;
const updateCard = async (req, res) => {
    const { id } = req.params;
    const { title, description, order, listId } = req.body;
    try {
        const card = await prisma_1.default.card.update({
            where: { id },
            data: { title, description, order, listId },
        });
        res.json(card);
    }
    catch (error) {
        res.status(500).json({ error: 'Error updating card' });
    }
};
exports.updateCard = updateCard;
const deleteCard = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma_1.default.card.delete({ where: { id } });
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: 'Error deleting card' });
    }
};
exports.deleteCard = deleteCard;
