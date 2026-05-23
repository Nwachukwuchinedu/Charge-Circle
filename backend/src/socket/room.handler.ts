import { Server } from 'socket.io';
import { AuthSocket } from './auth.socket.js';
import { RoomService } from '../services/room.service.js';
import { SocketResponse } from '../utils/socketResponse.js';

export const setupRoomHandlers = (io: Server, socket: AuthSocket) => {
  socket.on('get_rooms', async (data: any, callback) => {
    try {
      const rooms = await RoomService.getRooms();
      SocketResponse.acknowledge(socket, callback, { success: true, rooms });
    } catch (error: any) {
      SocketResponse.acknowledge(socket, callback, { success: false, error: error.message });
    }
  });

  socket.on('create_room', async (data: { name: string }, callback) => {
    try {
      const room = await RoomService.createRoom(socket.userId!, data.name);
      socket.join(room.id);
      SocketResponse.broadcast(io, null, 'rooms_updated', null); // Notify all clients to fetch updated room list
      SocketResponse.acknowledge(socket, callback, { success: true, room });
    } catch (error: any) {
      SocketResponse.acknowledge(socket, callback, { success: false, error: error.message });
    }
  });

  socket.on('join_room', async (data: { roomId: string }, callback) => {
    try {
      const room = await RoomService.joinRoom(data.roomId, socket.userId!);
      if (!room) throw new Error('Failed to join room');
      socket.join(room.id);
      SocketResponse.broadcast(io.to(room.id), room.id, 'room_state_update', room);
      SocketResponse.broadcast(io, null, 'rooms_updated', null);
      SocketResponse.acknowledge(socket, callback, { success: true, room });
    } catch (error: any) {
      SocketResponse.acknowledge(socket, callback, { success: false, error: error.message });
    }
  });
};
