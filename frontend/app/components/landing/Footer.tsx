'use client';

import { Zap } from 'lucide-react';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative z-10 border-t border-zinc-900/60 bg-zinc-950/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-400 font-black text-white text-xs shadow-lg">
                C
              </div>
              <span className="text-sm font-bold text-white">Charge Circle</span>
            </div>
            <p className="text-zinc-600 text-xs leading-relaxed max-w-[200px]">
              A real-time collaborative grid game. Built with Next.js, Socket.io, and Postgres.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-3">Product</h4>
            <ul className="space-y-2">
              <li><a href="/signup" className="text-zinc-600 hover:text-zinc-300 text-xs transition-colors">Get Started</a></li>
              <li><a href="/login" className="text-zinc-600 hover:text-zinc-300 text-xs transition-colors">Sign In</a></li>
              <li><span className="text-zinc-600 text-xs">Leaderboard</span></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-3">Company</h4>
            <ul className="space-y-2">
              <li><span className="text-zinc-600 text-xs">About</span></li>
              <li><span className="text-zinc-600 text-xs">Blog</span></li>
              <li><span className="text-zinc-600 text-xs">Contact</span></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-3">Legal</h4>
            <ul className="space-y-2">
              <li><span className="text-zinc-600 text-xs">Privacy</span></li>
              <li><span className="text-zinc-600 text-xs">Terms</span></li>
              <li><span className="text-zinc-600 text-xs">Cookies</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-zinc-900/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-zinc-700 text-[11px]">&copy; {year} Charge Circle. All rights reserved.</p>
          <div className="flex items-center gap-1 text-zinc-700 text-[11px]">
            <Zap size={10} />
            Powered by the grid
          </div>
        </div>
      </div>
    </footer>
  );
}
