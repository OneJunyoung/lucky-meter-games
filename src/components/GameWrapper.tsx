'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, Volume2, VolumeX } from 'lucide-react';
import Link from 'next/link';
import { soundManager } from '@/utils/soundManager';
import { useState, useEffect } from 'react';

interface GameWrapperProps {
  title: string;
  children: React.ReactNode;
}

export default function GameWrapper({ title, children }: GameWrapperProps) {
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    setIsMuted(soundManager.getMuted());
  }, []);

  const toggleMute = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
    if (!muted) soundManager.playSynth('click');
  };

  return (
    <div className="h-[100dvh] relative overflow-hidden flex flex-col items-center justify-center p-4 pb-0">
      {/* Background Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/20 blur-[120px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-10">
        <Link href="/" onClick={() => soundManager.playSynth('click')}>
          <motion.div
            onMouseEnter={() => soundManager.playSynth('hover')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 glass rounded-full text-sm font-medium hover:bg-white/10 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Hub</span>
          </motion.div>
        </Link>
        <button 
           onClick={toggleMute}
           className="p-3 bg-slate-800/80 hover:bg-white/10 rounded-full transition-colors border border-white/10 active:scale-95 touch-manipulation shadow-lg"
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-slate-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
        </button>
      </header>

      {/* Main Game Area */}
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-4xl glass-card rounded-3xl p-4 sm:p-8 mt-16 mb-4 z-0 flex flex-col items-center flex-1 min-h-0"
      >
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 neon-text bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent shrink-0">
          {title}
        </h1>
        <div className="w-full h-full relative bg-black/40 rounded-2xl border border-white/5 flex items-center justify-center overflow-hidden">
          {children}
        </div>
      </motion.main>
    </div>
  );
}
