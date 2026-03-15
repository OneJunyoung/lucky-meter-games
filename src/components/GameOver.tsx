'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Home, Trophy, Send, User } from 'lucide-react';
import Link from 'next/link';
import { soundManager } from '@/utils/soundManager';
import { useEffect, useState } from 'react';

interface GameOverProps {
  isOpen: boolean;
  score: number;
  isNewHighScore?: boolean;
  onRestart: () => void;
  title?: string;
  message?: string;
  gameId?: string; // e.g. 'candy-match', 'bubble-pop', 'scooter-run'
}

type LeaderboardEntry = {
    name: string;
    score: number;
    date: string;
};

export default function GameOver({ 
  isOpen, 
  score, 
  isNewHighScore, 
  onRestart,
  title = "Game Over!",
  message,
  gameId
}: GameOverProps) {
  
  const [phase, setPhase] = useState<'score' | 'input' | 'leaderboard'>('score');
  const [playerName, setPlayerName] = useState('');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [rankAcquired, setRankAcquired] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
        soundManager.playSynth(isNewHighScore ? 'success' : 'gameover');
        setPhase('score');
        setPlayerName('');
        setRankAcquired(null);

        // Load leaderboard specifically for this game
        if (gameId) {
            const stored = localStorage.getItem(`leaderboard-${gameId}`);
            if (stored) {
                setLeaderboard(JSON.parse(stored));
            }
        }
    }
  }, [isOpen, isNewHighScore, gameId]);

  // Handle flow from Score Screen
  const handleContinueFromScore = () => {
       soundManager.playSynth('click');
       
       if (!gameId) {
           // Skip input and leaderboard if this game isn't tracking it
           return onRestart();
       }

       if (score > 0) {
           // Can qualify for board, ask for name
           setPhase('input');
       } else {
           // Score is 0, skip input, go straight to leaderboard
           setPhase('leaderboard');
       }
  };

  const handleSaveScore = (e: React.FormEvent) => {
      e.preventDefault();
      soundManager.playSynth('pop');

      const finalName = playerName.trim() || 'Anonymous';
      
      const newEntry: LeaderboardEntry = {
          name: finalName,
          score: score,
          date: new Date().toISOString()
      };

      const newBoard = [...leaderboard, newEntry];
      
      // Sort descending
      newBoard.sort((a, b) => b.score - a.score);
      
      // Keep only top 10
      const top10 = newBoard.slice(0, 10);
      
      // Find what rank the user just got (1-based index)
      const achievedRank = top10.findIndex(e => e === newEntry) + 1;
      if (achievedRank > 0) {
          setRankAcquired(achievedRank);
      }

      setLeaderboard(top10);
      if(gameId) {
          localStorage.setItem(`leaderboard-${gameId}`, JSON.stringify(top10));
      }

      setPhase('leaderboard');
  };

  const renderScorePhase = () => (
    <motion.div
      key="score-phase"
      initial={{ scale: 0.9, y: 20, opacity: 0 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      exit={{ scale: 0.9, y: -20, opacity: 0 }}
      className="glass-card w-full max-w-sm p-8 rounded-3xl flex flex-col items-center text-center shadow-2xl border border-white/20"
    >
      <h2 className="text-3xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400">
        {title}
      </h2>
      
      {message && (
        <p className="text-slate-400 text-sm mb-6">{message}</p>
      )}

      <div className="mb-8 flex flex-col items-center relative w-full">
        <span className="text-sm uppercase tracking-wider text-slate-400 font-bold mb-1">Final Score</span>
        <span className="text-6xl font-black font-mono text-white neon-text">{score}</span>
        
        {isNewHighScore && (
          <motion.div 
            initial={{ rotate: -10, scale: 0 }}
            animate={{ rotate: -10, scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="absolute -top-4 -right-2 sm:-right-8 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-lg transform"
          >
            NEW HIGH!
          </motion.div>
        )}
      </div>

      <div className="w-full space-y-3 mt-4">
        {gameId ? (
            <motion.button
              onClick={handleContinueFromScore}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 text-white"
            >
              Continue
            </motion.button>
        ) : (
            <motion.button
              onMouseEnter={() => soundManager.playSynth('hover')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                  soundManager.playSynth('click');
                  onRestart();
              }}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 text-white"
            >
              <RotateCcw className="w-5 h-5" />
              Play Again
            </motion.button>
        )}
        
        
        <Link href="/" className="block w-full" onClick={() => soundManager.playSynth('click')}>
          <motion.button
            onMouseEnter={() => soundManager.playSynth('hover')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors text-white"
          >
            <Home className="w-5 h-5" />
            Back to Hub
          </motion.button>
        </Link>
      </div>
    </motion.div>
  );

  const renderInputPhase = () => (
      <motion.div
        key="input-phase"
        initial={{ scale: 0.9, x: 20, opacity: 0 }}
        animate={{ scale: 1, x: 0, opacity: 1 }}
        exit={{ scale: 0.9, x: -20, opacity: 0 }}
        className="glass-card w-full max-w-sm p-6 sm:p-8 rounded-3xl flex flex-col items-center text-center shadow-2xl border border-white/20"
      >
        <Trophy className="w-12 h-12 text-amber-400 mb-4" />
        <h2 className="text-2xl font-black mb-2 text-white">Save Your Score</h2>
        <p className="text-slate-400 text-sm mb-6">You scored {score}! Enter your name for the leaderboard.</p>

        <form onSubmit={handleSaveScore} className="w-full space-y-4">
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Anonymous"
                    maxLength={12}
                    className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl leading-5 bg-black/30 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 hover:bg-black/50 transition-all sm:text-lg font-bold text-white uppercase text-center"
                    autoFocus
                />
            </div>
            
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 text-white"
            >
              <Send className="w-5 h-5" />
              Save to Leaderboard
            </motion.button>
        </form>
      </motion.div>
  );

  const renderLeaderboardPhase = () => (
      <motion.div
        key="leaderboard-phase"
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass-card w-full max-w-sm p-4 sm:p-6 rounded-3xl flex flex-col items-center text-center shadow-2xl border border-white/20 max-h-[90vh] overflow-y-auto"
      >
        <Trophy className="w-10 h-10 text-amber-400 mb-2" />
        <h2 className="text-2xl font-black mb-4 text-white uppercase tracking-wider">Top 10</h2>
        
        {rankAcquired && (
            <div className="mb-4 bg-sky-500/20 border border-sky-400/30 text-sky-200 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                🎉 You ranked #{rankAcquired}!
            </div>
        )}

        <div className="w-full space-y-2 mb-6 text-left">
            {leaderboard.length === 0 ? (
                <div className="text-slate-500 text-center py-4 bg-black/20 rounded-xl">No scores yet.</div>
            ) : (
                leaderboard.map((entry, index) => {
                    const isFirst = index === 0;
                    const isSecond = index === 1;
                    const isThird = index === 2;
                    return (
                        <div 
                            key={`${entry.name}-${entry.date}-${index}`}
                            className={`flex items-center justify-between p-3 rounded-xl border ${
                                rankAcquired === index + 1 
                                ? 'bg-amber-500/20 border-amber-500/50' 
                                : 'bg-black/40 border-white/5'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <span className={`font-black w-6 text-center ${
                                    isFirst ? 'text-amber-400' : 
                                    isSecond ? 'text-slate-300' : 
                                    isThird ? 'text-orange-400' : 
                                    'text-slate-500'
                                }`}>
                                    {index + 1}
                                </span>
                                <span className="text-white font-bold uppercase truncate max-w-[120px]">
                                    {entry.name}
                                </span>
                            </div>
                            <span className="text-amber-400 font-mono font-bold tracking-wider">
                                {entry.score.toLocaleString()}
                            </span>
                        </div>
                    );
                })
            )}
        </div>

        <div className="w-full space-y-3">
            <motion.button
              onMouseEnter={() => soundManager.playSynth('hover')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                  soundManager.playSynth('click');
                  onRestart();
              }}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 text-white"
            >
              <RotateCcw className="w-5 h-5" />
              Play Again
            </motion.button>
            <Link href="/" className="block w-full" onClick={() => soundManager.playSynth('click')}>
              <motion.button
                onMouseEnter={() => soundManager.playSynth('hover')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors text-white"
              >
                <Home className="w-5 h-5" />
                Back to Hub
              </motion.button>
            </Link>
        </div>
      </motion.div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 flex flex-col items-center justify-center p-4 bg-black/80 backdrop-blur-sm rounded-2xl md:rounded-3xl"
        >
            <AnimatePresence mode="wait">
                {phase === 'score' && renderScorePhase()}
                {phase === 'input' && renderInputPhase()}
                {phase === 'leaderboard' && renderLeaderboardPhase()}
            </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
