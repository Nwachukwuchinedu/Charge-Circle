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
 * - `join_room`: Adds the user to an existing room.
 *
 * @param io - The Socket.io server instance
 * @param socket - The authenticated client socket
 */
export const setupRoomHandlers = (io: Server, socket: AuthSocket): void => {
  /**
   * Fetches all active (waiting / playing) rooms.
   */
  socket.on('get_rooms', async (_data: unknown, callback) => {
    try {
      const rooms = await RoomService.getRooms();
      SocketResponse.acknowledge(socket, callback, { success: true, rooms });
    } catch (error: any) {
      SocketResponse.acknowledge(socket, callback, { success: false, error: error.message, errorObj: error });
    }
  });

  /**
   * Creates a new room with an optional player limit.
   * The creator automatically joins the room.
   */
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

  /**
   * Joins an existing room by ID.
   */
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

  /**
   * Leaves an existing room by ID.
   */
  socket.on('leave_room', async (data: { roomId: string }, callback) => {
    try {
      const { roomId } = data;
      await RoomService.leaveRoom(roomId, socket.userId!);
      socket.leave(roomId);

      // Broadcast room update to remaining players
      const roomDetails = await RoomService.getRoomDetails(roomId);
      if (roomDetails) {
        SocketResponse.broadcast(io.to(roomId), roomId, 'room_state_update', roomDetails);
      }
      
      // Broadcast global rooms list update
      SocketResponse.broadcast(io, null, 'rooms_updated', null);

      if (callback) {
        callback({ success: true });
      }
    } catch (error: any) {
      if (callback) {
        callback({ success: false, error: error.message });
      }
    }
  });

  /**
   * Updates room metadata (name, maxPlayers).
   * Only the room owner may edit the room.
   */
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

  /**
   * Deletes a room and all associated data.
   * Only the room owner may delete the room.
   * All connected players receive a `room_deleted` event.
   */
  socket.on('delete_room', async (data: unknown, callback) => {
    try {
      const parsed = DeleteRoomDto.parse(data);
      await RoomService.deleteRoom(parsed.roomId, socket.userId!);
      // Notify all players currently in the room that it has been deleted
      SocketResponse.broadcast(io.to(parsed.roomId), parsed.roomId, 'room_deleted', { roomId: parsed.roomId });
      SocketResponse.broadcast(io, null, 'rooms_updated', null);
      SocketResponse.acknowledge(socket, callback, { success: true });
    } catch (error: any) {
      SocketResponse.acknowledge(socket, callback, { success: false, error: error.message, errorObj: error });
    }
  });
};
