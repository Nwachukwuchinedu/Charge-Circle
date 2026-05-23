import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USERS_DB_PATH = path.join(__dirname, 'database', 'users.json');
const GAME_DB_PATH = path.join(__dirname, 'database', 'game.json');

const app = express();
const httpServer = createServer(app);

// Enable CORS for Express and Socket.io
app.use(cors());
app.use(express.json());

const io = new Server(httpServer, {
  cors: {
    origin: '*', // Allow all origins for simplicity in development
    methods: ['GET', 'POST']
  }
});

// Game state in memory
let gameState = {
  piece: { x: 4, y: 4 },
  boardSize: 10,
  target: { x: 2, y: 7 },
  score: 0
};

let queue = []; // Array of { id, counter, myTurn, online: boolean }
const socketToUser = new Map(); // socket.id -> userId
const userToSocket = new Map(); // userId -> socket.id
const disconnectTimeouts = new Map(); // userId -> NodeJS.Timeout

// Ensure database directory and files exist, then load them
async function initDatabase() {
  try {
    await fs.mkdir(path.join(__dirname, 'database'), { recursive: true });
    
    // Load Game State
    try {
      const gameData = await fs.readFile(GAME_DB_PATH, 'utf-8');
      gameState = JSON.parse(gameData);
      console.log('Loaded game state from DB:', gameState);
    } catch (e) {
      console.log('No game state found, initializing with defaults');
      await saveGameStateImmediate();
    }

    // Load Users Queue
    try {
      const usersData = await fs.readFile(USERS_DB_PATH, 'utf-8');
      const loadedQueue = JSON.parse(usersData);
      // When loading from file on server start, all players are marked offline initially
      queue = loadedQueue.map(u => ({
        id: u.id,
        counter: u.counter,
        myTurn: u.myTurn,
        online: false
      }));
      console.log('Loaded users queue from DB:', queue);
    } catch (e) {
      console.log('No users queue found, initializing empty');
      queue = [];
      await saveUsersQueueImmediate();
    }
  } catch (err) {
    console.error('Failed to initialize database:', err);
  }
}

// Immediate save helper (non-throttled for initialization)
async function saveGameStateImmediate() {
  try {
    await fs.writeFile(GAME_DB_PATH, JSON.stringify(gameState, null, 2));
  } catch (err) {
    console.error('Error saving game state immediately:', err);
  }
}

// Immediate save helper (non-throttled for initialization)
async function saveUsersQueueImmediate() {
  try {
    const dataToSave = queue.map(u => ({
      id: u.id,
      myTurn: u.myTurn,
      counter: u.counter
    }));
    await fs.writeFile(USERS_DB_PATH, JSON.stringify(dataToSave, null, 2));
  } catch (err) {
    console.error('Error saving users queue immediately:', err);
  }
}

// Throttled saves to prevent disk overhead
let gameSavePending = false;
let usersSavePending = false;

function saveGameState() {
  if (gameSavePending) return;
  gameSavePending = true;
  setTimeout(async () => {
    try {
      await fs.writeFile(GAME_DB_PATH, JSON.stringify(gameState, null, 2));
    } catch (err) {
      console.error('Error saving game state:', err);
    } finally {
      gameSavePending = false;
    }
  }, 2000);
}

function saveUsersQueue() {
  if (usersSavePending) return;
  usersSavePending = true;
  setTimeout(async () => {
    try {
      const dataToSave = queue.map(u => ({
        id: u.id,
        myTurn: u.myTurn,
        counter: u.counter
      }));
      await fs.writeFile(USERS_DB_PATH, JSON.stringify(dataToSave, null, 2));
    } catch (err) {
      console.error('Error saving users queue:', err);
    } finally {
      usersSavePending = false;
    }
  }, 2000);
}

// Recalculates turn status to ensure the first active online player has myTurn = true
function updateQueueState() {
  if (queue.length === 0) return;

  const firstOnlineUser = queue.find(u => u.online);

  if (firstOnlineUser) {
    queue.forEach(u => {
      u.myTurn = false;
    });
    firstOnlineUser.myTurn = true;
    firstOnlineUser.counter = 0;
  } else {
    queue.forEach(u => {
      u.myTurn = false;
    });
  }
}

function broadcastGameState() {
  io.emit('game_state', {
    piece: gameState.piece,
    target: gameState.target,
    score: gameState.score,
    boardSize: gameState.boardSize,
    queue: queue.map(u => ({
      id: u.id,
      myTurn: u.myTurn,
      counter: u.counter,
      online: u.online
    }))
  });
}

