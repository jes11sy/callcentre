import { Server } from 'socket.io';

// Socket.IO instance will be initialized in index.ts
let io: Server | null = null;

export const setSocketIO = (instance: Server) => {
  io = instance;
};

export const getSocketIO = (): Server => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

