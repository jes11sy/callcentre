import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://callcentre.lead-schem.ru';

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    console.log('🔌 Initializing Socket.IO connection to:', SOCKET_URL);
    
    // Initialize socket connection
    socketRef.current = io(SOCKET_URL, {
      transports: ['polling', 'websocket'], // Try polling first, then upgrade to websocket
      withCredentials: true,
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: 5, // Limit attempts to avoid infinite retries
      timeout: 10000, // 10 second timeout
      autoConnect: true,
      forceNew: false
    });

    socketRef.current.on('connect', () => {
      console.log('✅ Socket.IO connected:', socketRef.current?.id);
      console.log('   Transport:', socketRef.current?.io.engine.transport.name);
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('❌ Socket.IO disconnected:', reason);
    });

    socketRef.current.on('connect_error', (error) => {
      console.warn('⚠️ Socket.IO connection error (это нормально, работает polling):', error.message);
    });

    socketRef.current.on('reconnect_attempt', (attemptNumber) => {
      console.log('🔄 Socket.IO reconnect attempt:', attemptNumber);
    });

    socketRef.current.on('reconnect_failed', () => {
      console.error('❌ Socket.IO reconnect failed after all attempts');
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        console.log('🔌 Disconnecting Socket.IO');
        socketRef.current.disconnect();
      }
    };
  }, []);

  return socketRef.current;
};

