'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';

interface GameOverProps {
  isOpen: boolean;
  score: number;
  isNewHighScore?: boolean;
  onRestart: () => void;
  title?: string;
  message?: string;
}

export default function GameOver({ 
  isOpen, 
  score, 
  isNewHighScore, 
  onRestart,
  title = "Game Over!",
  message
}: GameOverProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm rounded-2xl"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            className="glass-card w-full max-w-sm p-8 rounded-3xl flex flex-col items-center text-center shadow-2xl border border-white/20"
          >
            <h2 className="text-3xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400">
              {title}
            </h2>
            
            {message && (
              <p className="text-slate-400 text-sm mb-6">{message}</p>
            )}

            <div className="mb-8 flex flex-col items-center relative">
              <span className="text-sm uppercase tracking-wider text-slate-400 font-bold mb-1">Final Score</span>
              <span className="text-6xl font-black font-mono text-white neon-text">{score}</span>
              
              {isNewHighScore && (
                <motion.div 
                  initial={{ rotate: -10, scale: 0 }}
                  animate={{ rotate: -10, scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="absolute -top-4 -right-8 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-lg transform"
                >
                  NEW HIGH!
                </motion.div>
              )}
            </div>

            <div className="w-full space-y-3 mt-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onRestart}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
              >
                <RotateCcw className="w-5 h-5" />
                Play Again
              </motion.button>
              
              <Link href="/" className="block w-full">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <Home className="w-5 h-5" />
                  Back to Hub
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
