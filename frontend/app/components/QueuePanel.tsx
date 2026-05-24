'use client';

import React from 'react';
import Badge from './ui/Badge';
import Card from './ui/Card';

interface User {
  id: string;
  nickname: string;
  counter: number;
  myTurn: boolean;
  online: boolean;
}

interface QueuePanelProps {
  queue: User[];
  myUserId: string | null;
  myNickname?: string;
}

export default function QueuePanel({ queue, myUserId, myNickname }: QueuePanelProps) {
  const myIndex = queue.findIndex(u => u.id === myUserId);
  const myPosition = myIndex !== -1 ? myIndex + 1 : null;
  const myData = myIndex !== -1 ? queue[myIndex] : null;

  return (
    <div className="flex flex-col gap-6 w-full">
      <Card variant="glass" className="relative overflow-hidden p-5">
        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-indigo-500/5 blur-xl" />
        <div className="absolute -left-8 -bottom-8 h-24 w-24 rounded-full bg-cyan-500/5 blur-xl" />

        <h3 className="text-sm font-semibold text-indigo-400 mb-4">Your Status</h3>

        {myUserId ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 text-sm">Player</span>
              <span className="text-zinc-100 font-medium bg-zinc-800/40 px-2.5 py-0.5 rounded text-xs border border-zinc-700/30 max-w-[140px] truncate block">
                {myNickname || 'You'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-400 text-sm">Turn Status</span>
              <Badge variant={myData?.myTurn ? 'success' : 'info'} dot>
                {myData?.myTurn ? 'Active Turn' : 'Waiting...'}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-400 text-sm">Queue Position</span>
              <span className="font-bold text-zinc-100">
                {myPosition ? `#${myPosition} / ${queue.length}` : 'Not in queue'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-400 text-sm">Move Cycles</span>
              <span className="font-mono text-zinc-100 text-sm bg-zinc-800/20 px-2 py-0.5 rounded border border-zinc-700/30">
                {myData ? myData.counter : '0'}
              </span>
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-800/40 text-xs">
              {myData?.myTurn ? (
                <div className="text-emerald-400 font-medium bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/25">
                  ✦ You are active. Click an adjacent tile to move the Energy Orb!
                </div>
              ) : (
                <div className="text-zinc-500">
                  {myPosition && myPosition > 1 ? (
                    <span>Wait for {myPosition - 1} player(s) ahead of you.</span>
                  ) : (
                    <span>Connecting you to the grid...</span>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-sm text-zinc-500 animate-pulse py-4 text-center">
            Initializing connection...
          </div>
        )}
      </Card>

      <Card variant="glass" className="flex flex-col flex-1 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-indigo-400">Player Queue</h3>
          <Badge variant="info" className="text-xs font-mono px-2.5 py-0.5">
            {queue.length} Online
          </Badge>
        </div>

        <div className="flex flex-col gap-2 overflow-y-auto max-h-[300px] pr-1 custom-scrollbar">
          {queue.length === 0 ? (
            <div className="text-zinc-600 text-sm text-center py-8">
              No players connected.
            </div>
          ) : (
            queue.map((user, idx) => {
              const isSelf = user.id === myUserId;

              return (
                <div
                  key={user.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    user.myTurn
                      ? 'border-emerald-500/30 bg-emerald-500/5 shadow-md shadow-emerald-500/5'
                      : isSelf
                      ? 'border-indigo-500/30 bg-indigo-500/5'
                      : 'border-zinc-800/40 bg-zinc-900/20 hover:border-zinc-800'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`font-mono text-xs font-bold w-5 text-right ${
                      user.myTurn ? 'text-emerald-400' : 'text-zinc-600'
                    }`}>
                      {idx + 1}
                    </span>

                    <span className="relative flex h-2 w-2 shrink-0">
                      {user.online ? (
                        <>
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                            user.myTurn ? 'bg-emerald-400' : 'bg-indigo-400'
                          }`} />
                          <span className={`relative inline-flex rounded-full h-2 w-2 ${
                            user.myTurn ? 'bg-emerald-400' : 'bg-indigo-400'
                          }`} />
                        </>
                      ) : (
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-600" />
                      )}
                    </span>

                    <span className={`text-sm truncate ${
                      isSelf ? 'text-indigo-300 font-semibold' : 'text-zinc-300'
                    }`}>
                      {user.nickname} {isSelf && <span className="text-[9px] font-semibold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.2 rounded ml-1.5">YOU</span>}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-zinc-500" title="Cycles since last move">
                      C: {user.counter}
                    </span>

                    {user.myTurn ? (
                      <Badge variant="success" className="text-[10px] px-2 py-0.5">Active</Badge>
                    ) : !user.online ? (
                      <Badge variant="neutral" className="text-[10px] px-2 py-0.5">Offline</Badge>
                    ) : (
                      <span className="text-[10px] tracking-wider font-medium text-zinc-500">Wait</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}
