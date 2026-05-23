import { io } from 'socket.io-client';

console.log('--- STARTING WEBSOCKET TESTING SCRIPT ---');

const socketUrl = 'http://localhost:4000';

const clientA = io(socketUrl);
const clientB = io(socketUrl);

let stateA = null;
let stateB = null;

let step = 0;

// Connect client A
clientA.on('connect', () => {
  console.log('Client A connected.');
  clientA.emit('join_game', { userId: 'User_A' });
});

// Connect client B
clientB.on('connect', () => {
  console.log('Client B connected.');
  clientB.emit('join_game', { userId: 'User_B' });
});

// Listen for updates on Client A
clientA.on('game_state', (state) => {
  stateA = state;
  checkState();
});

// Listen for updates on Client B
clientB.on('game_state', (state) => {
  stateB = state;
  checkState();
});

clientA.on('error_message', (err) => {
  console.error('Client A Error:', err);
});

clientB.on('error_message', (err) => {
  console.error('Client B Error:', err);
});

function checkState() {
  if (!stateA || !stateB) return;

  // Let's run a sequence of checks
  if (step === 0) {
    // Both joined. Verify queue.
    console.log('Step 0: Verifying initial queue...');
    const queue = stateA.queue;
    console.log('Queue:', queue.map(u => `${u.id} (Turn:${u.myTurn}, Counter:${u.counter}, Online:${u.online})`).join(' -> '));
    console.log('Piece position:', stateA.piece);
    console.log('Target position:', stateA.target);

    if (queue.length === 2 && queue[0].id === 'User_A' && queue[0].myTurn === true && queue[1].id === 'User_B' && queue[1].myTurn === false) {
      console.log('SUCCESS: Initial queue state is correct. User_A has turn.');
      
      // Let's make an illegal move with User_B (not B's turn)
      console.log('Attempting illegal move with User_B (should fail)...');
      step = 1;
      clientB.emit('move_piece', { x: stateB.piece.x, y: stateB.piece.y - 1 });
      
      // Also make a legal move with User_A after a short delay
      setTimeout(() => {
        console.log('Attempting legal move with User_A...');
        // Adjacent move (e.g. move x + 1, or x - 1 depending on boundaries)
        const currentX = stateA.piece.x;
        const newX = currentX >= 9 ? currentX - 1 : currentX + 1;
        step = 2;
        clientA.emit('move_piece', { x: newX, y: stateA.piece.y });
      }, 1000);
    }
  } else if (step === 2) {
    // After User_A moves, queue should rotate. User_B active.
    console.log('Step 2: Verifying queue after User_A moves...');
    const queue = stateA.queue;
    console.log('Queue:', queue.map(u => `${u.id} (Turn:${u.myTurn}, Counter:${u.counter}, Online:${u.online})`).join(' -> '));
    console.log('Piece position:', stateA.piece);

    if (queue.length === 2 && queue[0].id === 'User_B' && queue[0].myTurn === true && queue[1].id === 'User_A' && queue[1].myTurn === false) {
      console.log('SUCCESS: Queue rotated correctly. User_B has turn.');
      
      // Let's make a legal move with User_B
      console.log('Attempting legal move with User_B...');
      const currentY = stateB.piece.y;
      const newY = currentY >= 9 ? currentY - 1 : currentY + 1;
      step = 3;
      clientB.emit('move_piece', { x: stateB.piece.x, y: newY });
    }
  } else if (step === 3) {
    // After User_B moves, queue should rotate. User_A active.
    console.log('Step 3: Verifying queue after User_B moves...');
    const queue = stateA.queue;
    console.log('Queue:', queue.map(u => `${u.id} (Turn:${u.myTurn}, Counter:${u.counter}, Online:${u.online})`).join(' -> '));
    console.log('Piece position:', stateA.piece);

    if (queue.length === 2 && queue[0].id === 'User_A' && queue[0].myTurn === true && queue[1].id === 'User_B' && queue[1].myTurn === false) {
      console.log('SUCCESS: Queue rotated back correctly. User_A has turn.');
      
      // Clean up
      console.log('--- TEST COMPLETED SUCCESSFULLY ---');
      clientA.disconnect();
      clientB.disconnect();
      process.exit(0);
    }
  }
}
