'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../hooks/useAuth';
import GameGrid from '../components/GameGrid';
import QueuePanel from '../components/QueuePanel';
import ChatPanel from '../components/ChatPanel';
import { GameState, Room } from '../types';

export default function Game() {
  const searchParams = useSearchParams();
  const roomId = searchParams.get('roomId');
  const router = useRouter();
  
  const { user, loading } = useAuth();
  const { socket, connected } = useSocket();
  
  const [room, setRoom] = useState<Room | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (socket && connected && roomId) {
      socket.emit('join_room', { roomId }, (response: any) => {
        if (!response.success) {
          setErrorText(response.error);
        }
      });

      socket.on('room_state_update', (updatedRoom: Room) => {
        setRoom(updatedRoom);
        if (updatedRoom.gameStates && updatedRoom.gameStates.length > 0) {
          setGameState(updatedRoom.gameStates[0]);
        }
      });

      socket.on('game_state_update', (state: GameState) => {
        setGameState(state);
      });

      socket.on('game_error', (data: { message: string }) => {
        setErrorText(data.message);
        setTimeout(() => setErrorText(null), 4000);
      });
    }

    return () => {
      if (socket) {
        socket.off('room_state_update');
        socket.off('game_state_update');
        socket.off('game_error');
      }
    };
  }, [socket, connected, roomId]);

  if (!roomId) return <div className="text-white p-8">No Room ID provided. Please join from the Lobby.</div>;
  if (!user || !gameState || !room) return <div className="min-h-screen bg-[#060709] flex items-center justify-center text-indigo-400 font-mono">Synchronizing Grid State...</div>;

  const handleMovePiece = (newX: number, newY: number) => {
    if (socket && connected) {
      socket.emit('move_piece', { roomId, toX: newX, toY: newY });
    }
  };

  const isMyTurn = gameState.turnQueue && gameState.turnQueue[0] === user.id;

  const queueForPanel = gameState.turnQueue.map((id, index) => ({
    id,
    counter: 0,
    myTurn: index === 0,
    online: true 
  }));

  return (
    <div className="flex flex-col min-h-screen bg-[#060709] text-zinc-100 font-sans antialiased">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-indigo-900/10 blur-[120px] pointer-events-none"></div>
      
      <header className="sticky top-0 z-30 border-b border-zinc-900/60 bg-[#060709]/80 backdrop-blur-md px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/')} className="text-zinc-400 hover:text-white px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-sm transition-all">
            ← Disconnect Node
          </button>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">Room: <span className="text-indigo-300">{room.name}</span></h1>
            <p className="text-[10px] text-zinc-500 uppercase flex gap-2">
              <span>Grid: {room.boardSize}x{room.boardSize}</span>
              <span>Status: <span className="text-emerald-400">{room.status}</span></span>
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Total Energy</span>
          <span className="text-2xl font-mono text-cyan-400 font-black">{gameState.score} GW</span>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col lg:flex-row gap-8 z-10">
        <div className="flex-1 flex flex-col items-center gap-4">
          {errorText && (
            <div className="w-full max-w-[500px] p-4 rounded-xl border border-rose-500/30 bg-rose-500/5 text-rose-400 text-sm font-medium shadow-lg">
              <span className="uppercase text-xs font-bold mr-2 text-rose-500 border border-rose-500/50 px-1 rounded">Alert</span>
              {errorText}
            </div>
          )}
          
          <GameGrid
            piece={{ x: gameState.pieceX, y: gameState.pieceY }}
            target={{ x: gameState.targetX, y: gameState.targetY }}
            boardSize={room.boardSize}
            myTurn={isMyTurn}
            onMove={handleMovePiece}
          />
        </div>

        <div className="w-full lg:w-[350px] flex flex-col gap-6">
          <QueuePanel queue={queueForPanel} myUserId={user.id} />
          <div className="flex-1 min-h-[400px]">
            <ChatPanel roomId={roomId} socket={socket} />
          </div>
        </div>
      </main>
    </div>
  );
}
