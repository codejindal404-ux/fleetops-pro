import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.ts';
import { Role } from '../types.ts';

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
        // Accept requests matching app configurations
        callback(null, true);
      },
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      credentials: true
    },
    path: '/socket.io',
    transports: ['websocket', 'polling']
  });

  // Socket Authentication & Room Joining Middleware
  io.use((socket: Socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '') ||
      (socket.handshake.query?.token as string);

    if (!token) {
      // Allow unauthenticated connection for guest socket ping if needed, but mark as guest
      (socket as any).user = null;
      return next();
    }

    try {
      const decoded = jwt.verify(token, config.jwtSecret) as SocketUserPayload;
      (socket as any).user = decoded;
      next();
    } catch (err) {
      console.warn('Socket token verification failed, connecting as guest');
      (socket as any).user = null;
      next();
    }
  });

  io.on('connection', (socket: Socket) => {
    const user: SocketUserPayload | null = (socket as any).user;

    if (user && user.userId) {
      // Join user specific room
      socket.join(`user:${user.userId}`);
      // Join role specific room (e.g. role:ADMIN, role:MECHANIC, role:CUSTOMER)
      if (user.role) {
        socket.join(`role:${user.role}`);
      }
      console.log(`[Socket.IO] User ${user.name || user.userId} (${user.role}) connected: ${socket.id}`);
    } else {
      console.log(`[Socket.IO] Anonymous client connected: ${socket.id}`);
    }

    // Allow client to manually register user ID after login
    socket.on('register_user', (userData: { userId: string; role: Role }) => {
      if (userData?.userId) {
        socket.join(`user:${userData.userId}`);
        if (userData.role) {
          socket.join(`role:${userData.role}`);
        }
        console.log(`[Socket.IO] Socket ${socket.id} joined rooms: user:${userData.userId}, role:${userData.role}`);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket.IO] Client disconnected (${socket.id}): ${reason}`);
    });
  });

  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

/**
 * Send real-time event to a specific user
 */
export function sendToUser(userId: string, event: string, payload: any) {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, payload);
}

/**
 * Send real-time event to all users of a specific role
 */
export function sendToRole(role: Role, event: string, payload: any) {
  if (!io) return;
  io.to(`role:${role}`).emit(event, payload);
}

/**
 * Broadcast event to all connected clients
 */
export function broadcastEvent(event: string, payload: any) {
  if (!io) return;
  io.emit(event, payload);
}
