'use client';

import { RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { soundManager } from '@/utils/soundManager';

interface ScoreBoardProps {
  score: number;
  highScore: number;
  onRestart: () => void;
  title?: string;
}

export default function ScoreBoard({ score, highScore, onRestart, title }: ScoreBoardProps) {
  return (
    <div className="w-full flex items-center justify-between p-4 mb-4 glass rounded-2xl">
      <div className="flex gap-6">
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">Score</span>
          <motion.span 
            key={score}
            initial={{ scale: 1.2, color: '#38bdf8' }}
            animate={{ scale: 1, color: '#f8fafc' }}
            className="text-2xl font-black font-mono"
          >
            {score}
          </motion.span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">High Score</span>
          <span className="text-2xl font-black font-mono text-slate-300">{highScore}</span>
        </div>
      </div>
      
      {title && (
         <div className="hidden sm:block absolute left-1/2 -translate-x-1/2 text-lg font-bold text-slate-300">
           {title}
         </div>
      )}

      <motion.button
        onMouseEnter={() => soundManager.playSynth('hover')}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
            soundManager.playSynth('click');
            onRestart();
        }}
        className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors font-medium text-sm"
      >
        <RotateCcw className="w-4 h-4" />
        <span className="hidden sm:inline">Restart</span>
      </motion.button>
    </div>
  );
}
