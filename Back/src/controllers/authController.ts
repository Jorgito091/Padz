import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';
import { AppError } from '../utils/AppError';
import { catchAsync } from '../utils/catchAsync';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

export const register = catchAsync(async (req: Request, res: Response) => {
    const { email, password, name } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        throw new AppError('User already exists', 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            name
        }
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar }, token });
});

export const login = catchAsync(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        throw new AppError('Invalid credentials', 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw new AppError('Invalid credentials', 401);
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar }, token });
});

export const updateProfile = catchAsync(async (req: AuthRequest, res: Response) => {
    if (!req.userId) throw new AppError('Unauthorized', 401);

    const { name, avatar } = req.body;

    const updatedUser = await prisma.user.update({
        where: { id: req.userId },
        data: { name, avatar }
    });

    res.json({ user: { id: updatedUser.id, email: updatedUser.email, name: updatedUser.name, avatar: updatedUser.avatar } });
});
