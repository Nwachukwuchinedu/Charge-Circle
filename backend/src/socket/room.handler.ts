import { Server } from 'socket.io';
import { AuthSocket } from './auth.socket.js';
import { RoomService } from '../services/room.service.js';
import { SocketResponse } from '../utils/socketResponse.js';
import { AppError } from '../utils/errors.js';
import { CreateRoomDto, JoinRoomDto, UpdateRoomDto, DeleteRoomDto } from '../dto/room.dto.js';

/**
 * Registers room-management Socket.io event handlers on the given socket.
 *
 * Events:
 * - `get_rooms`: Returns the list of active rooms.
 * - `create_room`: Creates a new room and joins the creator to it.
 * - `join_room`: Adds the user to an existing room and creates their GameState.
 * - `start_round`: Owner-only — starts a timed round for all players.
 * - `get_leaderboard`: Returns top players sorted by score.
 *
 * @param io - The Socket.io server instance
 * @param socket - The authenticated client socket
 */
export const setupRoomHandlers = (io: Server, socket: AuthSocket): void => {
  socket.on('get_rooms', async (_data: unknown, callback) => {
    try {
      const rooms = await RoomService.getRooms();
      SocketResponse.acknowledge(socket, callback, { success: true, rooms });
    } catch (error: any) {
      SocketResponse.acknowledge(socket, callback, { success: false, error: error.message, errorObj: error });
    }
  });

  socket.on('create_room', async (data: unknown, callback) => {
    try {
      const parsed = CreateRoomDto.parse(data);
      const room = await RoomService.createRoom(socket.userId!, parsed.name, parsed.maxPlayers ?? null);
      socket.join(room.id);
      SocketResponse.broadcast(io, null, 'rooms_updated', null);
      SocketResponse.acknowledge(socket, callback, { success: true, room });
    } catch (error: any) {
      SocketResponse.acknowledge(socket, callback, { success: false, error: error.message, errorObj: error });
    }
  });

  socket.on('join_room', async (data: unknown, callback) => {
    try {
      const parsed = JoinRoomDto.parse(data);
      const room = await RoomService.joinRoom(parsed.roomId, socket.userId!);
      if (!room) throw new AppError('Failed to join room');
      socket.join(room.id);
      SocketResponse.broadcast(io.to(room.id), room.id, 'room_state_update', room);
      SocketResponse.broadcast(io, null, 'rooms_updated', null);
      SocketResponse.acknowledge(socket, callback, { success: true, room });
    } catch (error: any) {
      SocketResponse.acknowledge(socket, callback, { success: false, error: error.message, errorObj: error });
    }
  });

  socket.on('leave_room', async (data: { roomId: string }, callback) => {
    try {
      const { roomId } = data;
      await RoomService.leaveRoom(roomId, socket.userId!);
      socket.leave(roomId);
      SocketResponse.broadcast(io, null, 'rooms_updated', null);
      if (callback) callback({ success: true });
    } catch (error: any) {
      if (callback) callback({ success: false, error: error.message });
    }
  });

  socket.on('update_room', async (data: unknown, callback) => {
    try {
      const parsed = UpdateRoomDto.parse(data);
      const room = await RoomService.updateRoom(parsed.roomId, socket.userId!, {
        name: parsed.name,
        maxPlayers: parsed.maxPlayers,
      });
      SocketResponse.broadcast(io.to(parsed.roomId), parsed.roomId, 'room_state_update', room);
      SocketResponse.broadcast(io, null, 'rooms_updated', null);
      SocketResponse.acknowledge(socket, callback, { success: true, room });
    } catch (error: any) {
      SocketResponse.acknowledge(socket, callback, { success: false, error: error.message, errorObj: error });
    }
  });

  socket.on('delete_room', async (data: unknown, callback) => {
    try {
      const parsed = DeleteRoomDto.parse(data);
      await RoomService.deleteRoom(parsed.roomId, socket.userId!);
      SocketResponse.broadcast(io.to(parsed.roomId), parsed.roomId, 'room_deleted', { roomId: parsed.roomId });
      SocketResponse.broadcast(io, null, 'rooms_updated', null);
      SocketResponse.acknowledge(socket, callback, { success: true });
    } catch (error: any) {
      SocketResponse.acknowledge(socket, callback, { success: false, error: error.message, errorObj: error });
    }
  });

  socket.on('start_round', async (data: { roomId: string }, callback) => {
    try {
      await RoomService.startRound(data.roomId, socket.userId!);
      const room = await RoomService.getRoomDetails(data.roomId);
      SocketResponse.broadcast(io.to(data.roomId), data.roomId, 'round_start', { room });
      SocketResponse.broadcast(io, null, 'rooms_updated', null);
      if (callback) callback({ success: true });
    } catch (error: any) {
      if (callback) callback({ success: false, error: error.message });
    }
  });

  socket.on('get_leaderboard', async (data: { roomId: string }, callback) => {
    try {
      const result = await RoomService.getLeaderboard(data.roomId, socket.userId!);
      if (callback) callback({ success: true, ...result });
    } catch (error: any) {
      if (callback) callback({ success: false, error: error.message });
    }
  });
};
