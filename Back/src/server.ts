import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
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
const PORT = process.env.PORT || 3001;

const httpServer = createServer(app);
export const io = new Server(httpServer, {
    cors: {
        origin: "*", // Replace with your frontend URL in production
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
    }
});

io.on("connection", (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on("join-board", (boardId: string) => {
        socket.join(boardId);
        console.log(`Socket ${socket.id} joined board ${boardId}`);
    });

    socket.on("leave-board", (boardId: string) => {
        socket.leave(boardId);
        console.log(`Socket ${socket.id} left board ${boardId}`);
    });

    socket.on("join-user", (userId: string) => {
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
