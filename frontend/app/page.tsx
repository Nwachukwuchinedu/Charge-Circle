'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import { useRoomList } from '../hooks/useRoomList';
import { LogOut, Plus, Users, Play } from 'lucide-react';

export default function Lobby() {
  const { user, loading, logout } = useAuth();
  const { socket, connected } = useSocket();
  const router = useRouter();
  const [newRoomName, setNewRoomName] = useState('');
  const [creating, setCreating] = useState(false);

  const { data: rooms = [], isLoading: isLoadingRooms } = useRoomList(socket, connected);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim() || !socket) return;
    
    setCreating(true);
    socket.emit('create_room', { name: newRoomName }, (response: any) => {
      setCreating(false);
      if (response.success) {
        setNewRoomName('');
        router.push(`/game?roomId=${response.room.id}`);
      } else {
        alert(response.error || 'Failed to create room');
      }
    });
  };

  const handleJoinRoom = (roomId: string) => {
    if (!socket) return;
    socket.emit('join_room', { roomId }, (response: any) => {
      if (response.success) {
        router.push(`/game?roomId=${roomId}`);
      } else {
        alert(response.error || 'Failed to join room');
      }
    });
  };

  if (loading || !user) return <div className="min-h-screen bg-[#060709] flex items-center justify-center text-indigo-400 font-mono">Initializing Node Authentication...</div>;

  return (
    <div className="min-h-screen bg-[#060709] text-zinc-100 p-8">
      <header className="max-w-5xl mx-auto flex items-center justify-between border-b border-zinc-800/60 pb-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 font-black text-white shadow-lg shadow-indigo-500/20">
            C
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Charge Circle Lobby</h1>
            <p className="text-xs text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              Operator: <span className="text-emerald-400 font-bold">{user.nickname}</span>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] border ${connected ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                {connected ? 'Socket Live' : 'Disconnected'}
              </span>
            </p>
          </div>
        </div>
        <button 
          onClick={() => { logout(); router.push('/login'); }}
          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white bg-zinc-900/50 hover:bg-rose-500/20 hover:border-rose-500/50 border border-zinc-800 px-4 py-2 rounded-lg transition-all"
        >
          <LogOut size={16} /> Disconnect
        </button>
      </header>

      <main className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <div className="bg-[#0d0e12] border border-zinc-800/40 rounded-2xl p-6 shadow-xl sticky top-8">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-indigo-400">
              <Plus size={18} /> Initialize Room
            </h2>
            <form onSubmit={handleCreateRoom} className="flex flex-col gap-4">
              <input 
                type="text" 
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="Room Designation..."
                className="w-full bg-[#181920] border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                required
              />
              <button 
                type="submit" 
                disabled={creating || !connected}
                className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold rounded-lg disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/20"
              >
                {creating ? 'Creating...' : 'Create Room'}
              </button>
            </form>
          </div>
        </div>

        <div className="md:col-span-2 flex flex-col gap-4">
          <h2 className="text-xl font-bold flex items-center gap-2 text-zinc-300">
            <Users size={20} /> Active Grid Nodes
          </h2>
          
          {isLoadingRooms ? (
            <div className="bg-[#0d0e12]/50 border border-zinc-800/30 border-dashed rounded-2xl p-12 text-center text-zinc-500">
              Loading active nodes...
            </div>
          ) : rooms.length === 0 ? (
            <div className="bg-[#0d0e12]/50 border border-zinc-800/30 border-dashed rounded-2xl p-12 text-center text-zinc-500">
              No active rooms available. Initialize a new room to start.
            </div>
          ) : (
            <div className="grid gap-4">
              {rooms.map(room => (
                <div key={room.id} className="bg-[#0d0e12] border border-zinc-800/40 rounded-xl p-5 flex items-center justify-between hover:border-indigo-500/50 transition-all group shadow-md">
                  <div>
                    <h3 className="font-bold text-lg text-white group-hover:text-indigo-300 transition-colors">{room.name}</h3>
                    <p className="text-xs text-zinc-500 mt-1">Owner: <span className="text-zinc-300">{room.owner?.nickname || 'Unknown'}</span> • Status: <span className="text-emerald-400">{room.status}</span></p>
                  </div>
                  <button 
                    onClick={() => handleJoinRoom(room.id)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-zinc-800 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors shadow"
                  >
                    <Play size={16} /> Join Node
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
