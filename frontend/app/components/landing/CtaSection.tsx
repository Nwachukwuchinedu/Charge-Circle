'use client';

import { motion } from 'framer-motion';
import { Zap, ArrowRight } from 'lucide-react';

export default function CtaSection() {
  return (
    <section className="relative z-10 py-24 sm:py-32 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: 'easeOut' as const }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600/20 via-zinc-900 to-cyan-600/20 border border-indigo-500/20 p-8 sm:p-14 text-center"
        >
          {/* Glow orbs */}
          <div className="absolute -top-20 -left-20 w-60 h-60 rounded-full bg-indigo-500/10 blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-60 h-60 rounded-full bg-cyan-500/10 blur-[80px] pointer-events-none" />

          <div className="relative">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-lg shadow-indigo-500/30 mb-6"
            >
              <Zap size={24} className="text-white" />
            </motion.div>

            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Ready to charge the grid?
            </h2>
            <p className="text-zinc-400 text-sm max-w-md mx-auto mb-8">
              Join thousands of operators online right now. Your node is one click away.
            </p>

            <a
              href="/signup"
              className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all duration-300 hover:scale-105"
            >
              Initialize Your Node
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </a>

            <p className="mt-4 text-zinc-600 text-xs">
              Already have a node? <a href="/login" className="text-indigo-400 hover:text-indigo-300 transition-colors">Connect</a>
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
