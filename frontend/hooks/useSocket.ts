import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';
    const socketClient = io(socketUrl, {
      auth: { token }
    });

    socketClient.on('connect', () => {
      console.log('Socket connected securely');
      setConnected(true);
    });
    
    socketClient.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });
    
    socketClient.on('connect_error', (err) => {
      console.error('Socket connect error:', err.message);
    });

    setSocket(socketClient);

    return () => {
      socketClient.disconnect();
    };
  }, []);

  return { socket, connected };
}
