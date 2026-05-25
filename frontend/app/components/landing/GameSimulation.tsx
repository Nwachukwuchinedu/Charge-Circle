'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Users, Activity, Play, Terminal, Cpu } from 'lucide-react';

interface SimNode {
  id: string;
  name: string;
  color: string; // Tailwind bg class
  glowColor: string; // Tailwind shadow class
  textLight: string;
  x: number;
  y: number;
  score: number;
}

interface PointsAnim {
  id: number;
  x: number;
  y: number;
  text: string;
}

export default function GameSimulation() {
  const [nodes, setNodes] = useState<SimNode[]>([
    { id: 'alpha', name: 'operator_alpha', color: 'bg-indigo-500', glowColor: 'shadow-indigo-500/60', textLight: 'text-indigo-400', x: 1, y: 1, score: 0 },
    { id: 'beta', name: 'operator_beta', color: 'bg-cyan-400', glowColor: 'shadow-cyan-400/60', textLight: 'text-cyan-400', x: 6, y: 2, score: 0 },
    { id: 'gamma', name: 'operator_gamma', color: 'bg-emerald-400', glowColor: 'shadow-emerald-400/60', textLight: 'text-emerald-400', x: 2, y: 6, score: 0 },
  ]);

  const [target, setTarget] = useState({ x: 4, y: 4 });
  const [globalScore, setGlobalScore] = useState(0);
  const [latency, setLatency] = useState(14);
  const [pointsAnims, setPointsAnims] = useState<PointsAnim[]>([]);

  // Simulation tick - move one node closer to the target every 800ms
  useEffect(() => {
    const interval = setInterval(() => {
      // Pick a random node to move
      const activeIndex = Math.floor(Math.random() * nodes.length);
      
      setNodes((prevNodes) => {
        const nextNodes = [...prevNodes];
        const node = nextNodes[activeIndex];
        
        const dx = target.x - node.x;
        const dy = target.y - node.y;

        if (dx === 0 && dy === 0) return prevNodes;

        let newX = node.x;
        let newY = node.y;

        // Move 1 step (horizontal or vertical randomly)
        if (dx !== 0 && (dy === 0 || Math.random() > 0.5)) {
          newX += Math.sign(dx);
        } else if (dy !== 0) {
          newY += Math.sign(dy);
        }

        // Apply new position
        const updatedNode = { ...node, x: newX, y: newY };
        nextNodes[activeIndex] = updatedNode;

        // Check if landed on target
        if (newX === target.x && newY === target.y) {
          // Increment scores
          updatedNode.score += 1;
          setGlobalScore((s) => s + 1);

          // Add points floating animation
          const animId = Date.now();
          setPointsAnims((prev) => [
            ...prev,
            { id: animId, x: target.x, y: target.y, text: '+100 GW' },
          ]);
          setTimeout(() => {
            setPointsAnims((prev) => prev.filter((a) => a.id !== animId));
          }, 1000);

          // Spawn new target (not on the current position of the capturing node)
          let newTargetX = Math.floor(Math.random() * 8);
          let newTargetY = Math.floor(Math.random() * 8);
          while (newTargetX === newX && newTargetY === newY) {
            newTargetX = Math.floor(Math.random() * 8);
            newTargetY = Math.floor(Math.random() * 8);
          }
          setTarget({ x: newTargetX, y: newTargetY });
        }

        return nextNodes;
      });

      // Staggered latency modulation
      setLatency((l) => {
        const delta = Math.random() > 0.5 ? 1 : -1;
        return Math.max(10, Math.min(18, l + delta));
      });

    }, 700);

    return () => clearInterval(interval);
  }, [target, nodes.length]);

  // Sort nodes for simulation leaderboard
  const sortedLeaderboard = [...nodes].sort((a, b) => b.score - a.score);

  return (
    <div className="w-full max-w-md lg:max-w-lg rounded-2xl border border-zinc-800/80 bg-zinc-950/60 backdrop-blur-xl overflow-hidden shadow-2xl shadow-indigo-500/5 flex flex-col font-sans select-none">
      {/* Window Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-900 bg-[#090b10]/80">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 tracking-wider">
          <Terminal size={11} className="text-indigo-400" />
          <span>OPERATOR_GRID_VISUALIZER // SIMULATOR</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[9px] font-mono text-emerald-400">ONLINE</span>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="p-3 sm:p-5 flex flex-col sm:flex-row gap-3 sm:gap-4 flex-1">
        {/* The Grid Canvas Grid */}
        <div className="relative aspect-square flex-1 bg-[#050608] rounded-xl border border-zinc-900 p-1 sm:p-2 overflow-hidden min-w-0">
          {/* Coordinates Labels - Top & Left */}
          <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 pointer-events-none opacity-20 text-[8px] font-mono text-zinc-600">
            {Array.from({ length: 64 }).map((_, idx) => {
              const r = Math.floor(idx / 8);
              const c = idx % 8;
              return (
                <div key={idx} className="border-r border-b border-zinc-950/30 p-0.5 flex justify-end items-end">
                  {r === 7 && <span className="absolute bottom-0.5 right-1">{c}</span>}
                  {c === 0 && <span className="absolute top-0.5 left-1">{r}</span>}
                </div>
              );
            })}
          </div>

          {/* Grid lines */}
          <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 pointer-events-none">
            {Array.from({ length: 64 }).map((_, idx) => (
              <div key={idx} className="border-r border-b border-zinc-900/30" />
            ))}
          </div>

          {/* Glowing Circle Target */}
          <motion.div
            key={`target-${target.x}-${target.y}`}
            animate={{
              scale: [0.95, 1.15, 0.95],
              boxShadow: [
                '0 0 12px rgba(6, 182, 212, 0.3)',
                '0 0 24px rgba(6, 182, 212, 0.6)',
                '0 0 12px rgba(6, 182, 212, 0.3)',
              ],
            }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{
              left: `${target.x * 12.5 + 6.25}%`,
              top: `${target.y * 12.5 + 6.25}%`,
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full border border-cyan-400 bg-cyan-950/40 z-10 flex items-center justify-center"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          </motion.div>

          {/* Player Nodes */}
          {nodes.map((node) => (
            <motion.div
              key={node.id}
              layout
              transition={{
                type: 'spring',
                stiffness: 180,
                damping: 20,
              }}
              style={{
                left: `${node.x * 12.5 + 6.25}%`,
                top: `${node.y * 12.5 + 6.25}%`,
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
            >
              {/* Particle Glow ring */}
              <div className={`absolute -inset-2.5 rounded-full blur-md opacity-40 animate-pulse ${node.color}`} />
              
              <div className={`relative w-4 h-4 rounded-full border border-white/20 shadow-lg ${node.glowColor} ${node.color} flex items-center justify-center`}>
                <span className="w-1 h-1 rounded-full bg-white" />
              </div>
              
              {/* Short Label */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-zinc-950/80 border border-zinc-800/80 text-[7px] font-mono text-zinc-400 tracking-tight whitespace-nowrap">
                {node.name}
              </div>
            </motion.div>
          ))}

          {/* Floating Point Indicators */}
          <AnimatePresence>
            {pointsAnims.map((anim) => (
              <motion.div
                key={anim.id}
                initial={{ opacity: 0, y: 0, scale: 0.8 }}
                animate={{ opacity: 1, y: -20, scale: 1.1 }}
                exit={{ opacity: 0 }}
                style={{
                  left: `${anim.x * 12.5 + 6.25}%`,
                  top: `${anim.y * 12.5}%`,
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-30 text-[9px] font-black text-cyan-400 font-mono tracking-wider drop-shadow-[0_2px_4px_rgba(6,182,212,0.4)]"
              >
                {anim.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Sidebar Statistics & Leaderboard */}
        <div className="w-full sm:w-36 flex flex-col justify-between border-t sm:border-t-0 sm:border-l border-zinc-900/60 pt-4 sm:pt-0 sm:pl-4">
          <div>
            <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-2 font-mono flex items-center gap-1.5">
              <Zap size={10} className="text-indigo-400" />
              <span>ROUND_LEADERBOARD</span>
            </div>
            
            <div className="space-y-1.5">
              {sortedLeaderboard.map((item, idx) => (
                <div key={item.id} className="flex items-center justify-between text-xs py-1 rounded bg-[#090b10]/40 px-2 border border-zinc-900/50">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[9px] text-zinc-600 font-mono">#{idx + 1}</span>
                    <span className={`truncate text-[10px] font-mono ${item.textLight}`}>{item.name}</span>
                  </div>
                  <span className="font-mono font-bold text-cyan-400 text-[10px]">{item.score}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 border-t border-zinc-900/60 pt-3 space-y-2">
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-zinc-500">GRID_SCORE:</span>
              <span className="text-white font-bold">{globalScore} GW</span>
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-zinc-500">LATENCY:</span>
              <span className="text-cyan-400 font-bold">{latency}ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control panel Status strip */}
      <div className="border-t border-zinc-900 bg-[#090b10]/80 px-4 py-2.5 flex items-center justify-between text-[9px] font-mono text-zinc-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Cpu size={10} /> Load: <span className="text-zinc-400 font-bold">12%</span>
          </span>
          <span className="flex items-center gap-1">
            <Users size={10} /> Nodes: <span className="text-zinc-400 font-bold">1,024</span>
          </span>
        </div>
        <div className="flex items-center gap-1 text-emerald-400 font-bold">
          <Activity size={10} className="animate-pulse" />
          <span>SYNCED</span>
        </div>
      </div>
    </div>
  );
}
