import { io, Socket } from 'socket.io-client';

// Define the API URL (should match your backend URL)
const SOCKET_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001';

class SocketService {
    private socket: Socket | null = null;

    connect() {
        if (!this.socket) {
            this.socket = io(SOCKET_URL, {
                transports: ['websocket', 'polling'],
            });

            this.socket.on('connect', () => {
                console.log('Connected to socket server:', this.socket?.id);
            });
        }
        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    getSocket() {
        return this.socket;
    }

    joinUser(userId: string) {
        if (this.socket) {
            this.socket.emit('join-user', userId);
        }
    }

    joinBoard(boardId: string) {
        if (this.socket) {
            this.socket.emit('join-board', boardId);
        }
    }

    leaveBoard(boardId: string) {
        if (this.socket) {
            this.socket.emit('leave-board', boardId);
        }
    }
}

export const socketService = new SocketService();
