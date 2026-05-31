import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import prisma from './prisma';

import boardRoutes from './routes/boardRoutes';
import listRoutes from './routes/listRoutes';
import cardRoutes from './routes/cardRoutes';
import authRoutes from './routes/authRoutes';
import memberRoutes from './routes/memberRoutes';
import commentRoutes from './routes/commentRoutes';
import labelRoutes from './routes/labelRoutes';
import notificationRoutes from './routes/notificationRoutes';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
// if behind a proxy (e.g., nginx, cloud), enable trust proxy for rate limiter
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3001;

const httpServer = createServer(app);
export const io = new Server(httpServer, {
    cors: {
        origin: "*", // Replace with your frontend URL in production
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
    }
});

app.set('io', io);

// Security: Helmet for secure headers
app.use(helmet());

// Rate limiting: basic global limiter
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(limiter);

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// Socket.io Authentication Middleware
io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) {
        return next(new Error('Authentication error: Token missing'));
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        socket.data = { userId: decoded.userId };
        next();
    } catch (err) {
        return next(new Error('Authentication error: Invalid or expired token'));
    }
});

io.on("connection", (socket: Socket) => {
    console.log(`Socket connected: ${socket.id} for user ${socket.data.userId}`);

    socket.on("join-board", async (boardId: string) => {
        try {
            const board = await prisma.board.findUnique({
                where: { id: boardId },
                include: { members: true }
            });
            if (!board) {
                console.warn(`[Socket] Board ${boardId} not found`);
                return;
            }
            const isOwner = board.ownerId === socket.data.userId;
            const isMember = board.members.some(m => m.userId === socket.data.userId);
            if (!isOwner && !isMember) {
                console.warn(`[Socket] Access denied to user ${socket.data.userId} for board ${boardId}`);
                return;
            }
            socket.join(boardId);
            console.log(`Socket ${socket.id} joined board ${boardId}`);
        } catch (error) {
            console.error('[Socket] Error on join-board:', error);
        }
    });

    socket.on("leave-board", (boardId: string) => {
        socket.leave(boardId);
        console.log(`Socket ${socket.id} left board ${boardId}`);
    });

    socket.on("join-user", (userId: string) => {
        if (socket.data.userId !== userId) {
            console.warn(`[Socket] User ${socket.data.userId} tried to join private user room ${userId}`);
            return;
        }
        socket.join(userId);
        console.log(`Socket ${socket.id} joined user room ${userId}`);
    });

    socket.on("disconnect", () => {
        console.log(`Socket disconnected: ${socket.id}`);
    });
});

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/lists', listRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/labels', labelRoutes);
app.use('/api/notifications', notificationRoutes);


app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.use(errorHandler);

httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
// restart
