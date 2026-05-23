import { Server } from 'socket.io';
import { AuthSocket } from './auth.socket.js';
import { GameService } from '../services/game.service.js';

export const setupGameHandlers = (io: Server, socket: AuthSocket) => {
  socket.on('move_piece', async (data: { roomId: string, toX: number, toY: number }) => {
    try {
      const newState = await GameService.movePiece(data.roomId, socket.userId!, data.toX, data.toY);
      io.to(data.roomId).emit('game_state_update', newState);
    } catch (error: any) {
      socket.emit('game_error', { message: error.message });
    }
  });
};
