import { useCallback } from 'react';
import { Socket } from 'socket.io-client';

export function useChatSocket(socket: Socket | null) {
  const sendMessage = useCallback((roomId: string, message: string) => {
    if (!socket) return;
    socket.emit('send_chat', { roomId, message });
  }, [socket]);

  return { sendMessage };
}
