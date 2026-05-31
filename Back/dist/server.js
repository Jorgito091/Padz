"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("./prisma"));
const boardRoutes_1 = __importDefault(require("./routes/boardRoutes"));
const listRoutes_1 = __importDefault(require("./routes/listRoutes"));
const cardRoutes_1 = __importDefault(require("./routes/cardRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const memberRoutes_1 = __importDefault(require("./routes/memberRoutes"));
const commentRoutes_1 = __importDefault(require("./routes/commentRoutes"));
const labelRoutes_1 = __importDefault(require("./routes/labelRoutes"));
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
const errorHandler_1 = require("./middleware/errorHandler");
dotenv_1.default.config();
const app = (0, express_1.default)();
// if behind a proxy (e.g., nginx, cloud), enable trust proxy for rate limiter
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3001;
const httpServer = (0, http_1.createServer)(app);
exports.io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: "*", // Replace with your frontend URL in production
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
    }
});
app.set('io', exports.io);
// Security: Helmet for secure headers
app.use((0, helmet_1.default)());
// Rate limiting: basic global limiter
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(limiter);
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
// Socket.io Authentication Middleware
exports.io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) {
        return next(new Error('Authentication error: Token missing'));
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        socket.data = { userId: decoded.userId };
        next();
    }
    catch (err) {
        return next(new Error('Authentication error: Invalid or expired token'));
    }
});
exports.io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id} for user ${socket.data.userId}`);
    socket.on("join-board", async (boardId) => {
        try {
            const board = await prisma_1.default.board.findUnique({
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
        }
        catch (error) {
            console.error('[Socket] Error on join-board:', error);
        }
    });
    socket.on("leave-board", (boardId) => {
        socket.leave(boardId);
        console.log(`Socket ${socket.id} left board ${boardId}`);
    });
    socket.on("join-user", (userId) => {
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
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/boards', boardRoutes_1.default);
app.use('/api/lists', listRoutes_1.default);
app.use('/api/cards', cardRoutes_1.default);
app.use('/api/members', memberRoutes_1.default);
app.use('/api/comments', commentRoutes_1.default);
app.use('/api/labels', labelRoutes_1.default);
app.use('/api/notifications', notificationRoutes_1.default);
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});
app.use(errorHandler_1.errorHandler);
httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
// restart
