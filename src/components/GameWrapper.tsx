'use client';

import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface GameWrapperProps {
  title: string;
  children: React.ReactNode;
}

export default function GameWrapper({ title, children }: GameWrapperProps) {
  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/20 blur-[120px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="absolute top-0 left-0 w-full p-6 flex items-center z-10">
        <Link href="/">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 glass rounded-full text-sm font-medium hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Hub</span>
          </motion.div>
        </Link>
      </header>

      {/* Main Game Area */}
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-4xl glass-card rounded-3xl p-8 z-0 flex flex-col items-center"
      >
        <h1 className="text-3xl font-bold mb-8 neon-text bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          {title}
        </h1>
        <div className="w-full aspect-video bg-black/40 rounded-2xl border border-white/5 flex items-center justify-center relative overflow-hidden">
          {children}
        </div>
      </motion.main>
    </div>
  );
}
