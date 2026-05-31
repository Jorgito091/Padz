import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';

import { Server } from 'http';

import { io as ClientIO } from 'socket.io-client';
import request from 'supertest';
import { createApp } from '../../src/server'; // assumes server exports a function to create app & http server

describe('Auth ↔ Socket integration', () => {
  let httpServer: Server;
  let clientSocket: ReturnType<typeof ClientIO>;

  beforeAll(async () => {
    // Initialize the Express app and attach Socket.io
    const { app, server } = createApp(); // app = Express instance, server = http.Server
    httpServer = server.listen(0); // random free port

    const testEmail = `test${Date.now()}@example.com`;
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ email: testEmail, password: 'Abc!1234', name: 'Test User' })
      .expect(201);
    const { accessToken } = registerRes.body;

    // Connect client socket using the obtained token
    const address = `http://localhost:${(httpServer.address() as any).port}`;
    clientSocket = ClientIO(address, {
      auth: { token: accessToken },
      transports: ['websocket'],
    });

    await new Promise<void>((resolve, reject) => {
      clientSocket.on('connect', () => resolve());
      clientSocket.on('connect_error', (err) => reject(err));
    });
  });

  afterAll(async () => {
    clientSocket.disconnect();
    await new Promise((resolve) => httpServer.close(() => resolve(null)));
  });

  test('socket receives notification after board event', async () => {
    // Simulate a board event that triggers a notification on the server side
    // Here we directly emit a notification via the server's io instance
    const notification = { message: 'Test notification', boardId: 'board-123' };
    // Access server.io (socket.io instance) – assuming it is exported from createApp
    const { io } = (httpServer as any);
    io.emit('notification', notification);

    const received = await new Promise<any>((resolve) => {
      clientSocket.once('notification', (data: any) => resolve(data));
    });

    expect(received).toMatchObject(notification);
  });
});
