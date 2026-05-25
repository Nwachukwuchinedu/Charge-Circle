import { useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { useRouter } from 'next/navigation';
import { toast } from '../app/components/ui';
import { Room } from '../app/types';

interface SocketAck<T = unknown> {
  success: boolean;
  error?: string;
  room?: T;
}

interface CreateRoomPayload {
  name: string;
  maxPlayers: number | null;
}

interface UpdateRoomPayload {
  roomId: string;
  name: string;
  maxPlayers: number | null;
}

export function useRoomOperations(socket: Socket | null) {
  const router = useRouter();

  const createRoom = useCallback(({ name, maxPlayers }: CreateRoomPayload) => {
    if (!socket) return;
    socket.emit('create_room', { name, maxPlayers }, (response: SocketAck<Room>) => {
      if (response.success && response.room) {
        router.push(`/game?roomId=${response.room.id}`);
      } else {
        toast.error(response.error || 'Failed to create room');
      }
    });
  }, [socket, router]);

  const joinRoom = useCallback((roomId: string) => {
    if (!socket) return;
    socket.emit('join_room', { roomId }, (response: SocketAck) => {
      if (response.success) {
        router.push(`/game?roomId=${roomId}`);
      } else {
        toast.error(response.error || 'Failed to join room');
      }
    });
  }, [socket, router]);

  const updateRoom = useCallback(({ roomId, name, maxPlayers }: UpdateRoomPayload) => {
    if (!socket) return;
    socket.emit('update_room', { roomId, name, maxPlayers }, (response: SocketAck) => {
      if (!response.success) {
        toast.error(response.error || 'Failed to update room');
      }
    });
  }, [socket]);

  const deleteRoom = useCallback((roomId: string) => {
    if (!socket) return;
    socket.emit('delete_room', { roomId }, (response: SocketAck) => {
      if (!response.success) {
        toast.error(response.error || 'Failed to delete room');
      }
    });
  }, [socket]);

  return { createRoom, joinRoom, updateRoom, deleteRoom };
}
