import { useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { useRouter } from 'next/navigation';
import { GameState, Room, GameStateDelta, ChatMessage, LeaderboardEntry } from '../app/types';

interface SocketAck<T = unknown> {
  success: boolean;
  error?: string;
  room?: T;
}

interface UseGameSocketOptions {
  socket: Socket | null;
  connected: boolean;
  roomId: string | null;
  userId: string | undefined;
  onRoomUpdate: (room: Room, gameState?: GameState, chatMessages?: ChatMessage[]) => void;
  onGameStateDelta: (delta: GameStateDelta) => void;
  onChatMessage: (msg: ChatMessage) => void;
  onLeaderboard: (entries: LeaderboardEntry[]) => void;
  onError: (message: string) => void;
}

export function useGameSocket(options: UseGameSocketOptions) {
  const { socket, connected, roomId, userId, onRoomUpdate, onGameStateDelta, onChatMessage, onLeaderboard, onError } = options;
  const router = useRouter();
  const joinedOnce = useRef(false);

  useEffect(() => {
    if (socket && connected && roomId && userId && !joinedOnce.current) {
      joinedOnce.current = true;

      socket.emit('join_room', { roomId }, (response: SocketAck<Room>) => {
        if (!response.success || !response.room) { onError(response.error || 'Failed to join room'); return; }
        onRoomUpdate(response.room,
          response.room.gameStates?.find((gs: GameState) => gs.userId === userId),
          response.room.chatMessages,
        );
      });

      const playerDeltaEvent = `player_delta:${userId}`;

      socket.on('room_state_update', (updatedRoom: Room) => {
        onRoomUpdate(updatedRoom,
          updatedRoom.gameStates?.find((gs: GameState) => gs.userId === userId),
          updatedRoom.chatMessages,
        );
      });

      socket.on(playerDeltaEvent, (delta: GameStateDelta) => {
        onGameStateDelta(delta);
      });

      socket.on('chat_message', (msg: ChatMessage) => {
        onChatMessage(msg);
      });

      socket.on('leaderboard_update', (data: { leaderboard: LeaderboardEntry[] }) => {
        onLeaderboard(data.leaderboard);
      });

      socket.on('round_start', (data: { room: Room }) => {
        onRoomUpdate(data.room,
          data.room.gameStates?.find((gs: GameState) => gs.userId === userId),
        );
      });

      socket.on('round_end', () => {
        onRoomUpdate({ status: 'lobby' } as Room);
      });

      socket.on('game_error', (data: { message: string }) => {
        onError(data.message);
      });

      socket.on('room_deleted', (data: { roomId: string }) => {
        if (data.roomId === roomId) router.push('/lobby');
      });

      return () => {
        socket.off('room_state_update');
        socket.off(playerDeltaEvent);
        socket.off('chat_message');
        socket.off('leaderboard_update');
        socket.off('round_start');
        socket.off('round_end');
        socket.off('game_error');
        socket.off('room_deleted');
      };
    }
  }, [socket, connected, roomId, userId, onRoomUpdate, onGameStateDelta, onChatMessage, onLeaderboard, onError, router]);

  const emitMove = useCallback((newX: number, newY: number) => {
    if (socket && connected && roomId) {
      socket.emit('move_piece', { roomId, toX: newX, toY: newY });
    }
  }, [socket, connected, roomId]);

  const emitLeaveRoom = useCallback(() => {
    if (socket && connected && roomId) {
      socket.emit('leave_room', { roomId }, () => router.push('/lobby'));
    } else {
      router.push('/lobby');
    }
  }, [socket, connected, roomId, router]);

  const emitStartRound = useCallback(() => {
    if (!socket || !connected || !roomId) return;
    socket.emit('start_round', { roomId }, (response: SocketAck) => {
      if (!response.success) onError(response.error || 'Failed to start round');
    });
  }, [socket, connected, roomId, onError]);

  return { emitMove, emitLeaveRoom, emitStartRound };
}
