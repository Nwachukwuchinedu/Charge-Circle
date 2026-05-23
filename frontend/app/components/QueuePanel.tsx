'use client';

import React from 'react';

interface User {
  id: string;
  counter: number;
  myTurn: boolean;
  online: boolean;
}

interface QueuePanelProps {
  queue: User[];
  myUserId: string | null;
}

export default function QueuePanel({ queue, myUserId }: QueuePanelProps) {
  // Find current user's position in the queue
  const myIndex = queue.findIndex(u => u.id === myUserId);
  const myPosition = myIndex !== -1 ? myIndex + 1 : null;
  const myData = myIndex !== -1 ? queue[myIndex] : null;

  // Active player is the one whose turn it is
  const activePlayer = queue.find(u => u.myTurn);

  return (
    <div className="flex flex-col gap-6 w-full lg:w-96">
      {/* 1. Personal Grid Connection Status (Glassmorphism Panel) */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-indigo-950/10 p-5 backdrop-blur-md">
        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-indigo-500/10 blur-xl"></div>
        <div className="absolute -left-8 -bottom-8 h-24 w-24 rounded-full bg-cyan-500/10 blur-xl"></div>

        <h3 className="text-sm font-semibold tracking-wider text-indigo-400 uppercase mb-4">
          Personal Console
        </h3>

        {myUserId ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 text-sm">Node ID</span>
              <span className="font-mono text-zinc-100 font-medium bg-zinc-800/40 px-2 py-0.5 rounded text-xs border border-zinc-700/30">
                {myUserId}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-400 text-sm">Turn Status</span>
              {myData?.myTurn ? (
                <span className="flex items-center gap-1.5 text-emerald-400 text-sm font-semibold animate-pulse">
                  <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                  Active Turn
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-indigo-400 text-sm font-medium">
                  <span className="h-2 w-2 rounded-full bg-indigo-400/50"></span>
                  Waiting...
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-400 text-sm">Queue Position</span>
              <span className="font-bold text-zinc-100">
                {myPosition ? `#${myPosition} / ${queue.length}` : 'Not in Queue'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-400 text-sm">Cycles Since Move</span>
              <span className="font-mono text-zinc-100">
                {myData ? myData.counter : 'N/A'}
              </span>
            </div>

            {/* Quick action message */}
            <div className="mt-4 pt-3 border-t border-zinc-800/40 text-xs">
              {myData?.myTurn ? (
                <div className="text-emerald-400 font-medium bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/25">
                  ✦ You are the active operator. Click any adjacent tile to move the Energy Orb!
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
            Initializing node connection...
          </div>
        )}
      </div>

      {/* 2. Grid Queue Registry List */}
      <div className="flex flex-col flex-1 rounded-2xl border border-indigo-500/10 bg-[#0e0f13] p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold tracking-wider text-indigo-400 uppercase">
            Grid Queue Registry
          </h3>
          <span className="text-xs bg-indigo-500/10 text-indigo-300 font-mono px-2 py-0.5 rounded-full border border-indigo-500/20">
            {queue.length} Active
          </span>
        </div>

        {/* Scrollable Queue Container */}
        <div className="flex flex-col gap-2 overflow-y-auto max-h-[300px] pr-1 custom-scrollbar">
          {queue.length === 0 ? (
            <div className="text-zinc-600 text-sm text-center py-8">
              No nodes registered on the grid.
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
                    {/* Index / Position badge */}
                    <span className={`font-mono text-xs font-bold w-5 text-right ${
                      user.myTurn ? 'text-emerald-400' : 'text-zinc-600'
                    }`}>
                      {idx + 1}
                    </span>

                    {/* Connection Indicator */}
                    <span className="relative flex h-2 w-2 shrink-0">
                      {user.online ? (
                        <>
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                            user.myTurn ? 'bg-emerald-400' : 'bg-indigo-400'
                          }`}></span>
                          <span className={`relative inline-flex rounded-full h-2 w-2 ${
                            user.myTurn ? 'bg-emerald-400' : 'bg-indigo-400'
                          }`}></span>
                        </>
                      ) : (
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-600"></span>
                      )}
                    </span>

                    {/* ID */}
                    <span className={`font-mono text-sm truncate ${
                      isSelf ? 'text-indigo-300 font-bold' : 'text-zinc-300'
                    }`}>
                      {user.id} {isSelf && <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-1 py-0.2 rounded ml-1">YOU</span>}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Cycles counter */}
                    <span className="text-xs font-mono text-zinc-500" title="Cycles since last move">
                      C: {user.counter}
                    </span>

                    {/* Status Badge */}
                    {user.myTurn ? (
                      <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        Active
                      </span>
                    ) : !user.online ? (
                      <span className="text-[10px] uppercase tracking-wider font-medium text-zinc-600 bg-zinc-800/40 px-2 py-0.5 rounded">
                        Offline
                      </span>
                    ) : (
                      <span className="text-[10px] uppercase tracking-wider font-medium text-zinc-500">
                        Wait
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
