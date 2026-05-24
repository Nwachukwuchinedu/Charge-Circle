import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { setRefreshFn } from '../lib/api';
import { useAuth } from './useAuth';

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const { refreshTokens } = useAuth();

  useEffect(() => {
    setRefreshFn(refreshTokens);
  }, [refreshTokens]);

  useEffect(() => {
    const getAccessToken = () =>
      typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

    const token = getAccessToken();
    if (!token) return;

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';
    const socketClient = io(socketUrl, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketClient.on('connect', () => {
      console.log('Socket connected securely');
      setConnected(true);
    });

    socketClient.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    socketClient.on('connect_error', async (err) => {
      console.error('Socket connect error:', err.message);

      if (err.message.includes('Authentication') || err.message.includes('token')) {
        const newToken = await refreshTokens();
        if (newToken) {
          socketClient.auth = { token: newToken };
          socketClient.connect();
        }
      }
    });

    setSocket(socketClient);

    return () => {
      socketClient.disconnect();
    };
  }, []);

  return { socket, connected };
}
