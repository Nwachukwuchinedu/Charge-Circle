'use client';

import React, { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import GameGrid from './components/GameGrid';
import QueuePanel from './components/QueuePanel';

interface User {
  id: string;
  counter: number;
  myTurn: boolean;
  online: boolean;
}

interface GameState {
  piece: { x: number; y: number };
  target: { x: number; y: number };
  boardSize: number;
  score: number;
  queue: User[];
}

export default function Home() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  
  // Game State
  const [gameState, setGameState] = useState<GameState>({
    piece: { x: 4, y: 4 },
    target: { x: 2, y: 7 },
    boardSize: 10,
    score: 0,
    queue: []
  });

  // UI Effects
  const [isCharged, setIsCharged] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize socket client
  useEffect(() => {
    // Check local storage for existing User ID, or generate a new one
    let userId = localStorage.getItem('charge_circle_user_id');
    if (!userId) {
      // Generate a user ID (e.g. Node-123)
      userId = `Node-${Math.floor(100 + Math.random() * 900)}`;
      localStorage.setItem('charge_circle_user_id', userId);
    }
    setMyUserId(userId);

    // Connect to backend WebSocket server
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';
    console.log(`Connecting to WebSocket server at ${socketUrl}`);
    const socketClient = io(socketUrl);

    socketClient.on('connect', () => {
      console.log('Connected to socket server');
      setConnected(true);
      
      // Immediately join game queue with our userId
      socketClient.emit('join_game', { userId });
    });

    socketClient.on('disconnect', () => {
      console.log('Disconnected from socket server');
      setConnected(false);
    });

    // Listen for state broadcasts
    socketClient.on('game_state', (state: GameState) => {
      setGameState(state);
    });

    // Listen for grid charged successes
    socketClient.on('grid_charged', () => {
      setIsCharged(true);
      setTimeout(() => {
        setIsCharged(false);
      }, 8000); // 800ms flash effect
    });

    // Listen for error messages (e.g., trying to move when it is not your turn)
    socketClient.on('error_message', (message: string) => {
      setErrorText(message);
      
      // Clear existing timeout
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
      
      // Auto-clear error after 4 seconds
      errorTimeoutRef.current = setTimeout(() => {
        setErrorText(null);
      }, 4000);
    });

    setSocket(socketClient);

    return () => {
      socketClient.disconnect();
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, []);

  // Emits move event to backend
  const handleMovePiece = (newX: number, newY: number) => {
    if (socket && connected) {
      socket.emit('move_piece', { x: newX, y: newY });
    }
  };

  // Find out who is currently playing
  const activeUser = gameState.queue.find(u => u.myTurn);
  const isMyTurn = activeUser?.id === myUserId;

  return (
    <div className="flex flex-col min-h-screen bg-[#060709] text-zinc-100 font-sans antialiased selection:bg-indigo-500/30">
      {/* Visual background ambient glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-indigo-900/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-cyan-900/10 blur-[120px] pointer-events-none"></div>

      {/* Grid charged flashing background layer */}
      <div className={`fixed inset-0 bg-emerald-500/5 transition-opacity duration-300 pointer-events-none z-40 ${
        isCharged ? 'opacity-100 animate-pulse' : 'opacity-0'
      }`}></div>

      {/* Header Bar */}
      <header className="sticky top-0 z-30 border-b border-zinc-900/60 bg-[#060709]/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-400 font-black text-white shadow-lg shadow-indigo-500/20">
              C
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">
                Charge Circle
              </h1>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
                Cooperative Power Grid
              </p>
            </div>
          </div>

          {/* Connection Status Badge */}
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
              connected 
                ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/20' 
                : 'bg-rose-500/5 text-rose-400 border-rose-500/20 animate-pulse'
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
              {connected ? 'Grid Connected' : 'Connecting...'}
            </span>
          </div>
        </div>
      </header>

      {/* Main content grid */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-8 flex flex-col gap-8 z-10">
        
        {/* Error Alert Display */}
        {errorText && (
          <div className="flex items-center justify-between p-4 rounded-xl border border-rose-500/30 bg-rose-500/5 text-rose-400 text-sm shadow-lg shadow-rose-950/20 animate-in fade-in slide-in-from-top duration-300">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs uppercase bg-rose-500/25 px-1.5 py-0.5 rounded">Access Denied</span>
              <span>{errorText}</span>
            </div>
            <button onClick={() => setErrorText(null)} className="hover:text-rose-200 ml-2 font-bold font-mono">×</button>
          </div>
        )}

        {/* Level Accomplished Flash alert */}
        {isCharged && (
          <div className="flex items-center justify-center p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-emerald-400 text-sm font-semibold text-center shadow-lg shadow-emerald-950/20 animate-bounce">
            ⚡ GRID NODE CHARGED! SYSTEM VOLTAGE STABILIZED (+1 SCORE) ⚡
          </div>
        )}

        {/* Global Game Status Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-[#0d0e12] border border-zinc-800/40 p-5 rounded-2xl">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Total Energy Charged</span>
            <span className="text-2xl font-black text-cyan-400 font-mono">
              {gameState.score} GW
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Online Grid Nodes</span>
            <span className="text-2xl font-bold text-zinc-100 font-mono">
              {gameState.queue.filter(u => u.online).length}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Grid Queue Length</span>
            <span className="text-2xl font-bold text-zinc-100 font-mono">
              {gameState.queue.length}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Active Operator</span>
            <span className="text-2xl font-bold text-indigo-400 truncate font-mono" title={activeUser?.id || 'None'}>
              {activeUser ? activeUser.id : 'Offgrid'}
            </span>
          </div>
        </div>

        {/* Game Area split */}
        <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">
          {/* Game Board */}
          <div className="flex flex-col items-center gap-4 w-full max-w-[500px]">
            <GameGrid
              piece={gameState.piece}
              target={gameState.target}
              boardSize={gameState.boardSize}
              myTurn={isMyTurn}
              onMove={handleMovePiece}
            />

            {/* Instruction Footer */}
            <div className="text-center text-xs text-zinc-500 max-w-[400px]">
              Cooperate with other players to guide the glowing <span className="text-orange-400 font-medium">Energy Orb</span> to the pulsing green <span className="text-emerald-400 font-medium">Charging Circle</span>. Take turns one step at a time!
            </div>
          </div>

          {/* Right hand Queue and Stats Dashboard */}
          <QueuePanel queue={gameState.queue} myUserId={myUserId} />
        </div>
      </main>

      {/* Footer copyright */}
      <footer className="mt-auto border-t border-zinc-950 py-6 px-8 text-center text-xs text-zinc-600 bg-[#060709]">
        Charge Circle Grid Game &copy; 2026. Powered by Socket.io, Next.js, and HTML Canvas.
      </footer>
    </div>
  );
}
