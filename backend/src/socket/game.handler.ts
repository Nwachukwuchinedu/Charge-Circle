import { Server } from 'socket.io';
import { AuthSocket } from './auth.socket.js';
import { GameService } from '../services/game.service.js';
import { throttleSocket } from '../utils/throttle.js';
import { BroadcastService } from '../services/broadcast.service.js';
import { SocketResponse } from '../utils/socketResponse.js';
import { MovePieceDto } from '../dto/game.dto.js';

/**
 * Registers game-play Socket.io event handlers on the given socket.
 *
 * Events:
 * - `move_piece`: Validates and applies a piece move, then queues a delta broadcast.
 *
 * @param io - The Socket.io server instance
 * @param socket - The authenticated client socket
 */
export const setupGameHandlers = (io: Server, socket: AuthSocket): void => {
  socket.on('move_piece', async (data: unknown) => {
    try {
      if (!throttleSocket(`move_${socket.userId}`, 200)) return;

      const parsed = MovePieceDto.parse(data);
      if (!socket.rooms.has(parsed.roomId)) return;

      const result = await GameService.movePiece(parsed.roomId, socket.userId!, parsed.toX, parsed.toY);

      BroadcastService.queueDelta(parsed.roomId, {
        piece: { x: result.state.pieceX, y: result.state.pieceY },
        activePlayer: (result.state.turnQueue as string[])?.[0] || '',
        score: result.state.score,
        turnQueue: result.state.turnQueue as string[],
        lastMove: {
          userId: socket.userId!,
          from: result.from,
          to: { x: parsed.toX, y: parsed.toY },
        },
      });
    } catch (error: any) {
      SocketResponse.error(socket, error.message, 'game_error', error);
    }
  });
};
