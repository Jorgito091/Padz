"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../prisma"));
const AppError_1 = require("../utils/AppError");
const catchAsync_1 = require("../utils/catchAsync");
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
exports.register = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
        throw new AppError_1.AppError('Email, password and name are required', 400);
    }
    const existingUser = await prisma_1.default.user.findUnique({ where: { email } });
    if (existingUser) {
        throw new AppError_1.AppError('User already exists', 400);
    }
    const hashedPassword = await bcryptjs_1.default.hash(password, 10);
    const user = await prisma_1.default.user.create({
        data: {
            email,
            password: hashedPassword,
            name
        }
    });
    const token = jsonwebtoken_1.default.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar }, token });
});
exports.login = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma_1.default.user.findUnique({ where: { email } });
    if (!user) {
        throw new AppError_1.AppError('Invalid credentials', 401);
    }
    const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
    if (!isPasswordValid) {
        throw new AppError_1.AppError('Invalid credentials', 401);
    }
    const token = jsonwebtoken_1.default.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar }, token });
});
exports.updateProfile = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.userId)
        throw new AppError_1.AppError('Unauthorized', 401);
    const { name, avatar } = req.body;
    const updatedUser = await prisma_1.default.user.update({
        where: { id: req.userId },
        data: { name, avatar }
    });
    res.json({ user: { id: updatedUser.id, email: updatedUser.email, name: updatedUser.name, avatar: updatedUser.avatar } });
});
