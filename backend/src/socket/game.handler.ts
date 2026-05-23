import { Server } from 'socket.io';
import { AuthSocket } from './auth.socket.js';
import { GameService } from '../services/game.service.js';
import { throttleSocket } from '../utils/throttle.js';
import { BroadcastService } from '../services/broadcast.service.js';

export const setupGameHandlers = (io: Server, socket: AuthSocket) => {
  socket.on('move_piece', async (data: { roomId: string, toX: number, toY: number }) => {
    try {
      if (!throttleSocket(`move_${socket.userId}`, 200)) {
        return; // Max 5 moves per second per user
      }

      const result = await GameService.movePiece(data.roomId, socket.userId!, data.toX, data.toY);
      
      BroadcastService.queueDelta(data.roomId, {
        piece: { x: result.state.pieceX, y: result.state.pieceY },
        activePlayer: (result.state.turnQueue as string[])?.[0] || '',
        score: result.state.score,
        lastMove: { 
          userId: socket.userId!, 
          from: result.from, 
          to: { x: data.toX, y: data.toY } 
        }
      });
    } catch (error: any) {
      socket.emit('game_error', { message: error.message });
    }
  });
};
