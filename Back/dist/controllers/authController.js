"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.logout = exports.refresh = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../prisma"));
const AppError_1 = require("../utils/AppError");
const catchAsync_1 = require("../utils/catchAsync");
const crypto_1 = __importDefault(require("crypto"));
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
const ACCESS_TOKEN_EXPIRY = (process.env.ACCESS_TOKEN_EXPIRY || '15m');
const REFRESH_TOKEN_EXPIRY_DAYS = parseInt(process.env.REFRESH_TOKEN_EXPIRY_DAYS || '30', 10);
function hashToken(token) {
    return crypto_1.default.createHash('sha256').update(token).digest('hex');
}
function generateRefreshToken() {
    return crypto_1.default.randomBytes(48).toString('hex');
}
exports.register = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { email, password, name } = req.body;
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
    const accessToken = jsonwebtoken_1.default.sign({ userId: user.id }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
    const refreshToken = generateRefreshToken();
    const tokenHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    await prisma_1.default.refreshToken.create({
        data: {
            tokenHash,
            userId: user.id,
            expiresAt
        }
    });
    res.status(201).json({ user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar }, accessToken, refreshToken });
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
    const accessToken = jsonwebtoken_1.default.sign({ userId: user.id }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
    const refreshToken = generateRefreshToken();
    const tokenHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    await prisma_1.default.refreshToken.create({
        data: {
            tokenHash,
            userId: user.id,
            expiresAt
        }
    });
    res.json({ user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar }, accessToken, refreshToken });
});
exports.refresh = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken)
        throw new AppError_1.AppError('Refresh token required', 400);
    const tokenHash = hashToken(refreshToken);
    const stored = await prisma_1.default.refreshToken.findUnique({ where: { tokenHash } });
    if (!stored || stored.revoked)
        throw new AppError_1.AppError('Invalid refresh token', 401);
    if (stored.expiresAt < new Date())
        throw new AppError_1.AppError('Refresh token expired', 401);
    // rotate: revoke old and create new
    await prisma_1.default.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });
    const newRefreshToken = generateRefreshToken();
    const newHash = hashToken(newRefreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    await prisma_1.default.refreshToken.create({ data: { tokenHash: newHash, userId: stored.userId, expiresAt } });
    const accessToken = jsonwebtoken_1.default.sign({ userId: stored.userId }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
    res.json({ accessToken, refreshToken: newRefreshToken });
});
exports.logout = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken)
        return res.status(204).send();
    const tokenHash = hashToken(refreshToken);
    const stored = await prisma_1.default.refreshToken.findUnique({ where: { tokenHash } });
    if (stored) {
        await prisma_1.default.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });
    }
    res.status(204).send();
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
