"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
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
const PORT = process.env.PORT || 3001;
const httpServer = (0, http_1.createServer)(app);
exports.io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: "*", // Replace with your frontend URL in production
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
    }
});
app.set('io', exports.io);
exports.io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);
    socket.on("join-board", (boardId) => {
        socket.join(boardId);
        console.log(`Socket ${socket.id} joined board ${boardId}`);
    });
    socket.on("leave-board", (boardId) => {
        socket.leave(boardId);
        console.log(`Socket ${socket.id} left board ${boardId}`);
    });
    socket.on("join-user", (userId) => {
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
