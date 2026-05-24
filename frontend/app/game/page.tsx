'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../hooks/useAuth';
import GameGrid from '../components/game/GameGrid';
import QueuePanel from '../components/QueuePanel';
import ChatPanel from '../components/ChatPanel';
import TurnBanner from '../components/game/TurnBanner';
import { HUDToggle, HUDDrawer } from '../components/game/HUDOverlay';
import ConnectionBadge from '../components/ui/ConnectionBadge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { GameState, Room, GameStateDelta } from '../types';
import { Users, MessageSquare, ArrowLeft, Zap } from 'lucide-react';

function GameContent() {
  const searchParams = useSearchParams();
  const roomId = searchParams.get('roomId');
  const router = useRouter();

  const { user, loading } = useAuth();
  const { socket, connected } = useSocket();

  const [room, setRoom] = useState<Room | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (socket && connected && roomId) {
      socket.emit('join_room', { roomId }, (response: any) => {
        if (!response.success) setErrorText(response.error);
        else {
          setRoom(response.room);
          if (response.room.gameStates?.[0]) setGameState(response.room.gameStates[0]);
        }
      });

      socket.on('room_state_update', (updatedRoom: Room) => {
        setRoom(updatedRoom);
        if (updatedRoom.gameStates?.[0]) setGameState(updatedRoom.gameStates[0]);
      });

      socket.on('game_state_delta', (delta: GameStateDelta) => {
        setGameState((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            pieceX: delta.piece ? delta.piece.x : prev.pieceX,
            pieceY: delta.piece ? delta.piece.y : prev.pieceY,
            score: delta.score !== undefined ? delta.score : prev.score,
            turnQueue: delta.turnQueue || prev.turnQueue,
          };
        });
      });

      socket.on('game_error', (data: { message: string }) => {
        setErrorText(data.message);
        setTimeout(() => setErrorText(null), 4000);
      });
    }

    return () => {
      if (socket) {
        socket.off('room_state_update');
        socket.off('game_state_delta');
        socket.off('game_error');
      }
    };
  }, [socket, connected, roomId]);

  if (!roomId) return <div className="text-white p-8">No Room ID provided. Join from the Lobby.</div>;
  if (!user || !gameState || !room) return <LoadingSpinner text="Synchronizing Grid State..." fullScreen />;

  const handleMove = (newX: number, newY: number) => {
    if (socket && connected) socket.emit('move_piece', { roomId, toX: newX, toY: newY });
  };

  const isMyTurn = gameState.turnQueue?.[0] === user.id;
  const activePlayerId = gameState.turnQueue?.[0];

  const queueForPanel = gameState.turnQueue.map((id, i) => {
    const player = room.players?.find((p) => p.id === id);
    return {
      id,
      nickname: player?.nickname || 'Player',
      counter: 0,
      myTurn: i === 0,
      online: player ? player.online : true,
    };
  });

  const activeNickname = room.players?.find((p) => p.id === activePlayerId)?.nickname || activePlayerId?.slice(0, 6) || 'Unknown';

  return (
    <div className="fixed inset-0 bg-[#060709] text-zinc-100 flex flex-col">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-indigo-900/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-cyan-900/10 blur-[120px] pointer-events-none" />

      {/* Top bar */}
      <header className="relative z-30 flex items-center justify-between px-4 py-2.5 border-b border-zinc-900/60 bg-[#060709]/80 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/lobby')}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 px-3 py-1.5 rounded-lg transition-all"
          >
            <ArrowLeft size={14} /> Lobby
          </button>
          <div className="hidden sm:block text-xs text-zinc-500">
            Room <span className="text-indigo-300 font-medium">{room.name}</span>
            <span className="mx-2">·</span>
            {room.boardSize}x{room.boardSize}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Zap size={12} className="text-cyan-400" />
            <span className="font-mono text-cyan-400 font-bold text-sm">{gameState.score}</span>
            <span className="hidden sm:inline">GW</span>
          </div>
          <ConnectionBadge connected={connected} />
        </div>
      </header>

      {/* Main area: board fills everything */}
      <main className="relative flex-1 flex flex-col min-h-0">
        {/* Turn banner above board */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-40">
          <TurnBanner isMyTurn={isMyTurn} activeNickname={activeNickname} />
        </div>

        {/* Error toast */}
        {errorText && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium backdrop-blur-sm shadow-xl">
            {errorText}
          </div>
        )}

        {/* Board */}
        <GameGrid
          piece={{ x: gameState.pieceX, y: gameState.pieceY }}
          target={{ x: gameState.targetX, y: gameState.targetY }}
          boardSize={room.boardSize}
          myTurn={isMyTurn}
          onMove={handleMove}
        />

        {/* Floating HUD controls (bottom-right) */}
        <div className="absolute bottom-4 right-4 flex items-center gap-2 z-30">
          <HUDToggle side="queue" label="Queue" icon={<Users size={16} />} count={queueForPanel.length} />
          <HUDToggle side="chat" label="Chat" icon={<MessageSquare size={16} />} />
        </div>

        {/* Queue Drawer */}
        <HUDDrawer side="queue" title="Grid Queue" icon={<Users size={16} />}>
          <QueuePanel queue={queueForPanel} myUserId={user.id} myNickname={user.nickname} />
        </HUDDrawer>

        {/* Chat Drawer */}
        <HUDDrawer side="chat" title="Comms Channel" icon={<MessageSquare size={16} />}>
          <ChatPanel roomId={roomId} socket={socket} initialMessages={room.chatMessages} />
        </HUDDrawer>
      </main>
    </div>
  );
}

export default function Game() {
  return (
    <Suspense fallback={<LoadingSpinner text="Synchronizing Grid State..." fullScreen />}>
      <GameContent />
    </Suspense>
  );
}
