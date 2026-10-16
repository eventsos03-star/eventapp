import type { Server as HttpServer } from 'http';
import { Server, type Socket } from 'socket.io';
import { env } from '../config/env.js';
import { USER_STATUS } from '../constants/index.js';
import { verifySocketTicket } from '../services/token.service.js';
import User from '../modules/auth/user.model.js';

let io: Server | null = null;

export const userRoom = (userId: string): string => `user:${userId}`;

export function getIO(): Server {
  if (!io) throw new Error('Socket.IO has not been initialized');
  return io;
}

export function emitToUser(userId: string, event: string, payload: unknown): void {
  if (!io) return;
  io.to(userRoom(userId)).emit(event, payload);
}

export function initSocket(server: HttpServer): Server {
  io = new Server(server, {
    path: '/socket.io',
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
    },
  });

  // Authenticate the handshake. Identity comes ONLY from the signed ticket.
  io.use(async (socket: Socket, next) => {
    try {
      const ticket = socket.handshake.auth?.ticket as string | undefined;
      if (!ticket) return next(new Error('Missing socket ticket'));

      let payload: { id: string };
      try {
        payload = verifySocketTicket(ticket);
      } catch {
        return next(new Error('Invalid or expired socket ticket'));
      }

      const user = await User.findById(payload.id).where({
        $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
      });

      if (!user) return next(new Error('Unauthorized'));
      if (user.status !== USER_STATUS.ACTIVE) {
        return next(new Error('Account is not active'));
      }

      socket.data.userId = user.id;
      next();
    } catch (error) {
      console.error(
        '[socket] auth failure:',
        error instanceof Error ? error.message : error,
      );
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId as string;
    socket.join(userRoom(userId));
    console.log(`[socket] user ${userId} connected (${socket.id})`);

    socket.on('disconnect', (reason) => {
      console.log(`[socket] user ${userId} disconnected (${socket.id}): ${reason}`);
    });
  });

  return io;
}

export async function closeSocket(): Promise<void> {
  if (!io) return;
  await new Promise<void>((resolve) => {
    io!.close(() => resolve());
  });
  io = null;
}
