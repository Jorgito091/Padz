import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { createServer, Server as HttpServer } from 'http';
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

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

/**
 * Creates and configures the Express app and the associated HTTP & Socket.io servers.
 * This function is used both in production (when the file is run directly) and in tests.
 */
export function createApp() {
  const app = express();
  // Trust proxy if behind Nginx/Cloud
  app.set('trust proxy', 1);

  // Security middlewares
  app.use(helmet());
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);
  app.use(cors());
  app.use(express.json());

  // HTTP server & Socket.io
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    },
  });
  app.set('io', io);

  // Socket.io authentication middleware
  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) {
      return next(new Error('Authentication error: Token missing'));
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      // @ts-ignore – we add a custom field to socket data
      socket.data = { userId: decoded.userId };
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid or expired token'));
    }
  });

  // Socket.io event handlers
  io.on('connection', (socket: Socket) => {
    console.log(`Socket connected: ${socket.id} for user ${socket.data.userId}`);

    socket.on('join-board', async (boardId: string) => {
      try {
        const board = await prisma.board.findUnique({
          where: { id: boardId },
          include: { members: true },
        });
        if (!board) {
          console.warn(`[Socket] Board ${boardId} not found`);
          return;
        }
        const isOwner = board.ownerId === socket.data.userId;
        const isMember = board.members.some((m) => m.userId === socket.data.userId);
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

    socket.on('leave-board', (boardId: string) => {
      socket.leave(boardId);
      console.log(`Socket ${socket.id} left board ${boardId}`);
    });

    socket.on('join-user', (userId: string) => {
      if (socket.data.userId !== userId) {
        console.warn(`[Socket] User ${socket.data.userId} tried to join private user room ${userId}`);
        return;
      }
      socket.join(userId);
      console.log(`Socket ${socket.id} joined user room ${userId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/boards', boardRoutes);
  app.use('/api/lists', listRoutes);
  app.use('/api/cards', cardRoutes);
  app.use('/api/members', memberRoutes);
  app.use('/api/comments', commentRoutes);
  app.use('/api/labels', labelRoutes);
  app.use('/api/notifications', notificationRoutes);

  // Health endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Error handling middleware
  app.use(errorHandler);

  // Attach the io instance to the http server for easy access in tests
  (httpServer as any).io = io;

  return { app, server: httpServer, io };
}

// If this file is executed directly, start the server.
if (require.main === module) {
  const { server } = createApp();
  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
