'use client';

import React, { useEffect, useState, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../hooks/useAuth';
import GameGrid from '../components/game/GameGrid';
import Leaderboard from '../components/game/Leaderboard';
import RoundTimer from '../components/game/RoundTimer';
import ChatPanel from '../components/ChatPanel';
import { HUDToggle, HUDDrawer } from '../components/game/HUDOverlay';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { GameState, Room, GameStateDelta, ChatMessage, LeaderboardEntry } from '../types';
import { useUIStore } from '../stores/ui.store';
import { Play, MessageSquare, LogOut, Zap, LayoutGrid } from 'lucide-react';

function GameContent() {
  const searchParams = useSearchParams();
  const roomId = searchParams.get('roomId');
  const router = useRouter();

  const { user, loading } = useAuth();
  const { socket, connected } = useSocket();

  const [room, setRoom] = useState<Room | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardOpen, setLeaderboardOpen] = useState(true);
  const chatOpen = useUIStore((s) => s.chatOpen);
  const joinedOnce = useRef(false);

  useEffect(() => {
    if (chatOpen) setUnreadCount(0);
  }, [chatOpen]);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (socket && connected && roomId && !joinedOnce.current) {
      joinedOnce.current = true;

      socket.emit('join_room', { roomId }, (response: any) => {
        if (!response.success) { setErrorText(response.error); return; }
        setRoom(response.room);
        const myGs = response.room.gameStates?.find(
          (gs: GameState) => gs.userId === user?.id,
        );
        if (myGs) setGameState(myGs);
        if (response.room.chatMessages) setChatMessages(response.room.chatMessages);
      });

      const playerDeltaEvent = `player_delta:${user?.id}`;

      socket.on('room_state_update', (updatedRoom: Room) => {
        setRoom(updatedRoom);
        const myGs = updatedRoom.gameStates?.find(
          (gs: GameState) => gs.userId === user?.id,
        );
        if (myGs) setGameState(myGs);
        if (updatedRoom.chatMessages) setChatMessages(updatedRoom.chatMessages);
      });

      socket.on(playerDeltaEvent, (delta: GameStateDelta) => {
        setGameState((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            pieceX: delta.piece?.x ?? prev.pieceX,
            pieceY: delta.piece?.y ?? prev.pieceY,
            targetX: delta.target?.x ?? prev.targetX,
            targetY: delta.target?.y ?? prev.targetY,
            score: delta.score ?? prev.score,
          };
        });
      });

      socket.on('chat_message', (msg: ChatMessage) => {
        setChatMessages((prev) => [...prev, msg]);
        if (!useUIStore.getState().chatOpen) {
          setUnreadCount((prev) => prev + 1);
        }
      });

      socket.on('leaderboard_update', (data: { leaderboard: LeaderboardEntry[] }) => {
        setLeaderboard(data.leaderboard);
      });

      socket.on('round_start', (data: { room: Room }) => {
        setRoom(data.room);
        const myGs = data.room.gameStates?.find(
          (gs: GameState) => gs.userId === user?.id,
        );
        if (myGs) setGameState(myGs);
      });

      socket.on('round_end', () => {
        setRoom((prev) => prev ? { ...prev, status: 'lobby' } : null);
      });

      socket.on('game_error', (data: { message: string }) => {
        setErrorText(data.message);
        setTimeout(() => setErrorText(null), 4000);
      });

      socket.on('room_deleted', (data: { roomId: string }) => {
        if (data.roomId === roomId) router.push('/lobby');
      });

      return () => {
        socket.off('room_state_update');
        socket.off(playerDeltaEvent);
        socket.off('chat_message');
        socket.off('leaderboard_update');
        socket.off('round_start');
        socket.off('round_end');
        socket.off('game_error');
        socket.off('room_deleted');
      };
    }
  }, [socket, connected, roomId, user?.id]);

  if (!roomId) return <div className="text-white p-8">No Room ID provided. Join from the Lobby.</div>;
  if (!user || !gameState || !room) return <LoadingSpinner text="Synchronizing Grid State..." fullScreen />;

  const handleMove = (newX: number, newY: number) => {
    if (socket && connected) socket.emit('move_piece', { roomId, toX: newX, toY: newY });
  };

  const handleLeaveRoom = () => {
    if (socket && connected && roomId) {
      socket.emit('leave_room', { roomId }, () => router.push('/lobby'));
    } else {
      router.push('/lobby');
    }
  };

  const handleStartRound = () => {
    if (!socket || !connected) return;
    socket.emit('start_round', { roomId }, (response: any) => {
      if (!response.success) setErrorText(response.error);
    });
  };

  const isActive = room.status === 'active';

  return (
    <div className="fixed inset-0 bg-[#060709] text-zinc-100 flex flex-col">
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-indigo-900/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-cyan-900/10 blur-[120px] pointer-events-none" />

      {/* Top bar */}
      <header className="relative z-30 flex items-center justify-between px-4 py-2.5 border-b border-zinc-900/60 bg-[#060709]/80 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={handleLeaveRoom}
            className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 bg-rose-950/20 hover:bg-rose-900/20 border border-rose-900/30 px-3 py-1.5 rounded-lg cursor-pointer transition-all"
          >
            <LogOut size={14} className="rotate-180" /> Leave
          </button>
          <div className="hidden sm:block text-xs text-zinc-500">
            <span className="text-indigo-300 font-medium">{room.name}</span>
            <span className="mx-2">·</span>
            {room.boardSize}x{room.boardSize}
            <span className="mx-2">·</span>
            <span className={isActive ? 'text-emerald-400' : 'text-amber-400'}>
              {isActive ? 'Active' : 'Lobby'}
            </span>
            {!isActive && room.ownerId === user.id && (
              <button
                onClick={handleStartRound}
                className="ml-2 flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 bg-emerald-950/20 hover:bg-emerald-900/20 border border-emerald-900/30 px-2.5 py-1 rounded-lg cursor-pointer transition-all"
              >
                <Play size={12} /> Start Round
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <RoundTimer roundEndsAt={room.roundEndsAt} />
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Zap size={12} className="text-cyan-400" />
            <span className="font-mono text-cyan-400 font-bold text-sm">{gameState.score}</span>
            <span className="hidden sm:inline">GW</span>
          </div>
          <button
            onClick={() => setLeaderboardOpen((v) => !v)}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              leaderboardOpen
                ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400'
                : 'bg-zinc-900/60 border-zinc-800 text-zinc-500 hover:text-zinc-300'
            }`}
            title="Toggle leaderboard"
          >
            <LayoutGrid size={14} />
          </button>
        </div>
      </header>

      {/* Main area */}
      <main className="relative flex-1 flex min-h-0">
        {/* Board */}
        <div className="flex-1 flex flex-col min-h-0 relative">
          {errorText && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium backdrop-blur-sm shadow-xl">
              {errorText}
            </div>
          )}

          {!isActive && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium backdrop-blur-sm">
              Waiting for round to start...
            </div>
          )}

          <GameGrid
            piece={{ x: gameState.pieceX, y: gameState.pieceY }}
            target={{ x: gameState.targetX, y: gameState.targetY }}
            boardSize={room.boardSize}
            myTurn={isActive}
            onMove={handleMove}
          />

          {/* Floating controls */}
          <div className="absolute bottom-4 right-4 flex items-center gap-2 z-30">
            <HUDToggle side="chat" label="Chat" icon={<MessageSquare size={16} />} count={unreadCount > 0 ? unreadCount : undefined} />
          </div>

          <HUDDrawer side="chat" title="Comms Channel" icon={<MessageSquare size={16} />}>
            <ChatPanel roomId={roomId} socket={socket} messages={chatMessages} />
          </HUDDrawer>
        </div>

        {/* Leaderboard sidebar */}
        {leaderboardOpen && (
          <Leaderboard entries={leaderboard} userId={user.id} isOpen />
        )}
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
