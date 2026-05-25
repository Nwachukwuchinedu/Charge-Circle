'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import { useRoomList } from '../../hooks/useRoomList';
import { useRoomOperations } from '../../hooks/useRoomOperations';
import { ConnectionBadge, LoadingSpinner, Logo } from '../components/ui';
import StatStrip from '../components/lobby/StatStrip';
import type { StatItem } from '../components/lobby/StatStrip';
import RoomCard from '../components/lobby/RoomCard';
import EditRoomModal from '../components/lobby/EditRoomModal';
import CreateRoomModal from '../components/lobby/CreateRoomModal';
import type { Room } from '../types';
import { LogOut, Radio } from 'lucide-react';

export default function Lobby() {
  const { user, loading, logout } = useAuth();
  const { socket, connected } = useSocket();
  const router = useRouter();

  const { data: rooms = [], isLoading: isLoadingRooms } = useRoomList(socket, connected);
  const { createRoom, joinRoom, updateRoom, deleteRoom } = useRoomOperations(socket);
  const [joiningRoomId, setJoiningRoomId] = useState<string | null>(null);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  const handleCreateRoom = useCallback((name: string, maxPlayers: number | null) => {
    createRoom({ name, maxPlayers });
  }, [createRoom]);

  const handleJoinRoom = useCallback((roomId: string) => {
    setJoiningRoomId(roomId);
    joinRoom(roomId);
  }, [joinRoom]);

  const handleEditRoom = useCallback((
    roomId: string,
    name: string,
    maxPlayers: number | null,
  ) => {
    updateRoom({ roomId, name, maxPlayers });
    setEditingRoom(null);
  }, [updateRoom]);

  const handleDeleteRoom = useCallback((roomId: string) => {
    deleteRoom(roomId);
  }, [deleteRoom]);

  if (loading || !user) {
    return <LoadingSpinner text="Initializing Node Authentication..." fullScreen />;
  }

  const stats: StatItem[] = [
    { label: 'Total Energy', value: 1247, suffix: ' GW', icon: 'zap', accent: 'indigo' },
    { label: 'Active Rooms', value: rooms.length, icon: 'radio', accent: 'emerald' },
    { label: 'Online Nodes', value: rooms.reduce((sum, r) => sum + (r.activePlayers || 0), 0), icon: 'grid', accent: 'cyan' },
    { label: 'Grid Status', value: connected ? 100 : 0, suffix: '%', icon: 'activity', accent: connected ? 'emerald' : 'amber' },
  ];

  return (
    <div className="min-h-screen bg-[#060709] text-zinc-100">
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-indigo-900/10 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-cyan-900/10 blur-[120px] pointer-events-none" />

      <header className="sticky top-0 z-30 border-b border-zinc-900/60 bg-[#060709]/80 backdrop-blur-md px-4 sm:px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <div className="max-sm:hidden sm:block">
              <h1 className="text-sm font-bold tracking-tight text-white">Charge Circle</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="max-sm:hidden sm:flex items-center gap-1.5 text-xs text-zinc-500">
              <Radio size={12} className="text-indigo-400" />
              Operator: <span className="text-emerald-400 font-medium">{user.nickname}</span>
            </div>
            <ConnectionBadge connected={connected} />
            <button
              onClick={() => { logout(); router.push('/'); }}
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-rose-400 bg-zinc-900/60 hover:bg-rose-500/10 border border-zinc-800 hover:border-rose-500/30 px-3 py-1.5 rounded-lg cursor-pointer transition-all"
            >
              <LogOut size={12} /> <span className="hidden sm:inline">Disconnect</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 flex flex-col gap-6">
        <StatStrip stats={stats} />

        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-zinc-300 flex items-center gap-2">
            Active Grid Nodes
            <span className="text-xs font-mono text-zinc-600 bg-zinc-900/60 px-2 py-0.5 rounded-full border border-zinc-800">
              {rooms.length}
            </span>
          </h2>
        </div>

        {isLoadingRooms ? (
          <div className="text-center py-16 text-zinc-600 text-sm font-mono">Scanning for active nodes...</div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-zinc-800/40 rounded-2xl bg-zinc-900/20">
            <p className="text-zinc-500 text-sm mb-2">No active rooms available.</p>
            <p className="text-zinc-600 text-xs">Initialize a new room to start playing.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room, i) => (
              <RoomCard
                key={room.id}
                room={room}
                onJoin={handleJoinRoom}
                index={i}
                isJoining={joiningRoomId === room.id}
                userId={user.id}
                onEdit={setEditingRoom}
                onDelete={handleDeleteRoom}
              />
            ))}
          </div>
        )}
      </main>

      <CreateRoomModal onCreate={handleCreateRoom} />
      <EditRoomModal
        room={editingRoom}
        isOpen={!!editingRoom}
        onClose={() => setEditingRoom(null)}
        onSave={handleEditRoom}
      />
    </div>
  );
}