// Socket IO connection handler
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Send current game state upon initial connection (before join_game)
  socket.emit('game_state', {
    piece: gameState.piece,
    target: gameState.target,
    score: gameState.score,
    boardSize: gameState.boardSize,
    queue: queue.map(u => ({
      id: u.id,
      myTurn: u.myTurn,
      counter: u.counter,
      online: u.online
    }))
  });

  socket.on('join_game', ({ userId }) => {
    if (!userId) {
      socket.emit('error_message', 'userId is required to join');
      return;
    }

    console.log(`User attempting to join: ${userId} (Socket: ${socket.id})`);

    // Cancel any pending disconnect timeout for this user
    if (disconnectTimeouts.has(userId)) {
      clearTimeout(disconnectTimeouts.get(userId));
      disconnectTimeouts.delete(userId);
      console.log(`Cleared disconnect grace period for ${userId}`);
    }

    // Clean up any stale sockets associated with this userId
    const oldSocketId = userToSocket.get(userId);
    if (oldSocketId && oldSocketId !== socket.id) {
      socketToUser.delete(oldSocketId);
      const oldSocket = io.sockets.sockets.get(oldSocketId);
      if (oldSocket) {
        oldSocket.disconnect(true);
      }
    }

    socketToUser.set(socket.id, userId);
    userToSocket.set(userId, socket.id);

    let user = queue.find(u => u.id === userId);
    if (user) {
      user.online = true;
      console.log(`User reconnected: ${userId}`);
    } else {
      user = {
        id: userId,
        myTurn: false,
        counter: queue.length + 1,
        online: true
      };
      queue.push(user);
      console.log(`New user joined: ${userId}`);
    }

    updateQueueState();
    saveUsersQueue();
    broadcastGameState();
  });

  socket.on('move_piece', ({ x, y }) => {
    const userId = socketToUser.get(socket.id);
    if (!userId) {
      socket.emit('error_message', 'You are not joined in the game queue.');
      return;
    }

    const playerIndex = queue.findIndex(u => u.id === userId);
    if (playerIndex === -1) {
      socket.emit('error_message', 'You are not in the queue.');
      return;
    }

    const player = queue[playerIndex];
    if (!player.myTurn) {
      socket.emit('error_message', 'Wait for your turn.');
      return;
    }

    // Coordinates validations
    const targetX = parseInt(x);
    const targetY = parseInt(y);
    if (isNaN(targetX) || isNaN(targetY)) {
      socket.emit('error_message', 'Coordinates must be numbers.');
      return;
    }

    if (targetX < 0 || targetX >= gameState.boardSize || targetY < 0 || targetY >= gameState.boardSize) {
      socket.emit('error_message', 'Move out of board bounds.');
      return;
    }

    // Orthogonal or diagonal move of 1 step
    const dx = Math.abs(targetX - gameState.piece.x);
    const dy = Math.abs(targetY - gameState.piece.y);
    if (dx > 1 || dy > 1 || (dx === 0 && dy === 0)) {
      socket.emit('error_message', 'Invalid move. You can only move 1 tile (orthogonal or diagonal).');
      return;
    }

    // Update piece position
    gameState.piece.x = targetX;
    gameState.piece.y = targetY;

    // Check target charging circle
    let charged = false;
    if (gameState.piece.x === gameState.target.x && gameState.piece.y === gameState.target.y) {
      gameState.score += 1;
      charged = true;

      // Spawn a new target charging circle at random coords (excluding current piece location)
      let newTargetX, newTargetY;
      do {
        newTargetX = Math.floor(Math.random() * gameState.boardSize);
        newTargetY = Math.floor(Math.random() * gameState.boardSize);
      } while (newTargetX === gameState.piece.x && newTargetY === gameState.piece.y);

      gameState.target = { x: newTargetX, y: newTargetY };
      console.log(`Grid CHARGED! New target: (${newTargetX}, ${newTargetY})`);
    }

    // Move current player to back of queue
    queue.splice(playerIndex, 1);
    queue.push(player);

    // Increment everyone's counters
    queue.forEach(u => {
      u.counter += 1;
      u.myTurn = false;
    });

    // Make the next online player active, set their counter to 0
    updateQueueState();

    saveGameState();
    saveUsersQueue();
    broadcastGameState();

    if (charged) {
      io.emit('grid_charged', { score: gameState.score, nextTarget: gameState.target });
    }
  });

  socket.on('disconnect', () => {
    const userId = socketToUser.get(socket.id);
    if (userId) {
      console.log(`Socket disconnected for user ${userId}: ${socket.id}`);
      socketToUser.delete(socket.id);
      userToSocket.delete(userId);

      const user = queue.find(u => u.id === userId);
      if (user) {
        user.online = false;

        // Set up grace period for reconnection
        const timeout = setTimeout(() => {
          disconnectTimeouts.delete(userId);

          // If still offline, remove user from queue
          const idx = queue.findIndex(u => u.id === userId);
          if (idx !== -1 && !queue[idx].online) {
            console.log(`Grace period expired. Removing user ${userId} from queue.`);
            queue.splice(idx, 1);
            updateQueueState();
            saveUsersQueue();
            broadcastGameState();
          }
        }, 8000);

        disconnectTimeouts.set(userId, timeout);
      }

      broadcastGameState();
    } else {
      console.log(`Stray socket disconnected: ${socket.id}`);
    }
  });
});

// Express health check endpoint
app.get('/status', (req, res) => {
  res.json({
    status: 'online',
    usersConnectedCount: queue.filter(u => u.online).length,
    queueLength: queue.length,
    score: gameState.score
  });
});

const PORT = process.env.PORT || 4000;

initDatabase().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`Charge Circle backend listening on port ${PORT}`);
  });
});
