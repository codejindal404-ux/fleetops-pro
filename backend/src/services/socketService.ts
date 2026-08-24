import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.ts';
import { Role } from '../types/index.ts';

let io: SocketIOServer | null = null;

export interface SocketUserPayload {
  userId: string;
  role: Role;
  email?: string;
  name?: string;
}

export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        callback(null, true);
      },
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      credentials: true
    },
    path: '/socket.io',
    transports: ['websocket', 'polling']
  });

  io.use((socket: Socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '') ||
      (socket.handshake.query?.token as string);

    if (!token) {
      (socket as any).user = null;
      return next();
    }

    try {
      const decoded = jwt.verify(token, config.jwtSecret) as SocketUserPayload;
      (socket as any).user = decoded;
      next();
    } catch (err) {
      (socket as any).user = null;
      next();
    }
  });

  io.on('connection', (socket: Socket) => {
    const user: SocketUserPayload | null = (socket as any).user;

    if (user && user.userId) {
      socket.join(`user:${user.userId}`);
      if (user.role) {
        socket.join(`role:${user.role}`);
      }
    }

    socket.on('register_user', (userData: { userId: string; role: Role }) => {
      if (userData?.userId) {
        socket.join(`user:${userData.userId}`);
        if (userData.role) {
          socket.join(`role:${userData.role}`);
        }
      }
    });

    socket.on('disconnect', (reason) => {
      // Clean disconnect handling
    });
  });

  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

export function sendToUser(userId: string, event: string, payload: any) {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, payload);
}

export function sendToRole(role: Role, event: string, payload: any) {
  if (!io) return;
  io.to(`role:${role}`).emit(event, payload);
}

export function broadcastEvent(event: string, payload: any) {
  if (!io) return;
  io.emit(event, payload);
}
