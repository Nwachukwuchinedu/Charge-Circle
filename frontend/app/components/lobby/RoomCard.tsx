'use client';

import { motion } from 'framer-motion';
import { Play, Users, Lock, Unlock } from 'lucide-react';
import type { Room } from '../../types';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

export default function RoomCard({
  room,
  onJoin,
  index,
}: {
  room: Room;
  onJoin: (id: string) => void;
  index: number;
}) {
  const playerCount = room.players?.length || 0;
  const maxPlayers = (room as any).maxPlayers;
  const hasLimit = typeof maxPlayers === 'number' && maxPlayers > 0;
  const isFull = hasLimit && playerCount >= maxPlayers;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
      className="group bg-[#0d0e12] border border-zinc-800/50 hover:border-indigo-500/40 rounded-xl p-5 transition-all shadow-md hover:shadow-lg hover:shadow-indigo-500/5"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-white group-hover:text-indigo-300 transition-colors text-base">{room.name}</h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            by <span className="text-zinc-400">{room.owner?.nickname || 'Unknown'}</span>
          </p>
        </div>
        <Badge
          variant={room.status === 'playing' ? 'success' : room.status === 'waiting' ? 'warning' : 'neutral'}
        >
          {room.status}
        </Badge>
      </div>

      <div className="flex items-center gap-4 text-xs text-zinc-500 mb-4">
        <span className="flex items-center gap-1.5">
          <Users size={13} />
          {playerCount}{hasLimit ? ` / ${maxPlayers}` : ''}
          {isFull && <Lock size={11} className="text-rose-400" />}
          {!hasLimit && <Unlock size={11} className="text-zinc-600" />}
        </span>
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
          {(room as any).boardSize || 10}&times;{(room as any).boardSize || 10}
        </span>
      </div>

      <Button
        onClick={() => onJoin(room.id)}
        disabled={isFull}
        variant="secondary"
        leftIcon={!isFull ? <Play size={14} /> : undefined}
        className="w-full py-2.5 text-sm font-medium rounded-lg"
      >
        {isFull ? 'Room Full' : 'Join Node'}
      </Button>
    </motion.div>
  );
}
